import { parse_response, fetch4 } from "./utils.js";
import { FavoriteTheme } from "./fav.js";

      
const urls = [
    'https://4pda.to/forum/index.php?act=inspector&CODE=fav',
    'https://4pda.to/forum/index.php?act=inspector&CODE=qms',
    'https://4pda.to/forum/index.php?act=inspector&CODE=mentions-list',
];
const PERIOD_MINUTES = 0.5;

export class CS {
    #initialized;

    constructor() {
        console.log('init CS', new Date());
        this.#initialized = false;
        this.user_id = 0;
        this.user_name;
        this.favorites = [];
    }

    init() {
        if (this.#initialized) {
            return;
        }
        this.update();
        chrome.alarms.create('periodicApiCheck', {
            periodInMinutes: PERIOD_MINUTES
        });

        this.#initialized = true;
    }

    update() {
        console.debug('Update:', new Date());

        fetch4('https://4pda.to/forum/index.php?act=inspector&CODE=id')
            .then(data => {
                let user_data = parse_response(data);
                if (user_data && user_data.length == 2) {
                    this.user_id = parseInt(user_data[0]);
                    this.user_name = user_data[1];
                    console.log('User:', user_data);
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
                                        // console.debug('Favorites:', this.favorites);
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
                    throw 'Bad user request';
                }
            })
            .catch(error => {
                console.error('API request failed:', error);
            });
    }
}