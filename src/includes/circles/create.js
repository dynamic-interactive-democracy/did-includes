const path = require("path");
const locale = require("../../locale");
const y18nMustacheReader = require("../../y18n-mustache-reader");
const getOverlay = require("../getFormOverlay");
const setUpMemberInviteSelect = require("../setUpMemberInviteSelect");

module.exports = (api, integration) => (opts) => {
    return {
        renderIn: (container) => {
            container.innerHTML = y18nMustacheReader.readSync(locale(), path.join(__dirname, "create-form.html.partial"));
            let form = container.querySelector("form.did-circle-form");

            if(opts) {
                if(opts.fill) {
                    prefillFields(form, opts.fill);
                }
            }

            let invites = [];
            let membersSelect = form.querySelector("[name=inviteMembers]");
            let membersList = form.querySelector(".did-invited-members-list");

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
                                .map(user => `<option value="${user.userId}">${user.name}</option>`)
                                .join("");
                membersSelect.innerHTML = `<option></option>` + options;

                setUpMemberInviteSelect(membersSelect, membersList, {
                    invite: (id, callback) => { invites.push(id); setTimeout(callback); },
                    remove: (id, callback) => { invites = invites.filter(invitedId => invitedId != id); setTimeout(callback); }
                });
            });

            form.addEventListener("submit", (e) => {
                e.preventDefault();
                sendCreateCircleRequest(api, integration, form, invites);
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

function sendCreateCircleRequest(api, integration, form, invitedMembers) {
    let validation = validateData(form, invitedMembers);
    if(!validation.valid) {
        //TODO: show errors on form
        return console.error("Failed to submit form because invalid data.");
    }
    let overlay = getOverlay(form);
    overlay.posting();
    api.circles.create(validation.data, (error, result) => {
        if(error) {
            overlay.failure();
            return console.error("Failed to create circle.", error);
        }
        overlay.success(() => integration.circles.view(result.circle.circleId));
    });
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
