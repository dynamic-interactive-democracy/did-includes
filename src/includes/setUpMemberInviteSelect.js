const createRemovableMemberElement = require("./createRemovableMemberElement");

module.exports = (state, hooks) => {
    state.membersSelect.addEventListener("change", (e) => {
        let id = state.membersSelect.value;
        let opt = state.membersSelect.querySelector(`option[value='${id}']`);
        let name = opt.innerText;

        hooks.invite(id, (error) => {
            if(error) {
                return console.error("Failed to remove a member element", error);
            }

            state.membersSelect.removeChild(opt);
            let memberElement = createRemovableMemberElement(id, name, state, hooks.remove);
            state.membersList.appendChild(memberElement);
        });
    });
};