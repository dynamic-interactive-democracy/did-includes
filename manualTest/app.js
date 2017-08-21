const express = require("express");
const path = require("path");
const staticView = require("./staticView");
const circleTestsApp = require("./circles/app");
const topicsTestsApp = require("./topics/app");
const tasksTestsApp = require("./tasks/app");

module.exports = (config) => {
    let app = express();

    app.get("/", staticView(path.join(__dirname, "index", "view.html")));
    app.use("/assets", express.static(path.join(__dirname, "assets")));
    app.use("/circles", circleTestsApp(config));
    app.use("/topics", topicsTestsApp(config));
    app.use("/tasks", tasksTestsApp(config));

    return app;
};
