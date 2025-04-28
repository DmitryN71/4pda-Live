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
            if (bg.user_id) {
                sendResponse(bg.popup_data);
                break;
            } else {
                return open_url('https://4pda.to/forum/index.php?act=auth');
            }
        case 'open_url':
            switch (message.what) {
                case 'user':
                    return open_url(`https://4pda.to/forum/index.php?showuser=${bg.user_id}`);
                case 'qms':
                    return bg.qms.open();
                case 'favorites':
                    return bg.favorites.open(message['id'], message['view']);
                case 'mentions':
                    return bg.mentions.open();
            }
            break;
    }
    // Return true if you want to send a response asynchronously
    //return true;
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
