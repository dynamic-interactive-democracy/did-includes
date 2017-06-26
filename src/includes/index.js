module.exports = (api) => {
    return {
        circleCreate: require("./circles/create")(api)
    };
};
