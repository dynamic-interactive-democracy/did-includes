/*********************
 * This contains integration hooks back into the integrating application.
 * For example, this is how we decide how to act when we want to view a
 * resource in the integrating application.
 */
module.exports = (conf) => {
    if(conf) {
        return validateConf(conf);
    }
    return {
        circles: {
            view: (id) => location.pathname = `/circles/${id}`
        }
    };
}

function validateConf(conf) {
    //TODO: validate expected structure, return clean version
    return conf;
}
