const includeTestView = require("../../includeTestView/fun");

module.exports = (apiPort) => includeTestView(apiPort, (did, getQueryParam) => {
    return {
        title: "topics/create",
        include: did.includes.topicCreate({
            circleId: getQueryParam("circleId")
        })
    };
});
