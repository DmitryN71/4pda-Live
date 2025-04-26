import { fetch4, parse_response, decode_special_chars } from "../utils.js";
import {open_url} from '../browser.js';


export class QMS {
    #list;

    constructor(cs) {
        this.cs = cs;
        this.#list = {};
    }

    get count() {
        return Object.keys(this.#list).length;
    }

    async update() {
        return fetch4('https://4pda.to/forum/index.php?act=inspector&CODE=qms')
            .then(data => {
                console.debug('QMS:', data);
                let lines = data.split(/\r\n|\n/),
                    new_list = {};
                lines.forEach(line => {
                    if (line == "") return;
                    console.debug('QMS dialog:', line);
                    let dialog = new Dialog(line);
                    new_list[dialog.id] = dialog;
                    if (dialog.id in this.#list) {
                        let current_dialog = this.#list[dialog.id];
                        if (current_dialog.last_msg_ts < dialog.last_msg_ts) {
                            console.debug('new_message_in_dialog:', dialog.opponent_name, dialog.title);
                            if (this.cs.notify) dialog.notification();
                        } else {
                            return;
                        }
                    } else {
                        console.debug('new_dialog:', dialog.opponent_name, dialog.title);
                        if (this.cs.notify) dialog.notification();
                    }
                });
                this.#list = new_list;
            });
    }

    open(id) {
        if (id) {
            let dialog = this.#list[id];
            return dialog.open();
        } else {
            return open_url('https://4pda.to/forum/index.php?act=qms');
        }
    }
}

class Dialog {

    constructor(text_line) {
        let obj = parse_response(text_line);

        this.id = obj[0];
        this.title = decode_special_chars(obj[1]);
        this.opponent_id = obj[2];
        this.opponent_name = decode_special_chars(obj[3]);
        this.last_msg_ts = obj[4];
        this.unread_msgs = obj[5];
        this.last_msg_id = obj[6];
    }

    notification() {
        return chrome.notifications.create(
            `${this.last_msg_ts}/dialog/${this.id}`
        , {
            'contextMessage': 'Новое сообщение',
            'title': this.title,
            'message': this.opponent_name,
            'eventTime': this.last_msg_ts*1000,
            'iconUrl': 'img/icons/icon_80_message.png',
            'type': 'basic'
        });
    }

    open() {
        return open_url(`https://4pda.to/forum/index.php?act=qms&mid=${this.opponent_id}&t=${this.id}`);
    }
}