(function() {
  // ===== ROBUST AUDIO DOWNLOAD MANAGER =====
  const GITHUB_BASE = 'https://raw.githubusercontent.com/reapertakumi/YouTube-Study-Enhancer/main';
  const MANIFEST_URL = 'https://raw.githubusercontent.com/reapertakumi/YouTube-Study-Enhancer/main/audio-manifest.json';
  const DB_NAME = 'StudyEnhancerAudio';
  const DB_VERSION = 2;
  const STORE_NAME = 'audioFiles';
  
  let db = null;
  let isDownloading = false;
  let popupElement = null;
  let pendingCallback = null;
  let remoteManifest = null;
  
  // Current audio files (will be populated from manifest)
  let currentAudioFiles = {
    music: [],
    sounds: []
  };
  
  // Custom user-added music
  let customPlaylist = [];
  
  // Open IndexedDB
  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (db && db.name === DB_NAME) {
        resolve(db);
        return;
      }
      
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'fileName' });
        }
      };
    });
  }
  
  // Save file to IndexedDB with metadata
  async function saveToIndexedDB(fileName, blob, metadata = {}) {
    await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ 
        fileName: fileName, 
        blob: blob, 
        timestamp: Date.now(),
        ...metadata
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  // Delete file from IndexedDB
  async function deleteFromIndexedDB(fileName) {
    await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(fileName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  // Get file from IndexedDB
  async function getFromIndexedDB(fileName) {
    await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fileName);
      request.onsuccess = () => resolve(request.result ? request.result.blob : null);
      request.onerror = () => reject(request.error);
    });
  }
  
  // Get stored manifest from IndexedDB
  async function getStoredManifest() {
    await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('_manifest');
      request.onsuccess = () => resolve(request.result ? request.result.data : null);
      request.onerror = () => reject(request.error);
    });
  }
  
  // Save manifest to IndexedDB
  async function saveManifestToDB(manifest) {
    await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ fileName: '_manifest', data: manifest, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  // Fetch remote manifest (with cache busting)
  async function fetchRemoteManifest() {
    try {
      const cacheBuster = '?t=' + Date.now();
      const url = MANIFEST_URL + cacheBuster;
      console.log('Fetching manifest from:', url);
      
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      remoteManifest = manifest;
      
      console.log('Manifest loaded successfully');
      console.log('Version:', manifest.version);
      console.log('Last updated:', manifest.lastUpdated);
      console.log('Music files:', manifest.files.music.length);
      console.log('Sound files:', manifest.files.sounds.length);
      
      return manifest;
    } catch (error) {
      console.error('Error fetching manifest:', error);
      return null;
    }
  }
  
  // Build audio files list from manifest
  function buildAudioFilesFromManifest(manifest) {
    if (!manifest || !manifest.files) return null;
    
    const musicFiles = manifest.files.music.map(file => ({
      name: file.fileName,
      url: `${GITHUB_BASE}/music/${file.fileName}`,
      sizeKB: file.sizeKB || 0,
      hash: file.hash || '',
      isCustom: false
    }));
    
    const soundFiles = manifest.files.sounds.map(file => ({
      name: file.fileName,
      url: `${GITHUB_BASE}/sounds/${file.fileName}`,
      sizeKB: file.sizeKB || 0,
      hash: file.hash || '',
      isCustom: false
    }));
    
    console.log('Built audio files from manifest:');
    console.log('Music count:', musicFiles.length);
    console.log('Music total KB:', musicFiles.reduce((sum, f) => sum + f.sizeKB, 0));
    console.log('Sounds count:', soundFiles.length);
    console.log('Sounds total KB:', soundFiles.reduce((sum, f) => sum + f.sizeKB, 0));
    
    return { music: musicFiles, sounds: soundFiles };
  }
  
  // Calculate total size in KB
  function getTotalSizeKB() {
    const musicTotal = currentAudioFiles.music.reduce((sum, f) => sum + (f.sizeKB || 0), 0);
    const soundsTotal = currentAudioFiles.sounds.reduce((sum, f) => sum + (f.sizeKB || 0), 0);
    return musicTotal + soundsTotal;
  }
  
  // Calculate total size in MB
  function getTotalSizeMB() {
    return (getTotalSizeKB() / 1024).toFixed(1);
  }
  
  // Check if audio is downloaded
  async function isAudioDownloaded() {
    try {
      await openDatabase();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const allFiles = [...currentAudioFiles.music, ...currentAudioFiles.sounds];
      if (allFiles.length === 0) return false;
      
      return new Promise((resolve) => {
        const countRequest = store.count();
        countRequest.onsuccess = () => {
          let count = countRequest.result;
          const hasManifest = count > 0;
          const actualFileCount = hasManifest ? count - 1 : count;
          resolve(actualFileCount >= allFiles.length);
        };
        countRequest.onerror = () => resolve(false);
      });
    } catch (error) {
      console.error('Error checking downloaded status:', error);
      return false;
    }
  }
  
  // Download a single file with retry logic
  async function downloadFileWithRetry(file, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Downloading ${file.name} (${file.sizeKB} KB) - attempt ${attempt}/${maxRetries}`);
        
        const response = await fetch(file.url, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        
        if (blob.size < 1000) {
          throw new Error('File too small - likely an error page');
        }
        
        await saveToIndexedDB(file.name, blob, { sizeKB: file.sizeKB });
        console.log(`Downloaded ${file.name} (${Math.round(blob.size / 1024)} KB)`);
        return { success: true, fileName: file.name };
        
      } catch (error) {
        console.error(`Attempt ${attempt} failed for ${file.name}:`, error);
        
        if (attempt === maxRetries) {
          return { success: false, fileName: file.name, error: error.message };
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    return { success: false, fileName: file.name, error: 'Max retries exceeded' };
  }
  
  // Download all files with progress
  async function downloadAllFiles(onProgress, onComplete, onError) {
    if (isDownloading) {
      if (onError) onError('Download already in progress');
      return;
    }
    
    isDownloading = true;
    const allFiles = [...currentAudioFiles.music, ...currentAudioFiles.sounds];
    let completed = 0;
    let failed = 0;
    const failedFiles = [];
    
    console.log(`Starting download of ${allFiles.length} files (${getTotalSizeMB()} MB total)`);
    
    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: allFiles.length,
          fileName: file.name,
          sizeKB: file.sizeKB,
          status: 'downloading'
        });
      }
      
      const result = await downloadFileWithRetry(file);
      
      if (result.success) {
        completed++;
        if (onProgress) {
          onProgress({
            current: completed,
            total: allFiles.length,
            fileName: file.name,
            sizeKB: file.sizeKB,
            status: 'completed'
          });
        }
      } else {
        failed++;
        failedFiles.push(result.fileName);
        if (onProgress) {
          onProgress({
            current: completed + failed,
            total: allFiles.length,
            fileName: file.name,
            status: 'failed',
            error: result.error
          });
        }
      }
    }
    
    // Save manifest to DB after successful download
    if (remoteManifest) {
      await saveManifestToDB(remoteManifest);
      localStorage.setItem('audioLibraryVersion', remoteManifest.version);
      console.log('Saved manifest version to localStorage:', remoteManifest.version);
    }
    
    isDownloading = false;
    
    if (failed === 0) {
      console.log(`Download complete! ${completed}/${allFiles.length} files`);
      if (onComplete) onComplete(completed, allFiles.length);
    } else {
      console.error(`Download completed with ${failed} failures`);
      if (onError) onError(`Failed to download ${failed} files: ${failedFiles.join(', ')}`);
    }
  }
  
  // Check for updates (compares local vs remote version)
  async function checkForUpdates() {
    console.log('Checking for updates');
    
    const remote = await fetchRemoteManifest();
    if (!remote) {
      console.log('Could not fetch remote manifest');
      return { hasUpdates: false, error: 'Cannot check for updates' };
    }
    
    const localVersion = localStorage.getItem('audioLibraryVersion');
    
    console.log('Local version:', localVersion);
    console.log('Remote version:', remote.version);
    
    if (!localVersion) {
      console.log('No local version found - first time user');
      return { hasUpdates: false, firstTime: true };
    }
    
    if (remote.version !== localVersion) {
      console.log(`Update available: ${localVersion} → ${remote.version}`);
      
      const updatedFiles = buildAudioFilesFromManifest(remote);
      if (updatedFiles) {
        currentAudioFiles = updatedFiles;
      }
      
      return { 
        hasUpdates: true, 
        newVersion: remote.version, 
        oldVersion: localVersion,
        lastUpdated: remote.lastUpdated,
        totalSizeMB: getTotalSizeMB()
      };
    }
    
    console.log('No updates available - already on latest version');
    return { hasUpdates: false, currentVersion: remote.version };
  }
  
  // SVG Icon Helpers
  function getDownloadIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 48px; height: 48px; margin-bottom: 16px;">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>`;
  }
  
  function getCheckmarkIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 48px; height: 48px; margin-bottom: 16px;">
      <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>`;
  }
  
  function getWarningIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 48px; height: 48px; margin-bottom: 16px;">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>`;
  }
  
  function getEyeOpenIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>`;
  }
  
  function getEyeClosedIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>`;
  }
  
  function getLibraryIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 22px; height: 22px;">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>`;
  }
  
  function getAddIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>`;
  }
  
  function getDeleteIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
      <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>`;
  }
  
  // Custom Confirm Popup
  function showCustomConfirm(message, onConfirm) {
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
  
  // Show update notification popup
  async function showUpdateNotification() {
    const updateInfo = await checkForUpdates();
    
    if (updateInfo.hasUpdates && updateInfo.newVersion) {
      console.log('Showing update notification for version', updateInfo.newVersion);
      
      const existingNotification = document.getElementById('updateNotification');
      if (existingNotification) existingNotification.remove();
      
      const totalFiles = currentAudioFiles.music.length + currentAudioFiles.sounds.length;
      const totalSizeMB = updateInfo.totalSizeMB || getTotalSizeMB();
      
      const notification = document.createElement('div');
      notification.id = 'updateNotification';
      notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10001;
        background: rgba(20, 20, 28, 0.98);
        backdrop-filter: blur(24px);
        border-radius: 28px;
        padding: 28px 32px;
        text-align: center;
        border: 1px solid rgba(168, 85, 247, 0.3);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        min-width: 320px;
        max-width: 400px;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      
      notification.innerHTML = `
        ${getDownloadIcon()}
        <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 8px; color: #c084fc;">Update Available</div>
        <div style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 20px; line-height: 1.4;">
          A new version of the audio library is available.<br>
          Version ${updateInfo.oldVersion} → ${updateInfo.newVersion}<br>
          Size: ${totalSizeMB} MB (${totalFiles} files)
        </div>
        <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 20px;">
          <button id="updateYesBtn" style="
            background: linear-gradient(135deg, #a855f7, #7c3aed);
            border: none;
            padding: 10px 28px;
            border-radius: 40px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s ease;
          ">Update Now</button>
          <button id="updateNoBtn" style="
            background: transparent;
            border: 1px solid rgba(255,255,255,0.2);
            padding: 10px 28px;
            border-radius: 40px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s ease;
          ">Later</button>
        </div>
        <div id="updateProgressArea" style="display: none;">
          <div style="background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; height: 8px; margin-bottom: 12px;">
            <div id="updateProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #a855f7, #c084fc); transition: width 0.3s;"></div>
          </div>
          <div id="updateStatusText" style="font-size: 0.75rem; opacity: 0.8; margin-bottom: 8px;"></div>
          <div id="updateCurrentFile" style="font-size: 0.7rem; opacity: 0.6;"></div>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      const yesBtn = document.getElementById('updateYesBtn');
      const noBtn = document.getElementById('updateNoBtn');
      const progressArea = document.getElementById('updateProgressArea');
      const progressBar = document.getElementById('updateProgressBar');
      const statusText = document.getElementById('updateStatusText');
      const currentFileText = document.getElementById('updateCurrentFile');
      
      yesBtn.addEventListener('click', async () => {
        yesBtn.disabled = true;
        yesBtn.style.opacity = '0.6';
        noBtn.disabled = true;
        noBtn.style.opacity = '0.6';
        progressArea.style.display = 'block';
        
        localStorage.removeItem('audioLibraryVersion');
        
        await downloadAllFiles(
          (progress) => {
            const percent = (progress.current / progress.total) * 100;
            progressBar.style.width = `${percent}%`;
            
            if (progress.status === 'downloading') {
              statusText.textContent = `Updating... ${Math.round(percent)}% (${progress.current}/${progress.total})`;
              currentFileText.textContent = `${progress.fileName.substring(0, 35)}... (${progress.sizeKB} KB)`;
            } else if (progress.status === 'completed') {
              statusText.textContent = `Updated: ${progress.current}/${progress.total}`;
              currentFileText.textContent = '';
            } else if (progress.status === 'failed') {
              statusText.textContent = `Failed: ${progress.fileName}`;
              currentFileText.textContent = `Error: ${progress.error}`;
            }
          },
          async (completed, total) => {
            notification.innerHTML = `
              ${getCheckmarkIcon()}
              <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 8px; color: #4ade80;">Update Complete</div>
              <div style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 20px;">
                Successfully updated to version ${updateInfo.newVersion}<br>
                (${completed}/${total} files, ${totalSizeMB} MB)
              </div>
              <button id="closeUpdateSuccessBtn" style="
                background: linear-gradient(135deg, #a855f7, #7c3aed);
                border: none;
                padding: 10px 28px;
                border-radius: 40px;
                color: white;
                font-weight: 600;
                cursor: pointer;
                font-size: 0.9rem;
              ">Continue</button>
            `;
            
            const closeBtn = document.getElementById('closeUpdateSuccessBtn');
            closeBtn.addEventListener('click', () => {
              notification.remove();
              location.reload();
            });
          },
          (error) => {
            notification.innerHTML = `
              ${getWarningIcon()}
              <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 8px; color: #ff6b6b;">Update Failed</div>
              <div style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 20px;">
                ${error}<br><br>
                Please check your internet connection and try again.
              </div>
              <button id="updateRetryBtn" style="
                background: linear-gradient(135deg, #a855f7, #7c3aed);
                border: none;
                padding: 10px 28px;
                border-radius: 40px;
                color: white;
                font-weight: 600;
                cursor: pointer;
                font-size: 0.9rem;
              ">Retry</button>
            `;
            
            const retryBtn = document.getElementById('updateRetryBtn');
            retryBtn.addEventListener('click', () => {
              notification.remove();
              showUpdateNotification();
            });
          }
        );
      });
      
      noBtn.addEventListener('click', () => {
        notification.remove();
      });
    }
  }
  
  // Create audio URL from blob
  async function getAudioUrl(fileName) {
    const blob = await getFromIndexedDB(fileName);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  }
  
  // Show download popup
  function showDownloadPopup(callback) {
    pendingCallback = callback;
    
    if (popupElement) {
      popupElement.remove();
    }
    
    const totalFiles = currentAudioFiles.music.length + currentAudioFiles.sounds.length;
    const totalSizeKB = getTotalSizeKB();
    const totalSizeMB = (totalSizeKB / 1024).toFixed(1);
    
    console.log('Download popup - Total files:', totalFiles);
    console.log('Download popup - Total size KB:', totalSizeKB);
    console.log('Download popup - Total size MB:', totalSizeMB);
    
    popupElement = document.createElement('div');
    popupElement.id = 'audioDownloadPopup';
    popupElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10000;
      background: rgba(20, 20, 28, 0.98);
      backdrop-filter: blur(24px);
      border-radius: 28px;
      padding: 28px 32px;
      text-align: center;
      border: 1px solid rgba(168, 85, 247, 0.3);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      min-width: 320px;
      max-width: 400px;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    
    popupElement.innerHTML = `
      ${getDownloadIcon()}
      <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 8px; color: #c084fc;">Download Audio Library</div>
      <div style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 20px; line-height: 1.4;">
        This feature requires ${totalFiles} audio files (${totalSizeMB} MB).<br>
        Download once and use offline.
      </div>
      <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 20px;">
        <button id="downloadYesBtn" style="
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          border: none;
          padding: 10px 28px;
          border-radius: 40px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        ">Yes, Download</button>
        <button id="downloadNoBtn" style="
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 10px 28px;
          border-radius: 40px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        ">No, Thanks</button>
      </div>
      <div id="downloadProgressArea" style="display: none;">
        <div style="background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; height: 8px; margin-bottom: 12px;">
          <div id="downloadProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #a855f7, #c084fc); transition: width 0.3s;"></div>
        </div>
        <div id="downloadStatusText" style="font-size: 0.75rem; opacity: 0.8; margin-bottom: 8px;"></div>
        <div id="downloadCurrentFile" style="font-size: 0.7rem; opacity: 0.6;"></div>
      </div>
    `;
    
    document.body.appendChild(popupElement);
    
    const yesBtn = document.getElementById('downloadYesBtn');
    const noBtn = document.getElementById('downloadNoBtn');
    const progressArea = document.getElementById('downloadProgressArea');
    const progressBar = document.getElementById('downloadProgressBar');
    const statusText = document.getElementById('downloadStatusText');
    const currentFileText = document.getElementById('downloadCurrentFile');
    
    yesBtn.addEventListener('click', async () => {
      yesBtn.disabled = true;
      yesBtn.style.opacity = '0.6';
      noBtn.disabled = true;
      noBtn.style.opacity = '0.6';
      progressArea.style.display = 'block';
      
      await downloadAllFiles(
        (progress) => {
          const percent = (progress.current / progress.total) * 100;
          progressBar.style.width = `${percent}%`;
          
          if (progress.status === 'downloading') {
            statusText.textContent = `Downloading... ${Math.round(percent)}% (${progress.current}/${progress.total})`;
            currentFileText.textContent = `${progress.fileName.substring(0, 35)}... (${progress.sizeKB} KB)`;
          } else if (progress.status === 'completed') {
            statusText.textContent = `Completed: ${progress.current}/${progress.total}`;
            currentFileText.textContent = '';
          } else if (progress.status === 'failed') {
            statusText.textContent = `Failed: ${progress.fileName}`;
            currentFileText.textContent = `Error: ${progress.error}`;
          }
        },
        async (completed, total) => {
          popupElement.innerHTML = `
            ${getCheckmarkIcon()}
            <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 8px; color: #4ade80;">Download Complete</div>
            <div style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 20px;">
              Successfully downloaded ${completed}/${total} audio files (${getTotalSizeMB()} MB).
            </div>
            <button id="closeSuccessBtn" style="
              background: linear-gradient(135deg, #a855f7, #7c3aed);
              border: none;
              padding: 10px 28px;
              border-radius: 40px;
              color: white;
              font-weight: 600;
              cursor: pointer;
              font-size: 0.9rem;
            ">Start Using</button>
          `;
          
          const closeBtn = document.getElementById('closeSuccessBtn');
          closeBtn.addEventListener('click', () => {
            popupElement.remove();
            popupElement = null;
            if (pendingCallback) {
              pendingCallback();
              pendingCallback = null;
            }
            location.reload();
          });
        },
        (error) => {
          popupElement.innerHTML = `
            ${getWarningIcon()}
            <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 8px; color: #ff6b6b;">Download Failed</div>
            <div style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 20px;">
              ${error}<br><br>
              Please check your internet connection and try again.
            </div>
            <button id="retryBtn" style="
              background: linear-gradient(135deg, #a855f7, #7c3aed);
              border: none;
              padding: 10px 28px;
              border-radius: 40px;
              color: white;
              font-weight: 600;
              cursor: pointer;
              font-size: 0.9rem;
            ">Retry</button>
          `;
          
          const retryBtn = document.getElementById('retryBtn');
          retryBtn.addEventListener('click', () => {
            popupElement.remove();
            popupElement = null;
            showDownloadPopup(pendingCallback);
          });
        }
      );
    });
    
    noBtn.addEventListener('click', () => {
      popupElement.remove();
      popupElement = null;
      pendingCallback = null;
    });
  }
  
  // Wrapper for audio actions
  async function withAudioCheck(callback) {
    console.log('withAudioCheck called - currentAudioFiles has', currentAudioFiles.music.length, 'music files');
    
    if (currentAudioFiles.music.length === 0) {
      const manifest = await fetchRemoteManifest();
      if (manifest) {
        const updatedFiles = buildAudioFilesFromManifest(manifest);
        if (updatedFiles) {
          currentAudioFiles = updatedFiles;
          console.log('Loaded audio files from manifest:', getTotalSizeKB(), 'KB total');
        }
      }
    }
    
    const downloaded = await isAudioDownloaded();
    console.log('Audio downloaded?', downloaded);
    
    if (downloaded) {
      callback();
    } else {
      showDownloadPopup(callback);
    }
  }

  // ===== UI COMPONENTS =====
  
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

  const mainLightSizeSlider = document.getElementById("mainLightSize");
  const secondLightSizeSlider = document.getElementById("secondLightSize");
  const mainLightSizeValue = document.getElementById("mainLightSizeValue");
  const secondLightSizeValue = document.getElementById("secondLightSizeValue");

  const mainPositions = {
    center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
    "top-left": { top: "5%", left: "5%", transform: "translate(0, 0)" },
    "top-right": { top: "5%", left: "95%", transform: "translate(-100%, 0)" },
    "bottom-left": { top: "95%", left: "5%", transform: "translate(0, -100%)" },
    "bottom-right": { top: "95%", left: "95%", transform: "translate(-100%, -100%)" }
  };
  const cornersList = ["top-left", "top-right", "bottom-right", "bottom-left"];
  let currentCornerIdx = 0;

  const textSpeedMap = {
    none: 0,
    slow: 8,
    medium: 4,
    fast: 2
  };

  let state = {
    secondLight: false,
    mainColor: "rgb(168, 85, 247)",
    secondColor: "rgb(196, 181, 253)",
    movement: "orbit",        // Default: Orbit Dance
    speed: 20,
    mainPosition: "center",
    textAnimationSpeed: "none",
    mainLightSize: 400,
    secondLightSize: 400,     // Changed from 800 to 400 (50% of max)
    mainLightCustomTop: null,
    mainLightCustomLeft: null
  };

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

  function updateActiveSpeedButton() {
    const buttons = [speedNone, speedSlow, speedMedium, speedFast];
    buttons.forEach(btn => btn.classList.remove('active'));
    
    switch(state.textAnimationSpeed) {
      case 'none': speedNone.classList.add('active'); break;
      case 'slow': speedSlow.classList.add('active'); break;
      case 'medium': speedMedium.classList.add('active'); break;
      case 'fast': speedFast.classList.add('active'); break;
    }
  }

  function createWaveText() {
    const text = "Study Mode";
    const chars = [];
    for (let i = 0; i < text.length; i++) {
      chars.push({
        char: text[i],
        isSpace: text[i] === ' '
      });
    }
    
    waveTitleEl.innerHTML = chars.map((item) => {
      if (item.isSpace) {
        return `<span class="wave-space"></span>`;
      }
      return `<span class="wave-letter">${item.char}</span>`;
    }).join('');
    
    updateTextAnimationSpeed();
  }

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
    if (state.mainPosition === 'custom') {
      if (state.mainLightCustomTop && state.mainLightCustomLeft) {
        mainLight.style.top = state.mainLightCustomTop;
        mainLight.style.left = state.mainLightCustomLeft;
        mainLight.style.transform = 'none';
      } else {
        const pos = mainPositions.center;
        mainLight.style.top = pos.top;
        mainLight.style.left = pos.left;
        mainLight.style.transform = pos.transform;
      }
    } else {
      const pos = mainPositions[state.mainPosition] || mainPositions.center;
      mainLight.style.top = pos.top;
      mainLight.style.left = pos.left;
      mainLight.style.transform = pos.transform;
      state.mainLightCustomTop = null;
      state.mainLightCustomLeft = null;
    }
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
      secondLightSize: state.secondLightSize,
      mainLightCustomTop: state.mainLightCustomTop,
      mainLightCustomLeft: state.mainLightCustomLeft
    };
    localStorage.setItem("studyMode", JSON.stringify(toStore));
  }

  function loadFromLocal() {
    const saved = localStorage.getItem("studyMode");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };
        
        if (typeof state.mainLightSize !== 'number' || state.mainLightSize < 100 || state.mainLightSize > 400) {
          state.mainLightSize = 400;
        }
        if (typeof state.secondLightSize !== 'number' || state.secondLightSize < 200 || state.secondLightSize > 800) {
          state.secondLightSize = 400;  // Changed from 800 to 400
        }
        
        // Ensure movement defaults to orbit if not present or invalid
        if (!state.movement || (state.movement !== "orbit" && state.movement !== "bounce" && state.movement !== "none")) {
          state.movement = "orbit";
        }
        
        // Restore custom positioning for main light
        if (state.mainPosition === 'custom' && state.mainLightCustomTop && state.mainLightCustomLeft) {
          mainLight.style.top = state.mainLightCustomTop;
          mainLight.style.left = state.mainLightCustomLeft;
          mainLight.style.transform = 'none';
        }
      } catch(e) {
        console.error("Error loading settings:", e);
      }
    }
  }

  function randomIcon() {
    const randomIndex = Math.floor(Math.random() * icons.length);
    iconEl.textContent = icons[randomIndex];
    iconEl.style.transform = "scale(1.2)";
    setTimeout(() => {
      iconEl.style.transform = "scale(1)";
    }, 200);
  }

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
        
        if (state.mainPosition !== 'custom') {
          state.mainLightCustomTop = null;
          state.mainLightCustomLeft = null;
        }
        
        saveToLocal();
        fullRender();
      }
    }
  }

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
    
    if (state.mainPosition !== 'custom') {
      state.mainLightCustomTop = null;
      state.mainLightCustomLeft = null;
    }
    
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

  createWaveText();
  loadFromLocal();
  fullRender();
  randomIcon();
  currentCornerIdx = 0;
  if (state.movement === "none" && state.secondLight) applySecondLightBehavior();

  // ===== MAIN LIGHT DRAGGABLE (for custom position) =====
  let isMainLightDragging = false;
  let mainLightDragStartX, mainLightDragStartY;

  function makeMainLightDraggable() {
    if (!mainLight) return;
    
    mainLight.style.cursor = 'grab';
    mainLight.style.userSelect = 'none';
    
    mainLight.addEventListener('mousedown', (e) => {
      if (state.mainPosition !== 'custom') return;
      if (e.target.closest('.settings-toggle, .action-btn, .control-btn, .eye-toggle')) return;
      
      isMainLightDragging = true;
      mainLight.style.cursor = 'grabbing';
      mainLight.style.transition = 'none';
      
      const rect = mainLight.getBoundingClientRect();
      mainLightDragStartX = e.clientX - rect.left;
      mainLightDragStartY = e.clientY - rect.top;
      
      mainLight.style.position = 'fixed';
      mainLight.style.top = rect.top + 'px';
      mainLight.style.left = rect.left + 'px';
      mainLight.style.transform = 'none';
      
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isMainLightDragging) return;
      
      let newTop = e.clientY - mainLightDragStartY;
      let newLeft = e.clientX - mainLightDragStartX;
      
      const lightSize = state.mainLightSize;
      newTop = Math.max(0, Math.min(window.innerHeight - lightSize, newTop));
      newLeft = Math.max(0, Math.min(window.innerWidth - lightSize, newLeft));
      
      mainLight.style.top = newTop + 'px';
      mainLight.style.left = newLeft + 'px';
    });
    
    document.addEventListener('mouseup', () => {
      if (isMainLightDragging) {
        isMainLightDragging = false;
        mainLight.style.cursor = 'grab';
        mainLight.style.transition = '';
        
        state.mainLightCustomTop = mainLight.style.top;
        state.mainLightCustomLeft = mainLight.style.left;
        saveToLocal();
        
        mainLight.style.animation = 'none';
        mainLight.offsetHeight;
        mainLight.style.animation = '';
      }
    });
  }

  makeMainLightDraggable();

  // ===== MUSIC PLAYER =====
  let playlist = [];
  let currentTrack = 0;
  let audio = new Audio();
  let isPlaying = false;
  let audioBlobUrls = new Map();

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

  // Load saved volume
  const savedVolume = localStorage.getItem('musicVolume');
  if (savedVolume !== null) {
    audio.volume = parseFloat(savedVolume);
    if (volumeSlider) volumeSlider.value = savedVolume * 100;
  } else {
    audio.volume = 0.7;
    if (volumeSlider) volumeSlider.value = 70;
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const vol = e.target.value / 100;
      audio.volume = vol;
      localStorage.setItem('musicVolume', vol);
    });
  }

  function loadCustomMusic() {
    const saved = localStorage.getItem('customPlaylist');
    if (saved) {
      try {
        customPlaylist = JSON.parse(saved);
        console.log('Loaded custom music:', customPlaylist.length, 'files');
      } catch(e) {
        console.error('Error loading custom music:', e);
      }
    }
  }

  function saveCustomMusic() {
    localStorage.setItem('customPlaylist', JSON.stringify(customPlaylist));
  }

  async function deleteCustomAudioFile(customItem, index) {
    showCustomConfirm(`Delete "${customItem.originalName || customItem.name}" from your library?`, async () => {
      await deleteFromIndexedDB(customItem.name);
      customPlaylist.splice(index, 1);
      saveCustomMusic();
      
      const currentPlayingFile = playlist[currentTrack]?.file;
      if (currentPlayingFile === customItem.name) {
        if (playlist.length > 1) {
          nextTrack();
        } else {
          audio.pause();
          isPlaying = false;
          playPauseBtn.textContent = '▶';
          artistNameSpan.textContent = 'Audio Library';
          songNameSpan.textContent = 'No songs available';
        }
      }
      
      rebuildFullPlaylist();
      if (libraryOpen) renderLibrary();
    });
  }

  async function addCustomAudioFile(file) {
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file (MP3, WAV, OGG, etc.)');
      return false;
    }
    
    const fileName = `custom_${Date.now()}_${file.name}`;
    const blob = await file.arrayBuffer();
    
    await saveToIndexedDB(fileName, new Blob([blob], { type: file.type }), { 
      sizeKB: Math.round(blob.byteLength / 1024),
      isCustom: true,
      originalName: file.name
    });
    
    customPlaylist.push({
      name: fileName,
      originalName: file.name,
      url: null,
      sizeKB: Math.round(blob.byteLength / 1024),
      isCustom: true
    });
    
    saveCustomMusic();
    return true;
  }

  function rebuildFullPlaylist() {
    const manifestMusic = currentAudioFiles.music.map(file => ({
      artist: file.name.includes('fassounds') ? 'fassounds' :
              file.name.includes('lofidreams') ? 'lofidreams' :
              file.name.includes('lofi_music_library') ? 'lofi_music_library' :
              file.name.includes('mondamusic') ? 'mondamusic' :
              file.name.includes('sonican') ? 'sonican' :
              file.name.includes('watermello') ? 'watermello' : 'Lofi Artist',
      song: file.name.replace(/\.opus$/, '').replace(/-/g, ' ').substring(0, 40),
      file: file.name,
      isCustom: false
    }));
    
    const customMusic = customPlaylist.map(custom => ({
      artist: 'My Music',
      song: custom.originalName || custom.name.replace(/^custom_\d+_/, '').replace(/\.(opus|mp3|wav|ogg)$/, ''),
      file: custom.name,
      isCustom: true,
      customIndex: customPlaylist.findIndex(c => c.name === custom.name)
    }));
    
    playlist = [...manifestMusic, ...customMusic];
    console.log('Full playlist rebuilt:', playlist.length, 'tracks');
  }

  function buildPlaylistFromManifest() {
    rebuildFullPlaylist();
  }

  async function loadTrack(index) {
    const track = playlist[index];
    if (!track) return;
    
    artistNameSpan.textContent = track.artist;
    songNameSpan.textContent = track.song;
    
    let audioUrl = await getAudioUrl(track.file);
    
    if (!audioUrl && track.isCustom) {
      const customFile = customPlaylist.find(c => c.name === track.file);
      if (customFile && customFile.url) {
        audioUrl = customFile.url;
      }
    }
    
    if (audioUrl) {
      if (audioBlobUrls.has(track.file)) {
        URL.revokeObjectURL(audioBlobUrls.get(track.file));
      }
      audioBlobUrls.set(track.file, audioUrl);
      audio.src = audioUrl;
      audio.load();
    }
    
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
    if (playlist.length === 0) return;
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
    if (playlist.length === 0) return;
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
  audio.addEventListener('ended', () => {
    withAudioCheck(() => nextTrack());
  });
  audio.addEventListener('canplay', () => {
    timeTotal.textContent = formatTime(audio.duration);
  });

  playPauseBtn.addEventListener('click', () => {
    withAudioCheck(() => togglePlayPause());
  });
  
  prevBtn.addEventListener('click', () => {
    withAudioCheck(() => prevTrack());
  });
  
  nextBtn.addEventListener('click', () => {
    withAudioCheck(() => nextTrack());
  });
  
  progressBar.addEventListener('click', (e) => {
    withAudioCheck(() => seek(e));
  });

  // ===== AMBIENT SOUND MIXER =====
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
    fireplace: 'fireplace.opus',
    wind: 'wind.opus',
    nature: 'bird.opus',
    rain: 'rain.opus',
    thunder: 'thunder.opus',
    waves: 'ocean.opus'
  };
  
  async function createAudioElement(soundName) {
    const fileName = soundFiles[soundName];
    const audioUrl = await getAudioUrl(fileName);
    const audio = new Audio();
    
    if (audioUrl) {
      audio.src = audioUrl;
    }
    audio.loop = true;
    audio.volume = ambientVolumes[soundName] * masterVolume;
    
    audio.addEventListener('error', (e) => {
      console.error(`Error loading sound ${soundName}:`, e);
    });
    
    return audio;
  }
  
  soundBtn.addEventListener('click', () => {
    withAudioCheck(() => {
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
      createAudioElement(soundName).then(audio => {
        ambientAudios[soundName] = audio;
      });
    }
    if (savedVolume) {
      ambientVolumes[soundName] = parseFloat(savedVolume);
      volumeSlider.value = ambientVolumes[soundName] * 100;
      if (ambientAudios[soundName]) {
        ambientAudios[soundName].volume = ambientVolumes[soundName] * masterVolume;
      }
    }
    
    toggle.addEventListener('click', () => {
      withAudioCheck(async () => {
        ambientEnabled[soundName] = !ambientEnabled[soundName];
        
        if (ambientEnabled[soundName]) {
          toggle.classList.add('active');
          volumeSlider.disabled = false;
          
          try {
            if (!ambientAudios[soundName]) {
              ambientAudios[soundName] = await createAudioElement(soundName);
            }
            
            ambientAudios[soundName].volume = ambientVolumes[soundName] * masterVolume;
            
            const playPromise = ambientAudios[soundName].play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.log(`Playback failed for ${soundName}:`, error);
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

  // ===== POMODORO TIMER =====
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

  async function playChime() {
    const chimeUrl = await getAudioUrl('break.opus');
    if (chimeUrl) {
      try {
        if (chimeAudio) {
          chimeAudio.pause();
          chimeAudio.currentTime = 0;
        }
        chimeAudio = new Audio(chimeUrl);
        chimeAudio.volume = 0.6;
        chimeAudio.play().catch(e => console.log('Chime sound error:', e));
      } catch(e) {
        console.log('Could not play chime sound:', e);
      }
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

  // ===== TO-DO LIST =====
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
        { text: "Read a book", completed: true },
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
      showCustomConfirm('Are you sure you want to clear all todos?', () => {
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

  // ===== LIBRARY POPUP =====
  const libraryBtn = document.getElementById('libraryBtn');
  const libraryPopup = document.getElementById('libraryPopup');
  const closeLibraryBtn = document.getElementById('closeLibraryBtn');
  const libraryList = document.getElementById('libraryList');
  const librarySearchInput = document.getElementById('librarySearchInput');
  const libraryStats = document.getElementById('libraryStats');
  
  let libraryOpen = false;
  let currentSearchTerm = '';
  
  // Create Add Music button if it doesn't exist
  let addMusicBtn = document.getElementById('addMusicBtn');
  if (!addMusicBtn && libraryPopup) {
    const libraryHeader = document.querySelector('.library-header');
    if (libraryHeader) {
      let rightSideWrapper = document.querySelector('.library-header-right');
      if (!rightSideWrapper) {
        rightSideWrapper = document.createElement('div');
        rightSideWrapper.className = 'library-header-right';
        
        addMusicBtn = document.createElement('button');
        addMusicBtn.id = 'addMusicBtn';
        addMusicBtn.className = 'add-music-btn';
        addMusicBtn.title = 'Add your own music';
        addMusicBtn.innerHTML = `${getAddIcon()} Add Music`;
        
        const existingCloseBtn = document.querySelector('.close-library-btn');
        if (existingCloseBtn) {
          existingCloseBtn.parentNode.removeChild(existingCloseBtn);
          rightSideWrapper.appendChild(addMusicBtn);
          rightSideWrapper.appendChild(existingCloseBtn);
          libraryHeader.appendChild(rightSideWrapper);
        }
      }
    }
  }
  
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
  
  function renderLibrary() {
    if (!libraryList) return;
    
    let filteredSongs = [...playlist];
    
    if (currentSearchTerm) {
      const searchLower = currentSearchTerm.toLowerCase();
      filteredSongs = filteredSongs.filter(song => 
        song.song.toLowerCase().includes(searchLower) || 
        song.artist.toLowerCase().includes(searchLower)
      );
    }
    
    if (filteredSongs.length === 0) {
      libraryList.innerHTML = `<div class="library-empty">🎵 No songs found</div>`;
      if (libraryStats) libraryStats.textContent = `0 songs`;
      return;
    }
    
    libraryList.innerHTML = filteredSongs.map((song, idx) => {
      const originalIndex = playlist.findIndex(s => s.file === song.file);
      const isActive = originalIndex === currentTrack;
      return `
        <div class="library-song-item ${isActive ? 'active' : ''}" data-index="${originalIndex}" data-custom="${song.isCustom}" data-custom-index="${song.customIndex !== undefined ? song.customIndex : -1}">
          <div class="library-song-info">
            <div class="library-song-title">${escapeHtml(song.song)} ${song.isCustom ? '<span style="font-size: 0.6rem; opacity: 0.5; margin-left: 5px;">📁</span>' : ''}</div>
            <div class="library-song-artist">${escapeHtml(song.artist)}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${isActive ? '<div class="library-song-playing">▶ Playing</div>' : ''}
            ${song.isCustom ? `<button class="delete-song-btn" data-index="${originalIndex}" data-custom-index="${song.customIndex}" title="Delete song">${getDeleteIcon()}</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    if (libraryStats) libraryStats.textContent = `${filteredSongs.length} ${filteredSongs.length === 1 ? 'song' : 'songs'}`;
    
    document.querySelectorAll('.library-song-item').forEach(item => {
      const index = parseInt(item.dataset.index);
      if (!isNaN(index)) {
        item.addEventListener('click', (e) => {
          if (e.target.closest('.delete-song-btn')) return;
          
          if (index !== currentTrack) {
            currentTrack = index;
            loadTrack(currentTrack);
          }
          if (!isPlaying) {
            audio.play().catch(e => console.log('Playback error:', e));
            isPlaying = true;
            playPauseBtn.textContent = '⏸';
          }
          libraryPopup.style.display = 'none';
          libraryOpen = false;
          renderLibrary();
        });
      }
    });
    
    document.querySelectorAll('.delete-song-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        const customIndex = parseInt(btn.dataset.customIndex);
        if (!isNaN(index) && !isNaN(customIndex) && customIndex >= 0 && customPlaylist[customIndex]) {
          await deleteCustomAudioFile(customPlaylist[customIndex], customIndex);
          renderLibrary();
        }
      });
    });
  }
  
  if (addMusicBtn) {
    addMusicBtn.addEventListener('click', () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'audio/*';
      fileInput.multiple = true;
      
      fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          let added = 0;
          for (const file of files) {
            if (file.type.startsWith('audio/')) {
              const success = await addCustomAudioFile(file);
              if (success) added++;
            }
          }
          showCustomConfirm(`Added ${added} audio file(s) to your library!`, () => {
            rebuildFullPlaylist();
            if (libraryOpen) renderLibrary();
            if (playlist.length > 0 && currentTrack >= playlist.length) {
              currentTrack = 0;
              loadTrack(currentTrack);
            }
          });
        }
      });
      
      fileInput.click();
    });
  }
  
  if (libraryBtn) {
    libraryBtn.innerHTML = getLibraryIcon();
    
    libraryBtn.addEventListener('click', () => {
      if (libraryOpen) {
        libraryPopup.style.display = 'none';
        libraryOpen = false;
      } else {
        renderLibrary();
        libraryPopup.style.display = 'block';
        libraryOpen = true;
        if (ambientPopup) ambientPopup.classList.remove('show');
        if (toolPopup) toolPopup.classList.remove('show');
        if (pomodoroPopup) pomodoroPopup.classList.remove('show');
        ambientOpen = false;
        toolPopupOpen = false;
        pomodoroOpen = false;
      }
    });
  }
  
  if (closeLibraryBtn) {
    closeLibraryBtn.addEventListener('click', () => {
      libraryPopup.style.display = 'none';
      libraryOpen = false;
    });
  }
  
  if (librarySearchInput) {
    librarySearchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      renderLibrary();
    });
  }
  
  document.addEventListener('click', (e) => {
    if (libraryOpen && libraryBtn && !libraryBtn.contains(e.target) && libraryPopup && !libraryPopup.contains(e.target)) {
      libraryPopup.style.display = 'none';
      libraryOpen = false;
    }
  });
  
  const originalLoadTrackForLibrary = loadTrack;
  const wrappedLoadTrackForLibrary = async function(index) {
    await originalLoadTrackForLibrary(index);
    if (libraryOpen) {
      renderLibrary();
    }
  };
  loadTrack = wrappedLoadTrackForLibrary;
  
  // ===== EYE TOGGLE (UI HIDE/SHOW) =====
  const eyeToggleBtn = document.getElementById('eyeToggleBtn');
  let uiHidden = false;
  
  function toggleUI() {
    uiHidden = !uiHidden;
    if (uiHidden) {
      document.body.classList.add('ui-hidden');
      if (eyeToggleBtn) eyeToggleBtn.innerHTML = getEyeClosedIcon();
      if (libraryPopup) libraryPopup.style.display = 'none';
      if (ambientPopup) ambientPopup.classList.remove('show');
      if (toolPopup) toolPopup.classList.remove('show');
      if (pomodoroPopup) pomodoroPopup.classList.remove('show');
      libraryOpen = false;
      ambientOpen = false;
      toolPopupOpen = false;
      pomodoroOpen = false;
    } else {
      document.body.classList.remove('ui-hidden');
      if (eyeToggleBtn) eyeToggleBtn.innerHTML = getEyeOpenIcon();
    }
  }
  
  if (eyeToggleBtn) {
    eyeToggleBtn.innerHTML = getEyeOpenIcon();
    eyeToggleBtn.addEventListener('click', toggleUI);
  }

  loadStickyPosition();
  initTodoList();
  loadCustomMusic();
  
  stickyNoteContainer.style.display = 'none';
  stickyNoteVisible = false;
  
  // Initialize audio player UI
  async function initAudioPlayer() {
    console.log('Initializing audio player');
    
    const manifest = await fetchRemoteManifest();
    if (manifest) {
      const updatedFiles = buildAudioFilesFromManifest(manifest);
      if (updatedFiles) {
        currentAudioFiles = updatedFiles;
      }
      rebuildFullPlaylist();
      
      const totalKB = getTotalSizeKB();
      console.log(`Total audio library size: ${totalKB} KB (${(totalKB / 1024).toFixed(1)} MB)`);
      
      await showUpdateNotification();
    } else {
      console.warn('Could not load manifest, using empty playlist');
      rebuildFullPlaylist();
    }
    
    const hasAudio = await isAudioDownloaded();
    console.log('Audio already downloaded?', hasAudio);
    
    if (hasAudio && playlist.length > 0) {
      await loadTrack(0);
      playPauseBtn.disabled = false;
      playPauseBtn.style.opacity = '1';
      prevBtn.disabled = false;
      prevBtn.style.opacity = '1';
      nextBtn.disabled = false;
      nextBtn.style.opacity = '1';
      artistNameSpan.textContent = playlist[0]?.artist || 'Lofi Artist';
      songNameSpan.textContent = playlist[0]?.song || 'Study Music';
    } else {
      artistNameSpan.textContent = '🎵 Audio Library';
      songNameSpan.textContent = 'Click play to download';
      playPauseBtn.disabled = false;
      playPauseBtn.style.opacity = '1';
      prevBtn.disabled = false;
      prevBtn.style.opacity = '1';
      nextBtn.disabled = false;
      nextBtn.style.opacity = '1';
    }
    isPlaying = false;
    playPauseBtn.textContent = '▶';
  }
  
  initAudioPlayer();
})();