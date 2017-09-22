const through = require("through2");
const resolve = require("resolve");
const path = require("path");
const staticModule = require("static-module");
const localize = require("./src/localize");
const quote = require("quote-stream");
const streamify = require("streamify-string");

module.exports = (file, opts) => {
    if(/\.json$/.test(file)) {
        return through();
    }

    function resolver(p) {
        return resolve.sync(p, { basedir: path.dirname(file) });
    }
    
    let vars = {
        __filename: file,
        __dirname: path.dirname(file),
        require: { resolve: resolver }
    };

    let sm = staticModule(
        {
            //TODO: fix naming once module is extracted
            "../../localize": {
                do: localizeWrap
            }
        },
        { vars: vars, varModules: { path: path } }
    );

    return sm;

    function localizeWrap(locale, text) {
        let result = localize.do(locale, text);

        return streamify(result, { encoding: 'utf8' })
            .on('error', error => sm.emit('error', error))
            .pipe(quote()).pipe(through(write, end));
    }

    function write(buf, enc, next) {
        this.push(buf);
        next();
    }

    function end(next) {
        this.push(null);
        sm.emit("file", file);
        next();
    }
};
