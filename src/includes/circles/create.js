const path = require("path");
const locale = require("../../locale");
const y18nMustacheReader = require("../../y18n-mustache-reader");

module.exports = (api, integration) => (opts) => {
    return {
        renderIn: (container) => {
            container.innerHTML = y18nMustacheReader.readSync(locale(), path.join(__dirname, "form.html.partial"));
            let form = container.querySelector("form.did-circle-form");

            //Prefill fields
            if(opts && opts.fill) {
                Object.keys(opts.fill).forEach((key) => {
                    let element = form.querySelector(`[name=${key}]`);
                    if(!element) {
                        return console.error("[did/create-circle-include] Tried to prefill", key, "with value", opts.fill[key], "but no such input element exists in the form.");
                    }
                    element.value = opts.fill[key];
                    //This has been verified to work for: input, textarea, select
                    //Not yet verified: checkbox, radio
                });
            }

            let inviteMembersSelect = form.querySelector("[name=inviteMembers]");
            let invitedMembersList = form.querySelector(".invitedMembersList");

            api.users.get((error, data) => {
                if(error) {
                    return console.error("Failed to load users.", error);
                }
                let options = data.users.map(user => `<option value="${user.userId}">${user.name}</option>`);
                inviteMembersSelect.innerHTML = `<option></option>` + options;

                inviteMembersSelect.addEventListener("change", (e) => {
                    let id = inviteMembersSelect.value;
                    let opt = inviteMembersSelect.querySelector(`option[value='${id}']`);
                    let name = opt.innerText;
                    inviteMembersSelect.removeChild(opt);
                    //TODO: alt to using `document`? (Breaks general usage!!!)
                    let memberElement = document.createElement("div");
                    memberElement.classList = "invite-member";
                    memberElement.innerText = name;
                    invitedMembersList.appendChild(memberElement);
                    //TODO: remove element again
                });
            });

            form.addEventListener("submit", (e) => {
                e.preventDefault();
                //TODO: validate content
                let data = "valid data";
                //TODO: submit through API
                api.circles.create(data, (error, result) => {
                    if(error) {
                        return; //TODO: Show error message
                    }
                    //TODO: somehow, based on result, redirect to correct url for viewing a circle
                    integration.circles.view(result.circle.id);
                });
                return false;
            });
        }
    };
};
