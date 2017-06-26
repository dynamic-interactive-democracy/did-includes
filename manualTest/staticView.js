const fs = require("fs");

module.exports = (path) => {
    let content = null;
    let queuedRequests = [];

    let handle = (req, res) => {
        res.send(content);
    }

    fs.readFile(path, (error, buf) => {
        if(error) {
            content = { error: "Failed to load static file " + path };
            return console.error("Failed to load static file " + path, error);
        }
        content = buf.toString();
        queuedRequests.forEach(({ req, res }) => handle(req, res));
    });

    return (req, res) => {
        if(!content) {
            return queuedRequests.push({ req, res });
        }
        handle(req, res);
    };
};
