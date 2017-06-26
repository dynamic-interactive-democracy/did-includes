const express = require("express");
const staticView = require("../staticView");
const path = require("path");

module.exports = () => {
    let app = express();

    app.get("/create", staticView(path.join(__dirname, "create", "view.html")));

    return app;
};
