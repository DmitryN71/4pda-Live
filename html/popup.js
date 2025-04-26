const CLASS_THEME_USED = 'used',
      CLASS_HAS_UNREAD = 'hasUnread',
      CLASS_LOADING = 'loading',
      CLASS_HIDDEN = 'hidden';

let elements = {};


window.onload = () => {
    chrome.runtime.sendMessage(
        {action: 'popup_loaded'},
        (response) => {
            if (!response.user_id) {
                console.error('not auth');
                return;
            }
            init();
            console.log('Background response:', response);
            elements.username_label.textContent = response.user_name;

            elements.themesList.textContent = '';
            elements.qmsBox.textContent = response.qms.count;
            elements.favoritesBox.textContent = response.favorites.count;
            elements.mentionsBox.textContent = response.mentions.count;

            if (response.qms.count) elements.qmsBox.classList.add(CLASS_HAS_UNREAD);
            if (response.mentions.count) elements.mentionsBox.classList.add(CLASS_HAS_UNREAD);

            if (response.favorites.count) {
                elements.favoritesBox.classList.add(CLASS_HAS_UNREAD);
                for (let theme of response.favorites.list) {
                    add_theme_row(theme);
                }
            } else {
                let tpl = document.getElementById('tpl_no_themes').cloneNode(true);
                elements.themesList.appendChild(tpl);
            }
        }
    );
};


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

    if (theme.pin) tpl_caption.classList.add('oneTheme_pin');
    tpl.addEventListener('click', (el) => {
        let current = el.target;
        //current.classList.add(CLASS_LOADING);
        //console.log(el, current);
        if (current.classList.contains('lastPost')) {
            chrome.runtime.sendMessage({
                action: 'open_url',
                what: 'favorites',
                id: theme.id,
                type: 'last'
            }).then(() => {
                tpl.classList.add(CLASS_THEME_USED);
            });
        } else {
            chrome.runtime.sendMessage({
                action: 'open_url',
                what: 'favorites',
                id: theme.id
            }).then(() => {
                tpl.classList.add(CLASS_THEME_USED);
            });
        }
    });

    elements.themesList.appendChild(tpl);
}