const path = require("path");
const locale = require("../../locale");
const y18nMustacheReader = require("../../y18n-mustache-reader");
const parallel = require("../../tiny-parallel");
const getOverlay = require("../getViewOverlay");
const createDomNode = require("../createDomNode");
const renderMembers = require("../renderMembers");

module.exports = (api, integration, marked) => (opts) => {
    return {
        renderIn: (container) => {
            container.innerHTML = y18nMustacheReader.readSync(locale(), path.join(__dirname, "view-scaffolding.html.partial"));
            let view = container.querySelector(".did-view");

            let overlay = getOverlay(container);
            overlay.loading();

            if(!opts || !opts.id || !opts.circleId) {
                throw new Error("Missing topic ID or circle ID for topicView include. You should provide `id` and `circleId` as options when creating the include.");
            }

            view.querySelector(".did-back-to-circle-link").addEventListener("click", e => {
                e.preventDefault();
                integration.circles.view(opts.circleId);
                return false;
            });

            view.querySelector(".did-edit-link").addEventListener("click", e => {
                e.preventDefault();
                integration.topics.edit(opts.circleId, opts.id);
                return false;
            });

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
                //TODO: action!

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
                for(let i = 0; i < stages.length; i++) {
                    let stage = stages[i];
                    if(stage != topic.stage) {
                        markStage(stage, "done");
                    }
                    else {
                        markStage(stage, "current");
                        if(i < stages.length - 1) {
                            goToNextStageLink.innerText += " " + getStageElement(stages[i+1]).innerText;
                        }
                        else {
                            goToNextStageLink.style = "display:none;";
                        }
                        break;
                    }
                }

                overlay.hide();
            });
        }
    };
};

function determineProcedure(stage, circle) {
    return {
        "exploration":      circle.topicExplorationStageProcedure,
        "pictureForming":   circle.topicPictureFormingStageProcedure,
        "proposalShaping":  circle.topicProposalShapingStageProcedure,
        "decisionMaking":   circle.topicDecisionMakingStageProcedure,
        "agreement":        circle.topicAgreementStageProcedure
    }[stage] || "";
}
