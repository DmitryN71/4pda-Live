import { parse_response, fetch4 } from "./utils.js";
import { FavoriteTheme } from "./fav.js";
import { print_count, print_logout, print_unavailable } from "./browser.js";

      
const urls = [
    'https://4pda.to/forum/index.php?act=inspector&CODE=fav',
    'https://4pda.to/forum/index.php?act=inspector&CODE=qms',
    'https://4pda.to/forum/index.php?act=inspector&CODE=mentions-list',
];
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

        this.favorites = [];
    }

    init() {
        console.debug('init CS', this.#initialized, new Date());
        if (this.#initialized) return;

        this.update();
        chrome.alarms.create('periodicApiCheck', {
            periodInMinutes: PERIOD_MINUTES
        });

        this.#initialized = true;
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
                        return this.#update();
                    }                    
                } else {
                    print_logout();
                    throw 'Bad user request';
                }
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
                        // todo update all
                        this.#update_user_data();
                    }
                } // else: no new events
                // todo print action
            })
            .catch(error => {
                console.error('Error fetching API data:', error);
                print_unavailable();
            });
    }

    async #update_user_data() {
        return Promise.all(urls.map(url => fetch4(url)))
            .then(responses => {
                responses.forEach((data, index) => {
                    switch (index) {
                        case 0:
                            // FAVORITES
                            // console.debug(data);
                            this.favorites = [];
                            let lines = data.split(/\r\n|\n/);
                            lines.forEach(line => {
                                if (line == "") return;
                                let theme = new FavoriteTheme(line);
                                // console.log(theme);
                                this.favorites.push(theme);
                            });
                            console.debug('Favorites:', this.favorites.length);
                            // todo: action print count
                            print_count(0, this.favorites.length);
                            break;
                        case 1:
                            console.log('QMS:', data);
                            // Handle qms response data here
                            break;
                        case 2:
                            console.log('mentions', data);
                            // Handle mentions response data here
                            break;
                    }
                });
            })
            .catch(error => {
                console.error('Error fetching API data:', error);
            });
    }
}