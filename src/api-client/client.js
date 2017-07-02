/********************************************************************
 * This is the API client, wrapping around access to API endpoints. *
 ********************************************************************/
module.exports = (url) => {
    let state = {
        url: url || "https://did-api-alpha.deranged.dk",
        user: { id: null, authKey: null }
    };
    return {
        asUser: (id, authKey) => setUser(state, id, authKey),
        user: {
            get: (callback) => request(state, "GET", "/user", callback)
        },
        users: {
            get: (callback) => request(state, "GET", "/users", callback),
            create: (data, callback) => request(state, "POST", "/users", data, callback)
        },
        circles: {
            create: (data, callback) => request(state, "POST", "/circles", data, callback),
            update: (id, data, callback) => request(state, "PUT", `/circles/${id}`, data, callback),
            get: (id, callback) => request(state, "GET", `/circles/${id}`, callback),
            getAll: (callback) => request(state, "GET", `/circles`, callback)
        }
    };
};

function setUser(state, id, authKey) {
    state.user.id = id;
    state.user.authKey = authKey;
}

function request(state, method, path, data, callback) {
    if(!callback) {
        callback = data;
        data = undefined;
    }

    let req = new XMLHttpRequest();
    req.open(method, state.url + path);
    req.setRequestHeader("Authorization", `Basic ${btoa(`${state.user.id}:${state.user.authKey}`)}`);

    req.onreadystatechange = function() {
        if(req.readyState != 4) {
            return;
        }
        if(req.status >= 200 && req.status < 300) {
            if(req.responseType != "json") {
                let response = null;
                try {
                    response = JSON.parse(req.response);
                }
                catch(e) {
                    return callback({
                        trace: new Error("API responded in something that was not JSON and could not be parsed as JSON."),
                        status: req.statusText,
                        responseType: req.responseType,
                        response: req.response
                    });
                }
                return callback(null, response);
            }
            return callback(null, req.response);
        }
        callback({
            trace: new Error("API call failed."),
            status: req.statusText,
            responseType: req.responseType,
            response: req.response
        });
    };
    
    if(data) {
        req.setRequestHeader("Content-Type", "application/json");
        return req.send(JSON.stringify(data));
    }
    req.send();
}
