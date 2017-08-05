const includeTestView = require("../../includeTestView/fun");

module.exports = (config) => includeTestView(config, (did, getQueryParam) => {
    return {
        title: "circles/edit",
        include: did.includes.circleEdit({
            id: getQueryParam("id")
        })
    };
});
