const includeTestView = require("../../includeTestView/fun");

module.exports = (config) => includeTestView(config, (did, getQueryParam) => {
    return {
        title: "topics/edit",
        include: did.includes.topicEdit({
            id: getQueryParam("id"),
            circleId: getQueryParam("circleId")
        })
    };
});
