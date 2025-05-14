const CLASS_THEME_USED = 'used';
const CLASS_ACCENT = 'accent';

let elements = {};


document.addEventListener('DOMContentLoaded', (event) => {
    chrome.runtime.sendMessage(
        {action: 'popup_loaded'},
        (response) => {
            if (!response) {
                //console.error('not auth');
                window.close();
                return;
            }
            init();
            console.log('Background response:', response);
            elements.username_label.textContent = response.user_name;

            elements.themesList.textContent = '';
            elements.qmsBox.textContent = response.qms.count;
            elements.favoritesBox.textContent = response.favorites.count;
            elements.mentionsBox.textContent = response.mentions.count;

            if (response.qms.count) elements.qmsBox.classList.add(CLASS_ACCENT);
            if (response.mentions.count) elements.mentionsBox.classList.add(CLASS_ACCENT);

            if (response.favorites.count) {
                elements.favoritesBox.classList.add(CLASS_ACCENT);
                for (let theme of response.favorites.list) {
                    add_theme_row(theme);
                }
            } else {
                let tpl = document.getElementById('tpl-no-themes').content.cloneNode(true);
                elements.themesList.appendChild(tpl);
            }
        }
    );
});


function init() {
    elements.username_label = document.getElementById('user-name');
    elements.username_label.addEventListener("click", () => {
        chrome.runtime.sendMessage({action: 'open_url', what: 'user'});
    });

    document.getElementById('options').addEventListener('click', () => {
        chrome.runtime.sendMessage({action: 'open_url', what: 'options'});
    });

    elements.qmsBox = document.getElementById('header-qms');
    elements.qmsBox.addEventListener("click", () => {
        chrome.runtime.sendMessage({action: 'open_url', what: 'qms'});
    });

    elements.favoritesBox = document.getElementById('header-favorites');
    elements.favoritesBox.addEventListener("click", () => {
        chrome.runtime.sendMessage({action: 'open_url', what: 'favorites'});
    });

    elements.mentionsBox = document.getElementById('header-mentions');
    elements.mentionsBox.addEventListener("click", () => {
        chrome.runtime.sendMessage({action: 'open_url', what: 'mentions'});
    });
    //
    elements.themesList = document.getElementById('topic-list');
    elements.themeTPL = document.getElementById('tpl-one-topic');
}

/**
 * @param {FavoriteTheme} theme 
 */
function add_theme_row(theme) {
    let tpl = elements.themeTPL.content.cloneNode(true),
        tpl_li = tpl.querySelector('li'),
        tpl_caption = tpl.querySelector('.topic-title'),
        tpl_last_user = tpl.querySelector('.user'),
        tpl_last_dt = tpl.querySelector('.date');
    
    tpl_caption.textContent = theme.title;
    tpl_last_user.textContent = theme.last_user_name;
    tpl_last_dt.textContent = new Date(theme.last_post_ts*1000).toLocaleString();

    if (theme.pin) tpl_caption.classList.add(CLASS_ACCENT);
    tpl_li.addEventListener('click', (el) => {
        let current = el.target;
        //current.classList.add(CLASS_LOADING);
        if (current.classList.contains('tli')) {
            chrome.runtime.sendMessage({
                action: 'open_url',
                what: 'favorites',
                id: theme.id,
                view: 'getlastpost'
            }).then(() => {
                tpl_li.classList.add(CLASS_THEME_USED);
            });
        } else {
            chrome.runtime.sendMessage({
                action: 'open_url',
                what: 'favorites',
                id: theme.id
            }).then(() => {
                tpl_li.classList.add(CLASS_THEME_USED);
            });
        }
    });

    elements.themesList.appendChild(tpl);
}