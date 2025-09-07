import { open_url } from '../browser.js';
import { AbstractEntity } from "./abstract.js";
import { SETTINGS } from '../cs.js'


const QMS_NOTIFICATION_KEY_REGEX = /^(\d+)_(\d+)$/;

export class QMS extends AbstractEntity {
    ACT_CODE_API = 'qms';
    ACT_CODE_FORUM = 'qms';

    _open(id) {
        const id2 = id.match(QMS_NOTIFICATION_KEY_REGEX);
        if (id2 && id2.length == 3) {
            return Dialog.just_open(id2[1], id2[2]);
        }
        throw new Error('Invalid qms id: ' + id);
    }

    process_line(line) {
        let dialog = new Dialog(line),
            current_dialog = this.get(dialog.id),
            n_level = 100;

        if (current_dialog) {
            if (current_dialog.last_msg_ts < dialog.last_msg_ts) {
                // new_message_in_dialog
                n_level = 20;
            }
        } else {
            n_level = 10;
        }
        if (this.notify && n_level <= SETTINGS.notification_qms_level) {
            dialog.notification();
        }
        return dialog;
    }
}

class Dialog {

    constructor(obj) {
        this.topic_id = obj[0];
        this.title = obj[1];
        this.opponent_id = obj[2];
        this.opponent_name = obj[3];
        this.last_msg_ts = obj[4];
        // this.unread_msgs = obj[5];
        // this.last_msg_id = obj[6];
    }

    get id() {
        return `${this.opponent_id}_${this.topic_id}`;
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

    static just_open(opponent_id, topic_id, set_active = true) {
        return open_url(
            `https://4pda.to/forum/index.php?act=qms&mid=${opponent_id}&t=${topic_id}`,
            set_active,
            false
        );
    }

    async open() {
        return this.constructor.just_open(this.opponent_id, this.topic_id)
            .then(tab => {
                return [tab, this];
            });
    }
}