const path = require("path");
const locale = require("../../locale");
const y18nMustacheReader = require("../../y18n-mustache-reader");
const getOverlay = require("../getFormOverlay");
const parallel = require("../../tiny-parallel");
const createRemovableMemberElement = require("../createRemovableMemberElement");
const setUpMemberInviteSelect = require("../setUpMemberInviteSelect");

module.exports = (api, integration) => (opts) => {
    return {
        renderIn: (container) => {
            container.innerHTML = y18nMustacheReader.readSync(locale(), path.join(__dirname, "edit-form.html.partial"));
            let form = container.querySelector("form.did-topic-form");

            let overlay = getOverlay(form);
            overlay.loading();

            if(!opts || !opts.id || !opts.circleId) {
                throw new Error("Missing topic ID or circle ID for circleEdit include. You should provide `id` and `circleId` as options when creating the include.");
            }

            parallel({
                usersRequest: (callback) => api.users.get(callback),
                circleRequest: (callback) => api.circles.get(opts.circleId, callback),
                topicRequest: (callback) => api.circles.topics.get(opts.circleId, opts.id, callback)
            }, (error, result) => {
                if(error) {
                    return console.error("Failed to load data", error);
                }
                let users = result.usersRequest.users;
                let circle = result.circleRequest.circle;
                let topic = result.topicRequest.topic;

                if(circle.members.indexOf(api.getCurrentUserId()) === -1) {
                    return console.error("Cannot edit this form. Not a member of the circle.");
                }

                let setValue = (name, value) => form[name].value = value;
                let transferValueByName = (name) => setValue(name, topic[name]);
                let transferValuesByName = (names) => names.forEach(transferValueByName);
                transferValuesByName([
                    "title",
                    "why"
                ]);

                let ownerOptions = users
                    .filter(user => circle.members.indexOf(user.userId) !== -1)
                    .map(user => `<option value="${user.userId}">${user.name}</option>`).join("");
                let ownerSelect = form.owner;
                ownerSelect.innerHTML = ownerOptions;
                ownerSelect.value = topic.owner;

                overlay.hide();
            });

            form.addEventListener("submit", (e) => {
                e.preventDefault();
                sendUpdateTopicRequest(api, integration, opts.circleId, opts.id, form);
                return false;
            });
        }
    };
};

function sendUpdateTopicRequest(api, integration, circleId, id, form) {
    let validation = validateData(form);
    if(!validation.valid) {
        //TODO: show errors on form
        return console.error("Failed to submit form because invalid data.");
    }
    let overlay = getOverlay(form);
    overlay.posting();
    api.circles.topics.update(circleId, id, validation.data, (error, result) => {
        if(error) {
            overlay.failure();
            return console.error("Failed to update topic.", error);
        }
        overlay.success(() => integration.topics.view(circleId, validation.data.title));
    });
}

function validateData(form) {
    let getValue = (name) => form[name].value;

    let valid = true;

    let errors = {};
    let title = getValue("title");
    let owner = getValue("owner");
    let why = getValue("why");

    //TODO: actually validate

    if(valid) {
        return {
            valid: true,
            data: { title, owner, why }
        };
    }
    return { valid, errors };
}
