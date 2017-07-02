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
            let invitedMembersList = form.querySelector(".did-invited-members-list");
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
        //TODO: Not yet verified: checkbox, radio
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
    let validation = validateData(form, invitedMembers);
    if(!validation.valid) {
        //TODO: show errors on form
        return console.error("Failed to submit form because invalid data.");
    }
    let overlay = getOverlay(form);
    overlay.loading();
    api.circles.create(validation.data, (error, result) => {
        if(error) {
            overlay.failure();
            return console.error("Failed to create circle.", error);
        }
        overlay.success(() => integration.circles.view(result.circle.id));
    });
}

function getOverlay(form) {
    let overlay = form.querySelector(".did-form-overlay");
    let loadingMsg = overlay.querySelector(".did-overlay-message-loading");
    let failureMsg = overlay.querySelector(".did-overlay-message-failure");
    let successMsg = overlay.querySelector(".did-overlay-message-success");

    let hideAllMsgs = () => {
        loadingMsg.style = "";
        failureMsg.style = "";
        successMsg.style = "";
    };

    let hide = () => {
        overlay.style = "display:flex;opacity:0;";
        hideAllMsgs();
        setTimeout(() => overlay.style = "", 500);
    };

    let showMsg = (msg) => {
        hideAllMsgs();
        overlay.style = "display:flex;opacity:1;";
        msg.style = "opacity:1;";
    }

    return {
        loading: () => showMsg(loadingMsg),
        failure: () => {
            showMsg(failureMsg);
            setTimeout(hide, 2500);
        },
        success: (callback) => {
            showMsg(successMsg);
            setTimeout(() => {
                hide();
                callback();
            }, 1200);
        }
    };
}

function validateData(form, invitedMembers) {
    let getValue = (name) => form[name].value;

    let valid = true;
    let errors = {};
    let name = getValue("title");
    let vision = getValue("vision");
    let mission = getValue("mission");
    let aim = getValue("aim");
    let fullState = getValue("fullState");
    let expectationsForMembers = getValue("expectationsForMembers");
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
