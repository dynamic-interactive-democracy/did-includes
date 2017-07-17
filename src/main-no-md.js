module.exports = (url, integrationConf, marked) => {
    let api = require("./api-client/client")(url);
    let integration = require("./integration/integration")(integrationConf);
    
    return {
        api: api,
        includes: require("./includes/index")(api, integration, marked)
    };
};
