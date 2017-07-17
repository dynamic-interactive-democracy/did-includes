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

                //Set up item tabs
                let itemList = view.querySelector(".did-circle-items-container-item-list");
                let tabs = view.querySelectorAll(".did-circle-items-container-tab");
                let selectedTab = tabs[0];
                let selectTab = (tab) => {
                    selectedTab.classList = "did-circle-items-container-tab";
                    tab.classList += " selected";
                    selectedTab = tab;
                }
                let itemLoaders = {
                    "roles": (callback) => callback(null, []),
                    "tasks": (callback) => callback(null, []),
                    "topics": (callback) => api.circles.topics.getAll(opts.id, (error, result) => {
                        if(error) return callback(error);
                        callback(null, result.topics.map(topic => {
                            let node = createDomNode("a", { class: "did-circle-item" });
                            node.innerHTML = `<h2>${topic.title}</h2><p>${marked(topic.why)}</p>`;
                            node.href = "#view-topic";
                            node.addEventListener("click", e => {
                                e.preventDefault();
                                integration.topics.view(opts.id, topic.title);
                                return false;
                            });
                            return node;
                        }));
                    }),
                    "agreements": (callback) => callback(null, [])
                };
                Array.prototype.forEach.call(tabs, tab => {
                    tab.addEventListener("click", e => {
                        selectTab(tab);
                        itemList.innerHTML = "";
                        itemLoaders[tab.dataset.didtab]((error, items) => {
                            items.forEach(item => itemList.appendChild(item));
                        });
                    });
                });
                Array.prototype.find.call(tabs, tab => tab.dataset.didtab == "roles").click();

                overlay.hide();
            });
        }
    };
};
