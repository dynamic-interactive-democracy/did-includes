const path = require("path");
const locale = require("../../locale");
const y18nMustacheReader = require("../../y18n-mustache-reader");
const parallel = require("async/parallel");
const getOverlay = require("../getViewOverlay");

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
                let setValue = (name, value) => view.querySelector(`.did-view-value-${name}`).innerText = value;
                console.log("loaded", result);
                let circle = result.circleRequest.circle;
                setValue("title", circle.name);
                overlay.hide();
            });
        }
    };
};
