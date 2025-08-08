document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('n_silent').addEventListener('click', () => {
        // chrome.runtime.sendMessage({action: 'notification_theme'});
        console.log('Silent');
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '../img/icons/icon_80_favorite.png',
            title: 'Silent notification',
            message: 'This is a silent notification',
            silent: true
        });
    });
    document.getElementById('n_not_silent').addEventListener('click', () => {
        // chrome.runtime.sendMessage({action: 'notification_theme'});
        console.log('Not silent');
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '../img/icons/icon_80_favorite.png',
            title: 'Not silent notification',
            message: 'This is a not silent notification',
            silent: false
        });
    });
});
