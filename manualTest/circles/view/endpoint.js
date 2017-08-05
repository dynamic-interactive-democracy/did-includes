const includeTestView = require("../../includeTestView/fun");

module.exports = (config) => includeTestView(config, (did, getQueryParam) => {
    return {
        title: "circles/view",
        include: did.includes.circleView({
            id: getQueryParam("id")
        })
    };
});
