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
            container.innerHTML = y18nMustacheReader.readSync(locale(), path.join(__dirname, "view.html.partial"));
            let view = container.querySelector(".did-view");

            let overlay = getOverlay(container);
            overlay.loading();

            if(!opts || !opts.id) {
                throw new Error("Missing circle ID for circleView include. You should provide `id` as an option when creating the include.");
            }

            parallel({
                usersRequest: (callback) => api.users.get(callback),
                circleRequest: (callback) => api.circles.get(opts.id, callback)
            }, (error, result) => {
                if(error) {
                    return console.error("Failed to get users or circle to display", error);
                }

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
                
                let users = result.usersRequest.users;
                let circle = result.circleRequest.circle;

                selectValueField(`fullState-${circle.fullState}`).style = "";

                setValue("title", circle.name);
                setMarkdownValue("vision", circle.vision);
                setMarkdownValue("mission", circle.mission);
                setMarkdownValue("aim", circle.aim);
                setMarkdownValue("expectationsForMembers", circle.expectationsForMembers);

                let insertDomElements = (name, elements) => {
                    let field = selectValueField(name);
                    elements.forEach(e => {
                        field.appendChild(e);
                        field.appendChild(createDomNode("br"));
                    });
                };
                insertDomElements("members", renderMembers(circle.members, users, integration));
                insertDomElements("invited", renderMembers(circle.invited, users, integration));
                insertDomElements("contactPerson", renderMembers([ circle.contactPerson ], users, integration));

                let editLink = view.querySelector(".did-edit-link");
                if(circle.members.indexOf(api.getCurrentUserId()) !== -1) {
                    editLink.addEventListener("click", (e) => {
                        e.preventDefault();
                        integration.circles.edit(opts.id);
                        return false;
                    });
                }
                else {
                    view.removeChild(editLink);
                }

                //Procedures
                setMarkdownValue("roleElectionProcedure", circle.roleElectionProcedure);
                setMarkdownValue("roleEvaluationProcedure", circle.roleEvaluationProcedure);
                setMarkdownValue("taskMeetingProcedure", circle.taskMeetingProcedure);
                setMarkdownValue("topicExplorationStageProcedure", circle.topicExplorationStageProcedure);
                setMarkdownValue("topicPictureFormingStageProcedure", circle.topicPictureFormingStageProcedure);
                setMarkdownValue("topicProposalShapingStageProcedure", circle.topicProposalShapingStageProcedure);
                setMarkdownValue("topicDecisionMakingStageProcedure", circle.topicDecisionMakingStageProcedure);
                setMarkdownValue("topicAgreementStageProcedure", circle.topicAgreementStageProcedure);
                setMarkdownValue("agreementEvaluationProcedure", circle.agreementEvaluationProcedure);

                let proceduresBox = view.querySelector(".did-procedures-container");
                let showProceduresLink = view.querySelector(".did-show-procedures-link");
                let hideProceduresLink = view.querySelector(".did-hide-procedures-link");
                showProceduresLink.addEventListener("click", e => {
                    e.preventDefault();
                    proceduresBox.style = "height:auto;box-shadow:none;";
                    showProceduresLink.style = "display:none;";
                    hideProceduresLink.style = "";
                    return false;
                });
                hideProceduresLink.addEventListener("click", e => {
                    e.preventDefault();
                    proceduresBox.style = "";
                    hideProceduresLink.style = "display:none;";
                    showProceduresLink.style = "";
                    return false;
                });

                let addTopicLink = view.querySelector(".did-add-topic-link");
                addTopicLink.addEventListener("click", e => {
                    e.preventDefault();
                    integration.topics.create(opts.id);
                    return false;
                });

                overlay.hide();
            });
        }
    };
};
