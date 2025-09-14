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
    document.getElementById('open_theme').addEventListener('click', () => {
        /*chrome.notifications.create(
            `${Date.now()}/theme/100`
        , {
            'contextMessage': 'NewComment',
            'title': 'not exists',
            'message': 'this.last_user_name',
            'iconUrl': '../img/icons/icon_80_favorite.png',
            'type': 'basic'
        });
        chrome.notifications.create(
            `${Date.now()}/theme/1034301`
        , {
            'contextMessage': 'NewComment',
            'title': 'exists',
            'message': 'this.last_user_name',
            'iconUrl': '../img/icons/icon_80_favorite.png',
            'type': 'basic'
        });*/

        /*chrome.notifications.create(
            `${Date.now()}/mention/1034301_110119843`
        , {
            'contextMessage': 'NewComment',
            'title': 'exists',
            'message': 'this.last_user_name',
            'iconUrl': '../img/icons/icon_80_mention.png',
            'type': 'basic'
        });*/
        chrome.notifications.create(
            `${Date.now()}/dialog/1572565_1042446`
        , {
            'contextMessage': 'NewComment',
            'title': 'exists',
            'message': 'this.last_user_name',
            'iconUrl': '../img/icons/icon_80_message.png',
            'type': 'basic'
        });
    });
});
