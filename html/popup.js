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
            console.log('Background response:', response);
            elements.username_label.textContent = response.user_name;
        }
    );
};


elements = {}
function init() {
    elements.username_label = document.getElementById('panelUsername');
}
