const path = require("path");
const locale = require("../../locale");
const y18nMustacheReader = require("../../y18n-mustache-reader");

module.exports = (api, integration) => (opts) => {
    return {
        renderIn: (container) => {
            container.innerHTML = y18nMustacheReader.readSync(locale(), path.join(__dirname, "form.html.partial"));
            let form = container.querySelector("form.did-circle-form");

            if(opts) {
                if(opts.fill) {
                    prefillFields(form, opts.fill);
                }
            }

            let inviteMembersSelect = form.querySelector("[name=inviteMembers]");
            let invitedMembersList = form.querySelector(".invitedMembersList");
            let invitedMembers = [];

            api.users.get((error, data) => {
                if(error) {
                    return console.error("Failed to load users.", error);
                }

                let options = data.users
                                .filter(user => user.userId != api.getCurrentUserId())
                                .sort((a,b) => {
                                    if(a.name == b.name) return 0;
                                    if(a.name < b.name) return -1;
                                    return 1;
                                })
                                .map(user => `<option value="${user.userId}">${user.name}</option>`);
                inviteMembersSelect.innerHTML = `<option></option>` + options;

                inviteMembersSelect.addEventListener("change", (e) => {
                    let id = inviteMembersSelect.value;
                    let opt = inviteMembersSelect.querySelector(`option[value='${id}']`);
                    let name = opt.innerText;
                    inviteMembersSelect.removeChild(opt);

                    let invitedMember = { id: id, name: name }; //TODO: refactor to not need this var
                    invitedMembers.push(id);

                    let memberElement = createDomNode("div", { class: "did-invite-member", text: name });
                    let dismissButton = createDomNode("div", { class: "did-uninvite-member-button" });

                    memberElement.appendChild(dismissButton);

                    invitedMembersList.appendChild(memberElement);

                    dismissButton.addEventListener("click", (e) => {
                        e.preventDefault();
                        invitedMembersList.removeChild(memberElement);
                        invitedMembers = invitedMembers.filter(id => id != invitedMember.id);
                        let newOpt = createDomNode("option", { value: invitedMember.id, text: invitedMember.name });
                        let elementAlphanumericallyFollowing = getElementAlphaAfter(inviteMembersSelect, invitedMember.name);
                        inviteMembersSelect.insertBefore(newOpt, elementAlphanumericallyFollowing);
                        return false;
                    });
                });
            });

            form.addEventListener("submit", (e) => {
                e.preventDefault();
                sendCreateCircleRequest(api, integration, form, invitedMembers);
                return false;
            });
        }
    };
};

function prefillFields(form, fill) {
    Object.keys(fill).forEach((key) => {
        let element = form.querySelector(`[name=${key}]`);
        if(!element) {
            return console.warn("[did/create-circle-include] Tried to prefill", key, "with value", fill[key], "but no such input element exists in the form.");
        }
        element.value = fill[key];
        //This has been verified to work for: input, textarea, select
        //Not yet verified: checkbox, radio
    });
}

function createDomNode(tag, attr) {
    //TODO: alt to using `document`? (Breaks general usage!!!)
    let el = document.createElement(tag);
    if(attr.class) el.classList = attr.class;
    if(attr.value) el.value = attr.value;
    if(attr.text) el.innerText = attr.text;
    else if(attr.html) el.innerHTML = attr.html;
    return el;
}

function getElementAlphaAfter(container, content) {
    return Array.prototype.filter.call(container.children, node => node.innerText >= content)[0];
}

function sendCreateCircleRequest(api, integration, form, invitedMembers) {
    //TODO: show some sort of loading indication
    let validation = validateData(form, invitedMembers);
    if(!validation.valid) {
        //TODO: show errors on form
        return console.error("Failed to submit form because invalid data.");
    }
    api.circles.create(validation.data, (error, result) => {
        if(error) {
            //TODO: Show error message in form
            return console.error("Failed to create circle.", error);
        }
        //TODO: somehow, based on result, redirect to correct url for viewing a circle
        integration.circles.view(result.circle.id);
    });
}

function validateData(form, invitedMembers) {
    let valid = true;
    let errors = {};
    let name = getValue(form, "title");
    let vision = getValue(form, "vision");
    let mission = getValue(form, "mission");
    let aim = getValue(form, "aim");
    let fullState = getValue(form, "fullState");
    let expectationsForMembers = getValue(form, "expectationsForMembers");
    let invited = invitedMembers;

    //TODO: actually validate

    if(valid) {
        return {
            valid: true,
            data: { name, vision, mission, aim, fullState, expectationsForMembers, invited }
        };
    }
    return { valid, errors };
}

function getValue(form, name) {
    return form.querySelector(`[name=${name}]`).value;
}
