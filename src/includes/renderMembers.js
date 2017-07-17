const createDomNode = require("./createDomNode");

module.exports = (userIds, users, integration) => {
    return userIds.map(userId => {
        let user = users.find(user => user.userId == userId);
        return renderUserLink(user, integration);
    });
};

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
