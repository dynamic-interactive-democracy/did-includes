const express = require("express");
const openurl = require("openurl");
const staticView = require("./staticView");
const path = require("path");
const circleTestsApp = require("./circles/app");
const pkg = require("../package.json");
const didIncludes = require("../index");

console.log("did-includes v." + pkg.version);

didIncludes.build();

let app = express();

app.get("/", staticView(path.join(__dirname, "index", "view.html")));
app.use("/scripts", express.static(path.join(__dirname, "..", "output")));
app.use("/circles", circleTestsApp());

console.log("+ Launching manual test");

app.listen(3000, () => {
    console.log("+ Opening default browser");
    openurl.open("http://localhost:3000/");
});
