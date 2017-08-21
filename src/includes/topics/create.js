const path = require("path");
const locale = require("../../locale");
const y18nMustacheReader = require("../../y18n-mustache-reader");
const getOverlay = require("../getFormOverlay");
const formInclude = require("../formInclude");

module.exports = formInclude({
    html: y18nMustacheReader.readSync(locale(), path.join(__dirname, "create-form.html.partial")),
    requiredOptions: [ "circleId" ],
    prefillFrom: "fill",
    formSubmitHandler: (api, integration, opts, form) => sendCreateTopicRequest(api, integration, opts.circleId, form)
});

function sendCreateTopicRequest(api, integration, circleId, form) {
    let validation = validateData(form);
    if(!validation.valid) {
        //TODO: show errors on form
        return console.error("Failed to submit form because invalid data.");
    }
    let overlay = getOverlay(form);
    overlay.posting();
    api.circles.topics.create(circleId, validation.data, (error, result) => {
        if(error) {
            overlay.failure();
            return console.error("Failed to create topic.", error);
        }
        overlay.success(() => integration.topics.view(circleId, result.topic.topicId));
    });
}

function validateData(form) {
    let getValue = (name) => form[name].value;

    let valid = true;
    let errors = {};
    let title = getValue("title");
    let why = getValue("why");
    
    //TODO: actually validate

    if(valid) {
        return {
            valid: true,
            data: { title, why }
        };
    }
    return { valid, errors };
}
