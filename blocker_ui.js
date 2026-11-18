document.addEventListener("DOMContentLoaded", () => {
  // --- Loading Screen Logic ---
  const loadingScreen = document.getElementById('loading-screen');

  // The first-run loading screen stays up until the page is actually ready
  // (background shown, music list loaded, page resources loaded) instead of
  // a fixed 2 seconds. See the "Initialization" section for what it waits on.
  const loadingText = loadingScreen ? loadingScreen.querySelector('.loading-text') : null;
  const isFirstLoad = !localStorage.getItem('blockerInitialized');
  const LOADING_TIMEOUT_MS = 20000; // never leave the user stuck behind the loader

  if (loadingScreen) {
    loadingScreen.style.display = isFirstLoad ? 'flex' : 'none';
  }

  // Reveal the page (it starts hidden via html.bg-pending). On the first run the
  // loading screen covers everything, so reveal straight away.
  const REVEAL_TIMEOUT_MS = 1500;
  function revealPage() {
    document.documentElement.classList.remove('bg-pending');
  }
  if (isFirstLoad) revealPage();
  else setTimeout(revealPage, REVEAL_TIMEOUT_MS);

  function setLoadingText(text) {
    if (isFirstLoad && loadingText) loadingText.textContent = text;
  }

  let loadingScreenHidden = !isFirstLoad;
  function hideLoadingScreen(completed) {
    if (loadingScreenHidden) return;
    loadingScreenHidden = true;
    // Only remember the first run as done once it actually finished, so an
    // interrupted first load shows the loader again next time.
    if (completed) localStorage.setItem('blockerInitialized', 'true');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }

  // --- Quote Display Logic ---
  const quotes = [
    {
      text: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
    },
    {
      text: "Believe you can and you're halfway there.",
      author: "Theodore Roosevelt",
    },
    {
      text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      author: "Winston Churchill",
    },
    {
      text: "The future belongs to those who believe in the beauty of their dreams.",
      author: "Eleanor Roosevelt",
    },
    {
      text: "It does not matter how slowly you go as long as you do not stop.",
      author: "Confucius",
    },
    {
      text: "Everything you've ever wanted is on the other side of fear.",
      author: "George Addair",
    },
    {
      text: "The only impossible journey is the one you never begin.",
      author: "Tony Robbins",
    },
    {
      text: "Your time is limited, don't waste it living someone else's life.",
      author: "Steve Jobs",
    },
    {
      text: "The best way to predict the future is to create it.",
      author: "Peter Drucker",
    },
    {
      text: "Don't watch the clock; do what it does. Keep going.",
      author: "Sam Levenson",
    },
    {
      text: "The secret of getting ahead is getting started.",
      author: "Mark Twain",
    },
    {
      text: "It always seems impossible until it's done.",
      author: "Nelson Mandela",
    },
    { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
    {
      text: "What we achieve inwardly will change outer reality.",
      author: "Plutarch",
    },
    {
      text: "The mind is everything. What you think you become.",
      author: "Buddha",
    },
    {
      text: "Strive not to be a success, but rather to be of value.",
      author: "Albert Einstein",
    },
    {
      text: "I have not failed. I've just found 10,000 ways that won't work.",
      author: "Thomas Edison",
    },
    {
      text: "A person who never made a mistake never tried anything new.",
      author: "Albert Einstein",
    },
    {
      text: "The only person you are destined to become is the person you decide to be.",
      author: "Ralph Waldo Emerson",
    },
    { text: "Everything you can imagine is real.", author: "Pablo Picasso" },
    {
      text: "In the middle of difficulty lies opportunity.",
      author: "Albert Einstein",
    },
    {
      text: "The only limit to our realization of tomorrow will be our doubts of today.",
      author: "Franklin D. Roosevelt",
    },
    {
      text: "Life is what happens when you're busy making other plans.",
      author: "John Lennon",
    },
    {
      text: "The way to get started is to quit talking and begin doing.",
      author: "Walt Disney",
    },
    {
      text: "Don't be afraid to give up the good to go for the great.",
      author: "John D. Rockefeller",
    },
    {
      text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
      author: "Nelson Mandela",
    },
    {
      text: "If you want to lift yourself up, lift up someone else.",
      author: "Booker T. Washington",
    },
    {
      text: "You are never too old to set another goal or to dream a new dream.",
      author: "C.S. Lewis",
    },
    {
      text: "Act as if what you do makes a difference. It does.",
      author: "William James",
    },
    {
      text: "Success usually comes to those who are too busy to be looking for it.",
      author: "Henry David Thoreau",
    },
  ];

  const quoteText = document.querySelector(".quote-text");
  const quoteAuthor = document.querySelector(".quote-author");
  const quoteDisplay = document.querySelector(".quote-display");
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
    quoteDisplay.style.transform = "translateX(100px)";
    quoteDisplay.style.opacity = "0";

    setTimeout(() => {
      // Update quote content
      quoteText.textContent = `"${quote.text}"`;
      quoteAuthor.textContent = `- ${quote.author}`;

      // Slide in new quote from the left
      quoteDisplay.style.transform = "translateX(-100px)";
      quoteDisplay.style.opacity = "0";

      setTimeout(() => {
        quoteDisplay.style.transform = "translateX(0)";
        quoteDisplay.style.opacity = "1";
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
  const timeDisplay = document.querySelector(".time-display");
  const startBtn = document.getElementById("start-btn");
  const resetBtn = document.getElementById("reset-btn");
  const modeBtns = document.querySelectorAll(".mode-btn");

  // Background Settings Elements
  const settingsBtn = document.getElementById("settings-btn");
  const settingsModal = document.getElementById("settings-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const bgGallery = document.getElementById("bg-gallery");
  const bgUploader = document.getElementById("bg-uploader");

  // Timer Settings Elements
  const timerSettingsBtn = document.getElementById("timer-settings-btn");
  const timerSettingsModal = document.getElementById("timer-settings-modal");
  const closeTimerModal = document.getElementById("close-timer-modal");
  const pomodoroInput = document.getElementById("pomodoro-input");
  const shortInput = document.getElementById("short-input");
  const longInput = document.getElementById("long-input");
  const preferredBreakSelect = document.getElementById("preferred-break");
  const autoSwitchCheckbox = document.getElementById("auto-switch");

  // --- State Variables ---
  let timerId = null;
  let timeLeft = 1500;
  let isRunning = false;
  let currentBlobUrl = null;
  let preferredBreak = localStorage.getItem("preferredBreak") || "short";
  let autoSwitch = localStorage.getItem("autoSwitch") !== "false";
  let pomodoroDuration =
    parseInt(localStorage.getItem("pomodoroDuration")) || 25;
  let shortBreakDuration =
    parseInt(localStorage.getItem("shortBreakDuration")) || 5;
  let longBreakDuration =
    parseInt(localStorage.getItem("longBreakDuration")) || 15;

  // Helper HTML escaper
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // --- Chime Sound ---
  // One shared AudioContext: creating a new one per chime leaks them, and
  // Chrome caps how many can exist at once.
  let sharedAudioContext = null;
  function playChime(frequency = 392) {
    if (!sharedAudioContext) {
      sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const audioContext = sharedAudioContext;
    if (audioContext.state === "suspended") audioContext.resume();

    // Create a chime with specified frequency
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.6,
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
  }

  // --- IndexedDB Management ---
  const dbName = "CozySpaceDB";
  const storeName = "backgrounds";
  const musicStoreName = "music";
  const ambientStoreName = "ambient_sounds";

  function getDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 4);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          const objectStore = db.createObjectStore(storeName, {
            keyPath: "id",
          });
          objectStore.createIndex("lastUsed", "lastUsed", { unique: false });
        }
        if (!db.objectStoreNames.contains(musicStoreName)) {
          const musicStore = db.createObjectStore(musicStoreName, {
            keyPath: "id",
          });
          musicStore.createIndex("uploadedAt", "uploadedAt", { unique: false });
        }
        if (!db.objectStoreNames.contains(ambientStoreName)) {
          const ambientStore = db.createObjectStore(ambientStoreName, {
            keyPath: "id",
          });
          ambientStore.createIndex("cachedAt", "cachedAt", { unique: false });
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
      // Only GitHub presets keep a (remote) URL; blob: URLs die with the page, so
      // persisting them was useless and leaked a URL on every save.
      url: isGitHub ? existing?.url || null : null,
    };

    store.put(backgroundData);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // One object URL per background id, reused across gallery renders / previews
  // (previously every render created new blob URLs that were never revoked).
  const bgUrlCache = new Map();
  function getBackgroundUrl(bg) {
    if (bg.blob) {
      let url = bgUrlCache.get(bg.id);
      if (!url) {
        url = URL.createObjectURL(bg.blob);
        bgUrlCache.set(bg.id, url);
      }
      return url;
    }
    return bg.url;
  }

  async function deleteBackground(id, isGitHub = false) {
    if (isGitHub) rememberDeletedPreset(id);
    const cachedUrl = bgUrlCache.get(id);
    if (cachedUrl && cachedUrl !== currentBlobUrl) {
      URL.revokeObjectURL(cachedUrl);
      bgUrlCache.delete(id);
    }
    const db = await getDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.delete(id);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function handleImageUpload(file) {
    const id = "custom_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    await saveBackground(file, id, false);
    await loadBackgrounds();

    // Switch to custom tab and select the new background
    const customTab = document.querySelector('.bg-tab[data-tab="custom"]');
    if (customTab) {
      customTab.click();
    }
  }

  async function saveMusicFile(blob, id, name) {
    const db = await getDB();
    const tx = db.transaction(musicStoreName, "readwrite");
    const store = tx.objectStore(musicStoreName);

    const musicData = {
      id: id,
      blob: blob,
      name: name,
      uploadedAt: Date.now(),
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
      return uploadedMusic.map((file) => ({
        ...file,
        url: URL.createObjectURL(file.blob),
      }));
    } catch (error) {
      console.error("Error loading uploaded music:", error);
      return [];
    }
  }

  let activePseudo = 1; // Track which pseudo-element is currently active (1 or 2)

  async function applyBackground(backgroundData) {
    // Built-in presets are downloaded the first time they're picked
    try {
      backgroundData = await ensurePresetBlob(backgroundData);
    } catch (e) {
      console.error("Error downloading background:", e);
      return;
    }
    currentBlobUrl = getBackgroundUrl(backgroundData);

    const gradient = 'linear-gradient(rgba(26, 21, 44, 0.45), rgba(15, 12, 28, 0.65))';
    const newBgImage = `${gradient}, url(${currentBlobUrl})`;
    
    // Determine which pseudo-element to use for the transition
    const inactivePseudo = activePseudo === 1 ? 2 : 1;
    
    // Set the new background on the inactive pseudo-element and fade it in
    document.documentElement.style.setProperty(`--bg-image-${inactivePseudo}`, newBgImage);
    document.documentElement.style.setProperty(`--bg-opacity-${inactivePseudo}`, '1');
    
    // Fade out the active pseudo-element
    document.documentElement.style.setProperty(`--bg-opacity-${activePseudo}`, '0');
    
    // Switch active pseudo-element after transition
    setTimeout(() => {
      activePseudo = inactivePseudo;
    }, 500);

    // Update last used timestamp
    await saveBackground(
      backgroundData.blob,
      backgroundData.id,
      backgroundData.isGitHub,
    );

    // Reload gallery to show updated sorting
    loadBackgrounds();
  }

  // --- GitHub Preset Fetching ---
  // Presets are listed from GitHub once (and re-checked weekly for new ones).
  // Only the default preset is downloaded up front; the rest are stored as
  // metadata and downloaded the first time you pick them in the gallery.
  const PRESETS_LISTED_KEY = "presetsListedAt";
  const DELETED_PRESETS_KEY = "deletedPresets";
  const PRESET_RELIST_MS = 7 * 24 * 60 * 60 * 1000;
  const PRESET_FILE_PATTERN = /\.(jpe?g|png|webp)$/i;

  // "comet.jpg" and "comet.webp" are the same preset
  function presetKey(name) {
    return String(name).replace(/\.[^.]+$/, "").toLowerCase();
  }

  function getDeletedPresets() {
    try {
      return new Set(JSON.parse(localStorage.getItem(DELETED_PRESETS_KEY)) || []);
    } catch {
      return new Set();
    }
  }

  function rememberDeletedPreset(id) {
    const deleted = getDeletedPresets();
    deleted.add(presetKey(id));
    localStorage.setItem(DELETED_PRESETS_KEY, JSON.stringify([...deleted]));
  }

  async function getAllBackgrounds() {
    const db = await getDB();
    const tx = db.transaction(storeName, "readonly");
    return new Promise((resolve, reject) => {
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function putBackgrounds(records) {
    const db = await getDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    records.forEach((record) => store.put(record));
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function downloadPresetBlob(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.blob();
  }

  // Make sure a preset's image is stored locally (downloads it on first use).
  async function ensurePresetBlob(bg) {
    if (bg.blob || !bg.isGitHub || !bg.url) return bg;
    const withBlob = { ...bg, blob: await downloadPresetBlob(bg.url) };
    await putBackgrounds([withBlob]);
    return withBlob;
  }

  // Returns { downloaded: true } when the default preset was just downloaded
  // (first run), so the caller can show it.
  async function fetchPresets() {
    const none = { downloaded: false };
    try {
      const all = await getAllBackgrounds();
      const stored = all.filter((bg) => bg.isGitHub);
      const listedAt = parseInt(localStorage.getItem(PRESETS_LISTED_KEY), 10) || 0;

      // Installs from before this change already have every preset downloaded.
      if (!listedAt && stored.length > 0) {
        localStorage.setItem(PRESETS_LISTED_KEY, String(Date.now()));
        return none;
      }

      const firstRun = !listedAt;
      if (!firstRun && Date.now() - listedAt < PRESET_RELIST_MS) return none;

      if (firstRun) setLoadingText("Downloading background...");
      const response = await fetch(
        "https://api.github.com/repos/reapertakumi/YouTube-Study-Enhancer/contents/BG",
      );
      if (!response.ok) return none; // try again next time
      const listing = await response.json();

      // One entry per preset, preferring .webp when both formats exist.
      const byKey = new Map();
      (Array.isArray(listing) ? listing : [])
        .filter((file) => file.type === "file" && PRESET_FILE_PATTERN.test(file.name))
        .forEach((file) => {
          const key = presetKey(file.name);
          const current = byKey.get(key);
          if (!current || /\.webp$/i.test(file.name)) byKey.set(key, file);
        });
      const files = [...byKey.values()];

      const deleted = getDeletedPresets();
      const storedKeys = new Set(stored.map((bg) => presetKey(bg.id)));
      const missing = files.filter((file) => {
        const key = presetKey(file.name);
        return !deleted.has(key) && !storedKeys.has(key);
      });

      const now = Date.now();
      const records = missing.map((file, index) => ({
        id: file.name,
        blob: null,
        isGitHub: true,
        // Newly found presets go after everything already used.
        lastUsed: firstRun ? now - (missing.length - index) : index,
        url: file.download_url,
      }));

      // Presets not downloaded yet should follow renamed files (e.g. .jpg -> .webp),
      // otherwise picking them would hit a link that no longer exists.
      stored.forEach((bg) => {
        const file = byKey.get(presetKey(bg.id));
        if (!bg.blob && file && file.download_url !== bg.url) {
          records.push({ ...bg, url: file.download_url });
        }
      });

      let downloaded = false;
      if (firstRun && records.length > 0) {
        // The last file in the listing has always been the default preset.
        const defaultRecord = records[records.length - 1];
        defaultRecord.blob = await downloadPresetBlob(defaultRecord.url);
        defaultRecord.lastUsed = now;
        downloaded = true;
      }

      if (records.length > 0) await putBackgrounds(records);
      localStorage.setItem(PRESETS_LISTED_KEY, String(now));
      return { downloaded };
    } catch (e) {
      console.error("Error loading presets:", e);
      return none;
    }
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

      // Separate built-in and custom backgrounds
      const builtInBackgrounds = allBackgrounds.filter(bg => bg.isGitHub);
      const customBackgrounds = allBackgrounds.filter(bg => !bg.isGitHub);

      // Load built-in gallery
      const bgGallery = document.getElementById("bg-gallery");
      if (bgGallery) {
        bgGallery.innerHTML = "";
        builtInBackgrounds.forEach((bg) => {
          const option = document.createElement("div");
          option.className = "bg-option";
          option.style.backgroundImage = `url(${getBackgroundUrl(bg)})`;
          option.dataset.id = bg.id;

          option.onclick = async () => {
            await applyBackground(bg);
            updateBackgroundPreview(bg);
          };

          const removeBtn = document.createElement("button");
          removeBtn.className = "remove-bg-btn";
          removeBtn.textContent = "×";
          removeBtn.onclick = async (e) => {
            e.stopPropagation();
            await deleteBackground(bg.id, true);
            await loadBackgrounds();
          };
          option.appendChild(removeBtn);

          bgGallery.appendChild(option);
        });
      }

      // Load custom gallery
      const customBgGallery = document.getElementById("custom-bg-gallery");
      if (customBgGallery) {
        customBgGallery.innerHTML = "";
        customBackgrounds.forEach((bg) => {
          const option = document.createElement("div");
          option.className = "bg-option";
          option.style.backgroundImage = `url(${getBackgroundUrl(bg)})`;
          option.dataset.id = bg.id;

          option.onclick = async () => {
            await applyBackground(bg);
            updateBackgroundPreview(bg);
          };

          const removeBtn = document.createElement("button");
          removeBtn.className = "remove-bg-btn";
          removeBtn.textContent = "×";
          removeBtn.onclick = async (e) => {
            e.stopPropagation();
            await deleteBackground(bg.id);
            await loadBackgrounds();
          };
          option.appendChild(removeBtn);

          customBgGallery.appendChild(option);
        });
      }

      // Update background preview with current background
      if (allBackgrounds.length > 0) {
        updateBackgroundPreview(allBackgrounds[0]);
      }
    } catch (e) {
      console.error("Error loading backgrounds:", e);
    }
  }

  function updateBackgroundPreview(bg) {
    const bgPreview = document.getElementById("bg-preview");
    if (!bgPreview) return;

    bgPreview.style.backgroundImage = `url(${getBackgroundUrl(bg)})`;

    // Update active state in galleries
    document.querySelectorAll(".bg-option").forEach(option => {
      option.classList.remove("active");
      if (option.dataset.id === bg.id) {
        option.classList.add("active");
      }
    });
  }

  // --- Timer Logic ---
  function updateDisplay() {
    const m = Math.floor(timeLeft / 60)
      .toString()
      .padStart(2, "0");
    const s = (timeLeft % 60).toString().padStart(2, "0");
    const timeString = `${m}:${s}`;
    timeDisplay.textContent = timeString;

    if (isRunning) {
      const activeMode = document.querySelector(".mode-btn.active").textContent;
      document.title = `${timeString} - ${activeMode.charAt(0).toUpperCase() + activeMode.slice(1)} Timer`;
    } else {
      document.title = "YT Study Enhancer";
    }
  }

  function startTimer() {
    isRunning = true;
    startBtn.textContent = "pause";
    updateDisplay();

    // Play chime based on mode when starting
    const activeMode = document.querySelector(".mode-btn.active").dataset.mode;
    if (activeMode === "pomodoro") {
      playChime(523.25); // C5 for pomodoro
    } else {
      playChime(392); // G4 for break
    }

    // Count down against a fixed end time: setInterval ticks drift and are
    // throttled in background tabs, which made the timer run slow.
    const endTime = Date.now() + timeLeft * 1000;
    clearInterval(timerId);
    timerId = setInterval(() => {
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      if (remaining > 0) {
        if (remaining !== timeLeft) {
          timeLeft = remaining;
          updateDisplay();
        }
      } else {
        timeLeft = 0;
        clearInterval(timerId);
        isRunning = false;
        startBtn.textContent = "start";
        document.title = "YT Study Enhancer";
        playChime();

        // Always switch to next mode
        const activeMode =
          document.querySelector(".mode-btn.active").dataset.mode;
        if (activeMode === "pomodoro") {
          // Switch to preferred break
          const breakMode = preferredBreak === "short" ? "short" : "long";
          switchMode(breakMode);
        } else {
          // Switch to pomodoro
          switchMode("pomodoro");
        }

        // Auto-start timer if enabled
        if (autoSwitch) {
          startTimer();
        }
      }
    }, 250);
  }

  function pauseTimer() {
    clearInterval(timerId);
    isRunning = false;
    startBtn.textContent = "start";
    updateDisplay();
  }

  function updateModeDurations() {
    // Empty / invalid inputs used to produce NaN and show "NaN:NaN"
    const readMinutes = (input, fallback) => {
      const value = parseInt(input.value, 10);
      const minutes = Number.isFinite(value) && value > 0 ? Math.min(value, 600) : fallback;
      input.value = minutes;
      return minutes;
    };
    if (pomodoroInput) pomodoroDuration = readMinutes(pomodoroInput, pomodoroDuration);
    if (shortInput) shortBreakDuration = readMinutes(shortInput, shortBreakDuration);
    if (longInput) longBreakDuration = readMinutes(longInput, longBreakDuration);

    const pomodoroBtn = document.querySelector('[data-mode="pomodoro"]');
    const shortBtn = document.querySelector('[data-mode="short"]');
    const longBtn = document.querySelector('[data-mode="long"]');
    
    if (pomodoroBtn) pomodoroBtn.dataset.time = pomodoroDuration * 60;
    if (shortBtn) shortBtn.dataset.time = shortBreakDuration * 60;
    if (longBtn) longBtn.dataset.time = longBreakDuration * 60;

    if (preferredBreakSelect) {
      preferredBreak = preferredBreakSelect.value;
      localStorage.setItem("preferredBreak", preferredBreak);
    }
    if (autoSwitchCheckbox) {
      autoSwitch = autoSwitchCheckbox.checked;
      localStorage.setItem("autoSwitch", autoSwitch);
    }

    localStorage.setItem("pomodoroDuration", pomodoroDuration);
    localStorage.setItem("shortBreakDuration", shortBreakDuration);
    localStorage.setItem("longBreakDuration", longBreakDuration);

    if (!isRunning) {
      const activeModeBtn = document.querySelector(".mode-btn.active");
      if (activeModeBtn && activeModeBtn.dataset.time) {
        timeLeft = parseInt(activeModeBtn.dataset.time);
        updateDisplay();
      }
    }
  }

  function switchMode(mode) {
    modeBtns.forEach((btn) => btn.classList.remove("active"));
    const targetBtn = document.querySelector(`[data-mode="${mode}"]`);
    if (targetBtn) {
      targetBtn.classList.add("active");
      timeLeft = parseInt(targetBtn.dataset.time);
      updateDisplay();
      updateModeIndicator(); // Ensures the slider follows the mode change
    }
  }

  // --- Event Listeners ---
  settingsBtn.onclick = () => {
    settingsModal.style.display = "flex";
    setTimeout(() => settingsModal.classList.add("show"), 10);
    loadBackgrounds();
  };
  closeModalBtn.onclick = () => {
    settingsModal.classList.remove("show");
    setTimeout(() => (settingsModal.style.display = "none"), 300);
  };

  // Close modal when clicking outside
  settingsModal.onclick = (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove("show");
      setTimeout(() => (settingsModal.style.display = "none"), 300);
    }
  };

  // Background tab switching
  const bgTabs = document.querySelectorAll(".bg-tab");
  const bgTabContents = document.querySelectorAll(".bg-tab-content");

  if (bgTabs.length > 0) {
    bgTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const targetTab = tab.dataset.tab;

        // Update active tab
        bgTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        // Show corresponding content
        bgTabContents.forEach(content => {
          content.style.display = "none";
        });
        const targetContent = document.getElementById(`${targetTab}-tab`);
        if (targetContent) {
          targetContent.style.display = "block";
        }
      });
    });
  }

  // Upload area click handler
  const uploadArea = document.getElementById("upload-area");
  if (uploadArea && bgUploader) {
    uploadArea.addEventListener("click", () => {
      bgUploader.click();
    });

    // Drag and drop handling
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "rgba(255, 255, 255, 0.6)";
      uploadArea.style.background = "rgba(255, 255, 255, 0.08)";
    });

    uploadArea.addEventListener("dragleave", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "";
      uploadArea.style.background = "";
    });

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "";
      uploadArea.style.background = "";

      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith("image/")) {
        handleImageUpload(files[0]);
      }
    });
  }

  // Background uploader change handler
  if (bgUploader) {
    bgUploader.addEventListener("change", async (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        await handleImageUpload(files[0]);
        bgUploader.value = "";
      }
    });
  }

  // --- Quote and Shortcuts Toggle Settings ---
  const enableQuotesCheckbox = document.getElementById("enable-quotes");
  const enableShortcutsCheckbox = document.getElementById("enable-shortcuts");

  // Load saved settings
  const enableQuotes = localStorage.getItem("enableQuotes") !== "false";
  const enableShortcuts = localStorage.getItem("enableShortcuts") !== "false";

  // Apply saved settings on load
  if (enableQuotesCheckbox) {
    enableQuotesCheckbox.checked = enableQuotes;
    if (!enableQuotes && quoteDisplay) {
      quoteDisplay.style.display = "none";
    }
  }

  if (enableShortcutsCheckbox) {
    enableShortcutsCheckbox.checked = enableShortcuts;
    if (!enableShortcuts) {
      document.querySelectorAll(".browser-shortcut").forEach((shortcut) => {
        shortcut.style.display = "none";
      });
    }
  }

  // Handle quotes toggle
  if (enableQuotesCheckbox) {
    enableQuotesCheckbox.addEventListener("change", () => {
      const isEnabled = enableQuotesCheckbox.checked;
      localStorage.setItem("enableQuotes", isEnabled);

      if (quoteDisplay) {
        quoteDisplay.style.display = isEnabled ? "block" : "none";
      }
    });
  }

  // Handle shortcuts toggle
  if (enableShortcutsCheckbox) {
    enableShortcutsCheckbox.addEventListener("change", () => {
      const isEnabled = enableShortcutsCheckbox.checked;
      localStorage.setItem("enableShortcuts", isEnabled);

      document.querySelectorAll(".browser-shortcut").forEach((shortcut) => {
        shortcut.style.display = isEnabled ? "flex" : "none";
      });

      // When re-enabling shortcuts, reload the saved shortcut data
      if (isEnabled) {
        const savedShortcuts = JSON.parse(
          localStorage.getItem("browserShortcuts"),
        ) || [
          { url: "https://www.youtube.com" },
          { url: "https://www.wikipedia.org" },
          null,
          null,
        ];

        savedShortcuts.forEach((shortcut, index) => {
          if (shortcut && shortcut.url) {
            updateShortcutIcon(index, shortcut.url);
          }
        });
      }
    });
  }

  // --- Spotify URL Handler ---
  const spotifyUrlInput = document.getElementById("spotify-url-input");
  const loadSpotifyBtn = document.getElementById("load-spotify-btn");
  const clearSpotifyBtn = document.getElementById("clear-spotify-btn");
  const spotifyIframe = document.getElementById("spotify-iframe");
  const spotifyError = document.getElementById("spotify-error");
  const spotifyLoading = document.getElementById("spotify-loading");
  const spotifyHistoryToggle = document.getElementById(
    "spotify-history-toggle",
  );
  const spotifyHistoryDropdown = document.getElementById(
    "spotify-history-dropdown",
  );
  const spotifyHistoryList = document.getElementById("spotify-history-list");
  const clearHistoryBtn = document.getElementById("clear-history-btn");
  const spotifyCollapseBtn = document.getElementById("spotify-collapse-btn");
  const spotifyControlsWrapper = document.querySelector(
    ".spotify-controls-wrapper",
  );
  const collapseIconUp = document.querySelector(".collapse-icon-up");
  const collapseIconDown = document.querySelector(".collapse-icon-down");

  // URL History Management
  const SPOTIFY_HISTORY_KEY = "spotifyUrlHistory";
  const MAX_HISTORY_ITEMS = 10;

  function getSpotifyHistory() {
    try {
      return JSON.parse(localStorage.getItem(SPOTIFY_HISTORY_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveSpotifyHistory(url) {
    let history = getSpotifyHistory();
    // Remove if already exists (to move to top)
    history = history.filter((item) => item.url !== url);
    // Add new item to top
    history.unshift({ url, timestamp: Date.now() });
    // Keep only last MAX_HISTORY_ITEMS
    history = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(SPOTIFY_HISTORY_KEY, JSON.stringify(history));
    renderSpotifyHistory();
  }

  function clearSpotifyHistory() {
    localStorage.removeItem(SPOTIFY_HISTORY_KEY);
    renderSpotifyHistory();
  }

  function renderSpotifyHistory() {
    const history = getSpotifyHistory();
    spotifyHistoryList.innerHTML = "";

    if (history.length === 0) {
      spotifyHistoryList.innerHTML =
        '<div class="history-empty">No recent URLs</div>';
      return;
    }

    history.forEach((item, index) => {
      const historyItem = document.createElement("div");
      historyItem.className = "history-item";
      historyItem.innerHTML = `
                <span class="history-url">${escapeHtml(item.url)}</span>
                <button class="history-load-btn" data-url="${escapeHtml(item.url)}" title="Load this URL">Load</button>
                <button class="history-delete-btn" data-index="${index}" title="Remove">×</button>
            `;
      spotifyHistoryList.appendChild(historyItem);
    });

    // Add event listeners to history items
    spotifyHistoryList.querySelectorAll(".history-load-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        spotifyUrlInput.value = btn.dataset.url;
        loadSpotifyUrl(btn.dataset.url);
      });
    });

    spotifyHistoryList
      .querySelectorAll(".history-delete-btn")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const history = getSpotifyHistory();
          history.splice(parseInt(btn.dataset.index), 1);
          localStorage.setItem(SPOTIFY_HISTORY_KEY, JSON.stringify(history));
          renderSpotifyHistory();
        });
      });
  }

  // URL Validation
  function validateSpotifyUrl(url) {
    if (!url) return { valid: false, error: "Please enter a Spotify URL" };

    const patterns = [
      /^https?:\/\/(open\.)?spotify\.com\/track\/[a-zA-Z0-9]+/,
      /^https?:\/\/(open\.)?spotify\.com\/playlist\/[a-zA-Z0-9]+/,
      /^https?:\/\/(open\.)?spotify\.com\/album\/[a-zA-Z0-9]+/,
      /^https?:\/\/(open\.)?spotify\.com\/artist\/[a-zA-Z0-9]+/,
      /^https?:\/\/(open\.)?spotify\.com\/episode\/[a-zA-Z0-9]+/,
      /^https?:\/\/(open\.)?spotify\.com\/show\/[a-zA-Z0-9]+/,
      /^[a-zA-Z0-9]{22}$/, // Direct ID
    ];

    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return { valid: true };
      }
    }

    return {
      valid: false,
      error:
        "Invalid Spotify URL. Please enter a valid track, playlist, album, artist, podcast, or show URL.",
    };
  }

  // Extract Spotify ID and type from URL
  function extractSpotifyInfo(url) {
    let type = "track";
    let id = "";

    if (url.includes("open.spotify.com/track/")) {
      type = "track";
      id = url.split("track/")[1].split("?")[0];
    } else if (url.includes("open.spotify.com/playlist/")) {
      type = "playlist";
      id = url.split("playlist/")[1].split("?")[0];
    } else if (url.includes("open.spotify.com/album/")) {
      type = "album";
      id = url.split("album/")[1].split("?")[0];
    } else if (url.includes("open.spotify.com/artist/")) {
      type = "artist";
      id = url.split("artist/")[1].split("?")[0];
    } else if (url.includes("open.spotify.com/episode/")) {
      type = "episode";
      id = url.split("episode/")[1].split("?")[0];
    } else if (url.includes("open.spotify.com/show/")) {
      type = "show";
      id = url.split("show/")[1].split("?")[0];
    } else if (/^[a-zA-Z0-9]{22}$/.test(url)) {
      // Direct ID - assume track
      id = url;
    } else {
      // Try to extract from any URL format
      const match = url.match(/spotify\.com\/([^\/]+)\/([a-zA-Z0-9]+)/);
      if (match) {
        type = match[1];
        id = match[2];
      }
    }

    return { type, id };
  }

  // Load Spotify URL
  function loadSpotifyUrl(url) {
    const validation = validateSpotifyUrl(url);

    if (!validation.valid) {
      spotifyError.textContent = validation.error;
      spotifyError.style.display = "block";
      return;
    }

    spotifyError.style.display = "none";
    spotifyLoading.style.display = "flex";
    loadSpotifyBtn.disabled = true;

    const { type, id } = extractSpotifyInfo(url);

    // Update iframe
    spotifyIframe.src = `https://open.spotify.com/embed/${type}/${id}?theme=0`;

    // Save to history
    saveSpotifyHistory(url);

    // Hide loading after a short delay
    setTimeout(() => {
      spotifyLoading.style.display = "none";
      loadSpotifyBtn.disabled = false;
    }, 1000);
  }

  // Collapse/Expand functionality
  function toggleSpotifyControls() {
    const isCollapsed = spotifyControlsWrapper.classList.toggle("collapsed");

    // Toggle icons - when collapsed show up, when expanded show down
    if (isCollapsed) {
      collapseIconUp.style.display = "block";
      collapseIconDown.style.display = "none";
      // Position button above iframe when collapsed
      spotifyCollapseBtn.style.position = "relative";
      spotifyCollapseBtn.style.top = "auto";
      spotifyCollapseBtn.style.right = "auto";
      spotifyCollapseBtn.style.marginBottom = "8px";
      spotifyCollapseBtn.style.marginLeft = "auto";
      spotifyCollapseBtn.style.alignSelf = "flex-end";
    } else {
      collapseIconUp.style.display = "none";
      collapseIconDown.style.display = "block";
      // Position button in top right when expanded
      spotifyCollapseBtn.style.position = "absolute";
      spotifyCollapseBtn.style.top = "8px";
      spotifyCollapseBtn.style.right = "8px";
      spotifyCollapseBtn.style.marginBottom = "0";
      spotifyCollapseBtn.style.marginLeft = "0";
      spotifyCollapseBtn.style.alignSelf = "auto";
    }
  }

  // Always start collapsed
  if (spotifyCollapseBtn && spotifyControlsWrapper) {
    spotifyControlsWrapper.classList.add("collapsed");
    collapseIconUp.style.display = "block";
    collapseIconDown.style.display = "none";
    // Position button above iframe when collapsed
    spotifyCollapseBtn.style.position = "relative";
    spotifyCollapseBtn.style.top = "auto";
    spotifyCollapseBtn.style.right = "auto";
    spotifyCollapseBtn.style.marginBottom = "8px";
    spotifyCollapseBtn.style.marginLeft = "auto";
    spotifyCollapseBtn.style.alignSelf = "flex-end";

    spotifyCollapseBtn.addEventListener("click", toggleSpotifyControls);
  }

  // Event Listeners
  if (loadSpotifyBtn && spotifyUrlInput && spotifyIframe) {
    loadSpotifyBtn.addEventListener("click", () => {
      const url = spotifyUrlInput.value.trim();
      if (url) {
        loadSpotifyUrl(url);
      }
    });

    // Allow pressing Enter to load
    spotifyUrlInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        loadSpotifyBtn.click();
      }
    });

    // Clear button
    if (clearSpotifyBtn) {
      clearSpotifyBtn.addEventListener("click", () => {
        spotifyUrlInput.value = "";
        spotifyError.style.display = "none";
        spotifyUrlInput.focus();
      });
    }

    // History toggle
    if (spotifyHistoryToggle) {
      spotifyHistoryToggle.addEventListener("click", () => {
        const isHidden = spotifyHistoryDropdown.style.display === "none";
        spotifyHistoryDropdown.style.display = isHidden ? "block" : "none";
        if (isHidden) {
          renderSpotifyHistory();
        }
      });
    }

    // Clear history
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener("click", clearSpotifyHistory);
    }

    // Close history dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".spotify-history-container")) {
        spotifyHistoryDropdown.style.display = "none";
      }
    });

    // Initialize history on load
    renderSpotifyHistory();
  }

  if (timerSettingsBtn) {
    timerSettingsBtn.onclick = () => {
      timerSettingsModal.style.display = "flex";
      setTimeout(() => timerSettingsModal.classList.add("show"), 10);
    };
  }
  if (closeTimerModal) {
    closeTimerModal.onclick = () => {
      updateModeDurations();
      timerSettingsModal.classList.remove("show");
      setTimeout(() => (timerSettingsModal.style.display = "none"), 300);
    };
  }

  // Close modal when clicking outside
  if (timerSettingsModal) {
    timerSettingsModal.onclick = (e) => {
      if (e.target === timerSettingsModal) {
        updateModeDurations();
        timerSettingsModal.classList.remove("show");
        setTimeout(() => (timerSettingsModal.style.display = "none"), 300);
      }
    };
  }

  modeBtns.forEach(
    (btn) =>
      (btn.onclick = (e) => {
        if (isRunning) pauseTimer();
        modeBtns.forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        timeLeft = parseInt(e.target.dataset.time);
        updateDisplay();
        updateModeIndicator();
        localStorage.setItem("activePomodoroMode", e.target.dataset.mode);
      }),
  );

  // Load saved active pomodoro mode on page load
  const savedActiveMode = localStorage.getItem("activePomodoroMode");
  if (savedActiveMode) {
    modeBtns.forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.mode === savedActiveMode) {
        btn.classList.add("active");
        timeLeft = parseInt(btn.dataset.time);
        updateDisplay();
      }
    });
    setTimeout(updateModeIndicator, 100);
  }

  function updateModeIndicator() {
    const activeBtn = document.querySelector(".mode-btn.active");
    const indicator = document.querySelector(".mode-indicator");
    if (activeBtn && indicator) {
      indicator.style.width = activeBtn.offsetWidth + "px";
      indicator.style.left = activeBtn.offsetLeft + "px";
    }
  }

  // Initialize indicator position
  setTimeout(updateModeIndicator, 100);

  // Update indicator on window resize
  window.addEventListener("resize", updateModeIndicator);

  // (The old one-liner short-circuited before updateDisplay(), leaving the
  // countdown in the tab title after pausing.)
  startBtn.onclick = () => (isRunning ? pauseTimer() : startTimer());
  resetBtn.onclick = () => {
    clearInterval(timerId);
    isRunning = false;
    startBtn.textContent = "start";
    timeLeft = parseInt(
      document.querySelector(".mode-btn.active").dataset.time,
    );
    updateDisplay();
  };

  // --- Music Tab Functionality ---
  const tabs = document.querySelectorAll(".music-tab");
  const dots = document.querySelectorAll(".tab-dot");

  // --- Music Player Logic ---
  const musicContainer = document.querySelector(".music-player-container");
  const collapseBtn = document.getElementById("collapse-btn");
  const soundIcon = document.getElementById("sound-icon");

  // Load saved state from localStorage with priority (apply immediately on load)
  const isMusicCollapsed =
    localStorage.getItem("musicPlayerCollapsed") === "true";
  if (isMusicCollapsed) {
    musicContainer.classList.add("collapsed");
    // Disable transition temporarily to prevent animation on load
    musicContainer.style.transition = "none";
    // Re-enable transition after a short delay
    setTimeout(() => {
      musicContainer.style.transition = "";
    }, 50);
  }

  function toggleMusicPlayer() {
    musicContainer.classList.toggle("collapsed");
    const isCollapsed = musicContainer.classList.contains("collapsed");

    // Save state to localStorage
    localStorage.setItem("musicPlayerCollapsed", isCollapsed);

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
    collapseBtn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const target = dot.dataset.target;
      const currentActiveTab = document.querySelector(".music-tab.active");
      const targetTab = document.querySelector(
        `.music-tab[data-tab="${target}"]`,
      );

      // If clicking the same tab, do nothing
      if (currentActiveTab === targetTab) return;

      // Determine direction
      const currentTabNum = parseInt(currentActiveTab?.dataset.tab);
      const targetTabNum = parseInt(target);
      const isForward = targetTabNum > currentTabNum;

      // Animate out current tab
      if (currentActiveTab) {
        currentActiveTab.style.opacity = "0";
        currentActiveTab.style.transform = isForward
          ? "translateX(-20px)"
          : "translateX(20px)";
      }

      // Wait for animation to complete, then switch tabs and animate in
      setTimeout(() => {
        tabs.forEach((tab) => {
          tab.classList.remove("active");
          tab.style.opacity = "0";
          tab.style.transform = isForward
            ? "translateX(20px)"
            : "translateX(-20px)";
        });
        dots.forEach((d) => d.classList.remove("active"));

        targetTab.classList.add("active");
        dot.classList.add("active");

        // Animate in new tab
        setTimeout(() => {
          targetTab.style.opacity = "1";
          targetTab.style.transform = "translateX(0)";
        }, 50);
      }, 300);
    });
  });

  // --- Task List Logic ---
  const noteIcon = document.getElementById("note-icon");
  const taskListEl = document.getElementById("task-list");
  const clearAllBtn = document.getElementById("clear-all-tasks");
  const addTaskBtn = document.getElementById("add-task-btn");
  const progressBar = document.getElementById("task-progress");

  if (noteIcon) {
    noteIcon.onclick = () => {
      document.body.classList.toggle("show-tasks");
    };
  }

  if (addTaskBtn) {
    addTaskBtn.onclick = () => {
      tasks.push({ text: "", completed: false });
      renderTasks();

      const currentInputs = taskListEl.querySelectorAll(".task-text-input");
      if (currentInputs.length > 0) {
        currentInputs[currentInputs.length - 1].focus();
      }
    };
  }

  if (clearAllBtn) {
    clearAllBtn.onclick = () => {
      if (
        tasks.length > 0 &&
        confirm("Are you sure you want to clear all tasks?")
      ) {
        tasks = [
          { text: "", completed: false },
          { text: "", completed: false },
          { text: "", completed: false },
        ];
        renderTasks();
      }
    };
  }

  // Fallback to 3 blank items if no history exists
  let tasks = JSON.parse(localStorage.getItem("ytEnhancerTasks"));
  if (!tasks || tasks.length === 0) {
    tasks = [
      { text: "", completed: false },
      { text: "", completed: false },
      { text: "", completed: false },
    ];
  }

  function renderTasks() {
    if (!taskListEl) return;
    taskListEl.innerHTML = "";
    let completedCount = 0;

    tasks.forEach((task, index) => {
      if (task.completed) completedCount++;
      const li = document.createElement("li");
      li.className = `task-item ${task.completed ? "completed" : ""}`;
      li.innerHTML = `
                <input type="checkbox" ${task.completed ? "checked" : ""} data-index="${index}">
                <textarea class="task-text-input" placeholder="Type a task..." data-index="${index}" rows="1"></textarea>
                <button class="delete-task" data-index="${index}" title="Remove Task">×</button>
            `;
      taskListEl.appendChild(li);

      // Set textarea value directly to preserve line breaks
      const textarea = li.querySelector(".task-text-input");
      textarea.value = task.text;
      // Auto-resize textarea after setting value
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    });

    // Update progress bar tracking
    const progressPercent =
      tasks.length === 0 ? 0 : (completedCount / tasks.length) * 100;
    if (progressBar) progressBar.style.width = `${progressPercent}%`;

    // Save current configuration
    localStorage.setItem("ytEnhancerTasks", JSON.stringify(tasks));
  }

  // Handle interactive updates cleanly without breaking cursor context focus trees
  if (taskListEl) {
    taskListEl.oninput = (e) => {
      if (e.target.classList.contains("task-text-input")) {
        const index = e.target.dataset.index;
        tasks[index].text = e.target.value;
        localStorage.setItem("ytEnhancerTasks", JSON.stringify(tasks));

        // Auto-resize textarea
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
      }
    };

    // Handle Enter and Shift+Enter for task inputs
    taskListEl.onkeydown = (e) => {
      if (e.target.classList.contains("task-text-input")) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const index = parseInt(e.target.dataset.index);
          tasks.push({ text: "", completed: false });
          renderTasks();

          // Auto-focus the fresh row item
          const currentInputs = taskListEl.querySelectorAll(".task-text-input");
          if (currentInputs.length > 0) {
            currentInputs[currentInputs.length - 1].focus();
          }
        } else if (e.key === "Backspace" && e.target.value === "") {
          e.preventDefault();
          const index = parseInt(e.target.dataset.index);
          if (index > 0) {
            tasks.splice(index, 1);
            renderTasks();

            // Focus on the previous task and move cursor to end
            const currentInputs = taskListEl.querySelectorAll(".task-text-input");
            if (currentInputs.length > 0 && currentInputs[index - 1]) {
              const prevInput = currentInputs[index - 1];
              prevInput.focus();
              prevInput.setSelectionRange(
                prevInput.value.length,
                prevInput.value.length,
              );
            }
          }
        }
      }
    };

    taskListEl.onclick = (e) => {
      if (e.target.tagName === "INPUT" && e.target.type === "checkbox") {
        const index = e.target.dataset.index;
        tasks[index].completed = e.target.checked;
        renderTasks();
      } else if (e.target.classList.contains("delete-task")) {
        const index = e.target.dataset.index;
        tasks.splice(index, 1);
        renderTasks();
      }
    };
  }

  // Initial Render execution
  renderTasks();

  // --- Taskbar Pop Animation ---
  const taskbarIcons = document.querySelectorAll(".taskbar-icon");

  taskbarIcons.forEach((icon) => {
    icon.addEventListener("click", () => {
      icon.classList.add("popping");
      setTimeout(() => icon.classList.remove("popping"), 200);
    });
  });

  // --- Clock Toggle Logic ---
  const clockIcon = document.getElementById("clock-icon");
  const pomodoroDisplay = document.getElementById("pomodoro-display");
  const clockWrapper = document.getElementById("clock-wrapper");
  const clockDisplay = document.getElementById("clock-display");
  const dateDisplay = document.getElementById("date-display");
  const dayPart = document.getElementById("day-part");
  const datePart = document.getElementById("date-part");
  const modeSwitchers = document.querySelector(".mode-switchers");
  const controls = document.querySelector(".controls");
  let isClockMode = localStorage.getItem("clockMode") === "true";
  let timeModeIndex = parseInt(localStorage.getItem("timeMode")) || 0; // 0: 24h+sec, 1: 12h+sec, 2: 24h-sec, 3: 12h-sec
  let dateFormatIndex = parseInt(localStorage.getItem("dateFormat")) || 0;
  let showDay = localStorage.getItem("showDay") !== "false";

  // --- Browser Shortcuts Logic ---
  const shortcutModal = document.getElementById("shortcut-modal");
  const shortcutUrlInput = document.getElementById("shortcut-url");
  const clearShortcutUrlBtn = document.getElementById("clear-shortcut-url-btn");
  const saveShortcutBtn = document.getElementById("save-shortcut-btn");
  const cancelShortcutBtn = document.getElementById("cancel-shortcut-btn");
  let currentShortcutIndex = null;
  const browserShortcuts = JSON.parse(
    localStorage.getItem("browserShortcuts"),
  ) || [
    { url: "https://www.youtube.com" },
    { url: "https://www.wikipedia.org" },
    null,
    null,
  ];

  // Tooltip Logic - Show once, never show again after closing
  const shortcutTooltip = document.getElementById("shortcut-tooltip");
  const tooltipCloseBtn = document.getElementById("tooltip-close-btn");
  const TOOLTIP_CLOSED_KEY = "shortcutTooltipClosed";

  function showTooltipOnce() {
    const hasBeenClosed = localStorage.getItem(TOOLTIP_CLOSED_KEY) === "true";
    if (!hasBeenClosed && shortcutTooltip) {
      shortcutTooltip.classList.add("visible");
    }
  }

  function closeTooltipPermanently() {
    if (shortcutTooltip) {
      shortcutTooltip.classList.remove("visible");
      localStorage.setItem(TOOLTIP_CLOSED_KEY, "true");
    }
  }

  // Close button functionality
  if (tooltipCloseBtn) {
    tooltipCloseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTooltipPermanently();
    });
  }

  // Show tooltip after a short delay
  setTimeout(showTooltipOnce, 1000);

  // --- Music Search Logic ---
  const searchMusicBtn = document.getElementById("search-music-btn");
  const musicSearchInput = document.getElementById("music-search");
  const searchContainer = document.querySelector(".search-container");
  let allSongs = [];

  searchMusicBtn.addEventListener("click", () => {
    searchContainer.classList.toggle("active");
    if (searchContainer.classList.contains("active")) {
      musicSearchInput.focus();
    }
  });

  musicSearchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterSongs(searchTerm);
  });

  musicSearchInput.addEventListener("blur", () => {
    setTimeout(() => {
      if (!musicSearchInput.value) {
        searchContainer.classList.remove("active");
      }
    }, 200);
  });

  function filterSongs(searchTerm) {
    const songList = document.getElementById("song-list");
    const songItems = songList.querySelectorAll(".song-item");

    songItems.forEach((item) => {
      const songName = item
        .querySelector(".song-name")
        .textContent.toLowerCase();
      if (songName.includes(searchTerm)) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });
  }

  // Function to normalize URL
  function normalizeUrl(url) {
    url = url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
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
    const shortcutIcon = document.getElementById(
      `browser-shortcut-${index + 1}`,
    );
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
  localStorage.setItem("browserShortcuts", JSON.stringify(browserShortcuts));

  // Open shortcut modal when clicking on browser shortcut icons
  document.querySelectorAll(".browser-shortcut").forEach((icon, index) => {
    icon.addEventListener("click", (e) => {
      e.stopPropagation();
      currentShortcutIndex = index;
      const savedShortcut = browserShortcuts[index];

      if (savedShortcut && savedShortcut.url) {
        // Open the website if already configured
        const normalizedUrl = normalizeUrl(savedShortcut.url);
        window.open(normalizedUrl, "_blank");
      } else {
        // Open modal to add new shortcut
        shortcutUrlInput.value = "";
        shortcutModal.style.display = "flex";
        setTimeout(() => shortcutModal.classList.add("show"), 10);
      }
    });

    // Right-click to edit shortcut
    icon.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentShortcutIndex = index;
      const savedShortcut = browserShortcuts[index];

      if (savedShortcut && savedShortcut.url) {
        // Open modal to edit existing shortcut
        shortcutUrlInput.value = savedShortcut.url;
        shortcutModal.style.display = "flex";
        setTimeout(() => shortcutModal.classList.add("show"), 10);
      }
    });
  });

  // Save shortcut
  saveShortcutBtn.addEventListener("click", () => {
    const url = shortcutUrlInput.value.trim();
    if (url) {
      const normalizedUrl = normalizeUrl(url);
      browserShortcuts[currentShortcutIndex] = { url: normalizedUrl };
      localStorage.setItem(
        "browserShortcuts",
        JSON.stringify(browserShortcuts),
      );
      updateShortcutIcon(currentShortcutIndex, normalizedUrl);
    } else {
      // Clear shortcut if URL is empty
      browserShortcuts[currentShortcutIndex] = null;
      localStorage.setItem(
        "browserShortcuts",
        JSON.stringify(browserShortcuts),
      );
      updateShortcutIcon(currentShortcutIndex, null);
    }
    shortcutModal.classList.remove("show");
    setTimeout(() => (shortcutModal.style.display = "none"), 300);
  });

  // Save shortcut on Enter key
  shortcutUrlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const url = shortcutUrlInput.value.trim();
      if (url) {
        const normalizedUrl = normalizeUrl(url);
        browserShortcuts[currentShortcutIndex] = { url: normalizedUrl };
        localStorage.setItem(
          "browserShortcuts",
          JSON.stringify(browserShortcuts),
        );
        updateShortcutIcon(currentShortcutIndex, normalizedUrl);
      } else {
        // Clear shortcut if URL is empty
        browserShortcuts[currentShortcutIndex] = null;
        localStorage.setItem(
          "browserShortcuts",
          JSON.stringify(browserShortcuts),
        );
        updateShortcutIcon(currentShortcutIndex, null);
      }
      shortcutModal.classList.remove("show");
      setTimeout(() => (shortcutModal.style.display = "none"), 300);
    }
  });

  // Cancel shortcut
  cancelShortcutBtn.addEventListener("click", () => {
    shortcutModal.classList.remove("show");
    setTimeout(() => (shortcutModal.style.display = "none"), 300);
  });

  // Clear shortcut button
  if (clearShortcutUrlBtn) {
    clearShortcutUrlBtn.addEventListener("click", () => {
      shortcutUrlInput.value = "";
      browserShortcuts[currentShortcutIndex] = null;
      localStorage.setItem(
        "browserShortcuts",
        JSON.stringify(browserShortcuts),
      );
      updateShortcutIcon(currentShortcutIndex, null);
      shortcutModal.classList.remove("show");
      setTimeout(() => (shortcutModal.style.display = "none"), 300);
    });
  }

  // Close modal when clicking outside
  shortcutModal.onclick = (e) => {
    if (e.target === shortcutModal) {
      shortcutModal.classList.remove("show");
      setTimeout(() => (shortcutModal.style.display = "none"), 300);
    }
  };

  const dateFormats = [
    // Format 0: Saturday, 30 May 2024
    (now) => {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    },
    // Format 1: Saturday, May 30 2024
    (now) => {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}`;
    },
    // Format 2: Saturday, 30.05.2024
    (now) => {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      return `${days[now.getDay()]}, ${day}.${month}.${now.getFullYear()}`;
    },
    // Format 3: Saturday, 05.30.2024
    (now) => {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      return `${days[now.getDay()]}, ${month}.${day}.${now.getFullYear()}`;
    },
  ];

  function updateSystemClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    let ampm = "";
    let showSeconds = true;

    // Mode 0: 24h with seconds, Mode 1: 12h with seconds, Mode 2: 24h without seconds, Mode 3: 12h without seconds
    const is24Hour = timeModeIndex === 0 || timeModeIndex === 2;
    showSeconds = timeModeIndex === 0 || timeModeIndex === 1;

    if (!is24Hour) {
      ampm = hours >= 12 ? " PM" : " AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
    }

    const hoursStr = String(hours).padStart(2, "0");
    let timeString = `${hoursStr}:${minutes}`;
    if (showSeconds) {
      timeString += `:${seconds}`;
    }
    timeString += ampm;
    clockDisplay.textContent = timeString;

    // Update date display with selected format
    const fullDate = dateFormats[dateFormatIndex](now);
    const parts = fullDate.split(", ");
    dayPart.textContent = parts[0] + ",";
    datePart.textContent = parts.slice(1).join(", ");

    // Show/hide day based on preference
    dayPart.style.display = showDay ? "inline" : "none";
    datePart.style.textAlign = showDay ? "left" : "center";
  }

  // Update system clock every second
  setInterval(updateSystemClock, 1000);
  updateSystemClock();

  // Apply saved clock/pomodoro mode on page load
  if (isClockMode) {
    pomodoroDisplay.style.display = "none";
    clockWrapper.style.display = "flex";
    modeSwitchers.style.display = "none";
    controls.style.display = "none";
    clockIcon.title = "Pomodoro";
  } else {
    pomodoroDisplay.style.display = "block";
    clockWrapper.style.display = "none";
    modeSwitchers.style.display = "flex";
    controls.style.display = "flex";
    clockIcon.title = "Clock";
  }

  // Toggle time mode on clock click
  clockDisplay.addEventListener("click", () => {
    timeModeIndex = (timeModeIndex + 1) % 4;
    localStorage.setItem("timeMode", timeModeIndex);
    updateSystemClock();
  });

  // Toggle date format on date click
  datePart.addEventListener("click", () => {
    dateFormatIndex = (dateFormatIndex + 1) % dateFormats.length;
    localStorage.setItem("dateFormat", dateFormatIndex);
    showDay = true;
    localStorage.setItem("showDay", showDay);
    updateSystemClock();
  });

  // Toggle day visibility on day click
  dayPart.addEventListener("click", () => {
    showDay = !showDay;
    localStorage.setItem("showDay", showDay);
    updateSystemClock();
  });

  if (clockIcon) {
    clockIcon.addEventListener("click", () => {
      isClockMode = !isClockMode;
      localStorage.setItem("clockMode", isClockMode);

      // Update tooltip based on mode
      clockIcon.title = isClockMode ? "Pomodoro" : "Clock";

      if (isClockMode) {
        // Show clock, hide pomodoro with transition
        pomodoroDisplay.style.transform = "translateY(-20px)";
        pomodoroDisplay.style.opacity = "0";
        modeSwitchers.style.display = "none";
        controls.style.display = "none";

        setTimeout(() => {
          pomodoroDisplay.style.display = "none";
          clockWrapper.style.display = "flex";
          clockWrapper.style.transform = "translateY(20px)";
          clockWrapper.style.opacity = "0";

          setTimeout(() => {
            clockWrapper.style.transform = "translateY(0)";
            clockWrapper.style.opacity = "1";
          }, 50);
        }, 500);
      } else {
        // Show pomodoro, hide clock with transition
        clockWrapper.style.transform = "translateY(-20px)";
        clockWrapper.style.opacity = "0";

        setTimeout(() => {
          clockWrapper.style.display = "none";
          pomodoroDisplay.style.display = "block";
          pomodoroDisplay.style.transform = "translateY(20px)";
          pomodoroDisplay.style.opacity = "0";

          setTimeout(() => {
            pomodoroDisplay.style.transform = "translateY(0)";
            pomodoroDisplay.style.opacity = "1";
            modeSwitchers.style.display = "flex";
            controls.style.display = "flex";

            // Update mode buttons to show saved active mode
            const savedActiveMode = localStorage.getItem("activePomodoroMode");
            if (savedActiveMode) {
              modeBtns.forEach((btn) => {
                btn.classList.remove("active");
                if (btn.dataset.mode === savedActiveMode) {
                  btn.classList.add("active");
                  // Only reset timeLeft if timer is not running
                  if (!isRunning) {
                    timeLeft = parseInt(btn.dataset.time);
                  }
                  updateDisplay();
                }
              });
            } else {
              // If no saved mode, default to pomodoro
              modeBtns.forEach((btn) => {
                btn.classList.remove("active");
                if (btn.dataset.mode === "pomodoro") {
                  btn.classList.add("active");
                  // Only reset timeLeft if timer is not running
                  if (!isRunning) {
                    timeLeft = parseInt(btn.dataset.time);
                  }
                  updateDisplay();
                }
              });
            }
            setTimeout(updateModeIndicator, 100);
          }, 50);
        }, 500);
      }
    });
  }

  // --- Initialization ---
  async function applyMostRecentBackground() {
    const db = await getDB();
    const tx = db.transaction(storeName, "readonly");
    const allBackgrounds = await new Promise((resolve, reject) => {
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (allBackgrounds.length === 0) return false;

    allBackgrounds.sort((a, b) => b.lastUsed - a.lastUsed);
    // Falls back to the remote URL if the download fails (e.g. offline)
    const mostRecent = await ensurePresetBlob(allBackgrounds[0]).catch(() => allBackgrounds[0]);
    const url = getBackgroundUrl(mostRecent);

    // Decode before swapping it in, so it appears in one go instead of
    // painting progressively (and so the loader knows it's really ready).
    // Capped: Chrome can defer decoding while the tab is in the background.
    try {
      const img = new Image();
      img.src = url;
      await Promise.race([
        img.decode(),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    } catch (e) {
      // Still apply it; the browser will just render it when it can.
    }

    currentBlobUrl = url;
    const gradient = 'linear-gradient(rgba(26, 21, 44, 0.45), rgba(15, 12, 28, 0.65))';
    document.documentElement.style.setProperty('--bg-image-1', `${gradient}, url(${currentBlobUrl})`);
    document.documentElement.style.setProperty('--bg-opacity-1', '1');
    return true;
  }

  // Apply the saved background straight from IndexedDB. On the first run there
  // is none yet: download the default preset first, show it, and let the other
  // presets keep downloading in the background (the gallery is only rendered
  // when the settings modal opens).
  const backgroundReady = (async () => {
    try {
      if (await applyMostRecentBackground()) {
        // Background is on screen; check GitHub for preset changes (weekly)
        // without holding up the page.
        fetchPresets();
        return;
      }
      const presets = await fetchPresets();
      if (presets.downloaded) {
        setLoadingText("Applying background...");
        await applyMostRecentBackground();
      }
    } catch (e) {
      console.error("Error applying background:", e);
    } finally {
      revealPage();
    }
  })();

  // Load all settings from localStorage
  if (preferredBreakSelect) preferredBreakSelect.value = preferredBreak;
  if (autoSwitchCheckbox) autoSwitchCheckbox.checked = autoSwitch;
  if (pomodoroInput) pomodoroInput.value = pomodoroDuration;
  if (shortInput) shortInput.value = shortBreakDuration;
  if (longInput) longInput.value = longBreakDuration;

  // Update the mode buttons with saved durations
  const pomodoroBtn = document.querySelector('[data-mode="pomodoro"]');
  const shortBtn = document.querySelector('[data-mode="short"]');
  const longBtn = document.querySelector('[data-mode="long"]');
  
  if (pomodoroBtn) pomodoroBtn.dataset.time = pomodoroDuration * 60;
  if (shortBtn) shortBtn.dataset.time = shortBreakDuration * 60;
  if (longBtn) longBtn.dataset.time = longBreakDuration * 60;

  // Update time display if not running
  if (!isRunning) {
    const activeModeBtn = document.querySelector(".mode-btn.active");
    if (activeModeBtn && activeModeBtn.dataset.time) {
      timeLeft = parseInt(activeModeBtn.dataset.time);
      updateDisplay();
    }
  }

  // --- Ambient Mixer Logic ---
  // Ambient page button functionality
  const ambientPageBtns = document.querySelectorAll(".ambient-page-btn");
  const ambientGrids = document.querySelectorAll(".ambient-grid");

  ambientPageBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pageNum = btn.dataset.page;
      
      // Update active button state
      ambientPageBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Show/hide corresponding grid
      ambientGrids.forEach((grid) => {
        if (grid.dataset.page === pageNum) {
          grid.style.display = "grid";
        } else {
          grid.style.display = "none";
        }
      });
    });
  });

  // --- Ambient Sounds ---
  // Sounds are cached in IndexedDB lazily, the first time each one is played.
  // (Previously every sound was downloaded and loaded into memory on page load,
  // defeating preload="none".)
  async function getCachedAmbientBlob(cacheKey) {
    const db = await getDB();
    const tx = db.transaction(ambientStoreName, "readonly");
    return new Promise((resolve, reject) => {
      const req = tx.objectStore(ambientStoreName).get(cacheKey);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => reject(req.error);
    });
  }

  async function cacheAmbientBlob(cacheKey, url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const db = await getDB();
    const tx = db.transaction(ambientStoreName, "readwrite");
    tx.objectStore(ambientStoreName).put({ id: cacheKey, blob, cachedAt: Date.now() });
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function prepareAmbientAudio(item, audio) {
    if (audio.dataset.prepared) return;
    audio.dataset.prepared = "true";
    const label = item.querySelector(".ambient-text");
    if (!label) return; // only the ambient (non-frequency) sounds are cached

    const cacheKey = `ambient_${label.textContent.toLowerCase()}`;
    const remoteSrc = audio.src;
    try {
      const blob = await getCachedAmbientBlob(cacheKey);
      if (blob) {
        audio.src = URL.createObjectURL(blob);
      } else {
        // Play from the network now; store a copy for next time.
        cacheAmbientBlob(cacheKey, remoteSrc).catch((err) =>
          console.error(`Error caching ambient sound ${cacheKey}:`, err),
        );
      }
    } catch (error) {
      console.error(`Error loading cached ambient sound ${cacheKey}:`, error);
    }
  }

  // Page 1 ambient items and page 2 frequency (brainwave) items share the same behaviour
  document.querySelectorAll(".ambient-item, .frequency-item").forEach((item) => {
    const slider = item.querySelector(".ambient-slider");
    const audio = item.querySelector("audio");

    item.addEventListener("click", async (e) => {
      // Prevent toggling if the user is clicking/dragging the slider
      if (e.target === slider) return;

      item.classList.toggle("active");
      if (!audio) return;

      if (item.classList.contains("active")) {
        await prepareAmbientAudio(item, audio);
        if (!item.classList.contains("active")) return; // toggled off meanwhile
        audio.volume = slider.value;
        audio
          .play()
          .catch((err) => console.warn("Audio could not be played.", err));
      } else {
        audio.pause();
      }
    });

    // Update volume live as the slider moves
    if (slider) {
      slider.addEventListener("input", (e) => {
        if (audio) audio.volume = e.target.value;
      });
    }
  });

  // --- Music Player Logic ---
  const musicAudio = document.getElementById("music-audio");
  const playBtn = document.getElementById("play-btn");
  const forwardBtn = document.getElementById("forward-btn");
  const rewindBtn = document.getElementById("rewind-btn");
  const loopBtn = document.getElementById("loop-btn");
  const songTitle = document.getElementById("song-title");
  const songList = document.getElementById("song-list");
  const uploadMusicBtn = document.getElementById("upload-music-btn");
  const musicUploader = document.getElementById("music-uploader");
  const volumeSlider = document.getElementById("volume-slider");
  const musicProgressBar = document.getElementById("progress-bar");

  let musicFiles = [];
  let currentTrackIndex = 0;
  let isPlaying = false;
  let isLooping = false;

  // Load hidden songs from localStorage
  let hiddenSongs = JSON.parse(localStorage.getItem("hiddenSongs")) || [];

  // Load last played data from localStorage
  let lastPlayedData = JSON.parse(localStorage.getItem("lastPlayed")) || {};

  // Load loop state from localStorage
  isLooping = localStorage.getItem("musicLoop") === "true";
  if (isLooping) {
    loopBtn.classList.add("active");
  }
  musicAudio.loop = isLooping; // the saved state was shown but never applied

  // Load saved volume from localStorage
  const savedVolume = localStorage.getItem("musicVolume");
  if (savedVolume !== null) {
    musicAudio.volume = parseFloat(savedVolume);
    volumeSlider.value = savedVolume;
  } else {
    musicAudio.volume = 0.8;
    volumeSlider.value = 0.8;
  }

  // Filled part of a range track (styled via --fill in blocker.css)
  function setRangeFill(input, percent) {
    input.style.setProperty("--fill", `${Math.max(0, Math.min(100, percent))}%`);
  }
  setRangeFill(volumeSlider, volumeSlider.value * 100);

  // Volume slider event listener
  volumeSlider.addEventListener("input", (e) => {
    const volume = e.target.value;
    musicAudio.volume = volume;
    localStorage.setItem("musicVolume", volume);
    setRangeFill(volumeSlider, volume * 100);
  });

  // Loop button event listener
  loopBtn.addEventListener("click", () => {
    isLooping = !isLooping;
    musicAudio.loop = isLooping;
    loopBtn.classList.toggle("active", isLooping);
    localStorage.setItem("musicLoop", isLooping);
  });

  const musicContent = document.querySelector(".music-player-content");
  const timeCurrent = document.getElementById("music-time-current");
  const timeTotal = document.getElementById("music-time-total");
  const libraryCount = document.getElementById("library-count");

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const s = Math.floor(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = String(s % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
  }

  function updateProgressUi() {
    const duration = musicAudio.duration;
    const progress = duration ? (musicAudio.currentTime / duration) * 100 : 0;
    musicProgressBar.value = progress;
    setRangeFill(musicProgressBar, progress);
    if (timeCurrent) timeCurrent.textContent = formatTime(musicAudio.currentTime);
    if (timeTotal) timeTotal.textContent = formatTime(duration);
  }

  // Update progress bar as song plays
  musicAudio.addEventListener("timeupdate", updateProgressUi);
  musicAudio.addEventListener("loadedmetadata", updateProgressUi);
  musicAudio.addEventListener("emptied", updateProgressUi);

  // Equalizer animation on the cover while playing
  musicAudio.addEventListener("play", () => musicContent?.classList.add("is-playing"));
  musicAudio.addEventListener("pause", () => musicContent?.classList.remove("is-playing"));

  // Seek on progress bar click
  musicProgressBar.addEventListener("input", (e) => {
    const seekTime = (e.target.value / 100) * musicAudio.duration;
    if (Number.isFinite(seekTime)) musicAudio.currentTime = seekTime;
    setRangeFill(musicProgressBar, e.target.value);
  });

  // --- Built-in music (from the music/ folder of the GitHub repo) ---
  // File names follow "Artist - Title.opus". New files added to the repo show up
  // automatically. The listing is cached so new tabs don't use up GitHub's
  // limit of 60 API requests per hour.
  const MUSIC_LISTING_URL =
    "https://api.github.com/repos/reapertakumi/YouTube-Study-Enhancer/contents/music";
  const MUSIC_LISTING_CACHE_KEY = "musicListingCache";
  const MUSIC_LISTING_MAX_AGE_MS = 12 * 60 * 60 * 1000;

  async function fetchMusicListing() {
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(MUSIC_LISTING_CACHE_KEY));
    } catch {}
    if (cached && Date.now() - cached.fetchedAt < MUSIC_LISTING_MAX_AGE_MS) {
      return cached.files;
    }
    try {
      const response = await fetch(MUSIC_LISTING_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const listing = await response.json();
      const files = (Array.isArray(listing) ? listing : [])
        .filter((file) => file.type === "file" && /\.(opus|mp3|ogg|m4a|wav)$/i.test(file.name))
        .map((file) => ({ name: file.name, url: file.download_url }));
      localStorage.setItem(
        MUSIC_LISTING_CACHE_KEY,
        JSON.stringify({ files, fetchedAt: Date.now() }),
      );
      return files;
    } catch (err) {
      // Offline or rate-limited: fall back to the last known list
      console.warn("Could not refresh the music list:", err);
      return cached ? cached.files : [];
    }
  }

  // Old GitHub file names -> new names. Files still uploaded under an old name
  // are shown with the new name, and history/favorites/removed songs carry over.
  const RENAMED_MUSIC = {
    "fassounds - good night lofi cozy chill music.opus": "fassounds - Good Night.opus",
    "fassounds - study calm peaceful chill hop.opus": "fassounds - Calm Study.opus",
    "lofi music library - lofi ambient.opus.opus": "Lofi Music Library - Ambient Drift.opus",
    "lofi music library - lofi coffee ambient.opus": "Lofi Music Library - Coffee Shop.opus",
    "lofi music library - lofi rain.opus": "Lofi Music Library - Rainy Window.opus",
    "lofidreams - cozy lofi background music.opus": "LofiDreams - Cozy Corner.opus",
    "lofidreams - lofi jazz.opus": "LofiDreams - Late Night Jazz.opus",
    "mondamusic - chill.opus": "Mondamusic - Easy Chill.opus",
    "mondamusic - girl lofi chill.opus": "Mondamusic - Daydream.opus",
    "mondamusic - lofi.opus": "Mondamusic - Lofi Breeze.opus",
    "sonican - jazzy-love.opus": "Sonican - Jazzy Love.opus",
    "watermello - lofi girl chill.opus": "Watermello - Sunset Chill.opus",
    "watermello - lofi-chill.opus": "Watermello - Slow Morning.opus",
  };

  function canonicalMusicName(fileName) {
    return RENAMED_MUSIC[fileName] || fileName;
  }

  (function migrateRenamedMusic() {
    let changed = false;
    hiddenSongs = hiddenSongs.map((name) => {
      if (RENAMED_MUSIC[name]) changed = true;
      return RENAMED_MUSIC[name] || name;
    });
    Object.entries(RENAMED_MUSIC).forEach(([oldName, newName]) => {
      if (oldName in lastPlayedData) {
        lastPlayedData[newName] = Math.max(lastPlayedData[newName] || 0, lastPlayedData[oldName]);
        delete lastPlayedData[oldName];
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem("hiddenSongs", JSON.stringify(hiddenSongs));
      localStorage.setItem("lastPlayed", JSON.stringify(lastPlayedData));
    }
  })();

  // "Artist - Title.ext" -> { title, artist }
  function parseTrackName(fileName) {
    const base = String(fileName).replace(/\.[a-z0-9]{2,5}$/i, "").trim();
    const sep = base.indexOf(" - ");
    if (sep === -1) return { title: base, artist: "" };
    return { artist: base.slice(0, sep).trim(), title: base.slice(sep + 3).trim() };
  }

  // --- Favorites (pinned to the top of the library) ---
  const FAVORITES_KEY = "favoriteSongs";
  let favoriteSongs;
  try {
    favoriteSongs = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []);
  } catch {
    favoriteSongs = new Set();
  }

  function trackKey(track) {
    return track.isUploaded ? track.id : track.originalName;
  }

  function isFavorite(track) {
    return favoriteSongs.has(trackKey(track));
  }

  // Stable: favorites move to the top, everything else keeps its order
  function pinFavorites(list) {
    return [...list.filter(isFavorite), ...list.filter((t) => !isFavorite(t))];
  }

  function toggleFavorite(track) {
    const key = trackKey(track);
    if (favoriteSongs.has(key)) favoriteSongs.delete(key);
    else favoriteSongs.add(key);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteSongs]));

    const current = musicFiles[currentTrackIndex];
    musicFiles = pinFavorites(musicFiles);
    currentTrackIndex = Math.max(0, musicFiles.indexOf(current));
    populateSongList();
  }

  // Build the library: built-in songs from GitHub + songs the user uploaded
  async function fetchMusicFiles() {
    try {
      const listing = await fetchMusicListing();
      const bundled = listing
        .map((file) => ({ file, key: canonicalMusicName(file.name) }))
        .filter(({ key }) => !hiddenSongs.includes(key))
        .map(({ file, key }) => ({
          ...parseTrackName(key),
          url: file.url,
          isUploaded: false,
          originalName: key, // stable key used for history, favorites and hiding
          lastPlayed: lastPlayedData[key] || 0,
        }));

      const uploadedFiles = await loadUploadedMusic();
      const uploaded = uploadedFiles.map((file) => {
        const parsed = parseTrackName(file.name);
        return {
          title: parsed.title,
          artist: parsed.artist || "Your upload",
          url: file.url,
          isUploaded: true,
          id: file.id,
          lastPlayed: lastPlayedData[file.id] || 0,
        };
      });

      // Release blob URLs from a previous load before replacing them
      musicFiles.forEach((file) => {
        if (file.isUploaded && file.url) URL.revokeObjectURL(file.url);
      });

      // Most recently played first, then favorites pinned on top
      const library = [...bundled, ...uploaded].sort((a, b) => b.lastPlayed - a.lastPlayed);
      musicFiles = pinFavorites(library);

      populateSongList();
      if (musicFiles.length > 0) {
        loadTrack(Math.min(currentTrackIndex, musicFiles.length - 1));
      } else {
        songTitle.textContent = "No music yet";
      }
    } catch (error) {
      console.error("Error loading music:", error);
      songTitle.textContent = "Error loading music";
    }
  }

  const STAR_ICON =
    '<svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2.8l2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.15 6.38 20.1l1.07-6.27L2.9 9.4l6.3-.9z"/></svg>';

  function populateSongList() {
    songList.innerHTML = "";
    if (libraryCount) libraryCount.textContent = musicFiles.length ? String(musicFiles.length) : "";
    if (musicFiles.length === 0) {
      const empty = document.createElement("div");
      empty.className = "song-list-empty";
      empty.textContent = "No songs yet. Use Add to upload your own music.";
      songList.appendChild(empty);
    }
    musicFiles.forEach((track, index) => {
      const favorite = isFavorite(track);
      const songItem = document.createElement("div");
      songItem.className = "song-item" + (favorite ? " favorite" : "");
      songItem.dataset.index = index;

      // Names come from files: build with textContent, never innerHTML
      const nameSpan = document.createElement("span");
      nameSpan.className = "song-name";
      const titleSpan = document.createElement("span");
      titleSpan.className = "song-title-text";
      titleSpan.textContent = track.title;
      nameSpan.appendChild(titleSpan);
      if (track.artist) {
        const artistSpan = document.createElement("span");
        artistSpan.className = "song-artist";
        artistSpan.textContent = track.artist;
        nameSpan.appendChild(artistSpan);
      }
      songItem.appendChild(nameSpan);

      const favoriteBtn = document.createElement("button");
      favoriteBtn.className = "favorite-song-btn" + (favorite ? " active" : "");
      favoriteBtn.title = favorite ? "Remove from favorites" : "Add to favorites";
      favoriteBtn.setAttribute("aria-pressed", String(favorite));
      favoriteBtn.innerHTML = STAR_ICON; // static markup only
      favoriteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(track);
      });
      songItem.appendChild(favoriteBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-song-btn";
      deleteBtn.textContent = "×";
      deleteBtn.title = "Remove song";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (track.isUploaded) {
          deleteUploadedSong(track.id, index);
        } else {
          hideBundledSong(track.originalName, index);
        }
      });
      songItem.appendChild(deleteBtn);

      songItem.addEventListener("click", () => {
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
    if (confirm("Are you sure you want to remove this song?")) {
      await deleteMusicFile(id);
      favoriteSongs.delete(id);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteSongs]));
      removeTrackAt(index);
    }
  }

  function hideBundledSong(originalName, index) {
    if (confirm("Are you sure you want to remove this song?")) {
      hiddenSongs.push(originalName);
      localStorage.setItem("hiddenSongs", JSON.stringify(hiddenSongs));
      removeTrackAt(index);
    }
  }

  function removeTrackAt(index) {
    const wasCurrent = currentTrackIndex === index;
    musicFiles.splice(index, 1);
    if (index < currentTrackIndex) currentTrackIndex--;
    if (currentTrackIndex >= musicFiles.length) {
      currentTrackIndex = Math.max(0, musicFiles.length - 1);
    }
    populateSongList();
    if (wasCurrent && musicFiles.length > 0) loadTrack(currentTrackIndex);
  }

  function updateActiveSong() {
    const songItems = songList.querySelectorAll(".song-item");
    songItems.forEach((item, index) => {
      if (index === currentTrackIndex) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }

  function loadTrack(index) {
    if (musicFiles.length === 0) return;

    currentTrackIndex = index;
    const track = musicFiles[currentTrackIndex];
    musicAudio.src = track.url;
    songTitle.replaceChildren();
    const label = document.createElement("span");
    label.className = "currently-playing-label";
    label.textContent = "Currently playing";
    songTitle.append(label, document.createElement("br"), track.title);
    if (track.artist) {
      const artist = document.createElement("span");
      artist.className = "np-artist";
      artist.textContent = track.artist;
      songTitle.append(artist);
    }

    // Update last played time (used to order the library the next time it loads).
    // The list is NOT re-sorted here: doing so moved the current song to the top,
    // which made "next" bounce between the same two songs forever.
    const songKey = track.isUploaded ? track.id : track.originalName;
    lastPlayedData[songKey] = Date.now();
    localStorage.setItem("lastPlayed", JSON.stringify(lastPlayedData));
    track.lastPlayed = lastPlayedData[songKey];

    updateActiveSong();

    if (isPlaying) {
      musicAudio
        .play()
        .catch((err) => console.warn("Error playing audio:", err));
    }
  }

  function togglePlay() {
    if (musicFiles.length === 0) return;

    if (isPlaying) {
      musicAudio.pause();
      playBtn.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    } else {
      musicAudio
        .play()
        .catch((err) => console.warn("Error playing audio:", err));
      playBtn.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
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
    currentTrackIndex =
      (currentTrackIndex - 1 + musicFiles.length) % musicFiles.length;
    loadTrack(currentTrackIndex);
  }

  // Auto-play next track when current track ends
  musicAudio.addEventListener("ended", nextTrack);

  // Event listeners for player controls
  if (playBtn) playBtn.addEventListener("click", togglePlay);
  if (forwardBtn) forwardBtn.addEventListener("click", nextTrack);
  if (rewindBtn) rewindBtn.addEventListener("click", previousTrack);

  // Upload button click handler
  if (uploadMusicBtn) {
    uploadMusicBtn.addEventListener("click", () => {
      musicUploader.click();
    });
  }

  // File upload handler
  if (musicUploader) {
    musicUploader.addEventListener("change", async (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        let firstId = null;
        for (const file of files) {
          const id =
            "music_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substr(2, 9);
          firstId = firstId || id;
          await saveMusicFile(file, id, file.name);
        }
        // Refresh the music library
        await fetchMusicFiles();
        // Play the first uploaded song
        currentTrackIndex = Math.max(0, musicFiles.findIndex((t) => t.id === firstId));
        loadTrack(currentTrackIndex);
        if (!isPlaying) {
          togglePlay();
        }
        musicUploader.value = "";
      }
    });
  }

  // Initialize music player
  const musicReady = fetchMusicFiles();

  // --- Loading screen: wait for everything ---
  // Background on screen + music list + all page resources (fonts, icons,
  // Spotify embed). Capped so a slow or offline network can't trap the user.
  if (!loadingScreenHidden) {
    const pageLoaded = new Promise((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", resolve, { once: true });
    });
    const timeout = new Promise((resolve) =>
      setTimeout(() => resolve("timeout"), LOADING_TIMEOUT_MS),
    );

    Promise.race([
      Promise.allSettled([backgroundReady, musicReady, pageLoaded]),
      timeout,
    ]).then((result) => hideLoadingScreen(result !== "timeout"));
  }
});
