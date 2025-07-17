const CLASS_THEME_USED = 'used';
const CLASS_ACCENT = 'accent';
const CLASS_LOADING = 'loading';
const CLASS_HIDDEN = 'hidden';

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

            let has_pin_themes = false;
            if (response.favorites.count) {
                elements.favoritesBox.classList.add(CLASS_ACCENT);
                for (let theme of response.favorites.list) {
                    add_theme_row(theme);
                    if (theme.pin) has_pin_themes = true;
                }
            } else {
                let tpl = document.getElementById('tpl-no-themes').content.cloneNode(true);
                elements.themesList.appendChild(tpl);
            }

            let show_themes_actions_list = [];
            if (response.favorites.count) {
                if (response.settings.toolbar_button_open_all) {
                    show_themes_actions_list.push('themes-open-all');
                    if (has_pin_themes) {
                        show_themes_actions_list.push('themes-open-all-pin');
                    }
                }
                if (response.settings.toolbar_button_read_all) {
                    show_themes_actions_list.push('themes-read-all');
                }
            }

            if (show_themes_actions_list.length) {
                let theme_buttons = document.getElementById('theme-actions').getElementsByClassName('header-item');
                for (let button of theme_buttons) {
                    if (show_themes_actions_list.includes(button.id)) {
                        button.addEventListener('click', () => {
                            create_port(button.id);
                        });
                    } else {
                        // button.remove();
                        button.classList.add(CLASS_HIDDEN);
                    }
                }
            } else {
                document.getElementById('theme-actions').remove();
            }
        }
    );
});


function create_port(name) {
    const port = chrome.runtime.connect({
        name: name
    });
    port.onMessage.addListener(function(msg) {
        document.getElementById(`theme_${msg.id}`).classList.add(CLASS_THEME_USED);
        print_themes_count(msg.count);
    });
    port.onDisconnect.addListener(() => {
        console.debug(`port ${name} disconnected`);
    });
    return port;
}


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
    
    tpl_li.id = `theme_${theme.id}`;
    // tpl_li.dataset.theme_id = theme.id;
    tpl_caption.textContent = theme.title;
    tpl_last_user.textContent = theme.last_user_name;
    tpl_last_dt.textContent = new Date(theme.last_post_ts*1000).toLocaleString();

    if (theme.pin) tpl_li.classList.add(CLASS_ACCENT);
    if (theme.viewed) tpl_li.classList.add(CLASS_THEME_USED);

    tpl_li.addEventListener('click', (el) => {
        let current = el.target;
        if (current.classList.contains('tli')) {
            tpl_li.classList.add(CLASS_THEME_USED);
            chrome.runtime.sendMessage({
                action: 'open_url',
                what: 'favorites',
                id: theme.id,
                view: 'getlastpost'
            });
        } else if (current.classList.contains('mark-as-read')) {    
            current.classList.add(CLASS_LOADING);
            chrome.runtime.sendMessage({
                action: 'mark_as_read',
                id: theme.id
            }, result => {
                console.debug('mark_as_read result:', result);
                current.classList.remove(CLASS_LOADING);
                if (result) {
                    tpl_li.classList.add(CLASS_THEME_USED);
                    update_themes_count();
                }
            });
        } else {
            tpl_li.classList.add(CLASS_THEME_USED);
            chrome.runtime.sendMessage({
                action: 'open_url',
                what: 'favorites',
                id: theme.id
            });
        }
    });

    elements.themesList.appendChild(tpl);
}

function print_themes_count(count) {
    elements.favoritesBox.textContent = String(count);
    if (count === 0) {
        elements.favoritesBox.classList.remove(CLASS_ACCENT);
    }
}

function update_themes_count() {
    chrome.runtime.sendMessage({
        action: 'request',
        what: 'favorites.count'
    }, count => {
        print_themes_count(count);
    });
}
