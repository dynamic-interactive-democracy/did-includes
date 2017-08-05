const includeTestView = require("../../includeTestView/fun");

module.exports = (config) => includeTestView(config, (did, getQueryParam) => {
    return {
        title: "topics/view",
        include: did.includes.topicView({
            id: getQueryParam("id"),
            circleId: getQueryParam("circleId")
        })
    };
});
