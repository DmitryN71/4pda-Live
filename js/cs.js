import { parse_response, fetch4 } from "./utils.js";
import { Favorites } from "./e/favorites.js";
import { Mentions } from "./e/mentions.js";
import { QMS } from "./e/qms.js";
import { print_count, print_logout, print_unavailable } from "./browser.js";


const PERIOD_MINUTES = 0.5;
const PARSE_APPBK_REGEXP = /u\d+:\d+:\d+:(\d+)/;


export class CS {
    #initialized;

    constructor() {
        console.log('Start CS', new Date());
        this.#initialized = false;
        this.user_id = 0;
        this.user_name;
        this.last_event = 0;

        this.favorites = new Favorites(this);
        this.qms = new QMS(this);
        this.mentions = new Mentions(this);

        this.notify = false;
    }

    init() {
        console.debug('Init CS', this.#initialized, new Date());
        if (this.#initialized) return;

        this.update();
        chrome.alarms.create('periodicApiCheck', {
            periodInMinutes: PERIOD_MINUTES
        });

        this.#initialized = true;
    }

    get popup_data() {
        return {
            user_id: this.user_id,
            user_name: this.user_name,
            favorites: {
                count: this.favorites.count,
                list: this.favorites.list
            },
            qms: {
                count: this.qms.count
            },
            mentions: {
                count: this.mentions.count
            }
        };
    }

    async update() {
        console.debug('Update:', new Date());
        return fetch4('https://4pda.to/forum/index.php?act=inspector&CODE=id')
            .then(data => {
                let user_data = parse_response(data);
                if (user_data && user_data.length == 2) {
                    if (user_data[0] == this.user_id) {
                        this.user_name = user_data[1];
                        return this.#update();
                    } else {
                        this.user_id = user_data[0];
                        this.user_name = user_data[1];
                        console.debug('New user:', this.user_id, this.user_name);
                        this.last_event = 0;
                        this.notify = false;
                        return this.#update();
                    }                    
                } else {
                    this.user_id = 0;
                    this.user_name = '';
                    console.debug('Unauthorized');
                    print_logout();
                }
            })
            .then(() => {
                console.debug('Update done');
                this.notify = true;
                print_count(
                    this.qms.count,
                    this.favorites.count
                );
            })
            .catch(error => {
                print_unavailable();
                console.error('API request failed:', error);
            });
    }

    async #update() {
        return fetch(`https://appbk.4pda.to/er/u${this.user_id}/s${this.last_event}`)
            .then(response => response.text())
            .then(data => {
                if (data) {
                    let parsed = data.match(PARSE_APPBK_REGEXP);
                    if (parsed) {
                        console.debug('Has new events');
                        this.last_event = parsed[1];
                        return Promise.all([
                            this.favorites.update(),
                            this.qms.update(),
                            this.mentions.update()
                        ]);
                    }
                } // else: no new events
            });
    }
}