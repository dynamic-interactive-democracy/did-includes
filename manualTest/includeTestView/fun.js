const mustache = require("mustache");
const fs = require("fs");
const path = require("path");
const view = fs.readFileSync(path.join(__dirname, "view.html"), "utf8");

module.exports = (setUpFun) => {
    let result = mustache.render(view, {
        setUpFun: setUpFun.toString()
    });

    return (req, res) => res.send(result);
};
