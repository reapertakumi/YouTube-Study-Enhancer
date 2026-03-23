const youtubeIds = ["speed", "sidebar", "comments"];
const blockIds = ["shorts", "instagram", "twitter", "tiktok", "reddit", "pinterest"];
const allIds = [...youtubeIds, ...blockIds];

// Get version from manifest.json
const CURRENT_VERSION = chrome.runtime.getManifest().version;
const GITHUB_REPO = "reapertakumi/YouTube-Study-Enhancer";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

let latestVersionInfo = null;

document.addEventListener("DOMContentLoaded", () => {
  // Load all settings
  chrome.storage.sync.get(allIds, (data) => {
    console.log("Loaded settings:", data);
    allIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.checked = data[id] === true;
      }
    });
  });

  // Add event listeners for all toggles
  allIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("change", (e) => {
        const value = e.target.checked;
        console.log(`Setting ${id} to:`, value);
        chrome.storage.sync.set({ [id]: value }, () => {
          console.log(`Saved ${id}:`, value);
        });
      });
    }
  });

  // Theme toggle functionality
  const themeToggle = document.getElementById('themeToggle');
  const moonIcon = document.querySelector('.moon-icon');
  const sunIcon = document.querySelector('.sun-icon');
  
  // Load saved theme preference
  chrome.storage.sync.get(['theme'], (data) => {
    const savedTheme = data.theme || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      moonIcon.style.display = 'none';
      sunIcon.style.display = 'block';
    } else {
      moonIcon.style.display = 'block';
      sunIcon.style.display = 'none';
    }
  });
  
  // Toggle theme on click
  themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-theme');
    
    if (isLight) {
      document.body.classList.remove('light-theme');
      moonIcon.style.display = 'block';
      sunIcon.style.display = 'none';
      chrome.storage.sync.set({ theme: 'dark' });
    } else {
      document.body.classList.add('light-theme');
      moonIcon.style.display = 'none';
      sunIcon.style.display = 'block';
      chrome.storage.sync.set({ theme: 'light' });
    }
  });

  // Updater functionality
  const versionDisplay = document.getElementById('versionDisplay');
  const updateStatus = document.getElementById('updateStatus');
  const checkUpdateBtn = document.getElementById('checkUpdateBtn');
  const installUpdateBtn = document.getElementById('installUpdateBtn');
  
  if (versionDisplay) {
    versionDisplay.textContent = `Current version: ${CURRENT_VERSION}`;
  }
  
  // Auto-check for updates when popup opens
  checkForUpdates();
  
  // Manual check button
  if (checkUpdateBtn) {
    checkUpdateBtn.addEventListener('click', () => {
      checkForUpdates();
    });
  }
  
  // Install update button
  if (installUpdateBtn) {
    installUpdateBtn.addEventListener('click', () => {
      installUpdate();
    });
  }
});

async function checkForUpdates() {
  const updateStatus = document.getElementById('updateStatus');
  const checkUpdateBtn = document.getElementById('checkUpdateBtn');
  const installUpdateBtn = document.getElementById('installUpdateBtn');
  
  if (!updateStatus) return;
  
  updateStatus.textContent = 'Checking for updates...';
  updateStatus.className = 'update-status checking';
  checkUpdateBtn.style.display = 'none';
  installUpdateBtn.style.display = 'none';
  
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const release = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, '');
    
    console.log("Current version:", CURRENT_VERSION);
    console.log("Latest version:", latestVersion);
    console.log("Release assets:", release.assets);
    
    if (compareVersions(latestVersion, CURRENT_VERSION) > 0) {
      updateStatus.textContent = `New version ${latestVersion} available!`;
      updateStatus.className = 'update-status available';
      latestVersionInfo = release;
      installUpdateBtn.textContent = 'Download ZIP Update';
      installUpdateBtn.style.display = 'block';
      checkUpdateBtn.style.display = 'none';
    } else {
      updateStatus.textContent = 'Up to date';
      updateStatus.className = 'update-status up-to-date';
      checkUpdateBtn.style.display = 'block';
      installUpdateBtn.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Update check failed:', error);
    updateStatus.textContent = 'Failed to check for updates';
    updateStatus.className = 'update-status error';
    checkUpdateBtn.style.display = 'block';
    installUpdateBtn.style.display = 'none';
  }
}

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = i < parts1.length ? parts1[i] : 0;
    const num2 = i < parts2.length ? parts2[i] : 0;
    
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  
  return 0;
}

