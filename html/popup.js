window.onload = () => {
    init();
    // Example: send a message to background when popup loads
    chrome.runtime.sendMessage(
        {action: 'popup_loaded'},
        (response) => {
            if (!response.user_id) {
                console.error('not auth');
                return;
            }
            // console.log('Background response:', response);
            elements.username_label.textContent = response.user_name;
        }
    );
};


elements = {}
function init() {
    elements.username_label = document.getElementById('panelUsername');
    elements.username_label.addEventListener("click", () => {
        chrome.runtime.sendMessage({action: 'open_url', what: 'user'});
    });

    elements.qmsBox = document.getElementById('panelQMS');
    elements.qmsBox.addEventListener("click", () => {
        chrome.runtime.sendMessage({action: 'open_url', what: 'qms'});
    });

    elements.favoritesBox = document.getElementById('panelFavorites');
    elements.favoritesBox.addEventListener("click", () => {
        chrome.runtime.sendMessage({action: 'open_url', what: 'favorites'});
    });

    elements.mentionsBox = document.getElementById('panelMentions');
    elements.mentionsBox.addEventListener("click", () => {
        chrome.runtime.sendMessage({action: 'open_url', what: 'mentions'});
    });
}
