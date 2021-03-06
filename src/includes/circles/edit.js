const path = require("path");
const locale = require("../../locale");
const y18nMustacheReader = require("../../y18n-mustache-reader");
const getOverlay = require("../getFormOverlay");
const parallel = require("../../tiny-parallel");
const createRemovableMemberElement = require("../createRemovableMemberElement");
const setUpMemberInviteSelect = require("../setUpMemberInviteSelect");
const formInclude = require("../formInclude");

module.exports = formInclude({
    html: y18nMustacheReader.readSync(locale(), path.join(__dirname, "edit-form.html.partial")),
    requiredOptions: [ "id" ],
    formSubmitHandler: (api, integration, opts, form) => sendUpdateCircleRequest(api, integration, opts.id, form)
}, (api, integration, opts, form, callback) => {
    let inviteMembersSelect = form.querySelector("[name=inviteMembers]");
    let inviteMembersList = form.querySelector(".did-invited-members-list");
    let membersList = form.querySelector(".did-members-list");

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
        let transferValueByName = (name) => setValue(name, circle[name]);
        let transferValuesByName = (names) => names.forEach(transferValueByName);
        setValue("title", circle.name);
        transferValuesByName([
            "vision",
            "mission",
            "aim",
            "fullState",
            "expectationsForMembers",
            //Procedures:
            "roleElectionProcedure",
            "roleEvaluationProcedure",
            "taskMeetingProcedure",
            "topicExplorationStageProcedure",
            "topicPictureFormingStageProcedure",
            "topicProposalShapingStageProcedure",
            "topicDecisionMakingStageProcedure",
            "topicAgreementStageProcedure",
            "agreementEvaluationProcedure"
        ]);

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
        inviteMembersSelect.innerHTML = `<option></option>` + inviteOptions;
        
        let contactPersonOptions = users.map(user => `<option value="${user.userId}">${user.name}</option>`).join("");
        let contactPersonSelect = form.contactPerson;
        contactPersonSelect.innerHTML = contactPersonOptions;
        contactPersonSelect.value = circle.contactPerson;

        addRemovableMemberElementsToList(api, opts.id, memberUsers, inviteMembersSelect, membersList);
        addRemovableMemberElementsToList(api, opts.id, invitedUsers, inviteMembersSelect, inviteMembersList);

        setUpMemberInviteSelect(inviteMembersSelect, inviteMembersList, {
            invite: (userId, callback) => api.circles.members.invite(opts.id, userId, callback),
            remove: (userId, callback) => api.circles.members.remove(opts.id, userId, callback)
        });

        callback();
    });
});

function addRemovableMemberElementsToList(api, circleId, users, membersSelect, membersList) {
    users.map(user => createRemovableMemberElement(user.userId, user.name, membersSelect, membersList, (userId, callback) => api.circles.members.remove(circleId, userId, callback)))
         .forEach((memberElement) => membersList.appendChild(memberElement));
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

    let roleElectionProcedure = getValue("roleElectionProcedure");
    let roleEvaluationProcedure = getValue("roleEvaluationProcedure");
    let taskMeetingProcedure = getValue("taskMeetingProcedure");
    let topicExplorationStageProcedure = getValue("topicExplorationStageProcedure");
    let topicPictureFormingStageProcedure = getValue("topicPictureFormingStageProcedure");
    let topicProposalShapingStageProcedure = getValue("topicProposalShapingStageProcedure");
    let topicDecisionMakingStageProcedure = getValue("topicDecisionMakingStageProcedure");
    let topicAgreementStageProcedure = getValue("topicAgreementStageProcedure");
    let agreementEvaluationProcedure = getValue("agreementEvaluationProcedure");

    //TODO: actually validate

    if(valid) {
        return {
            valid: true,
            data: { name, vision, mission, aim, fullState, expectationsForMembers, contactPerson,
                roleElectionProcedure, roleEvaluationProcedure, taskMeetingProcedure, topicExplorationStageProcedure,
                topicPictureFormingStageProcedure, topicProposalShapingStageProcedure, topicDecisionMakingStageProcedure,
                topicAgreementStageProcedure, agreementEvaluationProcedure }
        };
    }
    return { valid, errors };
}
