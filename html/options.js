document.addEventListener('DOMContentLoaded', function() {
    // Загрузка сохраненных настроек
    chrome.storage.sync.get({
        updateInterval: 300, // 5 минут по умолчанию
        setting1: false,
        setting2: false
    }, function(items) {
        document.getElementById('updateInterval').value = items.updateInterval;
        document.getElementById('setting1').checked = items.setting1;
        document.getElementById('setting2').checked = items.setting2;
    });

    // Обработчик сохранения настроек
    document.getElementById('saveSettings').addEventListener('click', function() {
        const settings = {
            updateInterval: parseInt(document.getElementById('updateInterval').value),
            setting1: document.getElementById('setting1').checked,
            setting2: document.getElementById('setting2').checked
        };

        chrome.storage.sync.set(settings, () => {
            // Показать уведомление о сохранении
            const status = document.getElementById('status');
            status.textContent = 'Настройки сохранены.';
            setTimeout(function() {
                status.textContent = '';
            }, 2000);
        });
    });
});