const ACTION_BUTTON_ICONS = {
    default: '/img/icons/icon_19.png',
    has_qms: '/img/icons/icon_19_qms.png',
    logout: '/img/icons/icon_19_out.png'
}

const ACTION_BUTTON_COLORS = {
    default: [63, 81, 181, 255],
    has_qms: [76, 175, 80, 255],
    logout: [158, 158, 158, 255],
}


export function print_unavailable() {
    chrome.action.setBadgeText({text: 'N/A'});
    chrome.action.setBadgeBackgroundColor({color: ACTION_BUTTON_COLORS.logout});
    chrome.action.setIcon({path: ACTION_BUTTON_ICONS.logout});
    chrome.action.setTitle({title: '4PDA - Сайт недоступен'});
}

export function print_available() {
    chrome.action.setBadgeText({text: ''});
    chrome.action.setBadgeBackgroundColor({color: ACTION_BUTTON_COLORS.default});
    chrome.action.setIcon({path: ACTION_BUTTON_ICONS.default});
    chrome.action.setTitle({title: '4PDA - В сети'});
}

export function print_logout() {
    chrome.action.setBadgeText({text: 'login'});
    chrome.action.setBadgeBackgroundColor({color: ACTION_BUTTON_COLORS.logout});
    chrome.action.setIcon({path: ACTION_BUTTON_ICONS.logout});
    chrome.action.setTitle({title: '4PDA - Не в сети'});
}

export function print_count(q_count, f_count) {
    chrome.action.setBadgeText({text: String(f_count) || ''});
    if (q_count) {
        chrome.action.setBadgeBackgroundColor({color: ACTION_BUTTON_COLORS.has_qms});
        chrome.action.setIcon({path: ACTION_BUTTON_ICONS.has_qms});
    } else {
        chrome.action.setBadgeBackgroundColor({color: ACTION_BUTTON_COLORS.default});
        chrome.action.setIcon({path: ACTION_BUTTON_ICONS.default});
    }
    chrome.action.setTitle({title: `4PDA - В сети\nНепрочитанных тем: ${f_count}\nНепрочитанных диалогов: ${q_count}`});
}


export function open_url(url) {
    chrome.tabs.create({
        url: url
    });
}
