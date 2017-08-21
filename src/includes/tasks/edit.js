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
    requiredOptions: [ "id", "circleId" ],
    formSubmitHandler: (api, integration, opts, form) => sendUpdateTaskRequest(api, integration, opts.circleId, opts.id, form)
}, (api, integration, opts, form, callback) => {
    parallel({
        usersRequest: (callback) => api.users.get(callback),
        circleRequest: (callback) => api.circles.get(opts.circleId, callback),
        taskRequest: (callback) => api.circles.tasks.get(opts.circleId, opts.id, callback)
    }, (error, result) => {
        if(error) {
            return console.error("Failed to load data", error);
        }
        let users = result.usersRequest.users;
        let circle = result.circleRequest.circle;
        let task = result.taskRequest.task;

        if(circle.members.indexOf(api.getCurrentUserId()) === -1) {
            return console.error("Cannot edit this form. Not a member of the circle.");
        }

        let setValue = (name, value) => form[name].value = value;
        let transferValueByName = (name) => setValue(name, task[name]);
        let transferValuesByName = (names) => names.forEach(transferValueByName);
        transferValuesByName([
            "title",
            "dueDate",
            "description",
            "aim",
            "status"
        ]);

        let ownerOptions = users
            .filter(user => circle.members.indexOf(user.userId) !== -1)
            .map(user => `<option value="${user.userId}">${user.name}</option>`).join("");
        let ownerSelect = form.owner;
        ownerSelect.innerHTML = ownerOptions;
        ownerSelect.value = task.owner;

        callback();
    });
});

function sendUpdateTaskRequest(api, integration, circleId, id, form) {
    let validation = validateData(form);
    if(!validation.valid) {
        //TODO: show errors on form
        return console.error("Failed to submit form because invalid data.");
    }
    let overlay = getOverlay(form);
    overlay.posting();
    api.circles.tasks.update(circleId, id, validation.data, (error, result) => {
        if(error) {
            overlay.failure();
            return console.error("Failed to update task.", error);
        }
        overlay.success(() => integration.tasks.view(circleId, id));
    });
}

function validateData(form) {
    let getValue = (name) => form[name].value;

    let valid = true;

    let errors = {};
    let title = getValue("title");
    let owner = getValue("owner");
    let dueDate = getValue("dueDate");
    let status = getValue("status");
    let aim = getValue("aim");
    let description = getValue("description");

    //TODO: actually validate

    if(valid) {
        return {
            valid: true,
            data: { title, owner, dueDate, status, aim, description }
        };
    }
    return { valid, errors };
}
