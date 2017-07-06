module.exports = (funcs, callback) => {
    let errored = false;
    let result = {};
    let keys = Object.keys(funcs);
    keys.forEach(key => funcs[key]((error, funcResult) => {
            if(errored) {
                return;
            }
            if(error) {
                errored = true;
                return callback(error);
            }
            result[key] = funcResult;
            if(Object.keys(result).length == keys.length) {
                callback(null, result);
            }
        }));
};
