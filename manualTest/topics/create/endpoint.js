const includeTestView = require("../../includeTestView/fun");

module.exports = (config) => includeTestView(config, (did, getQueryParam) => {
    return {
        title: "topics/create",
        include: did.includes.topicCreate({
            circleId: getQueryParam("circleId")
        })
    };
});
