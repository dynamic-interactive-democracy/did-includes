module.exports = (api, integration) => {
    return {
        circleCreate: require("./circles/create")(api, integration),
        circleView: require("./circles/view")(api, integration),
        circleEdit: require("./circles/edit")(api, integration)
    };
};
