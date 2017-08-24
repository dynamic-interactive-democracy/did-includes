const express = require("express");
const path = require("path");
const staticView = require("./staticView");
const includeTestView = require("./includeTestView/fun");

module.exports = (config) => {
    let app = express();

    app.get("/", staticView(path.join(__dirname, "index", "view.html")));
    app.use("/assets", express.static(path.join(__dirname, "assets")));

    setUpTestPages(app, config, {
        circles: {
            create: { include: "circleCreate", args: { fill: {
                title: "Imported Title",
                aim: "We aim to import this text.",
                fullState: "full",
                invite: [ "user-id-002" ]
            }}},
            view: { include: "circleView", args: { id: "__from_query" } },
            edit: { include: "circleEdit", args: { id: "__from_query" } }
        },
        topics: {
            create: { include: "topicCreate", args: { circleId: "__from_query" } },
            edit: { include: "topicEdit", args: { id: "__from_query", circleId: "__from_query" } },
            view: { include: "topicView", args: { id: "__from_query", circleId: "__from_query" } }
        },
        tasks: {
            create: { include: "taskCreate", args: { circleId: "__from_query" } },
            edit: { include: "taskEdit", args: { id: "__from_query", circleId: "__from_query" } },
            view: { include: "taskView", args: { id: "__from_query", circleId: "__from_query" } }
        }
    });

    return app;
};

function setUpTestPages(mainApp, appConfig, pagesConfig) {
    Object.keys(pagesConfig).forEach(category => {
        let app = express();

        Object.keys(pagesConfig[category]).forEach(page => {
            app.get(`/${page}`, includeTestView(appConfig, `${category}/${page}`, createFunctionString(pagesConfig[category][page])));
        });

        mainApp.use(`/${category}`, app);
    });
}

function createFunctionString(config) {
    return `did.includes.${config.include}(${renderArgs(config.args)})`;
}

function renderArgs(args) {
    return "{ " + Object.keys(args).map(key => `${key}: ${renderArg(args, key)}`).join(", ") + " }";
}

function renderArg(args, key) {
    if(args[key] == "__from_query") {
        return `getQueryParam(${JSON.stringify(key)})`;
    }
    return JSON.stringify(args[key]);
}
