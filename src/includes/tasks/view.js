const path = require("path");
const locale = require("../../locale");
const y18nMustacheReader = require("../../y18n-mustache-reader");
const parallel = require("../../tiny-parallel");
const createDomNode = require("../createDomNode");
const renderMembers = require("../renderMembers");
const viewInclude = require("../viewInclude");

module.exports = viewInclude({
    html: y18nMustacheReader.readSync(locale(), path.join(__dirname, "view-scaffolding.html.partial")),
    requiredOptions: [ "id", "circleId" ]
}, (api, integration, marked, opts, view, callback) => {

    let registerButton = (selector, action) => {
        view.querySelector(selector).addEventListener("click", e => {
            e.preventDefault();
            action();
            return false;
        });
    };
    registerButton(".did-back-to-circle-link", () => integration.circles.view(opts.circleId));
    registerButton(".did-edit-link", () => integration.tasks.edit(opts.circleId, opts.id));

    parallel({
        usersRequest: (callback) => api.users.get(callback),
        taskRequest: (callback) => api.circles.tasks.get(opts.circleId, opts.id, callback),
        circleRequest: (callback) => api.circles.get(opts.circleId, callback)
    }, (error, result) => {
        if(error) {
            console.error("Failed to get users or circle to display", error);
            return callback(error);
        }

        let users = result.usersRequest.users;
        let task = result.taskRequest.task;
        let circle = result.circleRequest.circle;

        let selectValueField = (name) => view.querySelector(`.did-view-value-${name}`);
        let setValue = (name, value) => {
            let field = selectValueField(name);
            if(value) field.innerText = value;
            else      field.innerHTML = "&mdash;";
        };
        let setMarkdownValue = (name, value) => {
            let field = selectValueField(name);
            field.innerHTML = value ? marked(value) : "&mdash;";
        }

        setValue("title", task.title);
        setValue("dueDate", task.dueDate);
        setMarkdownValue("aim", task.aim);
        setMarkdownValue("description", task.description);
        setMarkdownValue("procedure", circle.taskMeetingProcedure);

        let insertDomElements = (name, elements) => {
            let field = selectValueField(name);
            elements.forEach(e => {
                field.appendChild(e);
                field.appendChild(createDomNode("br"));
            });
        };
        insertDomElements("owner", renderMembers([ task.owner ], users, integration));

        view.querySelector(`.did-topic-status-${task.status}`).style = "display: block;";

        callback();
    });
});
