const browserify = require("browserify");
const fs = require("fs");
const path = require("path");
const less = require("less");
const LessPluginCleanCss = require("less-plugin-clean-css");
const async = require("async");

module.exports = {
    build: buildOutput,
    lib: require("./src/main"),
    libWithoutMarkdownParser: require("./src/main-no-md")
};

function buildOutput(outDir, localeDir, callback) {
    if(!localeDir) {
        callback = outDir;
        outDir = undefined;
    }
    else if(!callback) {
        callback = localeDir;
        localeDir = undefined;
    }

    outDir = outDir || path.join(__dirname, "output");
    localeDir = localeDir || path.join(__dirname, "locales");
    callback = callback || (error => { if(error) console.error("Uncaught error on build", error); });

    async.series([
        (callback) => buildCssBundle(outDir, callback),
        (callback) => buildJsBundle(outDir, localeDir, callback)
    ], (error) => {
        if(error) {
            return callback(error);
        }
        callback();
    });
}

function buildJsBundle(outDir, localeDir, callback) {
    fs.readdir(localeDir, (error, files) => {
        if(error) {
            return callback({
                trace: new Error("Failed to read locale dir"),
                error: error
            });
        }
        async.eachSeries(files.map(file => file.substring(0, file.length - 5)), (locale, callback) => {
            async.eachSeries([true, false], (includeMarkdown, callback) => {
                console.log("building js for locale", locale, includeMarkdown ? "with markdown" : "without markdown");
                let jsFileName = `lib.${locale}${includeMarkdown ? "" : ".no-md"}.js`;
                let outJs = path.join(outDir, jsFileName);

                let b = browserify();

                if(includeMarkdown) {
                    b.require("./src/main.js", { expose: "did" });
                }
                else {
                    b.require("./src/main-no-md.js", { expose: "did" });
                }
                b.transform("./browserify-path-inliner");
                b.transform("./browserify-locale-inliner", { locale: locale });
                b.transform("./browserify-y18n-mustache-inliner");
                b.transform("babelify", { presets: [ "es2015", "babili" ] });

                let outStream = fs.createWriteStream(outJs);
                let stream = b.bundle();
                stream.pipe(outStream);
                let errored = false;
                stream.on("error", (error) => {
                    if(errored) return;
                    console.log("- error while building", jsFileName);
                    errored = true;
                    callback(error);
                });
                stream.on("end", () => {
                    console.log("- finished building", jsFileName);
                    if(!errored) callback();
                });
            }, callback);
        }, callback);
    });
}

function buildCssBundle(outDir, callback) {
    let outCss = path.join(outDir, "lib.css");

    console.log("building css");
    let cleanCss = new LessPluginCleanCss({ advanced: true });
    less.render(`@import "main.less";`, {
        paths: [ path.join(__dirname, "styles") ],
        filename: "index.js",
        plugins: [ cleanCss ]
    }, (error, output) => {
        if(error) {
            console.log("- error while building css");
            return callback({ 
                trace: new Error("Failed to generate css"),
                error: error
            });
        }
        fs.writeFile(outCss, output.css, (error) => {
            if(error) {
                console.log("- error while writing css to file");
                return callback({
                    trace: new Error("Failed to write css to file " + outCss),
                    error: error
                });
            }
            console.log("- finished building css");
            callback();
        });
    });
}
