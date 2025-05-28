import { parse_response, fetch4, getLogDatetime } from "./utils.js";
import { Favorites } from "./e/favorites.js";
import { Mentions } from "./e/mentions.js";
import { QMS } from "./e/qms.js";
import { print_count, print_logout, print_unavailable } from "./browser.js";


export const ALARM_NAME = 'periodicApiCheck';
const PERIOD_MINUTES = 0.5;
const PARSE_APPBK_REGEXP = /u\d+:\d+:\d+:(\d+)/;

export let SETTINGS = {
    notification_qms_level: 10,
    notification_themes_level: 10,
    notification_mentions_level: 20,

    toolbar_pin_themes_level: 0,
    // toolbar_only_pin: false,
    toolbar_open_theme_hide: true,

    /*notification_qms_popup: true,
    notification_qms_all_messages: false,
    notification_themes_popup: true,
    notification_themes_all_comments: false,
    notification_mentions_popup: true*/

    /*interval: 30,
    open_themes_limit: 0,

    notification_sound_volume: 0.5,

    notification_themes_sound: true,

    notification_qms_sound: true,

    notification_mentions_sound: true,

    toolbar_pin_color: true,
    toolbar_pin_up: false,
    toolbar_simple_list: false,

    toolbar_button_open_all: true,
    toolbar_button_read_all: true,

    toolbar_width_fixed: false,
    toolbar_width: 400,
    toolbar_theme: 'auto',

    open_in_current_tab: false,
    user_links: [],

    build: 0*/
    //, setting1: false
}


class UnauthorizedError extends Error {};


export class CS {
    #initialized;
    #update_in_process = false;

    constructor() {
        console.log('Start CS', getLogDatetime());

        this.#initialized = false;
        this.available = false;
        this.user_id = 0;
        this.user_name;
        this.last_event = 0;

        this.favorites = new Favorites(this);
        this.qms = new QMS(this);
        this.mentions = new Mentions(this);
    }

    init() {
        console.debug('Init CS', this.#initialized, getLogDatetime());
        if (this.#initialized) return;

        // https://developer.chrome.com/docs/extensions/reference/api/alarms
        chrome.alarms.clear(ALARM_NAME)
            .then(res => {
                console.debug('clear_alarm', res);
                //console.log(Object.keys(SETTINGS));

                chrome.storage.local.get(Object.keys(SETTINGS))
                    .then((items) => {
                        console.debug('Settings loaded', items);
                        let to_save = {};
                        for (const [key, value] of Object.entries(SETTINGS)) {
                            if (key in items) {
                                SETTINGS[key] = items[key];
                            } else {
                                to_save[key] = value;
                            }
                            // console.debug(`${key}: ${value}`, key in items);
                        }
                        if (Object.keys(to_save).length) {
                            chrome.storage.local.set(to_save, () => {
                                console.debug('Settings are saved');
                            });
                        }

                        chrome.alarms.create(ALARM_NAME, {
                            periodInMinutes: PERIOD_MINUTES
                        }).then(() => {
                            this.update();
                            this.#initialized = true;
                        });
                    });
            })
    }

    get initialized() {
        return this.#initialized;
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

    update_action() {
        print_count(
            this.qms.count,
            this.favorites.count
        );
    }

    async update() {
        console.debug('Start new update:', getLogDatetime());
        if (this.#update_in_process) {
            console.debug('Update conflict. Skip.')
            return;
        }
        this.#update_in_process = true;
        this.available = true;

        return chrome.cookies.get({
            url: 'https://4pda.to',
            name: 'member_id',
        }).
            then(cookie => {
                // just check auth
                if (cookie) {
                    console.debug('USER ID from cookie:', cookie.value); // parseInt
                } else {
                    throw new UnauthorizedError('Cookie not found');
                }
            })
            .then(() => {
                return fetch4('https://4pda.to/forum/index.php?act=inspector&CODE=id');
            })
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
                        return this.#update(false);
                    }                    
                } else {
                    throw new UnauthorizedError('User ID not found');
                }
            })
            .then(() => {
                console.debug('Update done', getLogDatetime());
                this.update_action();
            })
            .catch(error => {
                if (error instanceof UnauthorizedError) {
                    console.debug('Unauthorized');
                    this.user_id = 0;
                    this.user_name = '';
                    print_logout();
                } else {
                    this.available = false;
                    print_unavailable();
                    console.error('API request failed:', error);
                }
            })
            .finally(() => {
                this.#update_in_process = false;
            });
    }

    async #update(notify = true) {
        return fetch(`https://appbk.4pda.to/er/u${this.user_id}/s${this.last_event}`)
            .then(response => response.text())
            .then(data => {
                if (data) {
                    let parsed = data.match(PARSE_APPBK_REGEXP);
                    if (parsed) {
                        console.debug('Has new events');
                        this.last_event = parsed[1];
                        return Promise.all([
                            this.favorites.update(notify),
                            this.qms.update(notify),
                            this.mentions.update(notify)
                        ]);
                    }
                } // else: no new events
            });
    }
}