const express = require("express");
const openurl = require("openurl");
const staticView = require("./staticView");
const path = require("path");
const circleTestsApp = require("./circles/app");
const topicsTestsApp = require("./topics/app");
const pkg = require("../package.json");
const didIncludes = require("../index");

console.log("did-includes v." + pkg.version);

didIncludes.build(); //TODO: Would be nice to be able to specify what should build.
// eg. { css: { minified: true }, js: { locales: [ "en_US", "en_UK" ], markdownIncluded: true }}
//     resulting in `css min`, `js en_US`, and `js en_UK`
// or  { js: { locales: [ "en_US" ], markdownIncluded: [ true, false ] }}
//     resulting in `js en_US` and `js en_US no-md`

let app = express();

app.get("/", staticView(path.join(__dirname, "index", "view.html")));
app.use("/assets", express.static(path.join(__dirname, "..", "output")));
app.use("/circles", circleTestsApp());
app.use("/topics", topicsTestsApp());

console.log("+ Launching manual test");

app.listen(3000, () => {
    console.log("+ Opening default browser");
    openurl.open("http://localhost:3000/");
});
