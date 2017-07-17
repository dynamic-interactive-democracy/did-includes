const includeTestView = require("../../includeTestView/fun");

module.exports = includeTestView((did, getQueryParam) => {
    return {
        title: "circles/view",
        include: did.includes.circleView({
            id: getQueryParam("id")
        })
    };
});
