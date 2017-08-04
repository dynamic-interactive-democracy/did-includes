const includeTestView = require("../../includeTestView/fun");

module.exports = (apiPort) => includeTestView(apiPort, (did, getQueryParam) => {
    return {
        title: "circles/view",
        include: did.includes.circleView({
            id: getQueryParam("id")
        })
    };
});
