import { fetch4, parse_response, decode_special_chars } from "../utils.js";


export class QMS {
    constructor(cs) {
        this.cs = cs;
    }

    get count() {
        return 0;
    }

    async update() {
        return fetch4('https://4pda.to/forum/index.php?act=inspector&CODE=qms')
            .then(data => {
                console.debug('QMS:', data);
                let lines = data.split(/\r\n|\n/);
                lines.forEach(line => {
                    if (line == "") return;
                    console.debug('QMS dialog:', line);
                    let dialog = new Dialog(line);
                    // todo
                });
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