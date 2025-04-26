import { open_url } from '../browser.js';
import { AbstractEntity } from "./abstract.js";


export class QMS extends AbstractEntity {
    ACT_CODE_API = 'qms';
    ACT_CODE_FORUM = 'qms';

    process_line(line) {
        let dialog = new Dialog(line),
            current_dialog = this.get[dialog.id];

        if (current_dialog) {
            if (current_dialog.last_msg_ts < dialog.last_msg_ts) {
                console.debug('new_message_in_dialog:', dialog.opponent_name, dialog.title);
                if (this.cs.notify) dialog.notification();
            }
        } else {
            console.debug('new_dialog:', dialog.opponent_name, dialog.title);
            if (this.cs.notify) dialog.notification();
        }
        return dialog;
    }
}

class Dialog {

    constructor(obj) {
        this.id = obj[0];
        this.title = obj[1];
        this.opponent_id = obj[2];
        this.opponent_name = obj[3];
        this.last_msg_ts = obj[4];
        // this.unread_msgs = obj[5];
        // this.last_msg_id = obj[6];
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