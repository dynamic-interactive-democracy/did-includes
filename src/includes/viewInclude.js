const include = require("./include");

module.exports = (viewIncludeOptions, setUp) => include({
    html: viewIncludeOptions.html,
    requiredOptions: viewIncludeOptions.requiredOptions,
    view: ".did-view"
}, setUp);
