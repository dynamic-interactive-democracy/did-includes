module.exports = (form, fill) => {
    Object.keys(fill).forEach((key) => {
        let element = form.querySelector(`[name=${key}]`);
        if(!element) {
            return console.warn("[did] Tried to prefill", key, "with value", fill[key], "but no such input element exists in the form.");
        }
        element.value = fill[key];
        //This has been verified to work for: input, textarea, select
        //TODO: Not yet verified: checkbox, radio
    });
};
