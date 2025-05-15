import { open_url } from '../browser.js';
import { AbstractEntity } from './abstract.js';
import { SETTINGS } from '../cs.js'


export class Favorites extends AbstractEntity {
    ACT_CODE_API = 'fav';
    ACT_CODE_FORUM = 'fav';

    get #list_filtered() {
        return super.list.filter(theme => !theme.viewed);
    }

    get list() {
        return this.#list_filtered.sort((a, b) => b.last_post_ts - a.last_post_ts);
    }

    get count() {
        return this.#list_filtered.length;
    }

    process_line(line) {
        let theme = new FavoriteTheme(line, this.cs),
            current_theme = this.get(theme.id);

        if (current_theme) {
            if (current_theme.last_post_ts < theme.last_post_ts) {
                if (current_theme.viewed) {
                    if (this.notify && SETTINGS.notification_themes_popup) {
                        theme.notification();
                    }
                } else {
                    // console.debug('new_comment_in_theme:', theme.id, theme.title);
                    if (this.notify && SETTINGS.notification_themes_popup && SETTINGS.notification_themes_all_comments) {
                        theme.notification();
                    }
                }
            }
        } else {
            // console.debug('new_theme:', theme.id, theme.title);
            if (this.notify && SETTINGS.notification_themes_popup) {
                theme.notification();
            }
        }
        return theme;
    }

}

export class FavoriteTheme {
    #cs;

    constructor(obj, cs) {
        this.id = obj[0];
        this.title = obj[1];
        // this.posts_num = obj[2];
        // this.last_user_id = obj[3];
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
        }/*, notificationId => {
            console.debug('notification_created', notificationId);
        }*/);
    }

    async open(view) {
        view = view || 'getnewpost';
        return open_url(
            `https://4pda.to/forum/index.php?showtopic=${this.id}&view=${view}`
        ).then((tab) => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    // check is last page
                    return document.querySelector('span.pagecurrent-wa') != null && document.querySelector('span.pagecurrent-wa + span.pagelink') == null;
                }
            }).then(([is_last_page]) => {
                console.debug('Is last theme page:', is_last_page.result);
                this.viewed = is_last_page.result;
                if (is_last_page.result) {
                    this.#cs.update_action();
                }
            });
        });
    }
}
