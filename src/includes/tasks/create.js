const path = require("path");
const locale = require("../../locale");
const y18nMustacheReader = require("../../y18n-mustache-reader");
const getOverlay = require("../getFormOverlay");
const formInclude = require("../formInclude");

module.exports = formInclude({
    html: y18nMustacheReader.readSync(locale(), path.join(__dirname, "create-form.html.partial")),
    requiredOptions: [ "circleId" ],
    prefillFrom: "fill",
    formSubmitHandler: (api, integration, opts, form) => sendCreateTaskRequest(api, integration, opts.circleId, form)
});

function sendCreateTaskRequest(api, integration, circleId, form) {
    let validation = validateData(form);
    if(!validation.valid) {
        //TODO: show errors on form
        return console.error("Failed to submit form because invalid data.");
    }
    let overlay = getOverlay(form);
    overlay.posting();
    api.circles.tasks.create(circleId, validation.data, (error, result) => {
        if(error) {
            overlay.failure();
            return console.error("Failed to create task.", error);
        }
        overlay.success(() => integration.tasks.view(circleId, result.task.taskId));
    });
}

function validateData(form) {
    let getValue = (name) => form[name].value;

    let valid = true;
    let errors = {};
    let title = getValue("title");
    let dueDate = getValue("dueDate");
    let aim = getValue("aim");
    let description = getValue("description");
    
    //TODO: actually validate

    if(valid) {
        return {
            valid,
            data: { title, dueDate, aim, description }
        };
    }
    return { valid, errors };
}
