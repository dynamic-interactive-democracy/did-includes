const fs = require("fs");
const path = require("path");
const mustache = require("mustache");
const htmlMinify = require("html-minifier").minify;
const localize = require("./localize");

module.exports = {
    readSync: readFileSync
};

function readFileSync(locale, filePath, minifyHtml) {
    minifyHtml = minifyHtml || false;
    let content = fs.readFileSync(filePath, "utf8");
    let localizedContent = mustache.render(content, {
        __: () => (text, render) => localize.do(locale, text)
    });
    if(minifyHtml) {
        return htmlMinify(localizedContent, {
            collapseWhitespace: true,
            conservativeCollapse: true,
            removeComments: true,
            sortAttributes: true,
            sortClassName: true
        });
    }
    return localizedContent;
}
