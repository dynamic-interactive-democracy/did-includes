module.exports = (tag, attr) => {
    //TODO: alt to using `document`? (Breaks general usage!!!)
    let el = document.createElement(tag);
    if(!attr) {
        return el;
    }
    if(attr.class) el.classList = attr.class;
    if(attr.value) el.value = attr.value;
    if(attr.text) el.innerText = attr.text;
    else if(attr.html) el.innerHTML = attr.html;
    return el;
};