function installUpdate() {
  if (!latestVersionInfo) {
    console.error('No update available');
    return;
  }
  
  const updateStatus = document.getElementById('updateStatus');
  const installUpdateBtn = document.getElementById('installUpdateBtn');
  
  // Find ZIP file first, then fallback to CRX
  const assets = latestVersionInfo.assets;
  let downloadUrl = null;
  let fileType = null;
  let fileName = null;
  
  // First look for .zip file
  for (const asset of assets) {
    if (asset.name.endsWith('.zip')) {
      downloadUrl = asset.browser_download_url;
      fileType = 'zip';
      fileName = asset.name;
      console.log("Found ZIP file:", fileName);
      break;
    }
  }
  
  // If no ZIP, look for .crx
  if (!downloadUrl) {
    for (const asset of assets) {
      if (asset.name.endsWith('.crx')) {
        downloadUrl = asset.browser_download_url;
        fileType = 'crx';
        fileName = asset.name;
        console.log("Found CRX file:", fileName);
        break;
      }
    }
  }
  
  if (!downloadUrl) {
    console.error("No installable file found");
    updateStatus.textContent = 'No installable file found in release';
    updateStatus.className = 'update-status error';
    return;
  }
  
  updateStatus.textContent = 'Starting download...';
  updateStatus.className = 'update-status checking';
  installUpdateBtn.disabled = true;
  
  // Method: Open download in new tab (most reliable for Chrome extensions)
  chrome.tabs.create({ url: downloadUrl, active: false }, (tab) => {
    console.log("Download tab opened:", tab.id);
    // Close the download tab after a few seconds to not clutter
    setTimeout(() => {
      chrome.tabs.remove(tab.id);
    }, 3000);
  });
  
  // Open extensions page for installation
  setTimeout(() => {
    chrome.tabs.create({ url: 'chrome://extensions/' });
    
    updateStatus.textContent = `✓ ${fileName} downloaded! Check your Downloads folder.`;
    updateStatus.className = 'update-status available';
    installUpdateBtn.disabled = false;
    
    if (fileType === 'zip') {
      showZipInstallInstructions();
    } else {
      showCrxInstallInstructions();
    }
  }, 1000);
}

function showZipInstallInstructions() {
  const instructionDiv = document.createElement('div');
  instructionDiv.className = 'install-instructions';
  instructionDiv.innerHTML = `
    <div style="margin-top: 8px; padding: 8px; background: rgba(76, 175, 80, 0.2); border-radius: 6px; font-size: 10px;">
      <strong>📦 How to install from ZIP:</strong><br>
      1. Extract the ZIP file to a folder on your computer<br>
      2. Go to the Extensions page (already open in another tab)<br>
      3. Click "Load unpacked" button<br>
      4. Select the extracted folder<br>
      5. The extension will update! All settings preserved!<br><br>
      <strong>💡 Tip:</strong> Keep the extracted folder - Chrome needs it to stay!
    </div>
  `;
  
  const updaterCard = document.querySelector('.updater-card');
  const existingInstructions = updaterCard.querySelector('.install-instructions');
  if (existingInstructions) {
    existingInstructions.remove();
  }
  updaterCard.appendChild(instructionDiv);
  
  setTimeout(() => {
    if (instructionDiv.parentNode) {
      instructionDiv.remove();
    }
  }, 25000);
}

function showCrxInstallInstructions() {
  const instructionDiv = document.createElement('div');
  instructionDiv.className = 'install-instructions';
  instructionDiv.innerHTML = `
    <div style="margin-top: 8px; padding: 8px; background: rgba(76, 175, 80, 0.2); border-radius: 6px; font-size: 10px;">
      <strong>📦 How to install from CRX:</strong><br>
      1. Go to the Extensions page (already open in another tab)<br>
      2. Find the downloaded .crx file in your Downloads folder<br>
      3. Drag and drop it onto the extensions page<br>
      4. Click "Add extension"<br><br>
      <strong>✅ Your settings will be preserved!</strong>
    </div>
  `;
  
  const updaterCard = document.querySelector('.updater-card');
  const existingInstructions = updaterCard.querySelector('.install-instructions');
  if (existingInstructions) {
    existingInstructions.remove();
  }
  updaterCard.appendChild(instructionDiv);
  
  setTimeout(() => {
    if (instructionDiv.parentNode) {
      instructionDiv.remove();
    }
  }, 20000);
}