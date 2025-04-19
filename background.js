// background.js - Chrome Extension MV3 Service Worker
import {CS} from './js/cs.js';


const bg = new CS();
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
