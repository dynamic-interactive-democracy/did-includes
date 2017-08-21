const includeTestView = require("../../includeTestView/fun");

module.exports = (config) => includeTestView(config, (did, getQueryParam) => {
    return {
        title: "tasks/view",
        include: did.includes.taskView({
            id: getQueryParam("id"),
            circleId: getQueryParam("circleId")
        })
    };
});
