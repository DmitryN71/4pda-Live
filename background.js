// background.js - Chrome Extension MV3 Service Worker
import {CS} from './js/cs.js';
import {open_url} from './js/browser.js';


const bg = new CS();
// Set up the alarm when the service worker starts
chrome.runtime.onInstalled.addListener(() => {
    console.debug('onInstalled');
    bg.init();
});

// Also set up the alarm if the service worker starts (in case of reload)
chrome.runtime.onStartup.addListener(() => {
    console.debug('onStartup');
    bg.init();
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'periodicApiCheck') {
        bg.update();
    }
});

// Listen for messages from popup or other extension parts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'popup_loaded':
            sendResponse(bg.popup_data);
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

// https://developer.chrome.com/docs/extensions/reference/api/notifications#type-NotificationOptions
chrome.notifications.onClicked.addListener(notificationId => {
    console.debug('notification_click', notificationId);
    const n_data = notificationId.split('/');
    switch (n_data[1]) {
        case 'theme':
            bg.favorites.open(n_data[2]);
            break;
        case 'dialog':
            bg.qms.open(n_data[2]);
            break;
        case 'mention':
            bg.mentions.open(n_data[2]);
            break;
    }
});
