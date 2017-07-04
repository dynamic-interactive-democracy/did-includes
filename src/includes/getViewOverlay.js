module.exports = (view) => {
    let overlay = view.querySelector(".did-overlay");
    let loadingMsg = overlay.querySelector(".did-overlay-message-loading");

    let hideAllMsgs = () => {
        loadingMsg.style = "";
    };

    let hide = () => {
        overlay.style = "display:flex;opacity:0;";
        hideAllMsgs();
        setTimeout(() => overlay.style = "", 500);
    };

    let showMsg = (msg) => {
        hideAllMsgs();
        overlay.style = "display:flex;opacity:1;";
        msg.style = "opacity:1;";
    }

    return {
        loading: () => showMsg(loadingMsg),
        hide: hide
    };
};
