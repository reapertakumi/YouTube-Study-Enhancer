document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const timeDisplay = document.querySelector('.time-display');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const modeBtns = document.querySelectorAll('.mode-btn');
    
    // Background Settings Elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const bgGallery = document.getElementById('bg-gallery');
    const bgUploader = document.getElementById('bg-uploader');
    const uploadTrigger = document.getElementById('upload-trigger');
    
    // Timer Settings Elements
    const timerSettingsBtn = document.getElementById('timer-settings-btn');
    const timerSettingsModal = document.getElementById('timer-settings-modal');
    const closeTimerModal = document.getElementById('close-timer-modal');
    const pomodoroInput = document.getElementById('pomodoro-input');
    const shortInput = document.getElementById('short-input');
    const longInput = document.getElementById('long-input');
    const preferredBreakSelect = document.getElementById('preferred-break');
    const autoSwitchCheckbox = document.getElementById('auto-switch');

    // --- State Variables ---
    let timerId = null;
    let timeLeft = 1500;
    let isRunning = false;
    let currentBlobUrl = null;
    let preferredBreak = localStorage.getItem('preferredBreak') || 'short';
    let autoSwitch = localStorage.getItem('autoSwitch') !== 'false';
    let pomodoroDuration = parseInt(localStorage.getItem('pomodoroDuration')) || 25;
    let shortBreakDuration = parseInt(localStorage.getItem('shortBreakDuration')) || 5;
    let longBreakDuration = parseInt(localStorage.getItem('longBreakDuration')) || 15;

    // Helper HTML escaper
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Chime Sound ---
    function playChime() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create a soft ding sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 1200; // Higher pitch
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    // --- IndexedDB Management ---
    const dbName = "CozySpaceDB";
    const storeName = "backgrounds";

    function getDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 2);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    const objectStore = db.createObjectStore(storeName, { keyPath: "id" });
                    objectStore.createIndex("lastUsed", "lastUsed", { unique: false });
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function saveBackground(blob, id, isGitHub = false) {
        const db = await getDB();
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        
        const existing = await new Promise((resolve, reject) => {
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        const backgroundData = {
            id: id,
            blob: blob,
            isGitHub: isGitHub,
            lastUsed: Date.now(),
            url: existing?.url || (isGitHub ? null : URL.createObjectURL(blob))
        };

        store.put(backgroundData);
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    function createBlobUrl(blob) {
        return URL.createObjectURL(blob);
    }

    async function deleteBackground(id) {
        const db = await getDB();
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        store.delete(id);
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async function applyBackground(backgroundData) {
        if (currentBlobUrl && !backgroundData.isGitHub) URL.revokeObjectURL(currentBlobUrl);
        
        if (backgroundData.isGitHub) {
            currentBlobUrl = backgroundData.url;
        } else {
            currentBlobUrl = createBlobUrl(backgroundData.blob);
        }
        
        document.body.style.backgroundImage = `linear-gradient(rgba(26, 21, 44, 0.45), rgba(15, 12, 28, 0.65)), url(${currentBlobUrl})`;
        
        // Update last used timestamp
        await saveBackground(backgroundData.blob, backgroundData.id, backgroundData.isGitHub);
        
        // Reload gallery to show updated sorting
        loadBackgrounds();
    }

    // --- GitHub Preset Fetching ---
    async function fetchPresets() {
        try {
            const db = await getDB();
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const allBackgrounds = await new Promise((resolve, reject) => {
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });

            // Check if GitHub backgrounds are already stored
            const githubBackgrounds = allBackgrounds.filter(bg => bg.isGitHub);
            
            if (githubBackgrounds.length === 0) {
                // Fetch and store GitHub backgrounds
                const response = await fetch("https://api.github.com/repos/reapertakumi/YouTube-Study-Enhancer/contents/BG");
                const files = await response.json();
                
                for (const file of files) {
                    if (file.type === "file" && (file.name.match(/\.(jpg|png|jpeg)$/i))) {
                        const res = await fetch(file.download_url);
                        const blob = await res.blob();
                        const backgroundData = {
                            id: file.name,
                            blob: blob,
                            isGitHub: true,
                            lastUsed: Date.now(),
                            url: file.download_url
                        };
                        const db = await getDB();
                        const tx = db.transaction(storeName, "readwrite");
                        tx.objectStore(storeName).put(backgroundData);
                        await new Promise((resolve, reject) => {
                            tx.oncomplete = () => resolve();
                            tx.onerror = () => reject(tx.error);
                        });
                    }
                }
                
                // Reload backgrounds after saving
                return loadBackgrounds();
            } else {
                // Load existing backgrounds from IndexedDB
                loadBackgrounds();
            }
        } catch (e) { console.error("Error loading presets:", e); }
    }

    async function loadBackgrounds() {
        try {
            const db = await getDB();
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const allBackgrounds = await new Promise((resolve, reject) => {
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });

            // Sort by last used (most recent first)
            allBackgrounds.sort((a, b) => b.lastUsed - a.lastUsed);

            // Clear gallery
            bgGallery.innerHTML = '';

            // Add upload button first (always in same position)
            const uploadBtn = document.createElement('div');
            uploadBtn.className = 'bg-option upload-btn';
            uploadBtn.id = 'upload-trigger';
            uploadBtn.title = 'Upload your own image';
            uploadBtn.textContent = '+';
            bgGallery.appendChild(uploadBtn);

            // Add backgrounds
            allBackgrounds.forEach(bg => {
                const option = document.createElement('div');
                option.className = 'bg-option';
                
                if (bg.isGitHub) {
                    option.style.backgroundImage = `url(${bg.url})`;
                } else {
                    // Create blob URL for uploaded backgrounds
                    const blobUrl = createBlobUrl(bg.blob);
                    option.style.backgroundImage = `url(${blobUrl})`;
                }
                
                option.onclick = async () => {
                    await applyBackground(bg);
                    settingsModal.classList.remove('show');
                    setTimeout(() => settingsModal.style.display = 'none', 300);
                };
                
                // Add remove button for all backgrounds
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-bg-btn';
                removeBtn.textContent = 'x';
                removeBtn.onclick = async (e) => {
                    e.stopPropagation();
                    await deleteBackground(bg.id);
                    await loadBackgrounds();
                };
                option.appendChild(removeBtn);
                
                bgGallery.appendChild(option);
            });

            // Re-attach upload trigger event
            document.getElementById('upload-trigger').onclick = () => bgUploader.click();

        } catch (e) { console.error("Error loading backgrounds:", e); }
    }

    // --- Timer Logic ---
    function updateDisplay() {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        const timeString = `${m}:${s}`;
        timeDisplay.textContent = timeString;

        if (isRunning) {
            const activeMode = document.querySelector('.mode-btn.active').textContent;
            document.title = `${timeString} - ${activeMode.charAt(0).toUpperCase() + activeMode.slice(1)} Timer`;
        } else {
            document.title = "YT Study Enhancer";
        }
    }

    function startTimer() {
        isRunning = true;
        startBtn.textContent = 'pause';
        updateDisplay();
        timerId = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                clearInterval(timerId);
                isRunning = false;
                startBtn.textContent = 'start';
                document.title = "YT Study Enhancer";
                playChime();
                
                // Always switch to next mode
                const activeMode = document.querySelector('.mode-btn.active').dataset.mode;
                if (activeMode === 'pomodoro') {
                    // Switch to preferred break
                    const breakMode = preferredBreak === 'short' ? 'short' : 'long';
                    switchMode(breakMode);
                } else {
                    // Switch to pomodoro
                    switchMode('pomodoro');
                }
                
                // Auto-start timer if enabled
                if (autoSwitch) {
                    startTimer();
                }
            }
        }, 1000);
    }

    function updateModeDurations() {
        pomodoroDuration = parseInt(pomodoroInput.value);
        shortBreakDuration = parseInt(shortInput.value);
        longBreakDuration = parseInt(longInput.value);
        
        document.querySelector('[data-mode="pomodoro"]').dataset.time = pomodoroDuration * 60;
        document.querySelector('[data-mode="short"]').dataset.time = shortBreakDuration * 60;
        document.querySelector('[data-mode="long"]').dataset.time = longBreakDuration * 60;
        
        preferredBreak = preferredBreakSelect.value;
        localStorage.setItem('preferredBreak', preferredBreak);
        autoSwitch = autoSwitchCheckbox.checked;
        localStorage.setItem('autoSwitch', autoSwitch);
        
        localStorage.setItem('pomodoroDuration', pomodoroDuration);
        localStorage.setItem('shortBreakDuration', shortBreakDuration);
        localStorage.setItem('longBreakDuration', longBreakDuration);
        
        if (!isRunning) {
            timeLeft = parseInt(document.querySelector('.mode-btn.active').dataset.time);
            updateDisplay();
        }
    }

    function switchMode(mode) {
        modeBtns.forEach(btn => btn.classList.remove('active'));
        const targetBtn = document.querySelector(`[data-mode="${mode}"]`);
        targetBtn.classList.add('active');
        timeLeft = parseInt(targetBtn.dataset.time);
        updateDisplay();
        updateModeIndicator(); // Ensures the slider follows the mode change
    }

    // --- Event Listeners ---
    settingsBtn.onclick = () => {
        settingsModal.style.display = 'flex';
        setTimeout(() => settingsModal.classList.add('show'), 10);
    };
    closeModalBtn.onclick = () => {
        settingsModal.classList.remove('show');
        setTimeout(() => settingsModal.style.display = 'none', 300);
    };
    
    timerSettingsBtn.onclick = () => {
        timerSettingsModal.style.display = 'flex';
        setTimeout(() => timerSettingsModal.classList.add('show'), 10);
    };
    closeTimerModal.onclick = () => {
        updateModeDurations();
        timerSettingsModal.classList.remove('show');
        setTimeout(() => timerSettingsModal.style.display = 'none', 300);
    };

    uploadTrigger.onclick = () => bgUploader.click();
    
    bgUploader.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const id = 'uploaded_' + Date.now();
            await saveBackground(file, id, false);
            
            // Get the saved background data
            const db = await getDB();
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const backgroundData = await new Promise((resolve, reject) => {
                const req = store.get(id);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            
            // Apply the new background
            await applyBackground(backgroundData);
            
            await loadBackgrounds();
            settingsModal.classList.remove('show');
            setTimeout(() => settingsModal.style.display = 'none', 300);
        }
    };

    modeBtns.forEach(btn => btn.onclick = (e) => {
        modeBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        timeLeft = parseInt(e.target.dataset.time);
        updateDisplay();
        updateModeIndicator();
    });

    function updateModeIndicator() {
        const activeBtn = document.querySelector('.mode-btn.active');
        const indicator = document.querySelector('.mode-indicator');
        if (activeBtn && indicator) {
            indicator.style.width = activeBtn.offsetWidth + 'px';
            indicator.style.left = activeBtn.offsetLeft + 'px';
        }
    }

    // Initialize indicator position
    setTimeout(updateModeIndicator, 100);
    
    // Update indicator on window resize
    window.addEventListener('resize', updateModeIndicator);

    startBtn.onclick = () => isRunning ? clearInterval(timerId) || (isRunning = false) || (startBtn.textContent = 'start') || updateDisplay() : startTimer();
    resetBtn.onclick = () => { clearInterval(timerId); isRunning = false; startBtn.textContent = 'start'; timeLeft = parseInt(document.querySelector('.mode-btn.active').dataset.time); updateDisplay(); };

    // --- Music Tab Functionality ---
    const tabs = document.querySelectorAll('.music-tab');
    const dots = document.querySelectorAll('.tab-dot');

    // --- Music Player Logic ---
    const musicContainer = document.querySelector('.music-player-container');
    const collapseBtn = document.getElementById('collapse-btn');
    const soundIcon = document.getElementById('sound-icon');

    // Load saved state from localStorage
    const isMusicCollapsed = localStorage.getItem('musicPlayerCollapsed') === 'true';
    if (isMusicCollapsed) {
        musicContainer.classList.add('collapsed');
    }

    function toggleMusicPlayer() {
        musicContainer.classList.toggle('collapsed');
        const isCollapsed = musicContainer.classList.contains('collapsed');
        
        // Save state to localStorage
        localStorage.setItem('musicPlayerCollapsed', isCollapsed);
        
        // Update button arrow direction
        const arrowHtml = isCollapsed 
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
        
        if (collapseBtn) collapseBtn.innerHTML = arrowHtml;
    }

    if (collapseBtn) collapseBtn.onclick = toggleMusicPlayer;
    if (soundIcon) soundIcon.onclick = toggleMusicPlayer;

    // Initialize collapse button arrow based on saved state
    if (collapseBtn && isMusicCollapsed) {
        collapseBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const target = dot.dataset.target;

            tabs.forEach(tab => tab.classList.remove('active'));
            dots.forEach(d => d.classList.remove('active'));

            document.querySelector(`.music-tab[data-tab="${target}"]`).classList.add('active');
            dot.classList.add('active');
        });
    });

    // --- Task List Logic ---
    const noteIcon = document.getElementById('note-icon');
    const taskListEl = document.getElementById('task-list');
    const clearAllBtn = document.getElementById('clear-all-tasks');
    const addTaskBtn = document.getElementById('add-task-btn');
    const progressBar = document.getElementById('task-progress');
    
    // Fallback to 3 blank items if no history exists
    let tasks = JSON.parse(localStorage.getItem('ytEnhancerTasks'));
    if (!tasks || tasks.length === 0) {
        tasks = [
            { text: '', completed: false },
            { text: '', completed: false },
            { text: '', completed: false }
        ];
    }

    function renderTasks() {
        taskListEl.innerHTML = '';
        let completedCount = 0;
        
        tasks.forEach((task, index) => {
            if (task.completed) completedCount++;
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''} data-index="${index}">
                <input type="text" class="task-text-input" value="${escapeHtml(task.text)}" placeholder="Type a task..." data-index="${index}">
                <button class="delete-task" data-index="${index}" title="Remove Task">×</button>
            `;
            taskListEl.appendChild(li);
        });

        // Update progress bar tracking
        const progressPercent = tasks.length === 0 ? 0 : (completedCount / tasks.length) * 100;
        progressBar.style.width = `${progressPercent}%`;

        // Save current configuration
        localStorage.setItem('ytEnhancerTasks', JSON.stringify(tasks));
    }

    noteIcon.onclick = () => {
        document.body.classList.toggle('show-tasks');
    };

    // Add structural row functionality
    addTaskBtn.onclick = () => {
        tasks.push({ text: '', completed: false });
        renderTasks();
        
        // Auto-focus the fresh row item
        const currentInputs = taskListEl.querySelectorAll('.task-text-input');
        if (currentInputs.length > 0) {
            currentInputs[currentInputs.length - 1].focus();
        }
    };

    // Handle interactive updates cleanly without breaking cursor context focus trees
    taskListEl.oninput = (e) => {
        if (e.target.classList.contains('task-text-input')) {
            const index = e.target.dataset.index;
            tasks[index].text = e.target.value;
            localStorage.setItem('ytEnhancerTasks', JSON.stringify(tasks));
        }
    };

    taskListEl.onclick = (e) => {
        if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
            const index = e.target.dataset.index;
            tasks[index].completed = e.target.checked;
            renderTasks();
        } else if (e.target.classList.contains('delete-task')) {
            const index = e.target.dataset.index;
            tasks.splice(index, 1);
            renderTasks();
        }
    };

    clearAllBtn.onclick = () => {
        if (tasks.length > 0 && confirm('Are you sure you want to clear all tasks?')) {
            tasks = [
                { text: '', completed: false },
                { text: '', completed: false },
                { text: '', completed: false }
            ];
            renderTasks();
        }
    };
    
    // Initial Render execution
    renderTasks();

    // --- Taskbar Pop Animation ---
    const taskbarIcons = document.querySelectorAll('.taskbar-icon');
    
    taskbarIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            icon.classList.add('popping');
            setTimeout(() => icon.classList.remove('popping'), 200);
        });
    });

    // --- Initialization ---
    getDB().then(async (db) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const allBackgrounds = await new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        // Sort by last used and apply the most recent one
        if (allBackgrounds.length > 0) {
            allBackgrounds.sort((a, b) => b.lastUsed - a.lastUsed);
            const mostRecent = allBackgrounds[0];
            
            // Apply background immediately without transition on load
            if (mostRecent.isGitHub) {
                currentBlobUrl = mostRecent.url;
            } else {
                currentBlobUrl = createBlobUrl(mostRecent.blob);
            }
            document.body.style.backgroundImage = `linear-gradient(rgba(26, 21, 44, 0.45), rgba(15, 12, 28, 0.65)), url(${currentBlobUrl})`;
        }
    });
    fetchPresets();
    
    // Load all settings from localStorage
    preferredBreakSelect.value = preferredBreak;
    autoSwitchCheckbox.checked = autoSwitch;
    pomodoroInput.value = pomodoroDuration;
    shortInput.value = shortBreakDuration;
    longInput.value = longBreakDuration;
    
    // Update the mode buttons with saved durations
    document.querySelector('[data-mode=\"pomodoro\"]').dataset.time = pomodoroDuration * 60;
    document.querySelector('[data-mode=\"short\"]').dataset.time = shortBreakDuration * 60;
    document.querySelector('[data-mode=\"long\"]').dataset.time = longBreakDuration * 60;
    
    // Update time display if not running
    if (!isRunning) {
        timeLeft = parseInt(document.querySelector('.mode-btn.active').dataset.time);
        updateDisplay();
    }

    // --- Ambient Mixer Logic ---
    const ambientItems = document.querySelectorAll('.ambient-item');
    
    ambientItems.forEach(item => {
        const slider = item.querySelector('.ambient-slider');
        const audio = item.querySelector('audio');
        
        item.addEventListener('click', (e) => {
            // Prevent toggling if the user is clicking/dragging the slider
            if (e.target === slider) return;
            
            item.classList.toggle('active');
            
            if (item.classList.contains('active')) {
                // Play audio and set volume to slider's current value
                if (audio) {
                    audio.volume = slider.value;
                    audio.play().catch(err => console.log("Audio requires actual file source to play.", err));
                }
            } else {
                // Stop audio
                if (audio) {
                    audio.pause();
                }
            }
        });
        
        // Update volume live as the slider moves
        slider.addEventListener('input', (e) => {
            if (audio) {
                audio.volume = e.target.value;
            }
        });
    });
});