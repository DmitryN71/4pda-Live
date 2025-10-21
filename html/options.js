// Interval values array - MUST be at the top
const interval_values = [
    30,   // 30 секунд
    60,   // 1 минута
    120,  // 2 минуты
    300,  // 5 минут
    600,  // 10 минут
    1200, // 20 минут
    1800, // 30 минут
    3600  // 1 час
];

// Auto-save delay (milliseconds)
const AUTO_SAVE_DELAY = 500;
let saveTimeout = null;

// Debug mode
const DEBUG = true;

document.addEventListener('DOMContentLoaded', () => {
    if (DEBUG) console.log('=== Settings page loaded ===');
    
    initializeSidebar();
    loadSettings();
    setupAutoSave();
});

// Sidebar Navigation
function initializeSidebar() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.dataset.section;
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Update active section
            sections.forEach(section => section.classList.remove('active'));
            
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            } else {
                console.error('Section not found:', sectionId);
            }
            
            // Scroll to top of content
            const contentArea = document.querySelector('.content');
            if (contentArea) {
                contentArea.scrollTop = 0;
            }
        });
    });
}

// Load Settings
function loadSettings() {
    if (DEBUG) console.log('Loading settings...');
    
    chrome.storage.local.get()
        .then((items) => {
            if (DEBUG) console.log('Loaded settings:', items);
            
            for (let [key, value] of Object.entries(items)) {
                let el = document.getElementById(key);

                if (!el) {
                    if (DEBUG) console.debug(`Element for "${key}" not found`);
                    continue;
                }

                // Handle interval slider specially
                if (key === 'interval') {
                    if (DEBUG) console.log('Setting up interval slider with value:', value);
                    setupIntervalSlider(el, value);
                    continue;
                }

                // Handle different input types
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
                        const radio = el.querySelector(`input[value="${value}"]`);
                        if (radio) radio.checked = true;
                        break;
                    default:
                        console.warn(`No inputs for settings ${key}`);
                }
            }
        });
}

// Setup Interval Slider
function setupIntervalSlider(slider, value) {
    if (DEBUG) {
        console.log('=== setupIntervalSlider called ===');
        console.log('Slider element:', slider);
        console.log('Saved value:', value);
        console.log('interval_values array:', interval_values);
    }
    
    const output = document.getElementById('interval_output');
    
    if (!output) {
        console.error('interval_output element not found!');
        return;
    }
    
    // Find the index of the saved value
    let idx = interval_values.indexOf(value);
    
    if (DEBUG) console.log('Index of saved value:', idx);
    
    // If saved value doesn't exist in our array, default to 30 seconds
    if (idx === -1) {
        console.warn('Invalid interval value:', value, 'defaulting to 30 seconds');
        value = 30;
        idx = 0;
    }
    
    // Set slider properties
    slider.max = interval_values.length - 1;
    slider.value = idx;
    
    if (DEBUG) {
        console.log('Slider setup:');
        console.log('  - max:', slider.max);
        console.log('  - value (index):', slider.value);
        console.log('  - actual seconds:', interval_values[idx]);
    }
    
    // Update display function
    const updateDisplay = () => {
        // Get the actual value from the array using slider position
        const sliderIndex = parseInt(slider.value);
        const currentValue = interval_values[sliderIndex];
        
        if (DEBUG) {
            console.log('=== updateDisplay called ===');
            console.log('Slider position (index):', sliderIndex);
            console.log('Actual value (seconds):', currentValue);
        }
        
        let displayValue = currentValue;
        let displayText = 'сек';
        
        if (currentValue >= 60) {
            displayValue = Math.round(currentValue / 60);
            displayText = 'мин';
        }
        
        output.textContent = `${displayValue} ${displayText}`;
        
        if (DEBUG) {
            console.log('Display updated to:', output.textContent);
        }
    };
    
    // Initial display update
    updateDisplay();
    
    // Listen to input event (fires during drag) - update display only
    slider.addEventListener('input', (e) => {
        if (DEBUG) console.log('Slider input event fired, value:', e.target.value);
        updateDisplay();
    });
    
    // Listen to change event (fires on release) - update display AND save
    slider.addEventListener('change', (e) => {
        if (DEBUG) console.log('Slider change event fired, value:', e.target.value);
        updateDisplay();
        scheduleAutoSave();
    });
    
    if (DEBUG) console.log('=== Slider setup complete ===');
}

// Setup Auto-save
function setupAutoSave() {
    // Listen to all input changes
    document.querySelectorAll('input').forEach(input => {
        // Skip the interval slider - it has its own handler
        if (input.id === 'interval') {
            if (DEBUG) console.log('Skipping interval slider in setupAutoSave');
            return;
        }
        
        input.addEventListener('change', () => {
            scheduleAutoSave();
        });
        
        // Also listen to input event for other range sliders (if any)
        if (input.type === 'range' && input.id !== 'interval') {
            input.addEventListener('input', () => {
                scheduleAutoSave();
            });
        }
    });
    
    // Setup stepper buttons for number inputs
    document.querySelectorAll('.stepper-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            const min = parseInt(input.min);
            const max = parseInt(input.max);
            let value = parseInt(input.value) || min;
            
            if (btn.classList.contains('stepper-increase')) {
                value = Math.min(value + 1, max);
            } else if (btn.classList.contains('stepper-decrease')) {
                value = Math.max(value - 1, min);
            }
            
            input.value = value;
            scheduleAutoSave();
        });
    });
}

// Schedule Auto-save with debounce
function scheduleAutoSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveSettings();
    }, AUTO_SAVE_DELAY);
}

// Save Settings
function saveSettings() {
    let settings = {};
    
    document.querySelectorAll('input').forEach(el => {
        switch (el.type) {
            case 'checkbox':
                settings[el.id] = el.checked;
                break;
            case 'number':
                // Handle both old number-input and new number-input-stepper
                if (el.classList.contains('number-input-stepper') || el.classList.contains('number-input')) {
                    let value = parseInt(el.value);
                    let min = parseInt(el.min);
                    let max = parseInt(el.max);
                    
                    if (value) {
                        if (value < min) value = min;
                        else if (value > max) value = max;
                    } else {
                        value = max;
                    }
                    
                    el.value = value;
                    settings[el.id] = value;
                }
                break;
            case 'radio':
                if (el.checked) {
                    settings[el.name] = parseInt(el.value);
                }
                break;
            case 'range':
                if (el.id === 'interval') {
                    const intervalValue = interval_values[parseInt(el.value)];
                    settings[el.id] = intervalValue;
                    if (DEBUG) console.log('Saving interval:', intervalValue);
                }
                break;
        }
    });
    
    if (DEBUG) console.log('Saving settings:', settings);
    
    chrome.storage.local.set(settings, () => {
        showSaveIndicator();
    });
}

// Show Save Indicator
function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    indicator.classList.add('show');
    
    setTimeout(() => {
        indicator.classList.remove('show');
    }, 2000);
}

// Smooth scroll for sidebar navigation
document.querySelector('.content')?.addEventListener('scroll', () => {
    // Optional: Add scroll-based effects here if needed
});