const fs = require("fs");
const y18n = require("y18n");
const path = require("path");
const mustache = require("mustache");

module.exports = {
    readSync: readFileSync
};

function readFileSync(locale, filePath) {
    let localize = y18n({ directory: "./locales", locale: locale });
    let content = fs.readFileSync(filePath, "utf8");
    let localizedContent = mustache.render(content, {
        __: () => (text, render) => localize.__(text)
        //TODO: Separate out each {{ closure }} inside the text, replace with %s,
        //   run localization, then insert {{ closure }} again, and call render.
    });
    return localizedContent;
}
