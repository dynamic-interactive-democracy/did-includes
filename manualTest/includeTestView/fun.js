const mustache = require("mustache");
const fs = require("fs");
const path = require("path");
const view = fs.readFileSync(path.join(__dirname, "view.html"), "utf8");

module.exports = (config, title, includeFun) => {
    let result = mustache.render(view, {
        apiUrl: config.apiUrl,
        currentUser: config.currentUser,
        title: title,
        includeFun: includeFun.toString()
    });

    return (req, res) => res.send(result);
};
