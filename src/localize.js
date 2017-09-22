const y18n = require("y18n");
const path = require("path");

module.exports = {
    do: (locale, text) => {
        let localize = y18n({ directory: path.join(__dirname, "..", "locales"), locale: locale });
        return localize.__(text);
        //TODO: Separate out each {{ closure }} inside the text, replace with %s,
        //   run localization, then insert {{ closure }} again, and call render.
        //   This would allow text replacement inside localized strings. Right now
        //   this is done manually, in javascript, but this approach might be more
        //   light-weight, pre-buildy.
    }
};
