const getOverlay = require("./getFormOverlay");

module.exports = (viewIncludeOptions, setUp) => {
    return (api, integration, marked) => (opts) => {
        return {
            renderIn: (container) => {
                container.innerHTML = viewIncludeOptions.html;
                let view = container.querySelector(viewIncludeOptions.view);
    
                let overlay = getOverlay(container);
                overlay.loading();

                if(viewIncludeOptions.requiredOptions) {
                    if(!opts) {
                        throw new Error("Missing options argument in view include");
                    }
                    let missingOptions = viewIncludeOptions.requiredOptions
                                            .filter(requiredOption => typeof opts[requiredOption] === "undefined");
                    if(missingOptions.length) {
                        throw new Error(`Missing options '${missingOptions.join("', '")}' in view include`);
                    }
                }

                if(!setUp) {
                    setUp = function(api, integration, opts, form, callback) { callback(); };
                }

                setUp(api, integration, marked, opts, view, (error) => {
                    if(error) {
                        return console.error("Failed to load view", error);
                    }
                    overlay.hide();
                });
            }
        };
    };
};
