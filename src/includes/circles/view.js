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

                let setUpButton = (selector, action) => {
                    view.querySelector(selector).addEventListener("click", e => {
                        e.preventDefault();
                        action();
                        return false;
                    });
                };
                setUpButton(".did-add-task-link", () => integration.tasks.create(opts.id));
                setUpButton(".did-add-topic-link", () => integration.topics.create(opts.id));

                //Set up item tabs
                let itemList = view.querySelector(".did-circle-items-container-item-list");
                let tabs = view.querySelectorAll(".did-circle-items-container-tab");
                let selectedTab = tabs[0];
                let selectTab = (tab) => {
                    selectedTab.classList = "did-circle-items-container-tab";
                    tab.classList += " selected";
                    selectedTab = tab;
                }
                let itemLoaders = { //TODO: Only call an item loader once (cache result if success)
                    "roles": (callback) => callback(null, []),
                    "tasks": (callback) => api.circles.tasks.getAll(opts.id, (error, result) => {
                        if(error) {
                            return callback(error);
                        }
                        callback(null, result.tasks.map(task => {
                            let node = createDomNode("a", { class: "did-circle-item" });
                            node.innerHTML = `
                                <div class="did-circle-item-description">
                                    <h1>${task.title}</h1>
                                    ${marked(previewMarkdown(task.aim))}
                                </div>
                                <div class="did-circle-item-stats">
                                    <div>${task.status}</div>
                                    <div>${task.attachments.length} attacments</div>
                                </div>
                            `; // TODO: Make "stage", "comments" and "attachments" localized
                            node.href = "#view-task";
                            node.addEventListener("click", e => {
                                e.preventDefault();
                                integration.tasks.view(opts.id, task.taskId);
                                return false;
                            });
                            return node;
                        }));
                    }),
                    "topics": (callback) => api.circles.topics.getAll(opts.id, (error, result) => {
                        if(error) {
                            return callback(error);
                        }
                        callback(null, result.topics.map(topic => {
                            let node = createDomNode("a", { class: "did-circle-item" });
                            node.innerHTML = `
                                <div class="did-circle-item-description">
                                    <h1>${topic.title}</h1>
                                    ${marked(previewMarkdown(topic.why))}
                                </div>
                                <div class="did-circle-item-stats">
                                    <div>In ${topic.stage} stage</div>
                                    <div>${topic.comments.length} comments</div>
                                    <div>${topic.attachments.length} attacments</div>
                                </div>
                            `; // TODO: Make "stage", "comments" and "attachments" localized
                            node.href = "#view-topic";
                            node.addEventListener("click", e => {
                                e.preventDefault();
                                integration.topics.view(opts.id, topic.topicId);
                                return false;
                            });
                            return node;
                        }));
                    }),
                    "agreements": (callback) => callback(null, [])
                };
                Array.prototype.forEach.call(tabs, tab => {
                    tab.addEventListener("click", e => {
                        e.preventDefault();
                        selectTab(tab);
                        itemList.innerHTML = `<div class="did-spinner"></div>`;
                        itemLoaders[tab.dataset.didtab]((error, items) => {
                            itemList.innerHTML = "";
                            items.forEach(item => itemList.appendChild(item));
                        });
                        return false;
                    });
                });
                Array.prototype.find.call(tabs, tab => tab.dataset.didtab == "roles").click();

                overlay.hide();
            });
        }
    };
};

function previewMarkdown(md) {
    if(md.length <= 250) {
        return md;
    }
    return md.substring(0, 249) + "&nbsp;&nbsp;&nbsp;&hellip;";
}
