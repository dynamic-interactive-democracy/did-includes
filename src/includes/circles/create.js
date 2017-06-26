const fs = require("fs");
const path = require("path");

module.exports = (api) => {
    return {
        renderIn: (container) => {
            //TODO: Load form look asynchronously?
            container.innerHTML = fs.readFileSync(path.join(__dirname, "form.html.partial"), "utf8");
            //TODO: Bind listeners
        }
    };
};
