import { fetch4, parse_response, decode_special_chars } from "../utils.js";


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
                            // inspector.notifications.add('new_message_in_dialog', dialog);
                        } else {
                            return;
                        }
                    } else {
                        console.debug('new_dialog:', dialog.opponent_name, dialog.title);
                        // inspector.notifications.add('new_dialog', dialog);
                    }
                });
                this.#list = new_list;
            });
    }
}

class Dialog {

    constructor(text_line) {
        let obj = parse_response(text_line);

        this.id = obj[0]
        this.title = decode_special_chars(obj[1])
        this.opponent_id = obj[2]
        this.opponent_name = decode_special_chars(obj[3])
        this.last_msg_ts = obj[4]
        this.unread_msgs = obj[5]
        this.last_msg_id = obj[6]
    }
}