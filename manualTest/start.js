const openurl = require("openurl");
const pkg = require("../package.json");
const path = require("path");
const didIncludes = require("../index");
const didApi = require("@dynamic-interactive-democracy/did-api");
const didIncludesManualTest = require("./app");
const Pool = require("pg-pool");
const async = require("async");
const request = require("request");
const fs = require("fs");

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

let logApiOut = function() {
    let args = Array.prototype.slice.call(arguments);
    let msg = args[args.length - 1];
    let objs = args.slice(0, args.length - 1);
    //first line is green (looks magical):
    console.log("\x1b[32m    [did-api] " + msg + "\x1b[0m \n" + objs.map(obj => indent(JSON.stringify(obj, null, 4))) + "\n");
};

function indent(str) {
    let prefix = "    | ";
    let firstLinePrefix = "    +-";
    let lines = str.split("\n");
    let maxLineLength = 75;
    //break lines longer than maxLineLength chars:
    lines = lines.map(remainder => {
        let newlySplitLines = [];
        do {
            newlySplitLines.push(remainder.slice(0, maxLineLength));
            remainder = remainder.slice(maxLineLength);
        } while(remainder.length > maxLineLength);
        if(remainder.length > 0) newlySplitLines.push(remainder);
        return newlySplitLines;
    }).reduce((ls1, ls2) => ls1.concat(ls2));
    //print them with the prefixes:
    return firstLinePrefix + lines[0] + "\n" + lines.slice(1).map(line => prefix + line).join("\n");
}

let apiLogger = {
    info: logApiOut,
    log: logApiOut,
    error: logApiOut,
    verbose: logApiOut,
    silly: logApiOut,
    critical: logApiOut
};

//TODO: interrupt handler: stop things
//TODO: when an error occurs in the chain before browser open: stop things
//TODO: Refactor this code!
//TODO: Consider a --quietApi flag that results in only printing error messages from the API
//TODO: Nicer colors printed from the api.

console.log(`did-includes v.${pkg.version} manual test`);

if(!yargs.customApiServer) {
    const pgdb = new Pool(postgresConfig);
    pgdb.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;", (error) => {
        if(error) {
            console.error("- Failed to clear database before starting apps", error);
            return process.exit(1);
        }
        console.log("+ Cleared database " + postgresConfig.database);
        //TODO: Make it possible to omit the `new` (return this in the app).
        (new didApi(apiLogger, apiConfig)).start((error) => {
            if(error) {
                console.error("- Failed to launch API", error);
                return process.exit(2);
            }
            console.log("+ Launched API on port " + apiConfig.port);

            //TODO: Without this silly timeout, the requests sometimes fail on the serverside (parserelation.c something)
            // very odd. Does start maybe callback before it is actually ready?
            setTimeout(() => setUpTestEnv(`http://localhost:${apiConfig.port}`), 100);
        });
    });
}
else {
    console.log("+ Using custom API server " + yargs.customApiServer);
    setUpTestEnv(yargs.customApiServer);
}

function setUpTestEnv(apiUrl) {
    async.map([
        { userId: "user-id-001", name: "Current User" },
        { userId: "user-id-002", name: "Asbjørn Thegler" },
        { userId: "user-id-003", name: "Rolf Bjerre" },
        { userId: "user-id-004", name: "Niels Abildgaard" },
        { userId: "user-id-005", name: "Kristiane Ravn Frost" }
    ], (data, callback) => {
        request.post(`${apiUrl}/users`, {
            json: data
        }, (error, httpResponse, body) => {
            if(error) {
                return callback(error);
            }
            if(httpResponse.statusCode < 200 || httpResponse.statusCode >= 300) {
                return callback({
                    trace: new Error("Failed to create user"),
                    statusCode: httpResponse.statusCode,
                    response: body
                });
            }
            callback(null, body.user);
        })
    }, (error, users) => {
        if(error) {
            console.error("- Failed to create users", error);
            return process.exit(3);
        }
        console.log(`+ Created ${users.length} predefined users`);

        buildAll((error) => {
            if(error) {
                console.error("- Failed to build scripts and styles", error);
                return process.exit(4);
            }
            console.log("+ Built scripts and styles");

            //TODO: Some notes in API docs say that recursive watching only works in Win and macOS, not linux! :-O
            //TODO: For some reason rebuild is triggered several times per change on my Windows machine --- niels

            //Watch js changes and rebuild
            fs.watch(path.join(__dirname, "..", "src"), { recursive: true }, (eventType, filename) => {
                console.log("+ Triggered rebuild of javascript due to change in source files");
                buildJs((error) => {
                    if(error) {
                        return console.log("- Failed to rebuild javascript", error);
                    }
                    console.log("+ Rebuild of javascript completed.");
                });
            });

            //Watch css changes and rebuild
            fs.watch(path.join(__dirname, "..", "styles"), { recursive: true }, (eventType, filename) => {
                console.log("+ Triggered rebuild of css due to change in source files");
                buildCss((error) => {
                    if(error) {
                        return console.log("- Failed to rebuild css", error);
                    }
                    console.log("+ Rebuild of css completed.");
                });
            });

            console.log("+ Registered source file change listeners");

            let manualTestConfig = {
                apiUrl,
                currentUser: users[0]
            };

            didIncludesManualTest(manualTestConfig).listen(manualTestPort, () => {
                console.log("+ Launched manual test interface on port " + manualTestPort);
                console.log("+ Opening manual test interface in default browser...");
                let manualTestInterfaceUrl = `http://localhost:${manualTestPort}/`;

                openurl.open(manualTestInterfaceUrl, (error) => {
                    if(error) {
                        console.log("- Failed to automatically open test interface in your browser.");
                        console.log(`  Please open ${manualTestInterfaceUrl} manually.`);
                    }
                });
            });
        });
    });
}

function buildAll(callback) {
    build(true, true, callback);
}

function build(css, js, callback) {
    let opts = {
        outDir: path.join(__dirname, "assets"),
        css: null,
        js: null
    };
    if(css) {
        opts.css = { minified: false }
    }
    if(js) {
        opts.js = {
            locale: "en_US",
            minified: false,
            markdownIncluded: true
        };
    }
    didIncludes.build(opts, callback);
}

function buildJs(callback) {
    build(false, true, callback);
}

function buildCss(callback) {
    build(true, false, callback);
}
