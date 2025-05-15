document.addEventListener('DOMContentLoaded', (event) => {
    //console.debug(event);
    const status_block = document.getElementById('saveStatus');

    // Загрузка сохраненных настроек
    chrome.storage.local.get() // todo storage.sync
        .then((items) => {
            for (let [key, value] of Object.entries(items)) {
                //console.log(key, value);
                let el = document.getElementById(key);

                if (!el) {
                    console.debug(`Element for "${key}" not found`);
                    continue;
                }
                
                if (el.tagName == 'INPUT') {
                    switch (el.type) {
                        case 'checkbox':
                            el.checked = value;
                            break;
                        case 'number':
                            el.value = value;
                            break;
                    }
                } else {
                    console.warn(`no input for settings ${key}`);
                }
            }
        });

    // Обработчик сохранения настроек
    document.getElementById('saveSettings').addEventListener('click', () => {
        let settings = {};
        document.querySelectorAll('input').forEach(el => {
            switch (el.type) {
                case 'checkbox':
                    settings[el.id] = el.checked;
                    break;
                case 'number':
                    settings[el.id] = parseInt(el.value);
                    break;
            }
        });

        chrome.storage.local.set(settings, () => {
            status_block.classList.add('show');
            setTimeout(function() {
                status_block.classList.remove('show');
            }, 2000);
        });
    });
});