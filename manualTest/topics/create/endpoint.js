const includeTestView = require("../../includeTestView/fun");

module.exports = includeTestView((did, getQueryParam) => {
    return {
        title: "topics/create",
        include: did.includes.topicCreate({
            circleId: getQueryParam("circleId")
        })
    };
});
