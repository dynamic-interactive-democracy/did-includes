const browserify = require("browserify");
const fs = require("fs");
const path = require("path");
const less = require("less");
const LessPluginCleanCss = require("less-plugin-clean-css");
const async = require("async");
const _ = require("lodash");

module.exports = {
    build: buildOutput,
    lib: require("./src/main"),
    libWithoutMarkdownParser: require("./src/main-no-md")
};

function buildOutput(config, callback) {
    if(!callback) {
        callback = config;
        config = {};
    }

    config = _.merge({
        verbose: false,
        outDir: path.join(__dirname, "output"),
        localeDir: path.join(__dirname, "locales"),
        js: {
            locale: [ "da_DK", "en_UK", "en_US" ],
            minified: true,
            markdownIncluded: [ true, false ]
        },
        css: {
            minified: true
        }
    }, config);

    callback = callback || (error => { if(error) console.error("Uncaught error on build", error); });

    if(config.verbose) console.log("Building with config", config);

    fs.mkdir(config.outDir, (error) => {
        if(error && error.code != "EEXIST") {
            return callback(error);
        }
        
        let builds = [];
        if(config.css) {
            builds.push((callback) => buildCssBundle(config, callback));
        }
        if(config.js) {
            builds.push((callback) => buildJsBundle(config, callback));
        }

        async.series(builds, (error) => {
            if(error) {
                return callback(error);
            }
            callback();
        });
    });
}

function buildJsBundle(config, callback) {
    let locales = config.js.locale;
    if(!Array.isArray(locales)) locales = [ locales ];

    async.eachSeries(locales, (locale, callback) => {
        let markdownIncluded = config.js.markdownIncluded;
        if(!Array.isArray(markdownIncluded)) markdownIncluded = [ markdownIncluded ];

        async.eachSeries(markdownIncluded, (markdownIncluded, callback) => {
            let minified = config.js.minified;
            if(!Array.isArray(minified)) minified = [ minified ];

            async.eachSeries(minified, (minified, callback) => {
                let jsFileName = `lib.${locale}${markdownIncluded ? "" : ".no-md"}${minified ? ".min" : ""}.js`;
                let outJs = path.join(config.outDir, jsFileName);
                if(config.verbose) console.log("building js for locale", locale, markdownIncluded ? "with markdown" : "without markdown", "into", jsFileName);

                let b = browserify();

                if(markdownIncluded) {
                    b.require("./src/main.js", { expose: "did" });
                }
                else {
                    b.require("./src/main-no-md.js", { expose: "did" });
                }
                b.transform("./browserify-path-inliner");
                b.transform("./browserify-locale-inliner", { locale: locale });
                b.transform("./browserify-y18n-mustache-inliner");
                b.transform("./browserify-localize-inliner");
                let babelPresets = [ "es2015" ];
                if(minified) {
                    babelPresets.push("babili");
                }
                b.transform("babelify", { presets: babelPresets });

                let outStream = fs.createWriteStream(outJs);
                let stream = b.bundle();
                stream.pipe(outStream);
                let errored = false;
                stream.on("error", (error) => {
                    if(errored) return;
                    if(config.verbose) console.log("- error while building", jsFileName);
                    errored = true;
                    callback(error);
                });
                stream.on("end", () => {
                    if(config.verbose) console.log("- finished building", jsFileName);
                    if(!errored) callback();
                });
            }, callback);
        }, callback);
    }, callback);
}

function buildCssBundle(config, callback) {
    let minified = config.css.minified;
    if(!Array.isArray(minified)) minified = [ minified ];

    async.eachSeries(minified, (minified, callback) => {
        let outCssFile = `lib${minified ? ".min" : ""}.css`;
        if(config.verbose) console.log("building css into", outCssFile);

        let outCss = path.join(config.outDir, outCssFile);

        let plugins = [];
        if(minified) {
            let cleanCss = new LessPluginCleanCss({ advanced: true });
            plugins.push(cleanCss);
        }
        less.render(`@import "main.less";`, {
            paths: [ path.join(__dirname, "styles") ],
            filename: "index.js",
            plugins: plugins
        }, (error, output) => {
            if(error) {
                if(config.verbose) console.log("- error while building css");
                return callback({ 
                    trace: new Error("Failed to generate css"),
                    error: error
                });
            }
            fs.writeFile(outCss, output.css, (error) => {
                if(error) {
                    if(config.verbose) console.log("- error while writing css to file");
                    return callback({
                        trace: new Error("Failed to write css to file " + outCss),
                        error: error
                    });
                }
                if(config.verbose) console.log("- finished building css");
                callback();
            });
        });
    }, callback);
}
