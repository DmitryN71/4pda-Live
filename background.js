// background.js - Chrome Extension MV3 Service Worker
import {parse_response} from './js/utils.js';

const PERIOD_MINUTES = 0.5;

// Set up the alarm when the service worker starts
chrome.runtime.onInstalled.addListener(() => {
    console.debug('onInstalled');
    bg.init();
    // chrome.alarms.create('periodicApiCheck', {
    //     periodInMinutes: PERIOD_MINUTES
    // });
});

// Also set up the alarm if the service worker starts (in case of reload)
chrome.runtime.onStartup.addListener(() => {
    console.debug('onStartup');
    // chrome.alarms.create('periodicApiCheck', {
    //     periodInMinutes: PERIOD_MINUTES
    // });
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

        fetch('https://4pda.to/forum/index.php?act=inspector&CODE=id')
            .then(response => response.text())
            .then(data => {
                // Handle the response data here
                // console.log('API response:', data);
                let user_data = parse_response(data);
                if (user_data && user_data.length == 2) {
                    this.user_id = parseInt(user_data[0]);
                    this.user_name = user_data[1];
                    console.log('User:', user_data);
                    Promise.all(urls.map(url => fetch(url).then(response => response.text())))
                        .then(responses => {
                            console.debug('API responses:', responses);
                            responses.forEach((data, index) => {
                                switch (index) {
                                    case 0:
                                        console.log('fav:', data);
                                        // Handle favorite themes response data here
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

// Listen for messages from popup or other extension parts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'popup_loaded') {
        sendResponse({
            user_id: bg.user_id,
            user_name: bg.user_name
        });
    }
    // Return true if you want to send a response asynchronously
    return true;
});
