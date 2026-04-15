(function() {
  'use strict';
  
  if (window.__studyEnhancerBlockerLoaded) {
    console.log('Blocker already loaded, skipping');
    return;
  }
  window.__studyEnhancerBlockerLoaded = true;
  
  let overlay = null;
  let originalVolume = 1;
  let audioObserver = null;
  let isBlocking = false;
  let retryCount = 0;
  const MAX_RETRIES = 5;
  let backgroundAudio = null;
  let isMusicMuted = false;
  let isMusicPaused = false;
  let currentMusicIndex = 0;
  let currentVolume = 0.15;
  let currentTabId = null;
  let isPrimaryBlocker = false;
  let primaryBlockerCheckInterval = null;
  let currentTheme = 'dark';
  let settingsModal = null;
  let spotlightAnimationFrame = null;
  let currentTab = 'general';
  
  // Spotlight settings
  let spotlightColor1 = '#8b5cf6'; // Purple for center light
  let spotlightColor2 = '#1e3a8a'; // Dark blue for moving light
  let spotlightCount = 1; // Default: 1 light (center light only)
  let spotlightSpeed = 0.0192; // 40% speed (0.003 = slowest, 0.03 = fastest)
  
  // Random movement variables for second spotlight (moving)
  let targetX = 50;
  let targetY = 50;
  let currentX = 50;
  let currentY = 50;
  let lastChangeTime = 0;
  
  // Music metadata
  let currentSongTitle = "No Name";
  let currentArtist = "Unknown";
  
  // List of music files in the music folder with metadata
  const MUSIC_FILES = [
    { 
      file: "fassounds-good-night-lofi-cozy-chill-music-160166.mp3",
      title: "Title Unavailable",
      artist: "???"
    },
    { 
      file: "fassounds-lofi-study-calm-peaceful-chill-hop-112191.mp3",
      title: "Title Unavailable",
      artist: "???"
    },
    {
      file: "lofi_music_library-coffee-lofi-chill-lofi-ambient-458901.mp3",
      title: "Title Unavailable",
      artist: "???"
    },
     {
      file: "lofi_music_library-lofi-girl-chill-lofi-beats-lofi-ambient-461871.mp3",
      title: "Title Unavailable",
      artist: "???"
    },
     {
      file: "lofi_music_library-lofi-rain-lofi-music-458077.mp3",
      title: "Title Unavailable",
      artist: "???"
    },
     {
      file: "lofidreams-cozy-lofi-background-music-457199.mp3",
      title: "Title Unavailable",
      artist: "???"
    },
     {
      file: "lofidreams-lofi-jazz-music-485312.mp3",
      title: "Title Unavailable",
      artist: "???"
    },
     {
      file: "mondamusic-lofi-chill-chill-512854.mp3",
      title: "Title Unavailable",
      artist: "???"
    },
     {
      file: "mondamusic-lofi-lofi-chill-lofi-girl-491690.mp3",
      title: "Title Unavailable",
      artist: "???"
    },
     {
      file: "mondamusic-lofi-lofi-girl-lofi-chill-512853.mp3",
      title: "Title Unavailable",
      artist: "???"
    },
     {
      file: "sonican-lo-fi-music-loop-sentimental-jazzy-love-473154.mp3",
      title: "Title Unavailable",
      artist: "???"
    },
     {
      file: "watermello-lofi-chill-lofi-girl-lofi-488388.mp3",
      title: "Title Unavailable",
      artist: "???"
    },
     {
      file: "watermello-lofi-lofi-girl-lofi-chill-484610.mp3",
      title: "Title Unavailable",
      artist: "???"
    }
  ];
  
  // List of 10 different icons for the immersive experience
  const STUDY_ICONS = [
    { emoji: "🧘", name: "meditation", animation: "float" },
    { emoji: "🎧", name: "headphones", animation: "pulse" },
    { emoji: "📚", name: "books", animation: "float" },
    { emoji: "🌿", name: "plant", animation: "sway" },
    { emoji: "✨", name: "sparkles", animation: "twinkle" },
    { emoji: "🕯️", name: "candle", animation: "flicker" },
    { emoji: "🌊", name: "waves", animation: "flow" },
    { emoji: "🌸", name: "flower", animation: "bloom" },
    { emoji: "⭐", name: "star", animation: "twinkle" },
    { emoji: "🍃", name: "leaf", animation: "drift" }
  ];
  
  let currentIcon = null;
  let staticNoiseImageData = null;
  let noiseCanvasWidth = 0;
  let noiseCanvasHeight = 0;
  
  // Preset configurations
  const PRESETS = {
    calm: { color1: '#8b5cf6', color2: '#1e3a8a', count: 1, speed: 0.003, icon: '🌙' },
    focus: { color1: '#3b82f6', color2: '#06b6d4', count: 1, speed: 0.01, icon: '🎯' },
    energy: { color1: '#ef4444', color2: '#f97316', count: 2, speed: 0.025, icon: '⚡' },
    deep: { color1: '#4c1d95', color2: '#2dd4bf', count: 2, speed: 0.008, icon: '🌊' },
    warm: { color1: '#f59e0b', color2: '#ec4899', count: 1, speed: 0.015, icon: '🔥' },
    night: { color1: '#06b6d4', color2: '#3b82f6', count: 2, speed: 0.005, icon: '🌃' }
  };
  
  function updateNowPlaying() {
    const nowPlayingElement = document.getElementById('now-playing-text');
    if (nowPlayingElement) {
      nowPlayingElement.textContent = `${currentArtist} - ${currentSongTitle}`;
    }
  }
  
  function applyPreset(presetName) {
    const preset = PRESETS[presetName];
    if (preset) {
      spotlightColor1 = preset.color1;
      spotlightColor2 = preset.color2;
      spotlightCount = preset.count;
      spotlightSpeed = preset.speed;
      saveSpotlightSettings(spotlightColor1, spotlightColor2, spotlightCount, spotlightSpeed);
      updateSpotlightColors();
      
      // Update UI if modal is open
      if (settingsModal && settingsModal.style.display === 'block') {
        const colorPicker1 = document.getElementById('settings-spotlight-color1');
        const colorPicker2 = document.getElementById('settings-spotlight-color2');
        const speedSlider = document.getElementById('settings-spotlight-speed');
        const speedValue = document.getElementById('settings-speed-value');
        
        if (colorPicker1) colorPicker1.value = spotlightColor1;
        if (colorPicker2) colorPicker2.value = spotlightColor2;
        if (speedSlider) speedSlider.value = spotlightSpeed;
        if (speedValue) {
          const percent = Math.round(((spotlightSpeed - 0.003) / (0.03 - 0.003)) * 100);
          speedValue.textContent = `${percent}%`;
        }
        
        // Update button styles for light count
        const btn1 = document.getElementById('settings-lights-1');
        const btn2 = document.getElementById('settings-lights-2');
        if (spotlightCount === 1) {
          if (btn1) {
            btn1.style.border = `1px solid ${currentTheme === 'light' ? '#3498db' : '#88ccff'}`;
            btn1.style.background = currentTheme === 'light' ? 'rgba(52,152,219,0.2)' : 'rgba(136,204,255,0.2)';
          }
          if (btn2) {
            btn2.style.border = `1px solid ${currentTheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`;
            btn2.style.background = 'transparent';
          }
        } else {
          if (btn2) {
            btn2.style.border = `1px solid ${currentTheme === 'light' ? '#3498db' : '#88ccff'}`;
            btn2.style.background = currentTheme === 'light' ? 'rgba(52,152,219,0.2)' : 'rgba(136,204,255,0.2)';
          }
          if (btn1) {
            btn1.style.border = `1px solid ${currentTheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`;
            btn1.style.background = 'transparent';
          }
        }
      }
    }
  }
  
  // Helper function to convert hex to rgb
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 139, g: 92, b: 246 };
  }
  
  function getRandomIcon() {
    const randomIndex = Math.floor(Math.random() * STUDY_ICONS.length);
    currentIcon = STUDY_ICONS[randomIndex];
    console.log(`Selected random icon: ${currentIcon.emoji} (${currentIcon.name})`);
    return currentIcon;
  }
  
  function getIconAnimation(animationName) {
    switch(animationName) {
      case 'float': return 'float 4s ease-in-out infinite';
      case 'pulse': return 'pulse 2s ease-in-out infinite';
      case 'sway': return 'sway 3s ease-in-out infinite';
      case 'twinkle': return 'twinkle 2s ease-in-out infinite';
      case 'flicker': return 'flicker 1.5s ease-in-out infinite';
      case 'flow': return 'flow 5s ease-in-out infinite';
      case 'bloom': return 'bloom 3s ease-in-out infinite';
      case 'drift': return 'drift 6s ease-in-out infinite';
      default: return 'float 4s ease-in-out infinite';
    }
  }
  
  function loadTheme() {
    const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
    storage.sync.get(['theme', 'spotlightColor1', 'spotlightColor2', 'spotlightCount', 'spotlightSpeed'], (result) => {
      currentTheme = result.theme || 'dark';
      spotlightColor1 = result.spotlightColor1 || '#8b5cf6';
      spotlightColor2 = result.spotlightColor2 || '#1e3a8a';
      spotlightCount = result.spotlightCount !== undefined ? result.spotlightCount : 1;
      spotlightSpeed = result.spotlightSpeed !== undefined ? result.spotlightSpeed : 0.0192;
      applyThemeToBlocker();
    });
  }
  
  function saveSpotlightSettings(color1, color2, count, speed) {
    const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
    storage.sync.set({ 
      spotlightColor1: color1,
      spotlightColor2: color2,
      spotlightCount: count,
      spotlightSpeed: speed
    });
  }
  
  function applyThemeToBlocker() {
    const blockerDiv = document.getElementById('study-enhancer-blocker');
    if (!blockerDiv) return;
    
    if (currentTheme === 'light') {
      const gradientBg = blockerDiv.querySelector('#gradient-background');
      if (gradientBg) gradientBg.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #e9edf2 100%)';
      
      const title = blockerDiv.querySelector('h1');
      if (title) title.style.background = 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)';
      
      const musicBar = blockerDiv.querySelector('#music-control-bar');
      if (musicBar) {
        musicBar.style.background = 'transparent';
        musicBar.style.border = '1px solid rgba(52, 152, 219, 0.3)';
        musicBar.style.backdropFilter = 'none';
      }
      
      const nowPlayingText = blockerDiv.querySelector('#now-playing-text');
      if (nowPlayingText) {
        nowPlayingText.style.color = '#2c3e50';
        nowPlayingText.style.textShadow = '0 0 8px rgba(52, 152, 219, 0.5)';
      }
      
      const textElements = blockerDiv.querySelectorAll('p, .music-status-text, #music-status-text');
      textElements.forEach(el => {
        if (el) el.style.color = '#2c3e50';
      });
      
      const indicator = blockerDiv.querySelector('#music-playing-indicator');
      if (indicator) {
        indicator.style.background = 'rgba(52, 152, 219, 0.1)';
        indicator.style.border = '1px solid rgba(52, 152, 219, 0.3)';
      }
      
      const buttons = blockerDiv.querySelectorAll('#music-onoff-btn, #prev-btn, #play-pause-btn, #next-btn');
      buttons.forEach(btn => {
        if (btn) {
          btn.style.color = '#2c3e50';
          btn.style.background = 'rgba(52, 152, 219, 0.15)';
        }
      });
      
      const cogwheel = blockerDiv.querySelector('#settings-cogwheel');
      if (cogwheel) {
        cogwheel.style.background = 'rgba(52, 152, 219, 0.1)';
        const svg = cogwheel.querySelector('svg');
        if (svg) svg.style.color = '#3498db';
      }
      
    } else {
      const gradientBg = blockerDiv.querySelector('#gradient-background');
      if (gradientBg) gradientBg.style.background = 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a15 100%)';
      
      const title = blockerDiv.querySelector('h1');
      if (title) title.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)';
      
      const musicBar = blockerDiv.querySelector('#music-control-bar');
      if (musicBar) {
        musicBar.style.background = 'transparent';
        musicBar.style.border = '1px solid rgba(100, 200, 255, 0.2)';
        musicBar.style.backdropFilter = 'none';
      }
      
      const nowPlayingText = blockerDiv.querySelector('#now-playing-text');
      if (nowPlayingText) {
        nowPlayingText.style.color = '#e2e8f0';
        nowPlayingText.style.textShadow = '0 0 8px rgba(100, 200, 255, 0.6), 0 0 12px rgba(100, 200, 255, 0.3)';
      }
      
      const textElements = blockerDiv.querySelectorAll('p, .music-status-text, #music-status-text');
      textElements.forEach(el => {
        if (el) el.style.color = '#e2e8f0';
      });
      
      const indicator = blockerDiv.querySelector('#music-playing-indicator');
      if (indicator) {
        indicator.style.background = 'rgba(100, 200, 255, 0.15)';
        indicator.style.border = '1px solid rgba(100, 200, 255, 0.3)';
      }
      
      const buttons = blockerDiv.querySelectorAll('#music-onoff-btn, #prev-btn, #play-pause-btn, #next-btn');
      buttons.forEach(btn => {
        if (btn) {
          btn.style.color = '#e2e8f0';
          btn.style.background = 'rgba(100, 200, 255, 0.15)';
        }
      });
      
      const cogwheel = blockerDiv.querySelector('#settings-cogwheel');
      if (cogwheel) {
        cogwheel.style.background = 'rgba(255, 255, 255, 0.1)';
        const svg = cogwheel.querySelector('svg');
        if (svg) svg.style.color = '#e2e8f0';
      }
    }
  }
  
  // Generate static noise once and save it
  function generateStaticNoiseOnce(canvas) {
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    
    if (staticNoiseImageData && noiseCanvasWidth === canvas.width && noiseCanvasHeight === canvas.height) {
      const ctx = canvas.getContext('2d');
      ctx.putImageData(staticNoiseImageData, 0, 0);
      return;
    }
    
    noiseCanvasWidth = canvas.width;
    noiseCanvasHeight = canvas.height;
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.floor(Math.random() * 90) + 30;
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = 255;
    }
    
    ctx.putImageData(imageData, 0, 0);
    staticNoiseImageData = imageData;
  }
  
  function setupStaticNoiseTexture(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      generateStaticNoiseOnce(canvas);
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  }
  
  function updateSpotlightColors() {
    const rgb1 = hexToRgb(spotlightColor1);
    const rgb2 = hexToRgb(spotlightColor2);
    
    const spotlight1 = document.getElementById('spotlight-center');
    const spotlight2 = document.getElementById('spotlight-moving');
    
    if (spotlight1) {
      spotlight1.style.background = `radial-gradient(circle at 50% 50%, rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.85) 0%, rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.5) 15%, rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.2) 30%, transparent 60%)`;
    }
    
    if (spotlight2) {
      spotlight2.style.background = `radial-gradient(circle at ${currentX}% ${currentY}%, rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.85) 0%, rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.5) 12%, rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.2) 25%, transparent 55%)`;
    }
  }
  
  function startSpotlightAnimation() {
    const spotlight2 = document.getElementById('spotlight-moving');
    if (!spotlight2) {
      console.log("Moving spotlight element not found");
      return;
    }
    
    console.log("Moving spotlight animation started with speed:", spotlightSpeed);
    
    function animateMovingSpotlight(timestamp) {
      // Change target position every 3-5 seconds
      if (!lastChangeTime || timestamp - lastChangeTime > (Math.random() * 3000 + 3000)) {
        lastChangeTime = timestamp;
        targetX = Math.random() * 100;
        targetY = Math.random() * 100;
      }
      
      // Smooth movement towards target
      currentX += (targetX - currentX) * spotlightSpeed;
      currentY += (targetY - currentY) * spotlightSpeed;
      
      const rgb2 = hexToRgb(spotlightColor2);
      spotlight2.style.background = `radial-gradient(circle at ${currentX}% ${currentY}%, rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.85) 0%, rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.5) 12%, rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.2) 25%, transparent 55%)`;
      
      spotlightAnimationFrame = requestAnimationFrame(animateMovingSpotlight);
    }
    
    animateMovingSpotlight(0);
  }
  
  function stopSpotlightAnimation() {
    if (spotlightAnimationFrame) {
      cancelAnimationFrame(spotlightAnimationFrame);
      spotlightAnimationFrame = null;
    }
  }
  
  function switchTab(tabName) {
    currentTab = tabName;
    
    const generalTab = document.getElementById('settings-tab-general');
    const lightTab = document.getElementById('settings-tab-light');
    const generalBtn = document.getElementById('tab-btn-general');
    const lightBtn = document.getElementById('tab-btn-light');
    
    if (tabName === 'general') {
      if (generalTab) generalTab.style.display = 'block';
      if (lightTab) lightTab.style.display = 'none';
      if (generalBtn) {
        generalBtn.style.borderBottom = `2px solid ${currentTheme === 'light' ? '#3498db' : '#88ccff'}`;
        generalBtn.style.color = currentTheme === 'light' ? '#3498db' : '#88ccff';
      }
      if (lightBtn) {
        lightBtn.style.borderBottom = '2px solid transparent';
        lightBtn.style.color = currentTheme === 'light' ? '#666' : '#aaa';
      }
    } else {
      if (generalTab) generalTab.style.display = 'none';
      if (lightTab) lightTab.style.display = 'block';
      if (lightBtn) {
        lightBtn.style.borderBottom = `2px solid ${currentTheme === 'light' ? '#3498db' : '#88ccff'}`;
        lightBtn.style.color = currentTheme === 'light' ? '#3498db' : '#88ccff';
      }
      if (generalBtn) {
        generalBtn.style.borderBottom = '2px solid transparent';
        generalBtn.style.color = currentTheme === 'light' ? '#666' : '#aaa';
      }
    }
  }
  
  function createSettingsModal() {
    if (settingsModal) return;
    
    settingsModal = document.createElement('div');
    settingsModal.id = 'blocker-settings-modal';
    settingsModal.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 400px !important;
      max-width: 90% !important;
      background: ${currentTheme === 'light' ? '#ffffff' : '#1f1f1f'} !important;
      border-radius: 20px !important;
      padding: 0 !important;
      z-index: 2147483650 !important;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
      border: 1px solid ${currentTheme === 'light' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(100, 200, 255, 0.2)'} !important;
      font-family: 'Inter', system-ui, sans-serif !important;
      display: none !important;
      overflow: hidden !important;
    `;
    
    // Calculate correct speed percentage (0.003 = slowest = 0%, 0.03 = fastest = 100%)
    const speedPercent = Math.round(((spotlightSpeed - 0.003) / (0.03 - 0.003)) * 100);
    
    settingsModal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 0 24px; margin-bottom: 0;">
        <h3 style="margin: 0; font-size: 18px; color: ${currentTheme === 'light' ? '#2c3e50' : '#e2e8f0'};">Settings</h3>
        <button id="close-settings-btn" style="background: transparent; border: none; font-size: 20px; cursor: pointer; color: ${currentTheme === 'light' ? '#2c3e50' : '#e2e8f0'};">&times;</button>
      </div>
      
      <!-- Tab Headers -->
      <div style="display: flex; gap: 0; padding: 16px 24px 0 24px; border-bottom: 1px solid ${currentTheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'};">
        <button id="tab-btn-general" style="background: transparent; border: none; padding: 8px 16px; font-size: 14px; cursor: pointer; color: ${currentTheme === 'light' ? '#3498db' : '#88ccff'}; border-bottom: 2px solid ${currentTheme === 'light' ? '#3498db' : '#88ccff'}; transition: all 0.2s ease;">General</button>
        <button id="tab-btn-light" style="background: transparent; border: none; padding: 8px 16px; font-size: 14px; cursor: pointer; color: ${currentTheme === 'light' ? '#666' : '#aaa'}; border-bottom: 2px solid transparent; transition: all 0.2s ease;">Light</button>
      </div>
      
      <!-- General Tab Content -->
      <div id="settings-tab-general" style="padding: 24px;">
        <label style="display: block; margin-bottom: 12px; color: ${currentTheme === 'light' ? '#2c3e50' : '#e2e8f0'}; font-size: 13px; font-weight: 500;">Choose Preset</label>
        
        <!-- Preset Grid 2x3 -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
          <div class="preset-item" data-preset="calm" style="background: ${currentTheme === 'light' ? '#f5f5f5' : '#2a2a2a'}; border-radius: 12px; padding: 16px 8px; text-align: center; cursor: pointer; transition: all 0.2s ease; border: 2px solid transparent;">
            <div style="font-size: 32px; margin-bottom: 8px;">🌙</div>
            <div style="font-size: 12px; color: ${currentTheme === 'light' ? '#2c3e50' : '#e2e8f0'};">Calm</div>
          </div>
          <div class="preset-item" data-preset="focus" style="background: ${currentTheme === 'light' ? '#f5f5f5' : '#2a2a2a'}; border-radius: 12px; padding: 16px 8px; text-align: center; cursor: pointer; transition: all 0.2s ease; border: 2px solid transparent;">
            <div style="font-size: 32px; margin-bottom: 8px;">🎯</div>
            <div style="font-size: 12px; color: ${currentTheme === 'light' ? '#2c3e50' : '#e2e8f0'};">Focus</div>
          </div>
          <div class="preset-item" data-preset="energy" style="background: ${currentTheme === 'light' ? '#f5f5f5' : '#2a2a2a'}; border-radius: 12px; padding: 16px 8px; text-align: center; cursor: pointer; transition: all 0.2s ease; border: 2px solid transparent;">
            <div style="font-size: 32px; margin-bottom: 8px;">⚡</div>
            <div style="font-size: 12px; color: ${currentTheme === 'light' ? '#2c3e50' : '#e2e8f0'};">Energy</div>
          </div>
          <div class="preset-item" data-preset="deep" style="background: ${currentTheme === 'light' ? '#f5f5f5' : '#2a2a2a'}; border-radius: 12px; padding: 16px 8px; text-align: center; cursor: pointer; transition: all 0.2s ease; border: 2px solid transparent;">
            <div style="font-size: 32px; margin-bottom: 8px;">🌊</div>
            <div style="font-size: 12px; color: ${currentTheme === 'light' ? '#2c3e50' : '#e2e8f0'};">Deep</div>
          </div>
          <div class="preset-item" data-preset="warm" style="background: ${currentTheme === 'light' ? '#f5f5f5' : '#2a2a2a'}; border-radius: 12px; padding: 16px 8px; text-align: center; cursor: pointer; transition: all 0.2s ease; border: 2px solid transparent;">
            <div style="font-size: 32px; margin-bottom: 8px;">🔥</div>
            <div style="font-size: 12px; color: ${currentTheme === 'light' ? '#2c3e50' : '#e2e8f0'};">Warm</div>
          </div>
          <div class="preset-item" data-preset="night" style="background: ${currentTheme === 'light' ? '#f5f5f5' : '#2a2a2a'}; border-radius: 12px; padding: 16px 8px; text-align: center; cursor: pointer; transition: all 0.2s ease; border: 2px solid transparent;">
            <div style="font-size: 32px; margin-bottom: 8px;">🌃</div>
            <div style="font-size: 12px; color: ${currentTheme === 'light' ? '#2c3e50' : '#e2e8f0'};">Night</div>
          </div>
        </div>
      </div>
      
      <!-- Light Tab Content -->
      <div id="settings-tab-light" style="padding: 24px; display: none;">
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: ${currentTheme === 'light' ? '#2c3e50' : '#e2e8f0'}; font-size: 13px; font-weight: 500;">Center Light</label>
          <input type="color" id="settings-spotlight-color1" value="${spotlightColor1}" style="width: 100%; height: 40px; border-radius: 10px; cursor: pointer; background: ${currentTheme === 'light' ? '#f0f0f0' : '#2a2a2a'}; border: 1px solid ${currentTheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'};">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: ${currentTheme === 'light' ? '#2c3e50' : '#e2e8f0'}; font-size: 13px; font-weight: 500;">Moving Light</label>
          <input type="color" id="settings-spotlight-color2" value="${spotlightColor2}" style="width: 100%; height: 40px; border-radius: 10px; cursor: pointer; background: ${currentTheme === 'light' ? '#f0f0f0' : '#2a2a2a'}; border: 1px solid ${currentTheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'};">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: ${currentTheme === 'light' ? '#2c3e50' : '#e2e8f0'}; font-size: 13px; font-weight: 500;">Number of Lights</label>
          <div style="display: flex; gap: 12px;">
            <button id="settings-lights-1" style="flex: 1; padding: 8px; border-radius: 10px; border: 1px solid ${spotlightCount === 1 ? (currentTheme === 'light' ? '#3498db' : '#88ccff') : (currentTheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)')}; background: ${spotlightCount === 1 ? (currentTheme === 'light' ? 'rgba(52,152,219,0.2)' : 'rgba(136,204,255,0.2)') : 'transparent'}; color: ${currentTheme === 'light' ? '#2c3e50' : '#e2e8f0'}; cursor: pointer;">1 Light (Center)</button>
            <button id="settings-lights-2" style="flex: 1; padding: 8px; border-radius: 10px; border: 1px solid ${spotlightCount === 2 ? (currentTheme === 'light' ? '#3498db' : '#88ccff') : (currentTheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)')}; background: ${spotlightCount === 2 ? (currentTheme === 'light' ? 'rgba(52,152,219,0.2)' : 'rgba(136,204,255,0.2)') : 'transparent'}; color: ${currentTheme === 'light' ? '#2c3e50' : '#e2e8f0'}; cursor: pointer;">2 Lights</button>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: ${currentTheme === 'light' ? '#2c3e50' : '#e2e8f0'}; font-size: 13px; font-weight: 500;">Moving Light Speed: <span id="settings-speed-value">${speedPercent}%</span></label>
          <input type="range" id="settings-spotlight-speed" min="0.003" max="0.03" step="0.001" value="${spotlightSpeed}" style="width: 100%;">
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span style="font-size: 10px; opacity: 0.6;">Slow (0%)</span>
            <span style="font-size: 10px; opacity: 0.6;">Fast (100%)</span>
          </div>
        </div>
      </div>
      
      <div style="padding: 16px 24px 24px 24px; border-top: 1px solid ${currentTheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}; margin-top: 0;">
        <p style="font-size: 11px; color: ${currentTheme === 'light' ? '#7f8c8d' : '#888'}; margin: 0; text-align: center;">Study Enhancer - Focus Mode</p>
      </div>
    `;
    
    document.body.appendChild(settingsModal);
    
    // Add preset hover effects
    const presetItems = settingsModal.querySelectorAll('.preset-item');
    presetItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.borderColor = currentTheme === 'light' ? '#3498db' : '#88ccff';
        item.style.transform = 'scale(1.02)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.borderColor = 'transparent';
        item.style.transform = 'scale(1)';
      });
      item.addEventListener('click', () => {
        const preset = item.dataset.preset;
        applyPreset(preset);
      });
    });
    
    // Close button
    document.getElementById('close-settings-btn')?.addEventListener('click', () => {
      settingsModal.style.display = 'none';
    });
    
    // Tab buttons
    document.getElementById('tab-btn-general')?.addEventListener('click', () => {
      switchTab('general');
    });
    document.getElementById('tab-btn-light')?.addEventListener('click', () => {
      switchTab('light');
    });
    
    // Spotlight color picker 1 (center light)
    document.getElementById('settings-spotlight-color1')?.addEventListener('change', (e) => {
      spotlightColor1 = e.target.value;
      saveSpotlightSettings(spotlightColor1, spotlightColor2, spotlightCount, spotlightSpeed);
      updateSpotlightColors();
    });
    
    // Spotlight color picker 2 (moving light)
    document.getElementById('settings-spotlight-color2')?.addEventListener('change', (e) => {
      spotlightColor2 = e.target.value;
      saveSpotlightSettings(spotlightColor1, spotlightColor2, spotlightCount, spotlightSpeed);
      updateSpotlightColors();
    });
    
    // Light count buttons
    document.getElementById('settings-lights-1')?.addEventListener('click', () => {
      spotlightCount = 1;
      saveSpotlightSettings(spotlightColor1, spotlightColor2, spotlightCount, spotlightSpeed);
      
      const btn1 = document.getElementById('settings-lights-1');
      const btn2 = document.getElementById('settings-lights-2');
      if (btn1) {
        btn1.style.border = `1px solid ${currentTheme === 'light' ? '#3498db' : '#88ccff'}`;
        btn1.style.background = currentTheme === 'light' ? 'rgba(52,152,219,0.2)' : 'rgba(136,204,255,0.2)';
      }
      if (btn2) {
        btn2.style.border = `1px solid ${currentTheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`;
        btn2.style.background = 'transparent';
      }
      
      const movingSpotlight = document.getElementById('spotlight-moving');
      if (movingSpotlight) movingSpotlight.style.opacity = '0';
    });
    
    document.getElementById('settings-lights-2')?.addEventListener('click', () => {
      spotlightCount = 2;
      saveSpotlightSettings(spotlightColor1, spotlightColor2, spotlightCount, spotlightSpeed);
      
      const btn1 = document.getElementById('settings-lights-1');
      const btn2 = document.getElementById('settings-lights-2');
      if (btn2) {
        btn2.style.border = `1px solid ${currentTheme === 'light' ? '#3498db' : '#88ccff'}`;
        btn2.style.background = currentTheme === 'light' ? 'rgba(52,152,219,0.2)' : 'rgba(136,204,255,0.2)';
      }
      if (btn1) {
        btn1.style.border = `1px solid ${currentTheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`;
        btn1.style.background = 'transparent';
      }
      
      const movingSpotlight = document.getElementById('spotlight-moving');
      if (movingSpotlight) movingSpotlight.style.opacity = '1';
    });
    
    // Speed slider - inverted (0% = slowest, 100% = fastest)
    document.getElementById('settings-spotlight-speed')?.addEventListener('input', (e) => {
      spotlightSpeed = parseFloat(e.target.value);
      saveSpotlightSettings(spotlightColor1, spotlightColor2, spotlightCount, spotlightSpeed);
      const speedValue = document.getElementById('settings-speed-value');
      if (speedValue) {
        const percent = Math.round(((spotlightSpeed - 0.003) / (0.03 - 0.003)) * 100);
        speedValue.textContent = `${percent}%`;
      }
    });
    
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
      }
    });
  }
  
  function showSettingsModal() {
    if (!settingsModal) createSettingsModal();
    if (settingsModal) {
      // Reset to general tab
      currentTab = 'general';
      const generalTab = document.getElementById('settings-tab-general');
      const lightTab = document.getElementById('settings-tab-light');
      const generalBtn = document.getElementById('tab-btn-general');
      const lightBtn = document.getElementById('tab-btn-light');
      
      if (generalTab) generalTab.style.display = 'block';
      if (lightTab) lightTab.style.display = 'none';
      if (generalBtn) {
        generalBtn.style.borderBottom = `2px solid ${currentTheme === 'light' ? '#3498db' : '#88ccff'}`;
        generalBtn.style.color = currentTheme === 'light' ? '#3498db' : '#88ccff';
      }
      if (lightBtn) {
        lightBtn.style.borderBottom = '2px solid transparent';
        lightBtn.style.color = currentTheme === 'light' ? '#666' : '#aaa';
      }
      
      // Update values
      const colorPicker1 = document.getElementById('settings-spotlight-color1');
      if (colorPicker1) colorPicker1.value = spotlightColor1;
      
      const colorPicker2 = document.getElementById('settings-spotlight-color2');
      if (colorPicker2) colorPicker2.value = spotlightColor2;
      
      const speedSlider = document.getElementById('settings-spotlight-speed');
      if (speedSlider) speedSlider.value = spotlightSpeed;
      
      const speedValue = document.getElementById('settings-speed-value');
      if (speedValue) {
        const percent = Math.round(((spotlightSpeed - 0.003) / (0.03 - 0.003)) * 100);
        speedValue.textContent = `${percent}%`;
      }
      
      settingsModal.style.display = 'block';
    }
  }
  
  function isExtensionValid() {
    try {
      if (typeof chrome === 'undefined' && typeof browser === 'undefined') return false;
      const runtime = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime : browser.runtime;
      return runtime && runtime.id;
    } catch (e) { return false; }
  }
  
  function getExtensionURL(path) {
    const runtime = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime : browser.runtime;
    return runtime.getURL(path);
  }
  
  function getCurrentTabId() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.getCurrent((tab) => {
          if (tab && tab.id) resolve(tab.id);
          else {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              resolve(tabs[0] ? tabs[0].id : Math.floor(Math.random() * 1000000));
            });
          }
        });
      } else {
        resolve(Math.floor(Math.random() * 1000000));
      }
    });
  }
  
  function checkAndSetPrimaryBlocker() {
    const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
    const key = 'active_blocker_tab';
    const timestampKey = 'active_blocker_timestamp';
    
    return new Promise((resolve) => {
      storage.sync.get([key, timestampKey], (result) => {
        const activeTab = result[key];
        const timestamp = result[timestampKey];
        const now = Date.now();
        const isStale = timestamp && (now - timestamp > 5000);
        
        if (!activeTab || isStale) {
          storage.sync.set({ [key]: currentTabId, [timestampKey]: now }, () => {
            isPrimaryBlocker = true;
            console.log(`Tab ${currentTabId} is now the primary blocker`);
            resolve(true);
          });
        } else if (activeTab === currentTabId) {
          storage.sync.set({ [timestampKey]: now }, () => {
            isPrimaryBlocker = true;
            console.log(`Tab ${currentTabId} is the primary blocker`);
            resolve(true);
          });
        } else {
          isPrimaryBlocker = false;
          console.log(`Tab ${currentTabId} is NOT primary`);
          resolve(false);
        }
      });
    });
  }
  
  function refreshPrimaryBlockerTimestamp() {
    if (!isPrimaryBlocker) return;
    const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
    storage.sync.set({ active_blocker_timestamp: Date.now() });
  }
  
  function releasePrimaryBlocker() {
    if (!isPrimaryBlocker) return;
    const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
    storage.sync.get(['active_blocker_tab'], (result) => {
      if (result.active_blocker_tab === currentTabId) {
        storage.sync.remove(['active_blocker_tab', 'active_blocker_timestamp']);
      }
    });
  }
  
  function startPrimaryBlockerHeartbeat() {
    if (primaryBlockerCheckInterval) clearInterval(primaryBlockerCheckInterval);
    primaryBlockerCheckInterval = setInterval(() => {
      if (isBlocking && isPrimaryBlocker) refreshPrimaryBlockerTimestamp();
    }, 2000);
  }
  
  function stopPrimaryBlockerHeartbeat() {
    if (primaryBlockerCheckInterval) {
      clearInterval(primaryBlockerCheckInterval);
      primaryBlockerCheckInterval = null;
    }
  }
  
  function safeStorageGet(keys, callback) {
    if (!isExtensionValid()) { if (callback) callback({}); return; }
    try {
      const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
      storage.sync.get(keys, (result) => {
        if (callback) callback(result || {});
      });
    } catch (e) { if (callback) callback({}); }
  }
  
  function getRandomMusicFile() {
    if (MUSIC_FILES.length === 0) {
      console.log("No music files found");
      return null;
    }
    const randomIndex = Math.floor(Math.random() * MUSIC_FILES.length);
    currentMusicIndex = randomIndex;
    const selectedFile = MUSIC_FILES[randomIndex];
    
    // Update now playing info
    currentSongTitle = selectedFile.title || "No Name";
    currentArtist = selectedFile.artist || "Unknown";
    updateNowPlaying();
    
    console.log(`Now playing: ${currentArtist} - ${currentSongTitle}`);
    return getExtensionURL(`music/${selectedFile.file}`);
  }
  
  function getMusicFileByIndex(index) {
    if (MUSIC_FILES.length === 0) return null;
    if (index < 0) index = MUSIC_FILES.length - 1;
    if (index >= MUSIC_FILES.length) index = 0;
    currentMusicIndex = index;
    const selectedFile = MUSIC_FILES[index];
    
    // Update now playing info
    currentSongTitle = selectedFile.title || "No Name";
    currentArtist = selectedFile.artist || "Unknown";
    updateNowPlaying();
    
    console.log(`Now playing: ${currentArtist} - ${currentSongTitle}`);
    return getExtensionURL(`music/${selectedFile.file}`);
  }
  
  function playNextSong() {
    if (MUSIC_FILES.length === 0) return;
    const nextIndex = (currentMusicIndex + 1) % MUSIC_FILES.length;
    playSpecificSong(getMusicFileByIndex(nextIndex));
  }
  
  function playPreviousSong() {
    if (MUSIC_FILES.length === 0) return;
    const prevIndex = (currentMusicIndex - 1 + MUSIC_FILES.length) % MUSIC_FILES.length;
    playSpecificSong(getMusicFileByIndex(prevIndex));
  }
  
  function playSpecificSong(songUrl) {
    if (isMusicMuted || !isPrimaryBlocker) return;
    
    if (backgroundAudio) {
      try { backgroundAudio.pause(); backgroundAudio = null; } catch(e) {}
    }
    
    try {
      backgroundAudio = new Audio(songUrl);
      backgroundAudio.loop = true;
      backgroundAudio.volume = currentVolume;
      
      const playPromise = backgroundAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("Playing song");
          isMusicPaused = false;
          updateMusicButtonUI();
        }).catch(error => {
          console.log("Playback error:", error);
          isMusicPaused = true;
          updateMusicButtonUI();
        });
      }
    } catch (e) {
      console.log("Could not play:", e);
    }
  }
  
  function loadMusicSetting() {
    return new Promise((resolve) => {
      const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
      storage.sync.get(['musicEnabled', 'musicVolume', 'theme', 'spotlightColor1', 'spotlightColor2', 'spotlightCount', 'spotlightSpeed'], (result) => {
        const musicEnabled = result.musicEnabled !== undefined ? result.musicEnabled : true;
        isMusicMuted = !musicEnabled;
        
        currentVolume = result.musicVolume !== undefined ? result.musicVolume : 0.15;
        if (result.musicVolume === undefined) storage.sync.set({ musicVolume: 0.15 });
        
        currentTheme = result.theme || 'dark';
        spotlightColor1 = result.spotlightColor1 || '#8b5cf6';
        spotlightColor2 = result.spotlightColor2 || '#1e3a8a';
        spotlightCount = result.spotlightCount !== undefined ? result.spotlightCount : 1;
        spotlightSpeed = result.spotlightSpeed !== undefined ? result.spotlightSpeed : 0.0192;
        
        resolve();
      });
    });
  }
  
  function saveMusicSetting(enabled) {
    const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
    storage.sync.set({ musicEnabled: enabled });
  }
  
  function saveVolumeSetting(volume) {
    const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
    storage.sync.set({ musicVolume: volume });
  }
  
  function playBackgroundMusic() {
    if (!isPrimaryBlocker) {
      console.log("Not primary blocker, not playing");
      return;
    }
    
    if (isMusicMuted) {
      console.log("Music is muted, not playing");
      return;
    }
    
    if (backgroundAudio) {
      try { backgroundAudio.pause(); backgroundAudio = null; } catch(e) {}
    }
    
    const musicUrl = getRandomMusicFile();
    if (!musicUrl) {
      console.log("No music files available");
      return;
    }
    
    try {
      backgroundAudio = new Audio(musicUrl);
      backgroundAudio.loop = true;
      backgroundAudio.volume = currentVolume;
      
      const playPromise = backgroundAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("Background music playing");
          isMusicPaused = false;
          updateMusicButtonUI();
        }).catch(error => {
          console.log("Autoplay prevented:", error);
          isMusicPaused = true;
          updateMusicButtonUI();
        });
      }
    } catch(e) {
      console.log("Could not play:", e);
    }
  }
  
  function stopBackgroundMusic() {
    if (backgroundAudio) {
      try { backgroundAudio.pause(); backgroundAudio = null; } catch(e) {}
    }
    isMusicPaused = false;
  }
  
  function toggleMusicOnOff() {
    isMusicMuted = !isMusicMuted;
    saveMusicSetting(!isMusicMuted);
    
    if (isMusicMuted) {
      if (backgroundAudio) {
        backgroundAudio.pause();
      }
      console.log("Music turned OFF");
    } else {
      console.log("Music turned ON, starting playback");
      if (backgroundAudio && isMusicPaused) {
        backgroundAudio.play().catch(e => console.log("Could not resume:", e));
        isMusicPaused = false;
      } else if (!backgroundAudio && isPrimaryBlocker) {
        playBackgroundMusic();
      }
    }
    updateMusicButtonUI();
  }
  
  function pausePlayMusic() {
    if (!backgroundAudio || !isPrimaryBlocker) return;
    
    if (isMusicPaused) {
      backgroundAudio.play().catch(e => console.log("Could not resume:", e));
      isMusicPaused = false;
    } else {
      backgroundAudio.pause();
      isMusicPaused = true;
    }
    updateMusicButtonUI();
  }
  
  function updateVolume(value) {
    currentVolume = value;
    saveVolumeSetting(currentVolume);
    if (backgroundAudio) backgroundAudio.volume = currentVolume;
  }
  
  function updateMusicButtonUI() {
    const musicStatusText = document.getElementById('music-status-text');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const musicOnOffBtn = document.getElementById('music-onoff-btn');
    const musicPlayingIndicator = document.getElementById('music-playing-indicator');
    const volumeValue = document.getElementById('volume-value');
    
    if (musicStatusText) musicStatusText.textContent = isMusicMuted ? "Off" : "On";
    if (musicOnOffBtn) musicOnOffBtn.textContent = isMusicMuted ? "Off" : "On";
    
    if (playPauseBtn) {
      if (isMusicPaused) {
        playPauseBtn.innerHTML = '▶';
        playPauseBtn.title = 'Play';
      } else {
        playPauseBtn.innerHTML = '⏸';
        playPauseBtn.title = 'Pause';
      }
    }
    
    if (volumeSlider) volumeSlider.value = currentVolume;
    if (volumeValue) volumeValue.textContent = Math.round(currentVolume * 100) + '%';
    
    if (musicPlayingIndicator) {
      if (isPrimaryBlocker && !isMusicMuted && !isMusicPaused && backgroundAudio) {
        musicPlayingIndicator.style.opacity = '1';
        musicPlayingIndicator.innerHTML = '🎵 Music is playing';
      } else if (isPrimaryBlocker && isMusicMuted) {
        musicPlayingIndicator.style.opacity = '0.5';
        musicPlayingIndicator.innerHTML = '🔇 Music is muted';
      } else if (isPrimaryBlocker && isMusicPaused) {
        musicPlayingIndicator.style.opacity = '0.5';
        musicPlayingIndicator.innerHTML = '⏸ Music is paused';
      } else {
        musicPlayingIndicator.style.opacity = '0.3';
        musicPlayingIndicator.innerHTML = '🎵 Music is playing in another tab';
      }
    }
  }
  
  function createBlocker() {
    if (overlay || document.getElementById('study-enhancer-blocker')) return;
    
    console.log("Creating blocker overlay");
    
    const randomIcon = getRandomIcon();
    const iconAnimation = getIconAnimation(randomIcon.animation);
    
    overlay = document.createElement('div');
    overlay.id = 'study-enhancer-blocker';
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 2147483647 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif !important;
      color: #e2e8f0 !important;
      overflow: hidden !important;
      pointer-events: auto !important;
    `;
    
    const rgb1 = hexToRgb(spotlightColor1);
    const rgb2 = hexToRgb(spotlightColor2);
    
    overlay.innerHTML = `
      <!-- Layer 1: Darker Gray Blur Layer -->
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; background: rgba(20, 20, 30, 0.7); backdrop-filter: blur(3px);"></div>
      
      <!-- Layer 2: Gradient Background -->
      <div id="gradient-background" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; background: radial-gradient(circle at center, #1a1a2e 0%, #0a0a15 100%);"></div>
      
      <!-- Layer 3: Static Noise Texture -->
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2;">
        <canvas id="noise-canvas-main" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.15; mix-blend-mode: overlay;"></canvas>
      </div>
      
      <!-- Settings Cogwheel - Top Right -->
      <div id="settings-cogwheel" style="position: fixed !important; top: 20px !important; right: 20px !important; z-index: 2147483649 !important; cursor: pointer !important; background: rgba(255, 255, 255, 0.1) !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; backdrop-filter: blur(8px) !important; transition: all 0.2s ease !important;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #e2e8f0;">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </div>
      
      <!-- Main Content Container - HIGH Z-INDEX to appear above noise -->
      <div style="text-align: center; padding: 2rem; max-width: 400px; width: 85%; margin: auto; animation: fadeInScale 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards; position: relative; z-index: 2147483647;">
        <div style="margin-bottom: 1.5rem;">
          <div style="font-size: 4rem; margin-bottom: 0.75rem; display: inline-block; animation: ${iconAnimation};">${randomIcon.emoji}</div>
          <h1 style="font-size: 2rem; font-weight: 600; margin: 0; letter-spacing: -0.02em; -webkit-background-clip: text; background-clip: text; text-decoration: none; border: none;">
            Study Mode
          </h1>
        </div>
        
        <p style="font-size: 0.9rem; margin-bottom: 1.5rem; opacity: 0.7; line-height: 1.5;">
          This space is temporarily cleared to help you focus.
        </p>
        
        <div id="music-playing-indicator" style="background: rgba(100, 200, 255, 0.15); border-radius: 40px; padding: 0.5rem 1.2rem; margin-bottom: 1.5rem; border: 1px solid rgba(100, 200, 255, 0.3); display: inline-block;">
          <p style="font-size: 0.75rem; margin: 0; display: flex; align-items: center; gap: 8px;">
            <span>🎵</span>
            <span id="music-status-text">${isPrimaryBlocker ? (isMusicMuted ? 'Music is muted' : 'Music is playing') : 'Music is playing in another tab'}</span>
          </p>
        </div>
        
        <p style="font-size: 0.65rem; opacity: 0.4;">Re-enable the site in your extension settings</p>
      </div>
      
      <!-- Now Playing Text - TRANSPARENT BACKGROUND -->
      <div id="now-playing" style="position: fixed !important; bottom: 140px !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 2147483648 !important; text-align: center !important; background: transparent !important;">
        <span id="now-playing-text" style="font-size: 11px; font-weight: 400; letter-spacing: 0.3px; color: #e2e8f0; text-shadow: 0 0 8px rgba(100, 200, 255, 0.6), 0 0 12px rgba(100, 200, 255, 0.3);">${currentArtist} - ${currentSongTitle}</span>
      </div>
      
      <!-- Compact Music Control Bar - FULLY TRANSPARENT -->
      <div id="music-control-bar" style="position: fixed !important; bottom: 80px !important; left: 50% !important; transform: translateX(-50%) !important; background: transparent !important; backdrop-filter: none !important; border-radius: 50px !important; padding: 8px 20px !important; display: flex !important; gap: 16px !important; align-items: center !important; border: 1px solid rgba(100, 200, 255, 0.3) !important; z-index: 2147483648 !important;">
        
        <div style="display: flex; gap: 8px; align-items: center;">
          <span style="font-size: 12px; color: #88ccff;">🎵</span>
          <button id="music-onoff-btn" style="background: rgba(100, 200, 255, 0.2); border: none; border-radius: 30px; padding: 5px 14px; color: white; font-size: 11px; cursor: pointer; font-weight: 500;">${isMusicMuted ? 'Off' : 'On'}</button>
        </div>
        
        <div style="display: flex; gap: 10px; align-items: center;">
          <button id="prev-btn" style="background: rgba(100, 200, 255, 0.15); border: none; border-radius: 50%; width: 30px; height: 30px; color: #CBD5E1; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">⏮</button>
          <button id="play-pause-btn" style="background: rgba(100, 200, 255, 0.2); border: none; border-radius: 50%; width: 34px; height: 34px; color: white; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">${isMusicPaused ? '▶' : '⏸'}</button>
          <button id="next-btn" style="background: rgba(100, 200, 255, 0.15); border: none; border-radius: 50%; width: 30px; height: 30px; color: #CBD5E1; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">⏭</button>
        </div>
        
        <div style="display: flex; gap: 8px; align-items: center;">
          <span style="font-size: 11px; color: #88ccff;">🔊</span>
          <input type="range" id="volume-slider" min="0" max="1" step="0.01" value="${currentVolume}" style="width: 85px; height: 3px; -webkit-appearance: none; background: rgba(100, 200, 255, 0.3); border-radius: 2px; cursor: pointer;">
          <span id="volume-value" style="font-size: 10px; color: #94A3B8; min-width: 35px; font-family: monospace;">${Math.round(currentVolume * 100)}%</span>
        </div>
      </div>
      
      <!-- Light 1: Center Light - Always visible -->
      <div id="spotlight-center" style="position: fixed !important; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2147483647; background: radial-gradient(circle at 50% 50%, rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.85) 0%, rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.5) 15%, rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.2) 30%, transparent 60%);"></div>
      
      <!-- Light 2: Moving Light - Hidden by default -->
      <div id="spotlight-moving" style="position: fixed !important; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2147483647; background: radial-gradient(circle at 50% 50%, rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.85) 0%, rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.5) 12%, rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.2) 25%, transparent 55%); opacity: ${spotlightCount === 2 ? '1' : '0'};"></div>
      
      <style>
        @keyframes fadeInScale { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        @keyframes sway { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(12deg); } }
        @keyframes twinkle { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes flicker { 0%, 100% { opacity: 1; } 25% { opacity: 0.7; } 75% { opacity: 0.9; } }
        @keyframes flow { 0%, 100% { transform: translateX(0px); } 50% { transform: translateX(10px); } }
        @keyframes bloom { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.18); } }
        @keyframes drift { 0%, 100% { transform: translateY(0px); } 25% { transform: translateY(-6px); } 75% { transform: translateY(6px); } }
        #music-control-bar button:hover { background: rgba(100, 200, 255, 0.4) !important; transform: scale(1.05); }
        #settings-cogwheel:hover { background: rgba(100, 200, 255, 0.3) !important; transform: rotate(30deg); }
        #volume-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #88ccff; cursor: pointer; }
        h1 { text-decoration: none !important; border-bottom: none !important; background: linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%) !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important; }
      </style>
    `;
    
    const addOverlay = async () => {
      if (document.body) {
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        isBlocking = true;
        startAudioObserver();
        
        currentTabId = await getCurrentTabId();
        await checkAndSetPrimaryBlocker();
        startPrimaryBlockerHeartbeat();
        await loadMusicSetting();
        
        setupStaticNoiseTexture('noise-canvas-main');
        applyThemeToBlocker();
        createSettingsModal();
        
        // Start the moving spotlight animation
        startSpotlightAnimation();
        
        // Event listeners
        document.getElementById('settings-cogwheel')?.addEventListener('click', (e) => {
          e.stopPropagation();
          showSettingsModal();
        });
        
        document.getElementById('music-onoff-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleMusicOnOff();
          const btn = document.getElementById('music-onoff-btn');
          if (btn) btn.textContent = isMusicMuted ? "Off" : "On";
        });
        
        document.getElementById('prev-btn')?.addEventListener('click', (e) => { e.stopPropagation(); playPreviousSong(); });
        document.getElementById('play-pause-btn')?.addEventListener('click', (e) => { e.stopPropagation(); pausePlayMusic(); });
        document.getElementById('next-btn')?.addEventListener('click', (e) => { e.stopPropagation(); playNextSong(); });
        document.getElementById('volume-slider')?.addEventListener('input', (e) => {
          e.stopPropagation();
          const value = parseFloat(e.target.value);
          updateVolume(value);
          const volumeValue = document.getElementById('volume-value');
          if (volumeValue) volumeValue.textContent = Math.round(value * 100) + '%';
        });
        
        if (isPrimaryBlocker && !isMusicMuted) {
          console.log("Auto-playing music");
          playBackgroundMusic();
        } else {
          updateMusicButtonUI();
        }
        
        const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
        storage.onChanged.addListener((changes) => {
          if (changes.theme) {
            currentTheme = changes.theme.newValue;
            applyThemeToBlocker();
            
            if (settingsModal) {
              settingsModal.remove();
              settingsModal = null;
              createSettingsModal();
            }
          }
        });
        
      } else if (retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(addOverlay, 100);
      }
    };
    
    addOverlay();
  }
  
  function removeBlocker() {
    stopSpotlightAnimation();
    
    if (overlay) {
      overlay.remove();
      overlay = null;
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      if (isPrimaryBlocker) {
        stopBackgroundMusic();
        releasePrimaryBlocker();
        stopPrimaryBlockerHeartbeat();
      }
      isBlocking = false;
      if (audioObserver) { audioObserver.disconnect(); audioObserver = null; }
    }
  }
  
  function blockAllAudio() {
    try {
      document.querySelectorAll('video').forEach(video => { try { video.volume = 0; video.muted = true; } catch(e) {} });
      document.querySelectorAll('audio').forEach(audio => { try { audio.volume = 0; audio.muted = true; } catch(e) {} });
    } catch(e) {}
  }
  
  function restoreAudio() {
    try {
      document.querySelectorAll('video').forEach(video => { try { video.muted = false; } catch(e) {} });
      document.querySelectorAll('audio').forEach(audio => { try { audio.muted = false; } catch(e) {} });
    } catch(e) {}
  }
  
  function startAudioObserver() {
    if (audioObserver) audioObserver.disconnect();
    try {
      audioObserver = new MutationObserver(() => {
        if (isBlocking && overlay) {
          document.querySelectorAll('video').forEach(video => { if (!video.muted) { video.muted = true; video.volume = 0; } });
          document.querySelectorAll('audio').forEach(audio => { if (!audio.muted) { audio.muted = true; audio.volume = 0; } });
        }
      });
      audioObserver.observe(document.documentElement, { childList: true, subtree: true });
    } catch(e) {}
  }
  
  function getCurrentSite(url) {
    if (url.includes('youtube.com')) return 'blockYoutube';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('reddit.com')) return 'reddit';
    if (url.includes('pinterest.com')) return 'pinterest';
    return null;
  }
  
  function matchesCustomDomain(url, customDomains) {
    try {
      let hostname = '';
      try { hostname = new URL(url).hostname.toLowerCase(); } catch(e) {
        let match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/?#]+)/i);
        hostname = match ? match[1].toLowerCase() : url.toLowerCase();
      }
      const cleanHostname = hostname.replace(/^www\./, '');
      for (const domain of Object.keys(customDomains)) {
        const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
        if (cleanHostname === cleanDomain || cleanHostname.endsWith('.' + cleanDomain)) return domain;
      }
    } catch(e) {
      for (const domain of Object.keys(customDomains)) {
        if (url.toLowerCase().includes(domain.toLowerCase())) return domain;
      }
    }
    return null;
  }
  
  function checkAndBlock() {
    if (!isExtensionValid()) return;
    const url = window.location.href;
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('edge://')) return;
    
    const currentSite = getCurrentSite(url);
    if (currentSite) {
      safeStorageGet([currentSite], (result) => {
        if (result[currentSite] === true && !isBlocking) createBlocker();
        else if (result[currentSite] !== true && isBlocking) removeBlocker();
      });
    } else {
      safeStorageGet(['customDomains'], (result) => {
        const customDomains = result.customDomains || {};
        const matchedDomain = matchesCustomDomain(url, customDomains);
        if (matchedDomain && customDomains[matchedDomain] === true && !isBlocking) createBlocker();
        else if ((!matchedDomain || customDomains[matchedDomain] !== true) && isBlocking) removeBlocker();
      });
    }
  }
  
  function initStorageListener() {
    if (!isExtensionValid()) return;
    const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
    storage.onChanged.addListener((changes) => {
      const relevantKeys = ['blockYoutube', 'instagram', 'twitter', 'tiktok', 'reddit', 'pinterest', 'customDomains', 'theme'];
      if (relevantKeys.some(key => changes[key])) setTimeout(checkAndBlock, 100);
    });
  }
  
  function initUrlWatcher() {
    let lastUrl = window.location.href;
    setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) { lastUrl = currentUrl; setTimeout(checkAndBlock, 200); }
    }, 1000);
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function() { originalPushState.apply(this, arguments); checkUrlChange(); };
    history.replaceState = function() { originalReplaceState.apply(this, arguments); checkUrlChange(); };
    window.addEventListener('popstate', () => checkUrlChange());
    function checkUrlChange() { setTimeout(checkAndBlock, 200); }
  }
  
  function initMessageListener() {
    const runtime = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime : browser.runtime;
    runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SETTINGS_UPDATED') { setTimeout(checkAndBlock, 100); sendResponse({ success: true }); }
      return true;
    });
  }
  
  function init() {
    console.log("Initializing blocker for:", window.location.href);
    if (!isExtensionValid()) { setTimeout(init, 1000); return; }
    setTimeout(() => { checkAndBlock(); initStorageListener(); initUrlWatcher(); initMessageListener(); }, 500);
  }
  
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isExtensionValid()) setTimeout(checkAndBlock, 100);
  });
})();