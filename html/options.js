const DEFAULT_SETTINGS = {
    updateInterval: 30,
    setting1: false,
    setting2: false
};

// 
document.addEventListener('DOMContentLoaded', (event) => {
    //console.debug(event);

    // Загрузка сохраненных настроек
    chrome.storage.local.get(DEFAULT_SETTINGS)
        .then((items) => {
            //console.log(items);
            for (let [key, value] of Object.entries(items)) {
                //console.log(key, value);
                let el = document.getElementById(`s.${key}`);
                if (el.tagName == 'INPUT') {
                    switch (el.type) {
                        case 'checkbox':
                            el.checked = value;
                            break;
                        case 'number':
                            el.value = value;
                            break;
                        /*default:
                            break;*/
                    }
                } else {
                    console.warn(`no input for settings ${key}`);
                }
            }
        });

    // Обработчик сохранения настроек
    document.getElementById('saveSettings').addEventListener('click', () => {
        let settings = {};
        for (let key in DEFAULT_SETTINGS) {
            let el = document.getElementById(`s.${key}`);
            if (el.tagName == 'INPUT') {
                switch (el.type) {
                    case 'checkbox':
                        settings[key] = el.checked;
                        break;
                    case 'number':
                        settings[key] = parseInt(el.value);
                        break;
                    default:
                        continue;
                }
            } else {
                console.warn(`no input for settings ${key}`);
            }
        }

        chrome.storage.local.set(settings, () => {
            // Показать уведомление о сохранении
            const status = document.getElementById('status');
            status.textContent = 'Настройки сохранены.';
            setTimeout(function() {
                status.textContent = '';
            }, 2000);
        });
    });
});