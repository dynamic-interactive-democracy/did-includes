const path = require("path");
const locale = require("../../locale");
const y18nMustacheReader = require("../../y18n-mustache-reader");
const getOverlay = require("../getFormOverlay");
const parallel = require("async/parallel");
const createRemovableMemberElement = require("../createRemovableMemberElement");
const setUpMemberInviteSelect = require("../setUpMemberInviteSelect");

module.exports = (api, integration) => (opts) => {
    return {
        renderIn: (container) => {
            container.innerHTML = y18nMustacheReader.readSync(locale(), path.join(__dirname, "edit-form.html.partial"));
            let form = container.querySelector("form.did-circle-form");

            let overlay = getOverlay(form);
            overlay.loading();

            if(!opts || !opts.id) {
                throw new Error("Missing circle ID for circleEdit include. You should provide `id` as an option when creating the include.");
            }

            let membersList = form.querySelector(".did-members-list");
            let members = [];

            let inviteMembersRemoverState = {
                membersSelect: form.querySelector("[name=inviteMembers]"),
                membersList: form.querySelector(".did-invited-members-list"),
                members: []
            };

            let membersRemoverState = {
                membersSelect: inviteMembersRemoverState.membersSelect,
                membersList: form.querySelector(".did-members-list"),
                members: []
            };

            parallel({
                usersRequest: (callback) => api.users.get(callback),
                circleRequest: (callback) => api.circles.get(opts.id, callback)
            }, (error, result) => {
                if(error) {
                    return console.error("Failed to load data", error);
                }
                let users = result.usersRequest.users;
                let circle = result.circleRequest.circle;

                if(circle.members.indexOf(api.getCurrentUserId()) === -1) {
                    return console.error("Cannot edit this form. Not a member.");
                }

                let setValue = (name, value) => form[name].value = value;
                setValue("title", circle.name);
                setValue("vision", circle.vision);
                setValue("mission", circle.mission);
                setValue("aim", circle.aim);
                setValue("fullState", circle.fullState);
                setValue("expectationsForMembers", circle.expectationsForMembers);

                let otherUsers = users
                                .filter(user => user.userId != api.getCurrentUserId())
                                .sort((a,b) => {
                                    if(a.name == b.name) return 0;
                                    if(a.name < b.name) return -1;
                                    return 1;
                                });

                let invitableUsers = otherUsers.filter(user => circle.invited.indexOf(user.userId) === -1 && circle.members.indexOf(user.userId) === -1);
                let invitedUsers = otherUsers.filter(user => circle.invited.indexOf(user.userId) !== -1);
                let memberUsers = users.filter(user => circle.members.indexOf(user.userId) !== -1);

                let inviteOptions = invitableUsers.map(user => `<option value="${user.userId}">${user.name}</option>`).join("");
                inviteMembersRemoverState.membersSelect.innerHTML = `<option></option>` + inviteOptions;
                
                let contactPersonOptions = users.map(user => `<option value="${user.userId}">${user.name}</option>`).join("");
                let contactPersonSelect = form.contactPerson;
                contactPersonSelect.innerHTML = contactPersonOptions;
                contactPersonSelect.value = circle.contactPerson;

                addRemovableMemberElementsToList(memberUsers, membersRemoverState);
                addRemovableMemberElementsToList(invitedUsers, inviteMembersRemoverState);

                setUpMemberInviteSelect(inviteMembersRemoverState, {
                    invite: (id, callback) => { inviteMembersRemoverState.members.push(id); setTimeout(callback); }, //TODO: API calls for invite/remove
                    remove: (id, callback) => { inviteMembersRemoverState.members = inviteMembersRemoverState.members.filter(invitedId => invitedId != id); setTimeout(callback); }
                });

                overlay.hide();
            });

            form.addEventListener("submit", (e) => {
                e.preventDefault();
                sendUpdateCircleRequest(api, integration, opts.id, form, inviteMembersRemoverState.members);
                return false;
            });
        }
    };
};

function addRemovableMemberElementsToList(users, state) {
    //TODO: removeHook should API call
    users.map(user => createRemovableMemberElement(user.userId, user.name, state, (id, callback) => { state.members = state.members.filter(invitedId => invitedId != id); setTimeout(callback); }))
         .forEach((memberElement) => state.membersList.appendChild(memberElement));
}

function sendUpdateCircleRequest(api, integration, id, form) {
    let validation = validateData(form);
    if(!validation.valid) {
        //TODO: show errors on form
        return console.error("Failed to submit form because invalid data.");
    }
    let overlay = getOverlay(form);
    overlay.posting();
    api.circles.update(id, validation.data, (error, result) => {
        if(error) {
            overlay.failure();
            return console.error("Failed to update circle.", error);
        }
        overlay.success(() => integration.circles.view(result.circle.circleId));
    });
}

function validateData(form) {
    let getValue = (name) => form[name].value;

    let valid = true;
    let errors = {};
    let name = getValue("title");
    let vision = getValue("vision");
    let mission = getValue("mission");
    let aim = getValue("aim");
    let fullState = getValue("fullState");
    let expectationsForMembers = getValue("expectationsForMembers");
    let contactPerson = getValue("contactPerson");

    //TODO: actually validate

    if(valid) {
        return {
            valid: true,
            data: { name, vision, mission, aim, fullState, expectationsForMembers, contactPerson }
        };
    }
    return { valid, errors };
}
