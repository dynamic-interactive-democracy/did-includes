const includeTestView = require("../../includeTestView/fun");

module.exports = includeTestView((did, getQueryParam) => {
    return {
        title: "circles/edit",
        include: did.includes.circleEdit({
            id: getQueryParam("id")
        })
    };
});
