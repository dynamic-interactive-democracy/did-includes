const path = require("path");
const locale = require("../../locale");
const y18nMustacheReader = require("../../y18n-mustache-reader");
const getOverlay = require("../getFormOverlay");
const setUpMemberInviteSelect = require("../setUpMemberInviteSelect");
const prefillFields = require("../prefillFields");

module.exports = (api, integration) => (opts) => {
    return {
        renderIn: (container) => {
            container.innerHTML = y18nMustacheReader.readSync(locale(), path.join(__dirname, "create-form.html.partial"));
            let form = container.querySelector("form.did-topic-form");

            if(!opts || !opts.circleId) {
                throw new Error("Missing circleId in topics creation form, must be supplied in opts");
            }
            if(opts.fill) {
                prefillFields(form, opts.fill);
            }

            form.addEventListener("submit", (e) => {
                e.preventDefault();
                sendCreateTopicRequest(api, integration, opts.circleId, form);
                return false;
            });
        }
    };
};

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
        overlay.success(() => integration.topics.view(circleId, result.topic.title));
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
