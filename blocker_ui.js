document.addEventListener('DOMContentLoaded', () => {
    // --- Quote Display Logic ---
    const quotes = [
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
        { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
        { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
        { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
        { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
        { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
        { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
        { text: "What we achieve inwardly will change outer reality.", author: "Plutarch" },
        { text: "The mind is everything. What you think you become.", author: "Buddha" },
        { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
        { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
        { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
        { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
        { text: "Everything you can imagine is real.", author: "Pablo Picasso" },
        { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
        { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
        { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
        { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
        { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
        { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
        { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
        { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
        { text: "Act as if what you do makes a difference. It does.", author: "William James" },
        { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" }
    ];

    const quoteText = document.querySelector('.quote-text');
    const quoteAuthor = document.querySelector('.quote-author');
    const quoteDisplay = document.querySelector('.quote-display');
    let currentQuoteIndex = Math.floor(Math.random() * quotes.length);

    function displayQuote() {
        // Get a random quote different from current
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * quotes.length);
        } while (newIndex === currentQuoteIndex && quotes.length > 1);

        currentQuoteIndex = newIndex;
        const quote = quotes[currentQuoteIndex];

        // Slide out old quote to the right
        quoteDisplay.style.transform = 'translateX(100px)';
        quoteDisplay.style.opacity = '0';

        setTimeout(() => {
            // Update quote content
            quoteText.textContent = `"${quote.text}"`;
            quoteAuthor.textContent = `- ${quote.author}`;

            // Slide in new quote from the left
            quoteDisplay.style.transform = 'translateX(-100px)';
            quoteDisplay.style.opacity = '0';

            setTimeout(() => {
                quoteDisplay.style.transform = 'translateX(0)';
                quoteDisplay.style.opacity = '1';
            }, 50);
        }, 300); // Wait for old quote to finish sliding out
    }

    // Display first quote immediately
    const quote = quotes[currentQuoteIndex];
    quoteText.textContent = `"${quote.text}"`;
    quoteAuthor.textContent = `- ${quote.author}`;

    // Cycle through quotes every 5 minutes
    setInterval(displayQuote, 300000);

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
    const musicStoreName = "music";

    function getDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 3);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    const objectStore = db.createObjectStore(storeName, { keyPath: "id" });
                    objectStore.createIndex("lastUsed", "lastUsed", { unique: false });
                }
                if (!db.objectStoreNames.contains(musicStoreName)) {
                    const musicStore = db.createObjectStore(musicStoreName, { keyPath: "id" });
                    musicStore.createIndex("uploadedAt", "uploadedAt", { unique: false });
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

    async function saveMusicFile(blob, id, name) {
        const db = await getDB();
        const tx = db.transaction(musicStoreName, "readwrite");
        const store = tx.objectStore(musicStoreName);
        
        const musicData = {
            id: id,
            blob: blob,
            name: name,
            uploadedAt: Date.now()
        };
        
        store.put(musicData);
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async function deleteMusicFile(id) {
        const db = await getDB();
        const tx = db.transaction(musicStoreName, "readwrite");
        const store = tx.objectStore(musicStoreName);
        store.delete(id);
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async function loadUploadedMusic() {
        try {
            const db = await getDB();
            const tx = db.transaction(musicStoreName, "readonly");
            const store = tx.objectStore(musicStoreName);
            const uploadedMusic = await new Promise((resolve, reject) => {
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            
            // Create new blob URLs for each uploaded file
            return uploadedMusic.map(file => ({
                ...file,
                url: URL.createObjectURL(file.blob)
            }));
        } catch (error) {
            console.error('Error loading uploaded music:', error);
            return [];
        }
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

            // Add scroll functionality if more than 5 rows (15 items with 3 columns)
            if (allBackgrounds.length > 15) {
                bgGallery.style.maxHeight = '480px'; // 5 rows * 80px height + gaps
                bgGallery.style.overflowY = 'auto';
                bgGallery.style.padding = '10px';
            } else {
                bgGallery.style.maxHeight = 'none';
                bgGallery.style.overflowY = 'visible';
                bgGallery.style.padding = '5px';
            }

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

    // Close modal when clicking outside
    settingsModal.onclick = (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('show');
            setTimeout(() => settingsModal.style.display = 'none', 300);
        }
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

    // Close modal when clicking outside
    timerSettingsModal.onclick = (e) => {
        if (e.target === timerSettingsModal) {
            updateModeDurations();
            timerSettingsModal.classList.remove('show');
            setTimeout(() => timerSettingsModal.style.display = 'none', 300);
        }
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
        localStorage.setItem('activePomodoroMode', e.target.dataset.mode);
    });

    // Load saved active pomodoro mode on page load
    const savedActiveMode = localStorage.getItem('activePomodoroMode');
    if (savedActiveMode) {
        modeBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === savedActiveMode) {
                btn.classList.add('active');
                timeLeft = parseInt(btn.dataset.time);
                updateDisplay();
            }
        });
        setTimeout(updateModeIndicator, 100);
    }

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

    // Load saved state from localStorage with priority (apply immediately on load)
    const isMusicCollapsed = localStorage.getItem('musicPlayerCollapsed') === 'true';
    if (isMusicCollapsed) {
        musicContainer.classList.add('collapsed');
        // Disable transition temporarily to prevent animation on load
        musicContainer.style.transition = 'none';
        // Re-enable transition after a short delay
        setTimeout(() => {
            musicContainer.style.transition = '';
        }, 50);
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
                <textarea class="task-text-input" placeholder="Type a task..." data-index="${index}" rows="1"></textarea>
                <button class="delete-task" data-index="${index}" title="Remove Task">×</button>
            `;
            taskListEl.appendChild(li);

            // Set textarea value directly to preserve line breaks
            const textarea = li.querySelector('.task-text-input');
            textarea.value = task.text;
            // Auto-resize textarea after setting value
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
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

            // Auto-resize textarea
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        }
    };

    // Handle Enter and Shift+Enter for task inputs
    taskListEl.onkeydown = (e) => {
        if (e.target.classList.contains('task-text-input')) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const index = parseInt(e.target.dataset.index);
                tasks.push({ text: '', completed: false });
                renderTasks();

                // Auto-focus the fresh row item
                const currentInputs = taskListEl.querySelectorAll('.task-text-input');
                if (currentInputs.length > 0) {
                    currentInputs[currentInputs.length - 1].focus();
                }
            } else if (e.key === 'Backspace' && e.target.value === '') {
                e.preventDefault();
                const index = parseInt(e.target.dataset.index);
                if (index > 0) {
                    tasks.splice(index, 1);
                    renderTasks();

                    // Focus on the previous task and move cursor to end
                    const currentInputs = taskListEl.querySelectorAll('.task-text-input');
                    if (currentInputs.length > 0 && currentInputs[index - 1]) {
                        const prevInput = currentInputs[index - 1];
                        prevInput.focus();
                        prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length);
                    }
                }
            }
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

    // --- Clock Toggle Logic ---
    const clockIcon = document.getElementById('clock-icon');
    const pomodoroDisplay = document.getElementById('pomodoro-display');
    const clockWrapper = document.getElementById('clock-wrapper');
    const clockDisplay = document.getElementById('clock-display');
    const dateDisplay = document.getElementById('date-display');
    const dayPart = document.getElementById('day-part');
    const datePart = document.getElementById('date-part');
    const modeSwitchers = document.querySelector('.mode-switchers');
    const controls = document.querySelector('.controls');
    let isClockMode = localStorage.getItem('clockMode') === 'true';
    let timeModeIndex = parseInt(localStorage.getItem('timeMode')) || 0; // 0: 24h+sec, 1: 12h+sec, 2: 24h-sec, 3: 12h-sec
    let dateFormatIndex = parseInt(localStorage.getItem('dateFormat')) || 0;
    let showDay = localStorage.getItem('showDay') !== 'false';

    // --- Browser Shortcuts Logic ---
    const shortcutModal = document.getElementById('shortcut-modal');
    const shortcutUrlInput = document.getElementById('shortcut-url');
    const saveShortcutBtn = document.getElementById('save-shortcut-btn');
    const cancelShortcutBtn = document.getElementById('cancel-shortcut-btn');
    let currentShortcutIndex = null;
    const browserShortcuts = JSON.parse(localStorage.getItem('browserShortcuts')) || [null, null, null, null];

    // --- Music Search Logic ---
    const searchMusicBtn = document.getElementById('search-music-btn');
    const musicSearchInput = document.getElementById('music-search');
    const searchContainer = document.querySelector('.search-container');
    let allSongs = [];

    searchMusicBtn.addEventListener('click', () => {
        searchContainer.classList.toggle('active');
        if (searchContainer.classList.contains('active')) {
            musicSearchInput.focus();
        }
    });

    musicSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterSongs(searchTerm);
    });

    musicSearchInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (!musicSearchInput.value) {
                searchContainer.classList.remove('active');
            }
        }, 200);
    });

    function filterSongs(searchTerm) {
        const songList = document.getElementById('song-list');
        const songItems = songList.querySelectorAll('.song-item');

        songItems.forEach(item => {
            const songName = item.querySelector('.song-name').textContent.toLowerCase();
            if (songName.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Function to normalize URL
    function normalizeUrl(url) {
        url = url.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        return url;
    }

    // Function to get favicon URL
    function getFaviconUrl(url) {
        try {
            const normalizedUrl = normalizeUrl(url);
            const domain = new URL(normalizedUrl).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch (e) {
            return null;
        }
    }

    // Function to update shortcut icon with favicon
    function updateShortcutIcon(index, url) {
        const shortcutIcon = document.getElementById(`browser-shortcut-${index + 1}`);
        if (!shortcutIcon) return;

        if (url) {
            const normalizedUrl = normalizeUrl(url);
            const faviconUrl = getFaviconUrl(normalizedUrl);
            if (faviconUrl) {
                shortcutIcon.innerHTML = `<img src="${faviconUrl}" alt="favicon" style="width: 24px; height: 24px; border-radius: 4px;">`;
            }
        } else {
            shortcutIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
        }
    }

    // Load saved shortcuts on page load and normalize them
    browserShortcuts.forEach((shortcut, index) => {
        if (shortcut && shortcut.url) {
            // Normalize the URL if it doesn't have a protocol
            const normalizedUrl = normalizeUrl(shortcut.url);
            browserShortcuts[index] = { url: normalizedUrl };
            updateShortcutIcon(index, normalizedUrl);
        }
    });

    // Save normalized shortcuts back to localStorage
    localStorage.setItem('browserShortcuts', JSON.stringify(browserShortcuts));

    // Open shortcut modal when clicking on browser shortcut icons
    document.querySelectorAll('.browser-shortcut').forEach((icon, index) => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            currentShortcutIndex = index;
            const savedShortcut = browserShortcuts[index];

            if (savedShortcut && savedShortcut.url) {
                // Open the website if already configured
                const normalizedUrl = normalizeUrl(savedShortcut.url);
                window.open(normalizedUrl, '_blank');
            } else {
                // Open modal to add new shortcut
                shortcutUrlInput.value = '';
                shortcutModal.style.display = 'flex';
                setTimeout(() => shortcutModal.classList.add('show'), 10);
            }
        });

        // Right-click to edit shortcut
        icon.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentShortcutIndex = index;
            const savedShortcut = browserShortcuts[index];

            if (savedShortcut && savedShortcut.url) {
                // Open modal to edit existing shortcut
                shortcutUrlInput.value = savedShortcut.url;
                shortcutModal.style.display = 'flex';
                setTimeout(() => shortcutModal.classList.add('show'), 10);
            }
        });
    });

    // Save shortcut
    saveShortcutBtn.addEventListener('click', () => {
        const url = shortcutUrlInput.value.trim();
        if (url) {
            const normalizedUrl = normalizeUrl(url);
            browserShortcuts[currentShortcutIndex] = { url: normalizedUrl };
            localStorage.setItem('browserShortcuts', JSON.stringify(browserShortcuts));
            updateShortcutIcon(currentShortcutIndex, normalizedUrl);
        }
        shortcutModal.classList.remove('show');
        setTimeout(() => shortcutModal.style.display = 'none', 300);
    });

    // Save shortcut on Enter key
    shortcutUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const url = shortcutUrlInput.value.trim();
            if (url) {
                const normalizedUrl = normalizeUrl(url);
                browserShortcuts[currentShortcutIndex] = { url: normalizedUrl };
                localStorage.setItem('browserShortcuts', JSON.stringify(browserShortcuts));
                updateShortcutIcon(currentShortcutIndex, normalizedUrl);
            }
            shortcutModal.classList.remove('show');
            setTimeout(() => shortcutModal.style.display = 'none', 300);
        }
    });

    // Cancel shortcut
    cancelShortcutBtn.addEventListener('click', () => {
        shortcutModal.classList.remove('show');
        setTimeout(() => shortcutModal.style.display = 'none', 300);
    });

    // Close modal when clicking outside
    shortcutModal.onclick = (e) => {
        if (e.target === shortcutModal) {
            shortcutModal.classList.remove('show');
            setTimeout(() => shortcutModal.style.display = 'none', 300);
        }
    };

    const dateFormats = [
        // Format 0: Saturday, 30 May 2024
        (now) => {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
        },
        // Format 1: Saturday, May 30 2024
        (now) => {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}`;
        },
        // Format 2: Saturday, 30.05.2024
        (now) => {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            return `${days[now.getDay()]}, ${day}.${month}.${now.getFullYear()}`;
        },
        // Format 3: Saturday, 05.30.2024
        (now) => {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            return `${days[now.getDay()]}, ${month}.${day}.${now.getFullYear()}`;
        }
    ];

    function updateSystemClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        let ampm = '';
        let showSeconds = true;

        // Mode 0: 24h with seconds, Mode 1: 12h with seconds, Mode 2: 24h without seconds, Mode 3: 12h without seconds
        const is24Hour = timeModeIndex === 0 || timeModeIndex === 2;
        showSeconds = timeModeIndex === 0 || timeModeIndex === 1;

        if (!is24Hour) {
            ampm = hours >= 12 ? ' PM' : ' AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
        }

        const hoursStr = String(hours).padStart(2, '0');
        let timeString = `${hoursStr}:${minutes}`;
        if (showSeconds) {
            timeString += `:${seconds}`;
        }
        timeString += ampm;
        clockDisplay.textContent = timeString;

        // Update date display with selected format
        const fullDate = dateFormats[dateFormatIndex](now);
        const parts = fullDate.split(', ');
        dayPart.textContent = parts[0] + ',';
        datePart.textContent = parts.slice(1).join(', ');

        // Show/hide day based on preference
        dayPart.style.display = showDay ? 'inline' : 'none';
        datePart.style.textAlign = showDay ? 'left' : 'center';
    }

    // Update system clock every second
    setInterval(updateSystemClock, 1000);
    updateSystemClock();

    // Apply saved clock/pomodoro mode on page load
    if (isClockMode) {
        pomodoroDisplay.style.display = 'none';
        clockWrapper.style.display = 'flex';
        modeSwitchers.style.display = 'none';
        controls.style.display = 'none';
        clockIcon.title = 'Pomodoro';
    } else {
        pomodoroDisplay.style.display = 'block';
        clockWrapper.style.display = 'none';
        modeSwitchers.style.display = 'flex';
        controls.style.display = 'flex';
        clockIcon.title = 'Clock';
    }

    // Toggle time mode on clock click
    clockDisplay.addEventListener('click', () => {
        timeModeIndex = (timeModeIndex + 1) % 4;
        localStorage.setItem('timeMode', timeModeIndex);
        updateSystemClock();
    });

    // Toggle date format on date click
    datePart.addEventListener('click', () => {
        dateFormatIndex = (dateFormatIndex + 1) % dateFormats.length;
        localStorage.setItem('dateFormat', dateFormatIndex);
        showDay = true;
        localStorage.setItem('showDay', showDay);
        updateSystemClock();
    });

    // Toggle day visibility on day click
    dayPart.addEventListener('click', () => {
        showDay = !showDay;
        localStorage.setItem('showDay', showDay);
        updateSystemClock();
    });

    if (clockIcon) {
        clockIcon.addEventListener('click', () => {
            isClockMode = !isClockMode;
            localStorage.setItem('clockMode', isClockMode);

            // Update tooltip based on mode
            clockIcon.title = isClockMode ? 'Pomodoro' : 'Clock';

            if (isClockMode) {
                // Show clock, hide pomodoro with transition
                pomodoroDisplay.style.transform = 'translateY(-20px)';
                pomodoroDisplay.style.opacity = '0';
                modeSwitchers.style.display = 'none';
                controls.style.display = 'none';

                setTimeout(() => {
                    pomodoroDisplay.style.display = 'none';
                    clockWrapper.style.display = 'flex';
                    clockWrapper.style.transform = 'translateY(20px)';
                    clockWrapper.style.opacity = '0';

                    setTimeout(() => {
                        clockWrapper.style.transform = 'translateY(0)';
                        clockWrapper.style.opacity = '1';
                    }, 50);
                }, 500);
            } else {
                // Show pomodoro, hide clock with transition
                clockWrapper.style.transform = 'translateY(-20px)';
                clockWrapper.style.opacity = '0';

                setTimeout(() => {
                    clockWrapper.style.display = 'none';
                    pomodoroDisplay.style.display = 'block';
                    pomodoroDisplay.style.transform = 'translateY(20px)';
                    pomodoroDisplay.style.opacity = '0';

                    setTimeout(() => {
                        pomodoroDisplay.style.transform = 'translateY(0)';
                        pomodoroDisplay.style.opacity = '1';
                        modeSwitchers.style.display = 'flex';
                        controls.style.display = 'flex';

                        // Update mode buttons to show saved active mode
                        const savedActiveMode = localStorage.getItem('activePomodoroMode');
                        if (savedActiveMode) {
                            modeBtns.forEach(btn => {
                                btn.classList.remove('active');
                                if (btn.dataset.mode === savedActiveMode) {
                                    btn.classList.add('active');
                                    timeLeft = parseInt(btn.dataset.time);
                                    updateDisplay();
                                }
                            });
                            setTimeout(updateModeIndicator, 100);
                        }
                    }, 50);
                }, 500);
            }
        });
    }

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

    // --- GitHub Music Player Logic ---
    const musicAudio = document.getElementById('music-audio');
    const playBtn = document.getElementById('play-btn');
    const forwardBtn = document.getElementById('forward-btn');
    const rewindBtn = document.getElementById('rewind-btn');
    const loopBtn = document.getElementById('loop-btn');
    const songTitle = document.getElementById('song-title');
    const songList = document.getElementById('song-list');
    const uploadMusicBtn = document.getElementById('upload-music-btn');
    const musicUploader = document.getElementById('music-uploader');
    const volumeSlider = document.getElementById('volume-slider');
    const musicProgressBar = document.getElementById('progress-bar');
    
    let musicFiles = [];
    let currentTrackIndex = 0;
    let isPlaying = false;
    let isLooping = false;
    
    // Load hidden songs from localStorage
    let hiddenSongs = JSON.parse(localStorage.getItem('hiddenSongs')) || [];
    
    // Load last played data from localStorage
    let lastPlayedData = JSON.parse(localStorage.getItem('lastPlayed')) || {};
    
    // Load loop state from localStorage
    isLooping = localStorage.getItem('musicLoop') === 'true';
    if (isLooping) {
        loopBtn.classList.add('active');
    }
    
    // Load saved volume from localStorage
    const savedVolume = localStorage.getItem('musicVolume');
    if (savedVolume !== null) {
        musicAudio.volume = parseFloat(savedVolume);
        volumeSlider.value = savedVolume;
    } else {
        musicAudio.volume = 0.8;
        volumeSlider.value = 0.8;
    }
    
    // Volume slider event listener
    volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value;
        musicAudio.volume = volume;
        localStorage.setItem('musicVolume', volume);
    });
    
    // Loop button event listener
    loopBtn.addEventListener('click', () => {
        isLooping = !isLooping;
        musicAudio.loop = isLooping;
        loopBtn.classList.toggle('active', isLooping);
        localStorage.setItem('musicLoop', isLooping);
    });
    
    // Update progress bar as song plays
    musicAudio.addEventListener('timeupdate', () => {
        if (musicAudio.duration) {
            const progress = (musicAudio.currentTime / musicAudio.duration) * 100;
            musicProgressBar.value = progress;
        }
    });
    
    // Seek on progress bar click
    musicProgressBar.addEventListener('input', (e) => {
        const seekTime = (e.target.value / 100) * musicAudio.duration;
        musicAudio.currentTime = seekTime;
    });

    // Fetch music files from GitHub
    async function fetchMusicFiles() {
        try {
            const response = await fetch('https://api.github.com/repos/reapertakumi/YouTube-Study-Enhancer/contents/music');
            const files = await response.json();
            
            // Filter for audio files and get their download URLs
            const githubFiles = files
                .filter(file => file.name.endsWith('.opus'))
                .map(file => ({
                    name: file.name.replace(/\.opus$/, '').replace(/-/g, ' ').replace(/_/g, ' '),
                    url: file.download_url,
                    isUploaded: false,
                    originalName: file.name,
                    lastPlayed: lastPlayedData[file.name] || 0
                }))
                .filter(file => !hiddenSongs.includes(file.originalName));
            
            // Load uploaded music files
            const uploadedFiles = await loadUploadedMusic();
            const uploadedMusic = uploadedFiles.map(file => ({
                name: file.name,
                url: file.url,
                isUploaded: true,
                id: file.id,
                lastPlayed: lastPlayedData[file.id] || 0
            }));
            
            // Combine GitHub and uploaded files
            musicFiles = [...githubFiles, ...uploadedMusic];
            
            // Sort by last played (most recent first)
            musicFiles.sort((a, b) => b.lastPlayed - a.lastPlayed);
            
            if (musicFiles.length > 0) {
                loadTrack(currentTrackIndex);
                populateSongList();
            }
        } catch (error) {
            console.error('Error fetching music files:', error);
            songTitle.textContent = 'Error loading music';
        }
    }

    function populateSongList() {
        songList.innerHTML = '';
        musicFiles.forEach((track, index) => {
            const songItem = document.createElement('div');
            songItem.className = 'song-item';
            songItem.innerHTML = `<span class="song-name">${track.name}</span>`;
            songItem.dataset.index = index;
            
            // Add delete button for all songs
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-song-btn';
            deleteBtn.textContent = '×';
            deleteBtn.title = 'Remove song';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (track.isUploaded) {
                    deleteUploadedSong(track.id, index);
                } else {
                    hideGitHubSong(track.originalName, index);
                }
            });
            songItem.appendChild(deleteBtn);
            
            songItem.addEventListener('click', () => {
                currentTrackIndex = index;
                loadTrack(currentTrackIndex);
                if (!isPlaying) {
                    togglePlay();
                }
            });
            songList.appendChild(songItem);
        });
        updateActiveSong();
    }

    async function deleteUploadedSong(id, index) {
        if (confirm('Are you sure you want to remove this song?')) {
            await deleteMusicFile(id);
            musicFiles.splice(index, 1);
            if (currentTrackIndex >= musicFiles.length) {
                currentTrackIndex = Math.max(0, musicFiles.length - 1);
            }
            if (currentTrackIndex === index) {
                loadTrack(currentTrackIndex);
            }
            populateSongList();
        }
    }

    function hideGitHubSong(originalName, index) {
        if (confirm('Are you sure you want to remove this song?')) {
            hiddenSongs.push(originalName);
            localStorage.setItem('hiddenSongs', JSON.stringify(hiddenSongs));
            musicFiles.splice(index, 1);
            if (currentTrackIndex >= musicFiles.length) {
                currentTrackIndex = Math.max(0, musicFiles.length - 1);
            }
            if (currentTrackIndex === index) {
                loadTrack(currentTrackIndex);
            }
            populateSongList();
        }
    }

    function updateActiveSong() {
        const songItems = songList.querySelectorAll('.song-item');
        songItems.forEach((item, index) => {
            if (index === currentTrackIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function loadTrack(index) {
        if (musicFiles.length === 0) return;
        
        currentTrackIndex = index;
        const track = musicFiles[currentTrackIndex];
        musicAudio.src = track.url;
        songTitle.innerHTML = `<span class="currently-playing-label">Currently playing</span><br>${track.name}`;
        
        // Update last played time
        const songKey = track.isUploaded ? track.id : track.originalName;
        lastPlayedData[songKey] = Date.now();
        localStorage.setItem('lastPlayed', JSON.stringify(lastPlayedData));
        track.lastPlayed = lastPlayedData[songKey];
        
        // Re-sort library by last played (most recent first)
        musicFiles.sort((a, b) => b.lastPlayed - a.lastPlayed);
        
        // Update current index after sorting
        currentTrackIndex = musicFiles.findIndex(t => t === track);
        
        updateActiveSong();
        populateSongList();
        
        if (isPlaying) {
            musicAudio.play().catch(err => console.log('Error playing audio:', err));
        }
    }

    function togglePlay() {
        if (musicFiles.length === 0) return;
        
        if (isPlaying) {
            musicAudio.pause();
            playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
        } else {
            musicAudio.play().catch(err => console.log('Error playing audio:', err));
            playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        }
        isPlaying = !isPlaying;
    }

    function nextTrack() {
        if (musicFiles.length === 0) return;
        currentTrackIndex = (currentTrackIndex + 1) % musicFiles.length;
        loadTrack(currentTrackIndex);
    }

    function previousTrack() {
        if (musicFiles.length === 0) return;
        currentTrackIndex = (currentTrackIndex - 1 + musicFiles.length) % musicFiles.length;
        loadTrack(currentTrackIndex);
    }

    // Auto-play next track when current track ends
    musicAudio.addEventListener('ended', nextTrack);

    // Event listeners for player controls
    if (playBtn) playBtn.addEventListener('click', togglePlay);
    if (forwardBtn) forwardBtn.addEventListener('click', nextTrack);
    if (rewindBtn) rewindBtn.addEventListener('click', previousTrack);

    // Upload button click handler
    if (uploadMusicBtn) {
        uploadMusicBtn.addEventListener('click', () => {
            musicUploader.click();
        });
    }

    // File upload handler
    if (musicUploader) {
        musicUploader.addEventListener('change', async (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                for (const file of files) {
                    const id = 'music_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    await saveMusicFile(file, id, file.name);
                }
                // Refresh the music library
                await fetchMusicFiles();
                // Play the first uploaded song
                currentTrackIndex = musicFiles.length - files.length;
                loadTrack(currentTrackIndex);
                if (!isPlaying) {
                    togglePlay();
                }
                musicUploader.value = '';
            }
        });
    }

    // Initialize music player
    fetchMusicFiles();
});