const includeTestView = require("../../includeTestView/fun");

module.exports = (config) => includeTestView(config, (did, getQueryParam) => {
    return {
        title: "tasks/edit",
        include: did.includes.taskEdit({
            id: getQueryParam("id"),
            circleId: getQueryParam("circleId")
        })
    };
});
