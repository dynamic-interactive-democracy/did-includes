const includeTestView = require("../../includeTestView/fun");

module.exports = (apiPort) => includeTestView(apiPort, (did, getQueryParam) => {
    return {
        title: "circles/edit",
        include: did.includes.circleEdit({
            id: getQueryParam("id")
        })
    };
});
