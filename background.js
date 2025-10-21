// background.js - Chrome Extension MV3 Service Worker
import {CS, SETTINGS} from './js/cs.js';
import {open_url} from './js/browser.js';
import {getLogDatetime} from "./js/utils.js";

const ALARM_NAME = 'periodicUpdate';
const bg = new CS();
console.debug('Background started');

// Initialize alarm on install
chrome.runtime.onInstalled.addListener(reason => {
    console.debug('onInstalled', reason.reason);
    
    // Create context menu
    chrome.contextMenus.create({
        title: 'Принудительное обновление',
        id: 'update.all',
        contexts: ["action"],
    });
    
    // Initialize alarm immediately
    initializeAlarm();
});

// Reinitialize alarm on browser startup
chrome.runtime.onStartup.addListener(() => {
    console.debug('onStartup');
    initializeAlarm();
});

// Function to create/update the alarm
function initializeAlarm() {
    // Clear existing alarm first
    chrome.alarms.clear(ALARM_NAME, (wasCleared) => {
        console.debug('Alarm cleared:', wasCleared);
        
        // Get current interval setting (minimum 1 minute)
        const intervalMinutes = Math.max(SETTINGS.interval / 60, 1.0);
        
        // Create new alarm
        chrome.alarms.create(ALARM_NAME, {
            delayInMinutes: 1.0, // Start in 1 minute
            periodInMinutes: intervalMinutes
        });
        
        console.debug('Alarm created with period:', intervalMinutes, 'minutes');
    });
}

// Listen to alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        console.debug('Alarm fired:', alarm.name, getLogDatetime());
        bg.update();
    }
});

chrome.idle.onStateChanged.addListener(newState => {
    console.debug('idle.onStateChanged', newState, getLogDatetime());
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case 'update.all':
            bg.update(); // Force immediate update
            break;
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
        case 'mark_as_read':
            bg.favorites.do_read(message.id)
                .then(result => {
                    sendResponse(result);
                })
                .catch((error) => {
                    console.error('Error marking theme as read:', error);
                    sendResponse(false);
                });
            break;
        case 'open_url':
            switch (message.what) {
                case 'user':
                    return open_url(`https://4pda.to/forum/index.php?showuser=${bg.user_id}`, true, true);
                case 'options':
                    return open_url(chrome.runtime.getURL('/html/options.html'), true, true);
                case 'qms':
                    return bg.qms.open();
                case 'favorites':
                    return bg.favorites.open(
                        message['id'],
                        message['view'],
                        SETTINGS.toolbar_open_theme_hide
                    );
                case 'mentions':
                    return bg.mentions.open();
            }
            break;
        case 'request':
            switch (message.what) {
                case 'favorites.count':
                    sendResponse(bg.favorites.count);
                    break;
                case 'qms.count':
                    sendResponse(bg.qms.count);
                    break;
                case 'mentions.count':
                    sendResponse(bg.mentions.count);
                    break;
            }
            break;
    }
    // Return true if you want to send a response asynchronously
    return true;
});

chrome.runtime.onConnect.addListener(async (port) => {
    console.debug('onConnect', port.name);
    
    // Проверка что порт всё ещё подключен
    const isPortConnected = () => {
        try {
            // Попытка получить доступ к свойству порта
            return port.name !== undefined;
        } catch (e) {
            return false;
        }
    };

    // Безопасная отправка сообщения через порт
    const safePostMessage = (msg) => {
        try {
            if (isPortConnected()) {
                port.postMessage(msg);
                return true;
            }
        } catch (e) {
            console.warn('Port disconnected, cannot send message:', e);
        }
        return false;
    };

    switch (port.name) {
        case 'themes-read-all':
            for (let theme of bg.favorites.list) {
                if (await theme.read()) {
                    safePostMessage({
                        id: theme.id,
                        count: bg.favorites.count,
                    });
                }
            }
            break;
        case 'themes-open-all':
            let count_TPA = 0;
            for (let theme of bg.favorites.list) {
                theme.open(false, false)
                    .then(([tab, theme]) => {
                        if (theme.viewed) {
                            safePostMessage({
                                id: theme.id,
                                count: bg.favorites.count,
                            });
                        }
                    })
                    .catch(err => console.warn('Error opening theme:', err));
                if (++count_TPA >= SETTINGS.open_themes_limit) break;
            }
            break;
        case 'themes-open-all-pin':
            let count_TPAP = 0;
            for (let theme of bg.favorites.list_pin) {
                theme.open(false, false)
                    .then(([tab, theme]) => {
                        if (theme.viewed) {
                            safePostMessage({
                                id: theme.id,
                                count: bg.favorites.count,
                            });
                        }
                    })
                    .catch(err => console.warn('Error opening pinned theme:', err));
                if (++count_TPAP >= SETTINGS.open_themes_limit) break;
            }
            break;
    }
    
    // Обработчик отключения порта
    port.onDisconnect.addListener(() => {
        console.debug('Port disconnected:', port.name);
    });
});

chrome.notifications.onClicked.addListener(notificationId => {
    console.debug('notification_click', notificationId);
    const n_data = notificationId.split('/'),
        funcs = {
            theme: (id) => bg.favorites.open(id),
            dialog: (id) => bg.qms.open(id),
            mention: (id) => bg.mentions.open(id),
        };

    if (n_data[1] in funcs) {
        funcs[n_data[1]](n_data[2])
            .then(([tab, entity]) => {
                chrome.windows.update(tab.windowId, { focused: true });
            })
            .catch(err => console.error('Error handling notification click:', err));
    }
    chrome.notifications.clear(notificationId);
});

chrome.action.onClicked.addListener(tab => {
    if (bg.initialized && bg.available) {
        if (bg.user_id) {
            console.warn('action click & authorized')
        } else {
            return open_url('https://4pda.to/forum/index.php?act=auth');
        }
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.debug(
            `Storage key "${key}" in namespace "${namespace}" changed.`,
            `Old value was "${oldValue}", new value is "${newValue}".`
        );
        SETTINGS[key] = newValue;
        if (!bg.initialized) return;
        switch (key) {
            case 'toolbar_pin_themes_level':
                if (oldValue == 20) {
                    bg.favorites.filter_pin(false);
                } else if (newValue == 20) {
                    bg.favorites.filter_pin(true);
                }
                break;
            case 'interval':
                // Recreate alarm with new interval
                initializeAlarm();
                break;
        }
    }
});