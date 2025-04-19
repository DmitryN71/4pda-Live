// background.js - Chrome Extension MV3 Service Worker
import {parse_response, fetch4} from './js/utils.js';
import {FavoriteTheme} from './js/fav.js';

const PERIOD_MINUTES = 0.5;

// Set up the alarm when the service worker starts
chrome.runtime.onInstalled.addListener(() => {
    console.debug('onInstalled');
    bg.init();
});

// Also set up the alarm if the service worker starts (in case of reload)
chrome.runtime.onStartup.addListener(() => {
    console.debug('onStartup');
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'periodicApiCheck') {
        bg.update();
    }
});
        
const urls = [
    'https://4pda.to/forum/index.php?act=inspector&CODE=fav',
    'https://4pda.to/forum/index.php?act=inspector&CODE=qms',
    'https://4pda.to/forum/index.php?act=inspector&CODE=mentions-list',
];

const bg = new class {
    #initialized = false; 
    user_id = 0;
    user_name;
    favorites;

    init() {
        if (this.#initialized) {
            return;
        }
        this.favorites = [];
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

function open_url(url) {
    chrome.tabs.create({
        url: url
    });
}

// Listen for messages from popup or other extension parts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'popup_loaded':
            sendResponse({
                user_id: bg.user_id,
                user_name: bg.user_name,
                favorites: bg.favorites
            });
            break;
        case 'open_url':
            let url = 'https://4pda.to/forum/index.php?';
            switch (message.what) {
                case 'user':
                    url += 'showuser=' + bg.user_id;
                    break;
                case 'qms':
                    url += 'act=qms';
                    break;
                case 'favorites':
                    url += 'act=fav';
                    break;
                case 'mentions':
                    url += 'act=mentions';
                    break;
                default:
                    return true;
            }
            open_url(url);
            break;
    }
    // Return true if you want to send a response asynchronously
    return true;
});
