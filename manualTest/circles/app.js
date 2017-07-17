const express = require("express");
const create = require("./create/endpoint");
const view = require("./view/endpoint");
const edit = require("./edit/endpoint");

module.exports = () => {
    let app = express();

    app.get("/create", create);
    app.get("/view", view);
    app.get("/edit", edit);

    return app;
};
