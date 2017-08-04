const mustache = require("mustache");
const fs = require("fs");
const path = require("path");
const view = fs.readFileSync(path.join(__dirname, "view.html"), "utf8");

module.exports = (apiPort, setUpFun) => {
    let result = mustache.render(view, {
        apiPort,
        setUpFun: setUpFun.toString()
    });

    return (req, res) => res.send(result);
};
