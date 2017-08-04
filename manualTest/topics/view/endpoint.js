const includeTestView = require("../../includeTestView/fun");

module.exports = (apiPort) => includeTestView(apiPort, (did, getQueryParam) => {
    return {
        title: "topics/view",
        include: did.includes.topicView({
            id: getQueryParam("id"),
            circleId: getQueryParam("circleId")
        })
    };
});
