const mustache = require("mustache");
const fs = require("fs");
const path = require("path");
const view = fs.readFileSync(path.join(__dirname, "view.html"), "utf8");

module.exports = (config, setUpFun) => {
    let result = mustache.render(view, {
        apiPort: config.apiPort,
        currentUser: config.currentUser,
        setUpFun: setUpFun.toString()
    });

    return (req, res) => res.send(result);
};
