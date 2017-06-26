module.exports = (url) => {
    let api = require("./api-client/client")(url);
    
    return {
        api: api,
        includes: require("./includes/index")(api)
    };
};
