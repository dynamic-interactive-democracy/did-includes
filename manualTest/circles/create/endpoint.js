const includeTestView = require("../../includeTestView/fun");

module.exports = (apiPort) => includeTestView(apiPort, (did, getQueryParam) => {
    return {
        title: "circles/create",
        include: did.includes.circleCreate({
            fill: {
                title: "Imported Title",
                aim: "We aim to import this text.",
                fullState: "full"
            }
        })
    };
});
