import { decode_special_chars } from '../utils.js';
import { open_url } from '../browser.js';
import { AbstractEntity } from './abstract.js';


export class Favorites extends AbstractEntity {
    ACT_CODE_API = 'fav';
    ACT_CODE_FORUM = 'fav';

    get list() {
        return super.list.sort((a, b) => b.last_post_ts - a.last_post_ts);
    }

    process_line(line) {
        let theme = new FavoriteTheme(line),
            current_theme = this.get(theme.id);

        if (current_theme) {
            if (current_theme.last_post_ts < theme.last_post_ts) {
                console.debug('new_comment_in_theme:', theme.id, theme.title);
                if (this.notify) theme.notification();
            }
        } else {
            console.debug('new_theme:', theme.id, theme.title);
            if (this.notify) theme.notification();
        }
        return theme;
    }

}

export class FavoriteTheme {
    constructor(obj) {
        this.id = obj[0];
        this.title = decode_special_chars(obj[1]);
        // this.posts_num = obj[2];
        // this.last_user_id = obj[3];
        this.last_user_name = decode_special_chars(obj[4]);
        this.last_post_ts = obj[5];
        // this.last_read_ts = obj[6];
        this.pin = (obj[7] == "1");
        // this.viewed = false;
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

    open(view) {
        view = view || 'getnewpost';
        return open_url(`https://4pda.to/forum/index.php?showtopic=${this.id}&view=${view}`);
    }
}
