const express = require("express");
const create = require("./create/endpoint");
const view = require("./view/endpoint");
const edit = require("./edit/endpoint");

module.exports = (config) => {
    let app = express();

    app.get("/create", create(config));
    app.get("/view", view(config));
    app.get("/edit", edit(config));

    return app;
};
