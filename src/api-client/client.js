/********************************************************************
 * This is the API client, wrapping around access to API endpoints. *
 ********************************************************************/

module.exports = (url) => {
    url = url || "https://did-api-alpha.deranged.dk/";
    let state = {
        user: { id: null, authKey: null }
    };
    return {
        asUser: (id, authKey) => setUser(state, id, authKey)
    };
};

function setUser(state, id, authKey) {
    state.user.id = id;
    state.user.authKey = authKey;
}
