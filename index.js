const browserify = require("browserify");
const fs = require("fs");
const path = require("path");

module.exports = {
    build: buildScripts
};

function buildScripts(out) {
    out = out || path.join(__dirname, "output", "lib.js");

    let b = browserify();

    b.require("./src/main.js", { expose: "did" });
    b.transform("brfs");

    let outStream = fs.createWriteStream(out);
    b.bundle().pipe(outStream);
}
