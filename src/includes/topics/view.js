const path = require("path");
const locale = require("../../locale");
const y18nMustacheReader = require("../../y18n-mustache-reader");
const parallel = require("../../tiny-parallel");
const getOverlay = require("../getFormOverlay");
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
    registerButton(".did-edit-link", () => integration.topics.edit(opts.circleId, opts.id));

    parallel({
        usersRequest: (callback) => api.users.get(callback),
        topicRequest: (callback) => api.circles.topics.get(opts.circleId, opts.id, callback),
        circleRequest: (callback) => api.circles.get(opts.circleId, callback)
    }, (error, result) => {
        if(error) {
            return console.error("Failed to get users or circle to display", error);
        }

        let users = result.usersRequest.users;
        let topic = result.topicRequest.topic;
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

        setValue("title", topic.title);
        setMarkdownValue("why", topic.why);
        setMarkdownValue("procedure", determineProcedure(topic.stage, circle));

        let insertDomElements = (name, elements) => {
            let field = selectValueField(name);
            elements.forEach(e => {
                field.appendChild(e);
                field.appendChild(createDomNode("br"));
            });
        };
        insertDomElements("owner", renderMembers([ topic.owner ], users, integration));

        let goToNextStageLink = view.querySelector(".did-go-to-next-stage-link");

        let getStageElement = (stage) => view.querySelector(`.did-topic-stage-${stage}`);
        let markStage = (stage, state) => {
            getStageElement(stage).classList += " " + state;
        };
        let stages = [
            "exploration",
            "pictureForming",
            "proposalShaping",
            "decisionMaking",
            "agreement"
        ];
        let nextStage = null;

        let overlay = getOverlay(view);

        goToNextStageLink.addEventListener("click", e => {
            e.preventDefault();
            overlay.posting();
            api.circles.topics.update(opts.circleId, opts.id, { stage: nextStage }, (error) => {
                if(error) {
                    overlay.failure();
                    return console.error("Failed up go to next stage", error);
                }
                overlay.success(() => integration.topics.view(opts.circleId, opts.id));
            });
            return false;
        });

        for(let i = 0; i < stages.length; i++) {
            let stage = stages[i];
            if(stage != topic.stage) {
                markStage(stage, "done");
            }
            else {
                markStage(stage, "current");
                if(i < stages.length - 1) {
                    nextStage = stages[i+1];
                    goToNextStageLink.innerText += " " + getStageElement(nextStage).innerText;
                }
                else {
                    goToNextStageLink.style = "display:none;";
                }
                break;
            }
        }

        callback();
    });
});

function determineProcedure(stage, circle) {
    return {
        "exploration":      circle.topicExplorationStageProcedure,
        "pictureForming":   circle.topicPictureFormingStageProcedure,
        "proposalShaping":  circle.topicProposalShapingStageProcedure,
        "decisionMaking":   circle.topicDecisionMakingStageProcedure,
        "agreement":        circle.topicAgreementStageProcedure
    }[stage] || "";
}
