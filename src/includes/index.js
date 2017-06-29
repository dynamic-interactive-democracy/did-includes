module.exports = (api, integration) => {
    return {
        circleCreate: require("./circles/create")(api, integration)
    };
};
