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
        circles: {
            create: (data, callback) => request(state, "POST", "/circles", data, callback),
            update: (id, data, callback) => request(state, "PUT", `/circles/${id}`, data, callback)
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
    req.setRequestHeader("Authentication", "TODO"); //TODO: state.user info
    if(data) {
        req.setRequestHeader("Content-Type", "application/json");
        req.send(JSON.stringify(data));
    }

    req.onreadystatechange = null; //TODO: error and success handling
    //TODO: send request
    callback(new Error("Not implemented"));
}
