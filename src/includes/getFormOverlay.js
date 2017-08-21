module.exports = (form) => {
    let overlay = form.querySelector(".did-overlay");
    let loadingMsg = overlay.querySelector(".did-overlay-message-loading");
    let postingMsg = overlay.querySelector(".did-overlay-message-posting");
    let failureMsg = overlay.querySelector(".did-overlay-message-failure");
    let successMsg = overlay.querySelector(".did-overlay-message-success");

    let msgs = [ loadingMsg, postingMsg, failureMsg, successMsg ];

    let hideAllMsgs = () => {
        msgs.forEach(msg => msg.style = "");
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

    if(!postingMsg || !failureMsg || !successMsg) {
        msgs = [ loadingMsg ];
        return {
            loading: () => showMsg(loadingMsg),
            hide: hide
        };
    }

    return {
        loading: () => showMsg(loadingMsg),
        posting: () => showMsg(postingMsg),
        failure: () => {
            showMsg(failureMsg);
            setTimeout(hide, 2500);
        },
        success: (callback) => {
            showMsg(successMsg);
            setTimeout(() => {
                callback();
                hide();
            }, 1200);
        },
        hide: hide
    };
};
