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

            elements.themesList.textContent = '';
            if (response.favorites.length) {
                for (let theme of response.favorites) {
                    // console.log('RT', theme);
                    add_theme_row(theme);
                }
            } else {
                let tpl = document.getElementById('tpl_no_themes').cloneNode(true)
                elements.themesList.appendChild(tpl);
            }
        }
    );
};


let elements = {}
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
    //
    elements.themesList = document.getElementById('themesList');
    elements.themeTPL = document.getElementById('tpl_one_theme');
}

/**
 * @param {FavoriteTheme} theme 
 */
function add_theme_row(theme) {
    let tpl = elements.themeTPL.cloneNode(true),
        tpl_caption = tpl.querySelector('.oneTheme_caption'),
        tpl_last_user = tpl.querySelector('.oneTheme_user'),
        tpl_last_dt = tpl.querySelector('.oneTheme_lastPost');
    
    tpl_caption.textContent = theme.title;
    tpl_last_user.textContent = theme.last_user_name;
    tpl_last_dt.textContent = new Date(theme.last_post_ts*1000).toLocaleString();

    elements.themesList.appendChild(tpl);
}