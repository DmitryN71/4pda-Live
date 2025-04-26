import { fetch4, parse_response, decode_special_chars } from "../utils.js";


export class Mentions {
    #list;

    constructor(cs) {
        this.cs = cs;
        this.#list = {};
    }

    get count() {
        return Object.keys(this.#list).length;
    }

    async update() {
        return fetch4('https://4pda.to/forum/index.php?act=inspector&CODE=mentions-list')
            .then(data => {
                console.debug('Mentions:', data);
                let lines = data.split(/\r\n|\n/),
                    new_list = {};
                lines.forEach(line => {
                    if (line == "") return;
                    console.debug('Mention:', line);
                    let mention = new Mention(line);
                    if (mention.from !== 0) return;

                    new_list[mention.key] = mention;
                    if (!(mention.key in this.#list)) {
                        console.debug('new_mention:', mention.title, mention.poster_name);
                        if (this.cs.notify) mention.notification();
                    }
                });
                this.#list = new_list;
            });
    }
}

class Mention {

    constructor(text_line) {
        let obj = parse_response(text_line)

        this.from = parseInt(obj[0]) // 0 = forum, 1 = site
        // if (this.from !== 0) {
        //     throw 'Mention: Bad from'
        // }
        this.topic_id = obj[1]; //or post_id
        this.post_id = obj[2]; //or comment_id
        this.title = decode_special_chars(obj[3])
        this.timestamp = obj[4]
        this.poster_id = obj[5]
        this.poster_name = decode_special_chars(obj[6])
    }

    get key() {
        return `${this.timestamp}_${this.topic_id}_${this.post_id}`
    }

    notification() {
        return chrome.notifications.create(
            `${this.timestamp}/mention/${this.topic_id}`
            //`${this.timestamp}_${this.topic_id}_${this.post_id}`
        , {
            'contextMessage': 'Новое упоминание',
            'title': this.title,
            'message': this.poster_name,
            'eventTime': this.timestamp*1000,
            'iconUrl': 'img/icons/icon_80_mention.png',
            'type': 'basic'
        });
    }

}