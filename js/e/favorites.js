import {parse_response, decode_special_chars, fetch4} from '../utils.js';


export class Favorites {
    #list;

    constructor(cs) {
        this.cs = cs;
        this.#list = {};
    }

    get list() {
        return Object.values(this.#list).sort((a, b) => a.sort_idx - b.sort_idx);
    }

    get count() {
        return Object.keys(this.#list).length;
    }

    async update() {
        return fetch4('https://4pda.to/forum/index.php?act=inspector&CODE=fav')
            .then(data => {
                let lines = data.split(/\r\n|\n/),
                    new_list = {};

                lines.forEach((line, idx) => {
                    if (line == "") return;
                    let theme = new FavoriteTheme(line, idx);
                    new_list[theme.id] = theme;
                    if (theme.id in this.#list) {
                        let current_theme = this.#list[theme.id];
                        if (current_theme.last_post_ts < theme.last_post_ts) {
                            console.debug('new_comment_in_theme:', theme.id, theme.title);
                            // inspector.notifications.add('new_comment_in_theme', theme);
                        } else {
                            return;
                        }
                    } else {
                        console.debug('new_theme:', theme.id, theme.title);
                        // inspector.notifications.add('new_theme', theme);
                    }
                });
                this.#list = new_list;
                console.debug('Favorites:', this.count);
            });

    }
}


export class FavoriteTheme {
    constructor(text_line, sort_idx) {
        let obj = parse_response(text_line);
        this.id = obj[0];
        this.title = decode_special_chars(obj[1]);
        this.posts_num = obj[2];
        this.last_user_id = obj[3];
        this.last_user_name = decode_special_chars(obj[4]);
        this.last_post_ts = obj[5];
        this.last_read_ts = obj[6];
        this.pin = (obj[7] == "1");
        // this.viewed = false;
        this.sort_idx = sort_idx;
    }
}
