const browserify = require("browserify");
const fs = require("fs");
const path = require("path");
const less = require("less");

module.exports = {
    build: buildOutput,
    lib: require("./src/main")
};

//TODO: buildScripts should probably take a callback for reporting errors?
function buildOutput(outDir, localeDir) {
    outDir = outDir || path.join(__dirname, "output");
    localeDir = localeDir || path.join(__dirname, "locales");

    //Build js bundle
    fs.readdir(localeDir, (error, files) => {
        //TODO: proper callback
        if(error) {
            return console.error("failed to read locale dir", error);
        }
        files.map(file => file.substring(0, file.length - 5)).forEach(locale => {
            console.log("building js for locale", locale);
            let outJs = path.join(outDir, `lib.${locale}.js`);

            let b = browserify();

            b.require("./src/main.js", { expose: "did" });
            b.transform("./browserify-locale-inliner", { locale: locale });
            b.transform("./browserify-y18n-mustache-inliner")

            //TODO: error handle
            let outStream = fs.createWriteStream(outJs);
            b.bundle().pipe(outStream);
        });
    });

    let outCss = path.join(outDir, "lib.css");

    //Build css bundle
    console.log("building css");
    less.render(`@import "main.less";`, {
        paths: [ path.join(__dirname, "styles") ],
        filename: "index.js"
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
