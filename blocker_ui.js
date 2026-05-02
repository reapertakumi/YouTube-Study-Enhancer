(function() {
  // 30 unique emoji variants for the center icon
  const icons = [
    "🌊", "📚", "🧠", "⏳", "✨", "🎯", "🌀", "⚡", "🔒", "📖", 
    "🕯️", "🌸", "🎧", "🌙", "⭐", "🔥", "💡", "🎨", "🧘", "🌿",
    "🍵", "💎", "🦋", "🌈", "🎵", "🧪", "🔭", "💭", "🌟", "🍃"
  ];
  
  const iconEl = document.getElementById("icon");
  const waveTitleEl = document.getElementById("waveTitle");
  const settingsDiv = document.getElementById("settings");
  const toggleBtn = document.getElementById("settingsToggle");
  const closeBtn = document.getElementById("closeSettings");
  const applyBtn = document.getElementById("applyBtn");

  // Text animation speed buttons
  const speedNone = document.getElementById("speedNone");
  const speedSlow = document.getElementById("speedSlow");
  const speedMedium = document.getElementById("speedMedium");
  const speedFast = document.getElementById("speedFast");

  const toggleLightCheck = document.getElementById("toggleLight");
  const mainColorPicker = document.getElementById("mainColor");
  const secondColorPicker = document.getElementById("secondColor");
  const movementSelect = document.getElementById("movementType");
  const speedSlider = document.getElementById("speedControl");
  const cornerCycleBtn = document.getElementById("cornerBtn");
  const secondLightSettingsPanel = document.getElementById("secondLightSettings");
  const mainPositionSelect = document.getElementById("mainPosition");

  const mainLight = document.querySelector(".light-main");
  const secondLight = document.querySelector(".light-secondary");

  // Light size sliders
  const mainLightSizeSlider = document.getElementById("mainLightSize");
  const secondLightSizeSlider = document.getElementById("secondLightSize");
  const mainLightSizeValue = document.getElementById("mainLightSizeValue");
  const secondLightSizeValue = document.getElementById("secondLightSizeValue");

  // position maps
  const mainPositions = {
    center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
    "top-left": { top: "5%", left: "5%", transform: "translate(0, 0)" },
    "top-right": { top: "5%", left: "95%", transform: "translate(-100%, 0)" },
    "bottom-left": { top: "95%", left: "5%", transform: "translate(0, -100%)" },
    "bottom-right": { top: "95%", left: "95%", transform: "translate(-100%, -100%)" }
  };
  const cornersList = ["top-left", "top-right", "bottom-right", "bottom-left"];
  let currentCornerIdx = 0;

  // Text animation speed mapping (duration in seconds for full wave cycle)
  const textSpeedMap = {
    none: 0,
    slow: 8,
    medium: 4,
    fast: 2
  };

  // state - text animation default is 'none'
  let state = {
    secondLight: false,
    mainColor: "rgb(168, 85, 247)",
    secondColor: "rgb(196, 181, 253)",
    movement: "none",
    speed: 20,
    mainPosition: "center",
    textAnimationSpeed: "none",
    mainLightSize: 400,
    secondLightSize: 800
  };

  // Store original settings when opening settings menu
  let originalSettings = null;

  // Function to update text animation speed - creates traveling wave
  function updateTextAnimationSpeed() {
    const letters = document.querySelectorAll('.wave-letter');
    const speedValue = textSpeedMap[state.textAnimationSpeed];
    
    if (state.textAnimationSpeed === 'none') {
      letters.forEach(letter => {
        letter.style.animation = 'none';
      });
    } else {
      letters.forEach((letter, index) => {
        const delay = index * 0.12;
        letter.style.animation = `waveTravel ${speedValue}s ease-in-out infinite`;
        letter.style.animationDelay = `${delay}s`;
      });
    }
  }

  // Function to update active button state
  function updateActiveSpeedButton() {
    const buttons = [speedNone, speedSlow, speedMedium, speedFast];
    buttons.forEach(btn => btn.classList.remove('active'));
    
    switch(state.textAnimationSpeed) {
      case 'none':
        speedNone.classList.add('active');
        break;
      case 'slow':
        speedSlow.classList.add('active');
        break;
      case 'medium':
        speedMedium.classList.add('active');
        break;
      case 'fast':
        speedFast.classList.add('active');
        break;
    }
  }

  // Function to create wave text - treats "Study Mode" as one continuous sequence
  function createWaveText() {
    const text = "Study Mode";
    const chars = [];
    for (let i = 0; i < text.length; i++) {
      chars.push({
        char: text[i],
        isSpace: text[i] === ' '
      });
    }
    
    waveTitleEl.innerHTML = chars.map((item, index) => {
      if (item.isSpace) {
        return `<span class="wave-space"></span>`;
      }
      return `<span class="wave-letter">${item.char}</span>`;
    }).join('');
    
    updateTextAnimationSpeed();
  }

  // Convert slider value (0-100) to duration in seconds
  function speedToDuration(speedValue) {
    const minDuration = 5;
    const maxDuration = 45;
    const duration = maxDuration - (speedValue / 100) * (maxDuration - minDuration);
    return duration;
  }

  function rgbToHex(rgbStr) {
    if (!rgbStr) return "#a855f7";
    const match = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return "#" + ((1 << 24) + (parseInt(match[1]) << 16) + (parseInt(match[2]) << 8) + parseInt(match[3])).toString(16).slice(1);
    }
    return rgbStr.startsWith('#') ? rgbStr : "#a855f7";
  }

  function hexToRgb(hex) {
    let r = parseInt(hex.slice(1,3), 16);
    let g = parseInt(hex.slice(3,5), 16);
    let b = parseInt(hex.slice(5,7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function setMainPositionUI() {
    const pos = mainPositions[state.mainPosition] || mainPositions.center;
    mainLight.style.top = pos.top;
    mainLight.style.left = pos.left;
    mainLight.style.transform = pos.transform;
  }

  function updateLightSizes() {
    mainLight.style.width = `${state.mainLightSize}px`;
    mainLight.style.height = `${state.mainLightSize}px`;
    secondLight.style.width = `${state.secondLightSize}px`;
    secondLight.style.height = `${state.secondLightSize}px`;
    
    if (mainLightSizeSlider) mainLightSizeSlider.value = state.mainLightSize;
    if (secondLightSizeSlider) secondLightSizeSlider.value = state.secondLightSize;
    if (mainLightSizeValue) mainLightSizeValue.textContent = `${Math.round(state.mainLightSize / 400 * 100)}%`;
    if (secondLightSizeValue) secondLightSizeValue.textContent = `${Math.round(state.secondLightSize / 800 * 100)}%`;
  }

  function ensureOrbitKeyframes() {
    if (!document.querySelector("#dynamicOrbitKeyframe")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "dynamicOrbitKeyframe";
      styleSheet.textContent = `
        @keyframes orbitAroundMain {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(260px) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(260px) rotate(-360deg); }
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }

  function applySecondLightBehavior() {
    if (!state.secondLight) return;
    
    const durationSec = speedToDuration(state.speed);
    const duration = `${durationSec}s`;
    
    secondLight.style.animation = "none";
    secondLight.offsetHeight;
    
    if (state.movement === "none") {
      secondLight.style.animation = "";
      const cornerPos = cornersList[currentCornerIdx];
      const pos = mainPositions[cornerPos];
      if (pos) {
        secondLight.style.top = pos.top;
        secondLight.style.left = pos.left;
        secondLight.style.transform = pos.transform;
      }
      return;
    }
    
    if (state.movement === "bounce") {
      secondLight.style.top = "";
      secondLight.style.left = "";
      secondLight.style.transform = "";
      secondLight.style.animation = `bounceSmooth ${duration} ease-in-out infinite`;
      return;
    }
    
    if (state.movement === "orbit") {
      ensureOrbitKeyframes();
      secondLight.style.top = "50%";
      secondLight.style.left = "50%";
      secondLight.style.transform = "translate(-50%, -50%)";
      secondLight.style.animation = `orbitAroundMain ${duration} linear infinite`;
    }
  }

  function updateSecondLightVisibility() {
    secondLight.style.display = state.secondLight ? "block" : "none";
    secondLightSettingsPanel.classList.toggle("hidden", !state.secondLight);
    cornerCycleBtn.style.display = (state.movement === "none" && state.secondLight) ? "flex" : "none";
  }

  function fullRender() {
    mainLight.style.background = state.mainColor;
    secondLight.style.background = state.secondColor;
    
    toggleLightCheck.checked = state.secondLight;
    mainColorPicker.value = rgbToHex(state.mainColor);
    secondColorPicker.value = rgbToHex(state.secondColor);
    movementSelect.value = state.movement;
    speedSlider.value = state.speed;
    mainPositionSelect.value = state.mainPosition;
    
    updateLightSizes();
    setMainPositionUI();
    updateSecondLightVisibility();
    if (state.secondLight) {
      applySecondLightBehavior();
    } else {
      secondLight.style.animation = "none";
    }
    
    updateActiveSpeedButton();
    updateTextAnimationSpeed();
  }

  function saveToLocal() {
    const toStore = {
      secondLight: state.secondLight,
      mainColor: state.mainColor,
      secondColor: state.secondColor,
      movement: state.movement,
      speed: state.speed,
      mainPosition: state.mainPosition,
      textAnimationSpeed: state.textAnimationSpeed,
      mainLightSize: state.mainLightSize,
      secondLightSize: state.secondLightSize
    };
    localStorage.setItem("studyMode", JSON.stringify(toStore));
  }

  function loadFromLocal() {
    const saved = localStorage.getItem("studyMode");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };
        // Convert old small sizes to new scale if needed
        if (state.mainLightSize && state.mainLightSize < 400 && state.mainLightSize !== 400 && state.mainLightSize > 0) {
          state.mainLightSize = Math.round(state.mainLightSize / 260 * 400);
        }
        if (state.secondLightSize && state.secondLightSize < 800 && state.secondLightSize !== 800 && state.secondLightSize > 0) {
          state.secondLightSize = Math.round(state.secondLightSize / 520 * 800);
        }
        if (state.mainColor && !state.mainColor.startsWith('rgb') && !state.mainColor.startsWith('#')) state.mainColor = "rgb(168, 85, 247)";
        if (state.secondColor && !state.secondColor.startsWith('rgb') && !state.secondColor.startsWith('#')) state.secondColor = "rgb(196, 181, 253)";
        if (typeof state.mainLightSize !== 'number') state.mainLightSize = 400;
        if (typeof state.secondLightSize !== 'number') state.secondLightSize = 800;
      } catch(e) {}
    }
    if (state.mainColor && state.mainColor.startsWith('#')) state.mainColor = hexToRgb(state.mainColor);
    if (state.secondColor && state.secondColor.startsWith('#')) state.secondColor = hexToRgb(state.secondColor);
  }

  function randomIcon() {
    const randomIndex = Math.floor(Math.random() * icons.length);
    iconEl.textContent = icons[randomIndex];
    iconEl.style.transform = "scale(1.2)";
    setTimeout(() => {
      iconEl.style.transform = "scale(1)";
    }, 200);
  }

  // Auto-save settings when they change (only if menu is open)
  function autoSaveSettings() {
    if (settingsDiv && !settingsDiv.classList.contains('hidden')) {
      const hasChanges = (
        state.mainColor !== hexToRgb(mainColorPicker.value) ||
        state.secondColor !== hexToRgb(secondColorPicker.value) ||
        state.movement !== movementSelect.value ||
        state.speed !== Number(speedSlider.value) ||
        state.mainPosition !== mainPositionSelect.value ||
        state.textAnimationSpeed !== (() => {
          if (speedNone.classList.contains('active')) return 'none';
          if (speedSlow.classList.contains('active')) return 'slow';
          if (speedMedium.classList.contains('active')) return 'medium';
          if (speedFast.classList.contains('active')) return 'fast';
          return state.textAnimationSpeed;
        })() ||
        state.mainLightSize !== Number(mainLightSizeSlider?.value) ||
        state.secondLightSize !== Number(secondLightSizeSlider?.value)
      );
      
      if (hasChanges) {
        state.mainColor = hexToRgb(mainColorPicker.value);
        state.secondColor = hexToRgb(secondColorPicker.value);
        state.movement = movementSelect.value;
        state.speed = Number(speedSlider.value);
        state.mainPosition = mainPositionSelect.value;
        if (mainLightSizeSlider) state.mainLightSize = Number(mainLightSizeSlider.value);
        if (secondLightSizeSlider) state.secondLightSize = Number(secondLightSizeSlider.value);
        
        if (speedNone.classList.contains('active')) state.textAnimationSpeed = 'none';
        else if (speedSlow.classList.contains('active')) state.textAnimationSpeed = 'slow';
        else if (speedMedium.classList.contains('active')) state.textAnimationSpeed = 'medium';
        else if (speedFast.classList.contains('active')) state.textAnimationSpeed = 'fast';
        
        saveToLocal();
        fullRender();
      }
    }
  }

  // Text speed button handlers with auto-save
  speedNone.addEventListener("click", () => {
    state.textAnimationSpeed = "none";
    updateActiveSpeedButton();
    updateTextAnimationSpeed();
    autoSaveSettings();
  });

  speedSlow.addEventListener("click", () => {
    state.textAnimationSpeed = "slow";
    updateActiveSpeedButton();
    updateTextAnimationSpeed();
    autoSaveSettings();
  });

  speedMedium.addEventListener("click", () => {
    state.textAnimationSpeed = "medium";
    updateActiveSpeedButton();
    updateTextAnimationSpeed();
    autoSaveSettings();
  });

  speedFast.addEventListener("click", () => {
    state.textAnimationSpeed = "fast";
    updateActiveSpeedButton();
    updateTextAnimationSpeed();
    autoSaveSettings();
  });

  // Event handlers with auto-save
  toggleLightCheck.addEventListener("change", () => {
    state.secondLight = toggleLightCheck.checked;
    updateSecondLightVisibility();
    if (state.secondLight) applySecondLightBehavior();
    else secondLight.style.animation = "none";
    autoSaveSettings();
  });

  movementSelect.addEventListener("change", () => {
    state.movement = movementSelect.value;
    updateSecondLightVisibility();
    if (state.secondLight) applySecondLightBehavior();
    autoSaveSettings();
  });

  speedSlider.addEventListener("input", (e) => {
    state.speed = Number(e.target.value);
    if (state.secondLight && state.movement !== "none") applySecondLightBehavior();
    autoSaveSettings();
  });

  mainPositionSelect.addEventListener("change", () => {
    state.mainPosition = mainPositionSelect.value;
    setMainPositionUI();
    autoSaveSettings();
  });

  mainColorPicker.addEventListener("input", () => {
    autoSaveSettings();
  });

  secondColorPicker.addEventListener("input", () => {
    autoSaveSettings();
  });

  if (mainLightSizeSlider) {
    mainLightSizeSlider.addEventListener("input", (e) => {
      state.mainLightSize = Number(e.target.value);
      mainLightSizeValue.textContent = `${Math.round(state.mainLightSize / 400 * 100)}%`;
      mainLight.style.width = `${state.mainLightSize}px`;
      mainLight.style.height = `${state.mainLightSize}px`;
      autoSaveSettings();
    });
  }

  if (secondLightSizeSlider) {
    secondLightSizeSlider.addEventListener("input", (e) => {
      state.secondLightSize = Number(e.target.value);
      secondLightSizeValue.textContent = `${Math.round(state.secondLightSize / 800 * 100)}%`;
      secondLight.style.width = `${state.secondLightSize}px`;
      secondLight.style.height = `${state.secondLightSize}px`;
      autoSaveSettings();
    });
  }

  applyBtn.addEventListener("click", () => {
    let newMainHex = mainColorPicker.value;
    let newSecondHex = secondColorPicker.value;
    state.mainColor = hexToRgb(newMainHex);
    state.secondColor = hexToRgb(newSecondHex);
    state.movement = movementSelect.value;
    state.speed = Number(speedSlider.value);
    state.mainPosition = mainPositionSelect.value;
    state.secondLight = toggleLightCheck.checked;
    if (mainLightSizeSlider) state.mainLightSize = Number(mainLightSizeSlider.value);
    if (secondLightSizeSlider) state.secondLightSize = Number(secondLightSizeSlider.value);
    
    saveToLocal();
    fullRender();
    settingsDiv.classList.add("hidden");
    randomIcon();
  });

  toggleBtn.addEventListener("click", (e) => {
    const isHidden = settingsDiv.classList.contains("hidden");
    if (isHidden) {
      mainColorPicker.value = rgbToHex(state.mainColor);
      secondColorPicker.value = rgbToHex(state.secondColor);
      movementSelect.value = state.movement;
      speedSlider.value = state.speed;
      toggleLightCheck.checked = state.secondLight;
      mainPositionSelect.value = state.mainPosition;
      if (mainLightSizeSlider) mainLightSizeSlider.value = state.mainLightSize;
      if (secondLightSizeSlider) secondLightSizeSlider.value = state.secondLightSize;
      updateSecondLightVisibility();
    }
    settingsDiv.classList.toggle("hidden");
  });

  closeBtn.addEventListener("click", () => {
    settingsDiv.classList.add("hidden");
  });

  settingsDiv.addEventListener("click", (e) => {
    if (e.target === settingsDiv) {
      settingsDiv.classList.add("hidden");
    }
  });

  // Initialize wave text
  createWaveText();
  
  // Initialize
  loadFromLocal();
  fullRender();
  randomIcon();
  currentCornerIdx = 0;
  if (state.movement === "none" && state.secondLight) applySecondLightBehavior();

  // ===== MUSIC PLAYER =====
  const playlist = [
    { artist: "fassounds", song: "Good Night - Lofi Cozy Chill Music", file: "music/fassounds-good-night-lofi-cozy-chill-music-160166.opus" },
    { artist: "fassounds", song: "Lofi Study - Calm Peaceful Chill Hop", file: "music/fassounds-lofi-study-calm-peaceful-chill-hop-112191.opus" },
    { artist: "lofidreams", song: "Cozy Lofi Background Music", file: "music/lofidreams-cozy-lofi-background-music-457199.opus" },
    { artist: "lofidreams", song: "Lofi Jazz Music", file: "music/lofidreams-lofi-jazz-music-485312.opus" },
    { artist: "lofi_music_library", song: "Coffee Lofi - Chill Lofi Ambient", file: "music/lofi_music_library-coffee-lofi-chill-lofi-ambient-458901.opus" },
    { artist: "lofi_music_library", song: "Lofi Girl - Chill Lofi Beats Lofi Ambient", file: "music/lofi_music_library-lofi-girl-chill-lofi-beats-lofi-ambient-461871.opus" },
    { artist: "lofi_music_library", song: "Lofi Rain - Lofi Music", file: "music/lofi_music_library-lofi-rain-lofi-music-458077.opus" },
    { artist: "mondamusic", song: "Lofi Chill", file: "music/mondamusic-lofi-chill-chill-512854.opus" },
    { artist: "mondamusic", song: "Lofi - Chill Lofi Girl", file: "music/mondamusic-lofi-lofi-chill-lofi-girl-491690.opus" },
    { artist: "mondamusic", song: "Lofi - Lofi Girl Lofi Chill", file: "music/mondamusic-lofi-lofi-girl-lofi-chill-512853.opus" },
    { artist: "sonican", song: "Lo Fi Music Loop - Sentimental Jazzy Love", file: "music/sonican-lo-fi-music-loop-sentimental-jazzy-love-473154.opus" },
    { artist: "watermello", song: "Lofi Chill - Lofi Girl Lofi", file: "music/watermello-lofi-chill-lofi-girl-lofi-488388.opus" },
    { artist: "watermello", song: "Lofi - Lofi Girl Lofi Chill", file: "music/watermello-lofi-lofi-girl-lofi-chill-484610.opus" }
  ];

  let currentTrack = 0;
  let audio = new Audio();
  let isPlaying = false;

  const playPauseBtn = document.getElementById('playPauseBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const timeCurrent = document.getElementById('timeCurrent');
  const timeTotal = document.getElementById('timeTotal');
  const artistNameSpan = document.getElementById('artistName');
  const songNameSpan = document.getElementById('songName');

  function loadTrack(index) {
    const track = playlist[index];
    if (!track) return;
    
    artistNameSpan.textContent = track.artist;
    songNameSpan.textContent = track.song;
    audio.src = track.file;
    audio.load();
    
    progressFill.style.width = '0%';
    timeCurrent.textContent = '0:00';
    
    if (isPlaying) {
      audio.play().catch(e => console.log('Playback error:', e));
    }
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function updateProgress() {
    if (audio.duration && !isNaN(audio.duration)) {
      const percent = (audio.currentTime / audio.duration) * 100;
      progressFill.style.width = `${percent}%`;
      timeCurrent.textContent = formatTime(audio.currentTime);
      timeTotal.textContent = formatTime(audio.duration);
    }
  }

  function seek(e) {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audio.duration) {
      audio.currentTime = percent * audio.duration;
    }
  }

  function togglePlayPause() {
    if (isPlaying) {
      audio.pause();
      playPauseBtn.textContent = '▶';
      isPlaying = false;
    } else {
      audio.play().catch(e => console.log('Playback error:', e));
      playPauseBtn.textContent = '⏸';
      isPlaying = true;
    }
  }

  function nextTrack() {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(currentTrack);
    if (isPlaying) {
      audio.play().catch(e => console.log('Playback error:', e));
    } else {
      audio.play().catch(e => console.log('Playback error:', e));
      isPlaying = true;
      playPauseBtn.textContent = '⏸';
    }
  }

  function prevTrack() {
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrack);
    if (isPlaying) {
      audio.play().catch(e => console.log('Playback error:', e));
    } else {
      audio.play().catch(e => console.log('Playback error:', e));
      isPlaying = true;
      playPauseBtn.textContent = '⏸';
    }
  }

  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('ended', nextTrack);
  audio.addEventListener('canplay', () => {
    timeTotal.textContent = formatTime(audio.duration);
  });

  volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value / 100;
  });

  playPauseBtn.addEventListener('click', togglePlayPause);
  prevBtn.addEventListener('click', prevTrack);
  nextBtn.addEventListener('click', nextTrack);
  progressBar.addEventListener('click', seek);

  audio.volume = 0.7;
  loadTrack(0);
  isPlaying = false;
  playPauseBtn.textContent = '▶';

  // ===== AMBIENT SOUND MIXER WITH LOCAL FILES =====
  const soundBtn = document.getElementById('soundBtn');
  const ambientPopup = document.getElementById('ambientPopup');
  const closeAmbientBtn = document.getElementById('closeAmbientBtn');
  const masterVolumeSlider = document.getElementById('masterVolumeSlider');
  const masterVolumeValue = document.getElementById('masterVolumeValue');
  
  let ambientOpen = false;
  
  const ambientAudios = {
    fireplace: null,
    wind: null,
    nature: null,
    rain: null,
    thunder: null,
    waves: null
  };
  
  const ambientEnabled = {
    fireplace: false,
    wind: false,
    nature: false,
    rain: false,
    thunder: false,
    waves: false
  };
  
  const ambientVolumes = {
    fireplace: 0.5,
    wind: 0.5,
    nature: 0.5,
    rain: 0.5,
    thunder: 0.5,
    waves: 0.5
  };
  
  let masterVolume = 0.7;
  
  const soundFiles = {
    fireplace: 'sounds/fireplace.opus',
    wind: 'sounds/wind.opus',
    nature: 'sounds/bird.opus',
    rain: 'sounds/rain.opus',
    thunder: 'sounds/thunder.opus',
    waves: 'sounds/ocean.opus'
  };
  
  function createAudioElement(soundName) {
    const audioFile = soundFiles[soundName];
    console.log(`Attempting to load: ${audioFile}`);
    
    const audio = new Audio();
    audio.src = audioFile;
    audio.loop = true;
    audio.volume = ambientVolumes[soundName] * masterVolume;
    
    audio.addEventListener('error', (e) => {
      console.error(`Error loading sound ${soundName}:`, e);
      console.log(`Make sure the file exists at: ${audioFile}`);
    });
    
    audio.addEventListener('canplaythrough', () => {
      console.log(`Sound ${soundName} loaded successfully`);
    });
    
    return audio;
  }
  
  soundBtn.addEventListener('click', () => {
    if (ambientOpen) {
      ambientPopup.classList.remove('show');
      ambientOpen = false;
    } else {
      ambientPopup.classList.add('show');
      ambientOpen = true;
      const toolPopup = document.getElementById('toolPopup');
      const pomodoroPopup = document.getElementById('pomodoroPopup');
      if (toolPopup) toolPopup.classList.remove('show');
      if (pomodoroPopup) pomodoroPopup.classList.remove('show');
    }
  });
  
  closeAmbientBtn.addEventListener('click', () => {
    ambientPopup.classList.remove('show');
    ambientOpen = false;
  });
  
  masterVolumeSlider.addEventListener('input', (e) => {
    masterVolume = e.target.value / 100;
    masterVolumeValue.textContent = Math.round(masterVolume * 100) + '%';
    
    for (const [sound, enabled] of Object.entries(ambientEnabled)) {
      if (enabled && ambientAudios[sound]) {
        ambientAudios[sound].volume = ambientVolumes[sound] * masterVolume;
      }
    }
  });
  
  document.querySelectorAll('.ambient-sound-item').forEach(item => {
    const soundName = item.dataset.sound;
    const toggle = item.querySelector('.sound-toggle');
    const volumeSlider = item.querySelector('.sound-volume-slider');
    
    const savedState = localStorage.getItem(`ambient_${soundName}_enabled`);
    const savedVolume = localStorage.getItem(`ambient_${soundName}_volume`);
    
    if (savedState === 'true') {
      ambientEnabled[soundName] = true;
      toggle.classList.add('active');
      volumeSlider.disabled = false;
      const audioElement = createAudioElement(soundName);
      ambientAudios[soundName] = audioElement;
    }
    if (savedVolume) {
      ambientVolumes[soundName] = parseFloat(savedVolume);
      volumeSlider.value = ambientVolumes[soundName] * 100;
      if (ambientAudios[soundName]) {
        ambientAudios[soundName].volume = ambientVolumes[soundName] * masterVolume;
      }
    }
    
    toggle.addEventListener('click', async () => {
      ambientEnabled[soundName] = !ambientEnabled[soundName];
      
      if (ambientEnabled[soundName]) {
        toggle.classList.add('active');
        volumeSlider.disabled = false;
        
        try {
          if (!ambientAudios[soundName]) {
            ambientAudios[soundName] = createAudioElement(soundName);
          }
          
          ambientAudios[soundName].volume = ambientVolumes[soundName] * masterVolume;
          
          const playPromise = ambientAudios[soundName].play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.log(`Playback failed for ${soundName}:`, error);
              setTimeout(() => {
                if (ambientEnabled[soundName] && ambientAudios[soundName]) {
                  ambientAudios[soundName].play().catch(e => console.log('Retry failed:', e));
                }
              }, 100);
            });
          }
        } catch(e) {
          console.log('Error playing sound:', soundName, e);
        }
      } else {
        toggle.classList.remove('active');
        volumeSlider.disabled = true;
        
        if (ambientAudios[soundName]) {
          ambientAudios[soundName].pause();
          ambientAudios[soundName].currentTime = 0;
        }
      }
      
      localStorage.setItem(`ambient_${soundName}_enabled`, ambientEnabled[soundName]);
    });
    
    volumeSlider.addEventListener('input', (e) => {
      const volume = e.target.value / 100;
      ambientVolumes[soundName] = volume;
      localStorage.setItem(`ambient_${soundName}_volume`, volume);
      
      if (ambientEnabled[soundName] && ambientAudios[soundName]) {
        ambientAudios[soundName].volume = volume * masterVolume;
      }
    });
  });
  
  document.addEventListener('click', (e) => {
    if (!soundBtn.contains(e.target) && !ambientPopup.contains(e.target)) {
      ambientPopup.classList.remove('show');
      ambientOpen = false;
    }
  });

  // ===== BOTTOM LEFT ACTION BUTTONS =====
  const toolBtn = document.getElementById('toolBtn');
  const toolPopup = document.getElementById('toolPopup');
  const pomodoroPopup = document.getElementById('pomodoroPopup');
  const toggleTodosBtn = document.getElementById('toggleTodosBtn');
  const pomodoroBtn = document.getElementById('pomodoroBtn');
  const closePomodoroBtn = document.getElementById('closePomodoroBtn');
  const stickyNoteContainer = document.getElementById('stickyNoteContainer');
  const closeStickyBtn = document.getElementById('closeStickyBtn');

  let toolPopupOpen = false;
  let pomodoroOpen = false;

  toolBtn.addEventListener('click', () => {
    if (toolPopupOpen) {
      toolPopup.classList.remove('show');
      toolPopupOpen = false;
    } else {
      toolPopup.classList.add('show');
      toolPopupOpen = true;
    }
  });

  document.addEventListener('click', (e) => {
    if (!toolBtn.contains(e.target) && !toolPopup.contains(e.target)) {
      toolPopup.classList.remove('show');
      toolPopupOpen = false;
    }
  });

  let stickyNoteVisible = false;
  toggleTodosBtn.addEventListener('click', () => {
    if (stickyNoteVisible) {
      stickyNoteContainer.style.display = 'none';
      stickyNoteVisible = false;
    } else {
      stickyNoteContainer.style.display = 'block';
      stickyNoteVisible = true;
      loadStickyPosition();
    }
    toolPopup.classList.remove('show');
    toolPopupOpen = false;
  });

  closeStickyBtn.addEventListener('click', () => {
    stickyNoteContainer.style.display = 'none';
    stickyNoteVisible = false;
  });

  // ===== STICKY NOTE DRAG FUNCTIONALITY =====
  const stickyNote = document.getElementById('stickyNote');
  let isDragging = false;
  let dragStartX, dragStartY;

  function loadStickyPosition() {
    const savedPos = localStorage.getItem('stickyNotePosition');
    if (savedPos) {
      try {
        const pos = JSON.parse(savedPos);
        stickyNoteContainer.style.left = pos.left;
        stickyNoteContainer.style.top = pos.top;
        stickyNoteContainer.style.transform = 'none';
      } catch(e) {}
    }
  }

  function saveStickyPosition() {
    const left = stickyNoteContainer.style.left;
    const top = stickyNoteContainer.style.top;
    if (left && top) {
      localStorage.setItem('stickyNotePosition', JSON.stringify({ left, top }));
    }
  }

  stickyNoteContainer.addEventListener('mousedown', (e) => {
    const isButton = e.target.closest('.note-btn, .add-todo-btn, .delete-todo, .todo-checkbox, .todo-text, .add-todo-input, .pin, .close-sticky-btn');
    if (isButton) return;
    
    isDragging = true;
    stickyNoteContainer.classList.add('dragging');
    stickyNote.classList.add('dragging');
    
    const rect = stickyNoteContainer.getBoundingClientRect();
    dragStartX = e.clientX - rect.left;
    dragStartY = e.clientY - rect.top;
    
    stickyNoteContainer.style.transform = 'none';
    stickyNoteContainer.style.left = rect.left + 'px';
    stickyNoteContainer.style.top = rect.top + 'px';
    
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    let newLeft = e.clientX - dragStartX;
    let newTop = e.clientY - dragStartY;
    
    const containerWidth = stickyNoteContainer.offsetWidth;
    const containerHeight = stickyNoteContainer.offsetHeight;
    newLeft = Math.max(5, Math.min(window.innerWidth - containerWidth - 5, newLeft));
    newTop = Math.max(5, Math.min(window.innerHeight - containerHeight - 5, newTop));
    
    stickyNoteContainer.style.left = newLeft + 'px';
    stickyNoteContainer.style.top = newTop + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      stickyNoteContainer.classList.remove('dragging');
      stickyNote.classList.remove('dragging');
      saveStickyPosition();
    }
  });

  // ===== POMODORO TIMER WITH LOCAL SOUNDS =====
  let pomodoroTime = 25 * 60;
  let pomodoroInterval = null;
  let isPomodoroRunning = false;
  let isFocusPhase = true;
  let isPomodoroDragging = false;
  let pomoDragStartX, pomoDragStartY;
  
  let focusMinutes = 25;
  let breakMinutes = 5;
  
  let chimeAudio = null;

  const pomodoroTimeDisplay = document.getElementById('pomodoroTimeDisplay');
  const pomodoroPhase = document.getElementById('pomodoroPhase');
  const pomodoroStartBtn = document.getElementById('pomodoroStartBtn');
  const pomodoroPauseBtn = document.getElementById('pomodoroPauseBtn');
  const pomodoroResetBtn = document.getElementById('pomodoroResetBtn');
  const pomodoroSettingsIcon = document.getElementById('pomodoroSettingsIcon');
  const pomodoroSettingsPopup = document.getElementById('pomodoroSettingsPopup');
  const focusDurationInput = document.getElementById('focusDurationInput');
  const breakDurationInput = document.getElementById('breakDurationInput');
  const savePomodoroSettings = document.getElementById('savePomodoroSettings');
  const cancelPomodoroSettings = document.getElementById('cancelPomodoroSettings');

  function playChime() {
    try {
      if (chimeAudio) {
        chimeAudio.pause();
        chimeAudio.currentTime = 0;
      }
      chimeAudio = new Audio('sounds/break.opus');
      chimeAudio.volume = 0.6;
      
      const playPromise = chimeAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.log('Chime sound error:', e);
          setTimeout(() => {
            chimeAudio.play().catch(err => console.log('Chime retry failed:', err));
          }, 100);
        });
      }
    } catch(e) {
      console.log('Could not play chime sound:', e);
    }
  }

  function loadPomodoroSettings() {
    const savedFocus = localStorage.getItem('pomodoroFocusMinutes');
    const savedBreak = localStorage.getItem('pomodoroBreakMinutes');
    if (savedFocus) {
      focusMinutes = parseInt(savedFocus);
      if (focusMinutes < 1) focusMinutes = 25;
      if (focusMinutes > 999) focusMinutes = 999;
    }
    if (savedBreak) {
      breakMinutes = parseInt(savedBreak);
      if (breakMinutes < 1) breakMinutes = 5;
      if (breakMinutes > 999) breakMinutes = 999;
    }
    focusDurationInput.value = focusMinutes;
    breakDurationInput.value = breakMinutes;
  }

  function savePomodoroSettingsToLocal() {
    localStorage.setItem('pomodoroFocusMinutes', focusMinutes);
    localStorage.setItem('pomodoroBreakMinutes', breakMinutes);
  }

  function applyPomodoroSettings() {
    focusMinutes = parseInt(focusDurationInput.value);
    breakMinutes = parseInt(breakDurationInput.value);
    
    if (isNaN(focusMinutes) || focusMinutes < 1) focusMinutes = 25;
    if (focusMinutes > 999) focusMinutes = 999;
    if (isNaN(breakMinutes) || breakMinutes < 1) breakMinutes = 5;
    if (breakMinutes > 999) breakMinutes = 999;
    
    savePomodoroSettingsToLocal();
    
    if (!isPomodoroRunning) {
      if (isFocusPhase) {
        pomodoroTime = focusMinutes * 60;
      } else {
        pomodoroTime = breakMinutes * 60;
      }
      updatePomodoroDisplay();
    }
    
    pomodoroSettingsPopup.classList.remove('show');
  }

  function updatePomodoroDisplay() {
    const minutes = Math.floor(pomodoroTime / 60);
    const seconds = pomodoroTime % 60;
    pomodoroTimeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function startPomodoroTimer() {
    if (pomodoroInterval) clearInterval(pomodoroInterval);
    isPomodoroRunning = true;
    pomodoroInterval = setInterval(() => {
      if (pomodoroTime > 0) {
        pomodoroTime--;
        updatePomodoroDisplay();
      } else {
        clearInterval(pomodoroInterval);
        isPomodoroRunning = false;
        
        playChime();
        
        if (isFocusPhase) {
          isFocusPhase = false;
          pomodoroTime = breakMinutes * 60;
          pomodoroPhase.textContent = 'Break Time 🍵';
          pomodoroPhase.style.background = 'rgba(236, 72, 153, 0.2)';
        } else {
          isFocusPhase = true;
          pomodoroTime = focusMinutes * 60;
          pomodoroPhase.textContent = 'Focus Time 📚';
          pomodoroPhase.style.background = 'rgba(168, 85, 247, 0.2)';
        }
        updatePomodoroDisplay();
        startPomodoroTimer();
      }
    }, 1000);
  }

  function pausePomodoroTimer() {
    if (pomodoroInterval) {
      clearInterval(pomodoroInterval);
      pomodoroInterval = null;
      isPomodoroRunning = false;
    }
  }

  function resetPomodoroTimer() {
    pausePomodoroTimer();
    isFocusPhase = true;
    pomodoroTime = focusMinutes * 60;
    pomodoroPhase.textContent = 'Focus Time 📚';
    pomodoroPhase.style.background = 'rgba(168, 85, 247, 0.2)';
    updatePomodoroDisplay();
  }

  pomodoroSettingsIcon.addEventListener('click', () => {
    pomodoroSettingsPopup.classList.add('show');
    focusDurationInput.value = focusMinutes;
    breakDurationInput.value = breakMinutes;
  });

  savePomodoroSettings.addEventListener('click', applyPomodoroSettings);
  
  cancelPomodoroSettings.addEventListener('click', () => {
    pomodoroSettingsPopup.classList.remove('show');
  });

  document.addEventListener('click', (e) => {
    if (!pomodoroSettingsIcon?.contains(e.target) && !pomodoroSettingsPopup?.contains(e.target)) {
      pomodoroSettingsPopup?.classList.remove('show');
    }
  });

  pomodoroStartBtn.addEventListener('click', () => {
    if (!isPomodoroRunning) {
      startPomodoroTimer();
    }
  });

  pomodoroPauseBtn.addEventListener('click', () => {
    pausePomodoroTimer();
  });

  pomodoroResetBtn.addEventListener('click', () => {
    resetPomodoroTimer();
  });

  function loadPomodoroPosition() {
    const savedPos = localStorage.getItem('pomodoroPosition');
    if (savedPos) {
      try {
        const pos = JSON.parse(savedPos);
        pomodoroPopup.style.left = pos.left;
        pomodoroPopup.style.top = pos.top;
        pomodoroPopup.style.transform = 'none';
      } catch(e) {}
    }
  }

  function savePomodoroPosition() {
    const left = pomodoroPopup.style.left;
    const top = pomodoroPopup.style.top;
    if (left && top) {
      localStorage.setItem('pomodoroPosition', JSON.stringify({ left, top }));
    }
  }

  pomodoroBtn.addEventListener('click', () => {
    if (pomodoroOpen) {
      pomodoroPopup.classList.remove('show');
      pomodoroOpen = false;
    } else {
      pomodoroPopup.classList.add('show');
      pomodoroOpen = true;
      toolPopup.classList.remove('show');
      toolPopupOpen = false;
      loadPomodoroPosition();
      loadPomodoroSettings();
    }
  });

  closePomodoroBtn.addEventListener('click', () => {
    pomodoroPopup.classList.remove('show');
    pomodoroOpen = false;
  });

  pomodoroPopup.addEventListener('mousedown', (e) => {
    const isButton = e.target.closest('.pomodoro-btn, .close-panel-btn, .pomodoro-settings-icon');
    if (isButton) return;
    
    isPomodoroDragging = true;
    pomodoroPopup.classList.add('dragging');
    
    const rect = pomodoroPopup.getBoundingClientRect();
    pomoDragStartX = e.clientX - rect.left;
    pomoDragStartY = e.clientY - rect.top;
    
    pomodoroPopup.style.transform = 'none';
    pomodoroPopup.style.left = rect.left + 'px';
    pomodoroPopup.style.top = rect.top + 'px';
    
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isPomodoroDragging) return;
    
    let newLeft = e.clientX - pomoDragStartX;
    let newTop = e.clientY - pomoDragStartY;
    
    const popupWidth = pomodoroPopup.offsetWidth;
    const popupHeight = pomodoroPopup.offsetHeight;
    newLeft = Math.max(5, Math.min(window.innerWidth - popupWidth - 5, newLeft));
    newTop = Math.max(5, Math.min(window.innerHeight - popupHeight - 5, newTop));
    
    pomodoroPopup.style.left = newLeft + 'px';
    pomodoroPopup.style.top = newTop + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isPomodoroDragging) {
      isPomodoroDragging = false;
      pomodoroPopup.classList.remove('dragging');
      savePomodoroPosition();
    }
  });

  loadPomodoroSettings();
  resetPomodoroTimer();

  // ===== TO-DO LIST FUNCTIONALITY =====
  function initTodoList() {
    const todoList = document.getElementById('todoList');
    const addTodoBtn = document.getElementById('addTodoBtn');
    const newTodoInput = document.getElementById('newTodoInput');
    const clearAllBtn = document.getElementById('clearAllTodos');

    function loadTodos() {
      const saved = localStorage.getItem('studyModeTodos');
      if (saved) {
        try {
          const todos = JSON.parse(saved);
          todoList.innerHTML = '';
          todos.forEach(todo => {
            addTodoItemToDOM(todo.text, todo.completed);
          });
        } catch(e) {
          setupDefaultTodos();
        }
      } else {
        setupDefaultTodos();
      }
    }

    function setupDefaultTodos() {
      const defaultTodos = [
        { text: "Read a book", completed: false },
        { text: "Complete project", completed: false },
        { text: "Take a break", completed: false }
      ];
      todoList.innerHTML = '';
      defaultTodos.forEach(todo => {
        addTodoItemToDOM(todo.text, todo.completed);
      });
      saveTodos();
    }

    function saveTodos() {
      const todos = [];
      document.querySelectorAll('.todo-item').forEach(item => {
        const checkbox = item.querySelector('.todo-checkbox');
        const textSpan = item.querySelector('.todo-text');
        todos.push({
          text: textSpan.textContent,
          completed: checkbox.checked
        });
      });
      localStorage.setItem('studyModeTodos', JSON.stringify(todos));
    }

    function makeEditable(span) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'todo-text editing';
      input.value = span.textContent;
      const checkbox = span.parentNode.querySelector('.todo-checkbox');
      span.parentNode.replaceChild(input, span);
      input.focus();
      
      input.addEventListener('blur', () => {
        const newSpan = document.createElement('span');
        newSpan.className = 'todo-text';
        if (input.value.trim() !== '') {
          newSpan.textContent = input.value;
        } else {
          newSpan.textContent = 'Empty task';
        }
        if (checkbox && checkbox.checked) {
          newSpan.classList.add('completed');
        }
        input.parentNode.replaceChild(newSpan, input);
        newSpan.addEventListener('click', (e) => {
          e.stopPropagation();
          checkbox.checked = !checkbox.checked;
          if (checkbox.checked) {
            newSpan.classList.add('completed');
          } else {
            newSpan.classList.remove('completed');
          }
          saveTodos();
        });
        newSpan.addEventListener('dblclick', () => makeEditable(newSpan));
        saveTodos();
      });
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        }
      });
    }

    function addTodoItemToDOM(text, completed = false) {
      const li = document.createElement('li');
      li.className = 'todo-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'todo-checkbox';
      checkbox.checked = completed;
      
      const textSpan = document.createElement('span');
      textSpan.className = 'todo-text';
      if (completed) textSpan.classList.add('completed');
      textSpan.textContent = text;
      
      textSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        checkbox.checked = !checkbox.checked;
        if (checkbox.checked) {
          textSpan.classList.add('completed');
        } else {
          textSpan.classList.remove('completed');
        }
        saveTodos();
      });
      
      textSpan.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        makeEditable(textSpan);
      });
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-todo';
      deleteBtn.textContent = '✕';
      
      li.appendChild(checkbox);
      li.appendChild(textSpan);
      li.appendChild(deleteBtn);
      todoList.appendChild(li);
      
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          textSpan.classList.add('completed');
        } else {
          textSpan.classList.remove('completed');
        }
        saveTodos();
      });
      
      deleteBtn.addEventListener('click', () => {
        li.remove();
        saveTodos();
      });
    }

    function addNewTodo() {
      const text = newTodoInput.value.trim();
      if (text !== '') {
        addTodoItemToDOM(text);
        saveTodos();
        newTodoInput.value = '';
      }
    }

    function clearAllTodos() {
      showConfirm('Are you sure you want to clear all todos?', () => {
        todoList.innerHTML = '';
        saveTodos();
      });
    }

    addTodoBtn.addEventListener('click', addNewTodo);
    newTodoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addNewTodo();
      }
    });
    clearAllBtn.addEventListener('click', clearAllTodos);

    loadTodos();
  }

  // Custom confirmation dialog
  function showConfirm(message, onConfirm) {
    const confirmDiv = document.createElement('div');
    confirmDiv.className = 'custom-confirm';
    confirmDiv.innerHTML = `
      <div class="confirm-box">
        <div class="confirm-message">${message}</div>
        <div class="confirm-buttons">
          <button class="confirm-btn yes">Yes</button>
          <button class="confirm-btn no">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(confirmDiv);
    
    const yesBtn = confirmDiv.querySelector('.yes');
    const noBtn = confirmDiv.querySelector('.no');
    
    yesBtn.addEventListener('click', () => {
      onConfirm();
      confirmDiv.remove();
    });
    
    noBtn.addEventListener('click', () => {
      confirmDiv.remove();
    });
  }

  loadStickyPosition();
  initTodoList();
  
  stickyNoteContainer.style.display = 'none';
  stickyNoteVisible = false;
})();