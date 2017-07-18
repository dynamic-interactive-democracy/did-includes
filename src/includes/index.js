module.exports = (api, integration, marked) => {
    return {
        circleCreate: require("./circles/create")(api, integration),
        circleView: require("./circles/view")(api, integration, marked),
        circleEdit: require("./circles/edit")(api, integration),
        topicCreate: require("./topics/create")(api, integration),
        topicView: require("./topics/view")(api, integration, marked),
        topicEdit: require("./topics/edit")(api, integration)
    };
};
