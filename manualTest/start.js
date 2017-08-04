const openurl = require("openurl");
const pkg = require("../package.json");
const path = require("path");
const didIncludes = require("../index");
const didApi = require("@dynamic-interactive-democracy/did-api");
const didIncludesManualTest = require("./app");
const Pool = require("pg-pool");

const yargs = require("yargs").argv;

let postgresConfig = {
    host: yargs.pgHost || "localhost",
    user: yargs.pgUser || "postgres",
    password: yargs.pgPass || "postgres",
    database: yargs.pgDb || "postgres"
};

let manualTestPort = yargs.manualTestPort || 3334;
let apiConfig = {
    port: yargs.apiPort || 3333,
    postgres: postgresConfig
};

//TODO: interrupt handler: stop things
//TODO: build selectively. Wait for build before launch
//TODO: Watch and rebuild on change
//TODO: Create some users, use one as "current user" in tests.

console.log(`did-includes v.${pkg.version} manual test`);

const pgdb = new Pool(postgresConfig);
pgdb.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;", (error) => {
    if(error) {
        return console.error("- Failed to clear database before starting apps", error);
    }
    console.log("+ Cleared database " + postgresConfig.database);

    //TODO: Make it possible to omit the `new` (return this in the app).
    (new didApi(console, apiConfig)).start((error) => {
        if(error) {
            return console.error("- Failed to launch API", error);
        }
        console.log("+ Launched API on port " + apiConfig.port);
    });

    didIncludes.build({
        outDir: path.join(__dirname, "assets"),
        css: { minified: false },
        js: {
            locale: "en_US",
            minified: false,
            markdownIncluded: true
        }
    }, (error) => {
        if(error) {
            return console.error("- Failed to build scripts and styles", error);
        }
        console.log("+ Built scripts and styles");

        didIncludesManualTest({ apiPort: apiConfig.port }).listen(manualTestPort, () => {
            console.log("+ Launched manual test interface on port " + manualTestPort);
            console.log("+ Opening manual test interface in default browser...");
            openurl.open(`http://localhost:${manualTestPort}/`);
        });
    });
});
