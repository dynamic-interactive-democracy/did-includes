const path = require("path");
const locale = require("../../locale");
const y18nMustacheReader = require("../../y18n-mustache-reader");
const getOverlay = require("../getFormOverlay");
const setUpMemberInviteSelect = require("../setUpMemberInviteSelect");
const prefillFields = require("../prefillFields");
const createRemovableMemberElement = require("../createRemovableMemberElement");

module.exports = (api, integration) => (opts) => {
    return {
        renderIn: (container) => {
            container.innerHTML = y18nMustacheReader.readSync(locale(), path.join(__dirname, "create-form.html.partial"));
            let form = container.querySelector("form.did-circle-form");


            let prefillInvites = [];
            if(opts) {
                if(opts.fill) {
                    if(opts.fill.invite) {
                        prefillInvites = opts.fill.invite;
                        delete opts.fill.invite;
                    }
                    prefillFields(form, opts.fill);
                }
            }

            let invites = prefillInvites;
            let membersSelect = form.querySelector("[name=inviteMembers]");
            let membersList = form.querySelector(".did-invited-members-list");

            api.users.get((error, data) => {
                if(error) {
                    return console.error("Failed to load users.", error);
                }

                let users = data.users;

                let options = users
                                .filter(user => user.userId != api.getCurrentUserId())
                                .filter(user => prefillInvites.indexOf(user.userId) === -1)
                                .sort((a,b) => {
                                    if(a.name == b.name) return 0;
                                    if(a.name < b.name) return -1;
                                    return 1;
                                })
                                .map(user => `<option value="${user.userId}">${user.name}</option>`)
                                .join("");
                membersSelect.innerHTML = `<option></option>` + options;

                users.filter(user => prefillInvites.indexOf(user.userId) !== -1)
                     .map(user => createRemovableMemberElement(user.userId, user.name, membersSelect, membersList, (id, callback) => (id, callback) => { invites = invites.filter(invitedId => invitedId != id); setTimeout(callback); }))
                     .forEach((memberElement) => membersList.appendChild(memberElement));;

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
