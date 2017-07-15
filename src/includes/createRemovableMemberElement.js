const createDomNode = require("./createDomNode");

module.exports = (id, name, membersSelect, membersList, removeHook) => {
    let memberElement = createDomNode("div", { class: "did-invite-member", text: name });
    let dismissButton = createDomNode("div", { class: "did-uninvite-member-button" });

    dismissButton.addEventListener("click", (e) => {
        e.preventDefault();
        removeHook(id, (error) => {
            if(error) {
                return console.error("Failed to remove an invited member", error);
            }
            membersList.removeChild(memberElement);
            let newOpt = createDomNode("option", { value: id, text: name });
            let elementAlphanumericallyFollowing = getElementAlphaAfter(membersSelect, name);
            membersSelect.insertBefore(newOpt, elementAlphanumericallyFollowing);
        });
        return false;
    });

    memberElement.appendChild(dismissButton);
    return memberElement;
}

function getElementAlphaAfter(container, content) {
    return Array.prototype.filter.call(container.children, node => node.innerText >= content)[0];
}
