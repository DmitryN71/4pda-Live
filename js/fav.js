import {parse_response, decode_special_chars} from './utils.js';


export class FavoriteTheme {
    constructor(text_line) {
        let obj = parse_response(text_line);
        this.id = obj[0];
        this.title = decode_special_chars(obj[1]);
        this.posts_num = obj[2];
        this.last_user_id = parseInt(obj[3]);
        this.last_user_name = decode_special_chars(obj[4]);
        this.last_post_ts = parseInt(obj[5]);
        this.last_read_ts = parseInt(obj[6]);
        this.pin = (obj[7] == "1");
        // this.viewed = false;
    }
}
