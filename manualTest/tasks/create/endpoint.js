const includeTestView = require("../../includeTestView/fun");

module.exports = (config) => includeTestView(config, (did, getQueryParam) => {
    return {
        title: "tasks/create",
        include: did.includes.taskCreate({
            circleId: getQueryParam("circleId")
        })
    };
});
