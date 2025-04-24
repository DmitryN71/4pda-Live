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
                    new_list[mention.key] = mention;
                    if (!(mention.key in this.#list)) {
                        console.debug('new_mention:', mention.title, mention.poster_name);
                        // inspector.notifications.add('new_mention', mention)
                    }
                });
                this.#list = new_list;
            });
    }
}

class Mention {

    constructor(text_line) {
        let obj = parse_response(text_line)

        // this.from = parseInt(obj[0]) // 0 = forum, 1 = site
        // if (this.from !== 0) {
        //     throw 'Mention: Bad from'
        // }
        this.topic_id = parseInt(obj[1]) //or post_id
        this.post_id = parseInt(obj[2]) //or comment_id
        this.title = decode_special_chars(obj[3])
        this.timestamp = parseInt(obj[4])
        this.poster_id = parseInt(obj[5])
        this.poster_name = decode_special_chars(obj[6])
    }

    get key() {
        return `${this.timestamp}_${this.topic_id}_${this.post_id}`
    }

}