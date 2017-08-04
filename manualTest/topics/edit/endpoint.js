const includeTestView = require("../../includeTestView/fun");

module.exports = (apiPort) => includeTestView(apiPort, (did, getQueryParam) => {
    return {
        title: "topics/edit",
        include: did.includes.topicEdit({
            id: getQueryParam("id"),
            circleId: getQueryParam("circleId")
        })
    };
});
