const browserify = require("browserify");
const fs = require("fs");
const path = require("path");
const less = require("less");

module.exports = {
    build: buildOutput
};

//TODO: buildScripts should probably take a callback for reporting errors?
function buildOutput(outDir) {
    outDir = outDir || path.join(__dirname, "output");
    let outJs = path.join(outDir, "lib.js");
    let outCss = path.join(outDir, "lib.css");

    //Build js bundle
    //TODO: Build internationalized versions
    let b = browserify();

    b.require("./src/main.js", { expose: "did" });
    b.transform("brfs");

    //TODO: error handle
    let outStream = fs.createWriteStream(outJs);
    b.bundle().pipe(outStream);

    //Build css bundle
    less.render(`@import "main.less";`, {
        paths: [ path.join(__dirname, "styles") ],
        filename: "____VIRTUAL_FILE____computed_entry_point.less"
    }, (error, output) => {
        //TODO: Proper callback
        if(error) {
            console.error("failed to build less", error);
        }
        fs.writeFile(outCss, output.css, (error) => {
            if(error) {
                console.error("Failed to save css in", outCss, error);
            }
        });
    });
}
