/********************************************************************
 * This is the API client, wrapping around access to API endpoints. *
 ********************************************************************/
module.exports = (url) => {
    let state = {
        url: url || "https://did-api-alpha.deranged.dk",
        user: { id: null, authKey: null }
    };
    let r = request.bind(this, state);
    return {
        asUser: (id, authKey) => setUser(state, id, authKey),
        getCurrentUserId: () => state.user.id,
        user: {
            get: (callback) => r("GET", "/user", callback)
        },
        users: {
            get: (callback) => r("GET", "/users", callback),
            create: (data, callback) => r("POST", "/users", data, callback)
        },
        circles: {
            create: (data, callback) => r("POST", "/circles", data, callback),
            update: (id, data, callback) => r("PUT", `/circles/${id}`, data, callback),
            get: (id, callback) => r("GET", `/circles/${id}`, callback),
            getAll: (callback) => r("GET", `/circles`, callback),
            members: {
                invite: (circleId, userId, callback) => r("POST", `/circles/${circleId}/members`, { userId }, callback),
                remove: (circleId, userId, callback) => r("DELETE", `/circles/${circleId}/members/${userId}`, callback)
            },
            topics: {
                create: (circleId, data, callback) => r("POST", `/circles/${circleId}/topics`, data, callback),
                update: (circleId, id, data, callback) => r("PUT", `/circles/${circleId}/topics/${id}`, data, callback),
                get: (circleId, id, callback) => r("GET", `/circles/${circleId}/topics/${id}`, callback),
                getAll: (circleId, callback) => r("GET", `/circles/${circleId}/topics`, callback)
            },
            tasks: {
                create: (circleId, data, callback) => r("POST", `/circles/${circleId}/tasks`, data, callback),
                update: (circleId, id, data, callback) => r("PUT", `/circles/${circleId}/tasks/${id}`, data, callback),
                get: (circleId, id, callback) => r("GET", `/circles/${circleId}/tasks/${id}`, callback),
                getAll: (circleId, callback) => r("GET", `/circles/${circleId}/tasks`, callback)
            }
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
    req.responseType = "json";

    req.onreadystatechange = function() {
        if(req.readyState != 4) {
            return;
        }
        if(req.status >= 200 && req.status < 300) {
            if(!req.response && (req.responseType == "" || req.responseType == "document")) {
                let response = null;
                try {
                    response = JSON.parse(req.responseText);
                }
                catch(e) {
                    return callback({
                        trace: new Error("API responded in something that was not JSON and could not be parsed as JSON."),
                        status: req.statusText,
                        responseType: req.responseType,
                        response: req.responseText
                    });
                }
                console.warn(`[did/api-client] Got response from API that was not automatically JSON from ${method} ${path}. Managed to parse it anyway.`, response);
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
