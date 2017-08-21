const getOverlay = require("./getFormOverlay");
const prefillFields = require("./prefillFields");

module.exports = (formIncludeOptions, setUp) => {
    return (api, integration) => (opts) => {
        return {
            renderIn: (container) => {
                container.innerHTML = formIncludeOptions.html;
                let form = container.querySelector("form");

                let overlay = getOverlay(form);
                overlay.loading();

                if(formIncludeOptions.requiredOptions) {
                    if(!opts) {
                        throw new Error("Missing options argument in form include");
                    }
                    let missingOptions = formIncludeOptions.requiredOptions
                                            .filter(requiredOption => typeof opts[requiredOption] === "undefined");
                    if(missingOptions.length) {
                        throw new Error(`Missing options '${missingOptions.join("', '")}' in form include`);
                    }
                }

                if(formIncludeOptions.prefillFrom && opts[formIncludeOptions.prefillFrom]) {
                    prefillFields(form, opts[formIncludeOptions.prefillFrom]);
                }

                form.addEventListener("submit", (e) => {
                    e.preventDefault();
                    formIncludeOptions.formSubmitHandler(api, integration, opts, form);
                    return false;
                });

                if(!setUp) {
                    setUp = function(api, integration, opts, form, callback) { callback(); };
                }

                setUp(api, integration, opts, form, (error) => {
                    if(error) {
                        return console.error("Failed to load form", error);
                    }
                    overlay.hide();
                });
            }
        };
    };
};
