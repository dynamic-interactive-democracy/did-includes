const marked = require("marked");

//Strip out HTML sections in the Markdown.
const markedRenderer = new marked.Renderer();
markedRenderer.html = (html) => "";

marked.setOptions({ renderer: markedRenderer });

module.exports = (url, integrationConf) => {
    let api = require("./api-client/client")(url);
    let integration = require("./integration/integration")(integrationConf);
    
    return {
        api: api,
        includes: require("./includes/index")(api, integration, marked)
    };
};
