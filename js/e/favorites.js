import { open_url } from '../browser.js';
import { AbstractEntity } from './abstract.js';
import { SETTINGS } from '../cs.js'


function _sort_by_last_post(a, b) {
    return b.last_post_ts - a.last_post_ts;
}

function _sort_with_pin(a, b) {
    if (a.pin == b.pin) {
        return _sort_by_last_post(a, b);
    } else {
        return b.pin - a.pin;
    }
}

export class Favorites extends AbstractEntity {
    ACT_CODE_API = 'fav';
    ACT_CODE_FORUM = 'fav';

    get #list_filtered() {
        return super.list.filter(theme => !theme.viewed);
    }

    /**  @returns {FavoriteTheme[]} */
    get list_pin() {
        return super.list.filter(theme => !theme.viewed && theme.pin);
    }

    /**  @returns {FavoriteTheme[]} */
    get list() {
        return this.#list_filtered.sort(
            SETTINGS.toolbar_pin_themes_level == 10
                ? _sort_with_pin
                : _sort_by_last_post
        );
    }

    get count() {
        return this.#list_filtered.length;
    }

    filter_pin(only_pin) {
        if (only_pin) {
            this._list = Object.fromEntries(Object.entries(this._list).filter(([key, value]) => value.pin));
            this.cs.update_action();
        } else {
            this.notify = false;
            super.update()
                .then(() => {
                    this.cs.update_action();
                });
        }
    }

    _open(id) {
        return FavoriteTheme.just_open(id);
    }

    process_line(line) {
        let theme = new FavoriteTheme(line, this.cs),
            current_theme = this.get(theme.id),
            n_level = 100;

        if (theme.last_user_id == this.cs.user_id) return;
        if (SETTINGS.toolbar_pin_themes_level == 20 && !theme.pin) return;

        if (current_theme) {
            if (current_theme.last_post_ts < theme.last_post_ts) {
                if (current_theme.viewed) {
                    n_level = theme.pin ? 5 : 10;
                } else {
                    // console.debug('new_comment_in_theme:', theme.id, theme.title);
                    n_level = theme.pin ? 12 : 20;
                }
            }
        } else {
            n_level = theme.pin ? 5 : 10;
        }

        if (this.notify && n_level <= SETTINGS.notification_themes_level) {
            theme.notification();
        }
        return theme;
    }

    async do_read(theme_id) {
        let theme = this.get(theme_id);
        return theme ? theme.read() : false;
    }
}

export class FavoriteTheme {
    #cs;

    constructor(obj, cs) {
        this.id = obj[0];
        this.title = obj[1];
        // this.posts_num = obj[2];
        this.last_user_id = obj[3];
        this.last_user_name = obj[4];
        this.last_post_ts = obj[5];
        // this.last_read_ts = obj[6];
        this.pin = (obj[7] == 1);
        this.viewed = false;

        this.#cs = cs;
    }

    notification(){
        return chrome.notifications.create(
            `${this.last_post_ts}/theme/${this.id}`
        , {
            'contextMessage': 'Новый комментарий',
            'title': this.title,
            'message': this.last_user_name,
            'eventTime': this.last_post_ts*1000,
            'iconUrl': 'img/icons/icon_80_favorite.png',
            'type': 'basic'
        });
    }

    static just_open(id, view = 'getnewpost', set_active = true) {
        return open_url(
            `https://4pda.to/forum/index.php?showtopic=${id}&view=${view}`,
            set_active,
            false
        );
    }

    async open(view, set_active = true) {
        return this.constructor.just_open(this.id, view, set_active)
            .then(async (tab) => {
                //console.debug(tab);
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        // check is last page
                        return document.querySelector('span.pagecurrent-wa') != null && document.querySelector('span.pagecurrent-wa + span.pagelink') == null;
                    }
                }).then(([is_last_page]) => {
                    console.debug('Is last theme page:', is_last_page.result, this.id);
                    if (is_last_page.result) {
                        this.viewed = true;
                        this.#cs.update_action();
                    }
                }).catch((error) => {
                    console.error(error);
                });
                
                return [tab, this];
            });
    }

    async read() {
        return fetch(`https://4pda.to/forum/index.php?showtopic=${this.id}&view=getlastpost`)
            .then(response => {
                if (response.ok) {
                    this.viewed = true;
                    this.#cs.update_action();
                }
                return response.ok;
            });
    }
}
