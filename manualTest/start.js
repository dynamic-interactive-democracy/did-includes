const openurl = require("openurl");
const pkg = require("../package.json");
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

    (new didApi(console, apiConfig)).start((error) => {
        if(error) {
            return console.error("- Failed to launch API", error);
        }
        console.log("+ Launched API on port " + yargs.apiPort);
    });

    didIncludes.build(); //TODO: Would be nice to be able to specify what should build.
    // eg. { css: { minified: true }, js: { locales: [ "en_US", "en_UK" ], markdownIncluded: true }}
    //     resulting in `css min`, `js en_US`, and `js en_UK`
    // or  { js: { locales: [ "en_US" ], markdownIncluded: [ true, false ] }}
    //     resulting in `js en_US` and `js en_US no-md`
    // TODO: Would also be nice to bulid and watch for changes -> rebuild

    didIncludesManualTest({ apiPort: yargs.apiPort }).listen(manualTestPort, () => {
        console.log("+ Launched manual test interface on port " + manualTestPort);
        console.log("+ Opening manual test interface in default browser...");
        openurl.open(`http://localhost:${manualTestPort}/`);
    });
});
