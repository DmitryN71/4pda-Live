import { parse_response, fetch4, getLogDatetime, FETCH_TIMEOUT } from "./utils.js";
import { Favorites } from "./e/favorites.js";
import { Mentions } from "./e/mentions.js";
import { QMS } from "./e/qms.js";
import { print_count, print_logout, print_unavailable } from "./browser.js";

const PARSE_APPBK_REGEXP = /u\d+:\d+:\d+:(\d+)/;

export let SETTINGS = {
    notification_qms_level: 10,
    notification_themes_level: 10,
    notification_mentions_level: 20,
    toolbar_pin_themes_level: 0,
    toolbar_open_theme_hide: true,
    toolbar_button_open_all: true,
    toolbar_button_read_all: true,
    toolbar_simple_list: false,
    open_themes_limit: 5,
    interval: 30,
}

export class CS {
    #initialized = false;
    #update_in_process = false;
    #cookie_authorized = false;
    #available = true;
    #user_id = 0;
    #user_name = '';
    #last_event = 0;
    #rate_limit_count = 0; // Счётчик 429 ошибок
    #backoff_until = 0; // Timestamp до которого не делать запросы

    constructor() {
        console.log('Start CS', getLogDatetime());

        this.favorites = new Favorites(this);
        this.qms = new QMS(this);
        this.mentions = new Mentions(this);

        chrome.storage.local.get(Object.keys(SETTINGS))
            .then((items) => {
                console.debug('Settings are loaded', items);
                let to_save = {};
                for (const [key, value] of Object.entries(SETTINGS)) {
                    if (key in items) {
                        SETTINGS[key] = items[key];
                    } else {
                        to_save[key] = value;
                    }
                }
                if (Object.keys(to_save).length) {
                    chrome.storage.local.set(to_save, () => {
                        console.debug('Settings are saved');
                    });
                }
            })
            .then(() => {
                return this.#get_cookie_member_id()
                    .then(start_member_id => {
                        this.heartbeat = setInterval(() => {
                            if (this.#update_in_process) return;

                            this.#get_cookie_member_id()
                                .then(member_id => {
                                    if (this.#cookie_authorized == (member_id != null)) return;

                                    if (member_id) {
                                        console.debug('! Auth found');
                                        this.#cookie_authorized = true;
                                        this.update();
                                    } else {
                                        console.debug('! Auth lost');
                                        this.#do_logout();
                                        this.#cookie_authorized = false;
                                    }
                                });
                        }, 1000);

                        this.#cookie_authorized = start_member_id != null;
                        return this.#cookie_authorized
                    });
            })
            .then(auth => {
                console.debug('CS initialized; auth: ', auth);
                if (auth) {
                    // Небольшая задержка перед первым обновлением
                    setTimeout(() => this.update(), 2000);
                } else {
                    this.#do_logout();
                }
            })
            .finally(() => {
                this.#initialized = true;
            });
    }

    #get_cookie_member_id() {
        return chrome.cookies.get({
            url: 'https://4pda.to',
            name: 'member_id',
        })
            .then(cookie => {
                return cookie ? cookie.value : null;
            });
    }

    #do_logout() {
        this.#user_id = 0;
        this.#user_name = '';
        print_logout();
    }

    reset_timeout() {
        if (this.#update_in_process) {
            console.debug('Update already in progress. Skip.')
            return;
        }
        this.update();
    }

    get initialized() { return this.#initialized; }
    get available() { return this.#available; }
    get user_id() { return this.#user_id; }

    get popup_data() {
        return {
            user_id: this.#user_id,
            user_name: this.#user_name,
            favorites: {
                count: this.favorites.count,
                list: this.favorites.list
            },
            qms: {
                count: this.qms.count
            },
            mentions: {
                count: this.mentions.count
            },
            settings: SETTINGS
        };
    }

    update_action() {
        print_count(
            this.qms.count,
            this.favorites.count
        );
    }

    async update() {
        console.debug('* Start new update:', getLogDatetime());
        
        if (!this.#cookie_authorized) {
            console.debug('Hasn\'t cookie. Skip.')
            return;
        }
        
        if (this.#update_in_process) {
            console.debug('Update conflict. Skip.')
            return;
        }

        // Проверяем backoff
        const now = Date.now();
        if (now < this.#backoff_until) {
            const waitSeconds = Math.ceil((this.#backoff_until - now) / 1000);
            console.warn(`⏸️ Rate limit backoff active. Waiting ${waitSeconds}s...`);
            return;
        }

        this.#update_in_process = true;

        return fetch4('https://4pda.to/forum/index.php?act=inspector&CODE=id')
            .then(data => {
                // Успешный запрос - сбрасываем счётчик
                this.#rate_limit_count = 0;
                this.#backoff_until = 0;

                let user_data = parse_response(data);
                if (user_data && user_data.length == 2) {
                    if (user_data[0] == this.#user_id) {
                        this.#user_name = user_data[1];
                    } else {
                        this.#user_id = user_data[0];
                        this.#user_name = user_data[1];
                        console.debug('New user:', this.#user_id, this.#user_name);

                        this.#last_event = 0;
                        this.favorites.reset();
                        this.qms.reset();
                        this.mentions.reset();
                    }   
                    return this.#update_all_data();                 
                } else {
                    console.debug('Unauthorized');
                    this.#do_logout();
                }
            })
            .catch(error => {
                const errorStr = String(error);
                console.error('API request failed:', errorStr);
                
                // Проверяем на 429
                if (errorStr.includes('429')) {
                    this.#rate_limit_count++;
                    
                    // Экспоненциальная задержка: 1 мин, 5 мин, 15 мин, 30 мин
                    const backoffMinutes = Math.min(Math.pow(5, this.#rate_limit_count - 1), 30);
                    this.#backoff_until = Date.now() + (backoffMinutes * 60 * 1000);
                    
                    console.warn(`⚠️ Rate limit (429) #${this.#rate_limit_count}. Пауза на ${backoffMinutes} минут до ${new Date(this.#backoff_until).toLocaleTimeString()}`);
                    
                    // Сайт доступен, просто ограничение
                    this.#available = true;
                } else {
                    // Другие ошибки - сайт недоступен
                    this.#available = false;
                    print_unavailable();
                }
            })
            .finally(() => {
                this.#update_in_process = false;
            });
    }

    async #update_all_data() {
        return fetch(
            `https://appbk.4pda.to/er/u${this.#user_id}/s${this.#last_event}`,
            {
                method: 'GET',
                signal: AbortSignal.timeout(FETCH_TIMEOUT),
            }
        )
            .then(response => response.text())
            .then(data => {
                if (data) {
                    let parsed = data.match(PARSE_APPBK_REGEXP);
                    if (parsed) {
                        console.debug('! Has new events');
                        return Promise.all([
                            this.favorites.update(),
                            this.qms.update(),
                            this.mentions.update()
                        ])
                            .then(() => {
                                this.#last_event = parsed[1];
                                return true;
                            });
                    }
                }
                return false;
            })
            .then(has_updates => {
                console.debug('Update done', has_updates, this.#available, getLogDatetime());
                this.update_action();
                this.#available = true;
            });
    }
}