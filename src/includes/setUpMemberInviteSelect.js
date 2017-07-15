const createRemovableMemberElement = require("./createRemovableMemberElement");

module.exports = (membersSelect, membersList, hooks) => {
    membersSelect.addEventListener("change", (e) => {
        let id = membersSelect.value;
        let opt = membersSelect.querySelector(`option[value='${id}']`);
        let name = opt.innerText;

        hooks.invite(id, (error) => {
            if(error) {
                return console.error("Failed to remove a member element", error);
            }

            membersSelect.removeChild(opt);
            let memberElement = createRemovableMemberElement(id, name, membersSelect, membersList, hooks.remove);
            membersList.appendChild(memberElement);
        });
    });
};