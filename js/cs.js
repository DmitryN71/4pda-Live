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
        console.log('init CS', new Date());
        this.#initialized = false;
        this.user_id = 0;
        this.user_name;
        this.favorites = [];
        this.last_event = 0;
    }

    init() {
        if (this.#initialized) {
            return;
        }
        this.update_all_data();
        chrome.alarms.create('periodicApiCheck', {
            periodInMinutes: PERIOD_MINUTES
        });

        this.#initialized = true;
    }

    update_all_data() {
        fetch4('https://4pda.to/forum/index.php?act=inspector&CODE=id')
            .then(data => {
                let user_data = parse_response(data);
                if (user_data && user_data.length == 2) {
                    this.user_id = parseInt(user_data[0]);
                    this.user_name = user_data[1];
                    console.debug('User:', user_data);
                    Promise.all(urls.map(url => fetch4(url)))
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
                } else {
                    print_logout();
                    // throw 'Bad user request';
                }
            })
            .catch(error => {
                print_unavailable();
                console.error('API request failed:', error);
            });
    }

    update() {
        console.debug('Update:', new Date());
        let url = `https://appbk.4pda.to/er/u${this.user_id}/s${this.last_event}`;
        fetch(url)
            .then(response => response.text())
            .then(data => {
                // console.debug(data);
                if (data) {
                    let parsed = data.match(PARSE_APPBK_REGEXP);
                    if (parsed) {
                        console.debug('Has new events');
                        this.last_event = parsed[1];
                        // todo update all
                    }
                } // else: no new events
                // todo print action
            })
            .catch(error => {
                console.error('Error fetching API data:', error);
                print_unavailable();
            });
    }
}