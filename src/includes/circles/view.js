const path = require("path");
const locale = require("../../locale");
const y18nMustacheReader = require("../../y18n-mustache-reader");
const parallel = require("async/parallel");
const getOverlay = require("../getViewOverlay");
const createDomNode = require("../createDomNode");
const marked = require("marked");

module.exports = (api, integration) => (opts) => {
    return {
        renderIn: (container) => {
            container.innerHTML = y18nMustacheReader.readSync(locale(), path.join(__dirname, "view.html.partial"));
            let view = container.querySelector(".did-view");

            let overlay = getOverlay(container);
            overlay.loading();

            if(!opts || !opts.id) {
                throw new Error("Missing circle ID for circleView include. You should provide `id` as an option when creating the include.");
            }

            parallel({ //TODO: async/parallel makes the bundle *huge*. Fix!
                usersRequest: (callback) => api.users.get(callback),
                circleRequest: (callback) => api.circles.get(opts.id, callback)
            }, (error, result) => {
                if(error) {
                    return console.error("Failed to get users or circle to display", error);
                }

                let setValue = (name, value) => {
                    let field = view.querySelector(`.did-view-value-${name}`);
                    if(value) field.innerText = value;
                    else      field.innerHTML = "&mdash;";
                };
                let setMarkdownValue = (name, value) => {
                    let field = view.querySelector(`.did-view-value-${name}`);
                    field.innerHTML = value ? marked(value) : "&mdash;";
                }
                
                let users = result.usersRequest.users;
                let circle = result.circleRequest.circle;

                setValue("title", circle.name);
                setMarkdownValue("vision", circle.vision);
                setMarkdownValue("mission", circle.mission);
                setMarkdownValue("aim", circle.aim);
                setValue("fullState", circle.fullState); //TODO: Should be made nicer to read :-)
                setMarkdownValue("expectationsForMembers", circle.expectationsForMembers);

                let insertDomElements = (name, elements) => {
                    let field = view.querySelector(`.did-view-value-${name}`);
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

                overlay.hide();
            });
        }
    };
};

function renderMembers(userIds, users, integration) {
    return userIds.map(userId => {
        let user = users.find(user => user.userId == userId);
        return renderUserLink(user, integration);
    });
}

function renderUserLink(user, integration) {
    let box = createDomNode("div");
    box.innerHTML = `<a href="#view-user" data-userId="${user.userId}" class="did-user-link">${user.name}</a>`;
    let link = box.firstChild;
    link.addEventListener("click", (e) => {
        e.preventDefault();
        integration.users.view(user.userId);
        return false;
    });
    return link;
}
