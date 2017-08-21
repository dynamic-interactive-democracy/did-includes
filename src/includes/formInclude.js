const include = require("./include");
const prefillFields = require("./prefillFields");

module.exports = (formIncludeOptions, setUp) => include({
    html: formIncludeOptions.html,
    requiredOptions: formIncludeOptions.requiredOptions,
    view: "form"
}, (api, integration, marked, opts, form, callback) => {
    if(formIncludeOptions.prefillFrom && opts && opts[formIncludeOptions.prefillFrom]) {
        prefillFields(form, opts[formIncludeOptions.prefillFrom]);
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        formIncludeOptions.formSubmitHandler(api, integration, opts, form);
        return false;
    });

    if(!setUp) {
        setUp = function(api, integration, opts, form, callback) { callback(); };
    }

    setUp(api, integration, opts, form, callback);
});
