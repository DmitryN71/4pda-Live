document.addEventListener('DOMContentLoaded', (event) => {
    //console.debug(event);
    const status_block = document.getElementById('saveStatus');

    // Загрузка сохраненных настроек
    chrome.storage.local.get() // todo storage.sync
        .then((items) => {
            for (let [key, value] of Object.entries(items)) {
                // console.debug(key, value);
                let el = document.getElementById(key);

                if (!el) {
                    console.debug(`Element for "${key}" not found`);
                    continue;
                }

                switch (el.tagName) {
                    case 'INPUT':
                        switch (el.type) {
                            case 'checkbox':
                                el.checked = value;
                                break;
                            case 'number':
                                el.value = value;
                                break;
                        }
                        break;
                    case 'FIELDSET':
                        el.querySelector(`input[value="${value}"]`).checked = true;
                        break;
                    default:
                        console.warn(`No inputs for settings ${key}`);
                        
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
                case 'radio':
                    if (el.checked) {
                        // console.log(el.closest('fieldset'));
                        settings[el.name] = parseInt(el.value);
                    }
                    break;
            }
        });
        console.debug(settings);

        chrome.storage.local.set(settings, () => {
            status_block.classList.add('show');
            setTimeout(function() {
                status_block.classList.remove('show');
            }, 2000);
        });
    });
});