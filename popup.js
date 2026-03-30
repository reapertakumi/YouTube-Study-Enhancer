const youtubeFeatureIds = ["speed", "sidebar", "comments"];
const blockIds = ["shorts", "instagram", "twitter", "tiktok", "reddit", "pinterest", "blockYoutube"];
const allIds = [...youtubeFeatureIds, ...blockIds];

const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
const runtime = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime : browser.runtime;

const CURRENT_VERSION = runtime.getManifest().version;
const GITHUB_REPO = "reapertakumi/YouTube-Study-Enhancer";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

let latestVersionInfo = null;
let modalOverlay = null;
let domainModalOverlay = null;

document.addEventListener("DOMContentLoaded", () => {
  storage.sync.get([...allIds, "hideFeedMode", "theme"], (data) => {
    console.log("Loaded settings:", data);
    allIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.checked = data[id] === true;
      }
    });
    
    const currentMode = data.hideFeedMode || "remove";
    const feedModeToggle = document.getElementById('feedModeToggle');
    const modeDescription = document.getElementById('modeDescription');
    
    if (feedModeToggle) {
      feedModeToggle.checked = (currentMode === 'hide');
    }
    if (modeDescription) {
      if (currentMode === 'remove') {
        modeDescription.textContent = 'Remove Mode: Hides feed and expands video to full width';
      } else {
        modeDescription.textContent = 'Hide Mode: Hides feed but keeps original video size';
      }
    }
  });

  loadCustomDomains();

  allIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("change", (e) => {
        const value = e.target.checked;
        console.log(`Setting ${id} to:`, value);
        storage.sync.set({ [id]: value }, () => {
          console.log(`Saved ${id}:`, value);
          notifyAllTabs();
        });
      });
    }
  });

  const themeToggle = document.getElementById('themeToggle');
  const moonIcon = document.querySelector('.moon-icon');
  const sunIcon = document.querySelector('.sun-icon');
  
  storage.sync.get(['theme'], (data) => {
    const savedTheme = data.theme || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      if (moonIcon) moonIcon.style.display = 'none';
      if (sunIcon) sunIcon.style.display = 'block';
    } else {
      if (moonIcon) moonIcon.style.display = 'block';
      if (sunIcon) sunIcon.style.display = 'none';
    }
  });
  
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.contains('light-theme');
      
      if (isLight) {
        document.body.classList.remove('light-theme');
        if (moonIcon) moonIcon.style.display = 'block';
        if (sunIcon) sunIcon.style.display = 'none';
        storage.sync.set({ theme: 'dark' });
      } else {
        document.body.classList.add('light-theme');
        if (moonIcon) moonIcon.style.display = 'none';
        if (sunIcon) sunIcon.style.display = 'block';
        storage.sync.set({ theme: 'light' });
      }
    });
  }

  const addDomainBtn = document.getElementById('addDomainBtn');
  if (addDomainBtn) {
    addDomainBtn.addEventListener('click', () => {
      showAddDomainModal();
    });
  }

  const settingsWheelBtn = document.getElementById('settingsWheelBtn');
  const feedModeModal = document.getElementById('feedModeModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const feedModeToggle = document.getElementById('feedModeToggle');
  const modeDescription = document.getElementById('modeDescription');

  if (settingsWheelBtn) {
    settingsWheelBtn.addEventListener('click', () => {
      if (feedModeModal) feedModeModal.style.display = 'flex';
    });
  }

  function closeModal() {
    if (feedModeModal) feedModeModal.style.display = 'none';
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  window.addEventListener('click', (e) => {
    if (e.target === feedModeModal) {
      closeModal();
    }
  });

  if (feedModeToggle) {
    feedModeToggle.addEventListener('change', (e) => {
      const mode = e.target.checked ? 'hide' : 'remove';
      setHideFeedMode(mode);
      if (modeDescription) {
        if (mode === 'remove') {
          modeDescription.textContent = 'Remove Mode: Hides feed and expands video to full width';
        } else {
          modeDescription.textContent = 'Hide Mode: Hides feed but keeps original video size';
        }
      }
    });
  }

  const versionDisplay = document.getElementById('versionDisplay');
  const updateStatus = document.getElementById('updateStatus');
  const checkUpdateBtn = document.getElementById('checkUpdateBtn');
  const installUpdateBtn = document.getElementById('installUpdateBtn');
  
  if (versionDisplay) {
    versionDisplay.textContent = `Current version: ${CURRENT_VERSION}`;
  }
  
  checkForUpdates();
  
  if (checkUpdateBtn) {
    checkUpdateBtn.addEventListener('click', () => {
      checkForUpdates();
    });
  }
  
  if (installUpdateBtn) {
    installUpdateBtn.addEventListener('click', () => {
      showDownloadOptions();
    });
  }
});

function setHideFeedMode(mode) {
  storage.sync.set({ hideFeedMode: mode }, () => {
    console.log(`Hide feed mode set to: ${mode}`);
    notifyAllTabs();
  });
}

function notifyAllTabs() {
  storage.sync.get([...blockIds, 'customDomains', 'hideFeedMode'], (data) => {
    const message = {
      type: 'SETTINGS_UPDATED',
      settings: data
    };
    
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {});
        });
      });
    } else if (typeof browser !== 'undefined' && browser.tabs) {
      browser.tabs.query({}).then((tabs) => {
        tabs.forEach(tab => {
          browser.tabs.sendMessage(tab.id, message).catch(() => {});
        });
      });
    }
  });
}

function loadCustomDomains() {
  storage.sync.get(['customDomains'], (data) => {
    const customDomains = data.customDomains || {};
    const container = document.getElementById('customDomainsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.entries(customDomains).forEach(([domain, enabled]) => {
      const domainCard = createDomainCard(domain, enabled);
      container.appendChild(domainCard);
    });
  });
}

function createDomainCard(domain, enabled) {
  const card = document.createElement('div');
  card.className = 'card custom-domain-card';
  card.dataset.domain = domain;
  
  const domainSpan = document.createElement('span');
  domainSpan.textContent = domain;
  
  const actionsDiv = document.createElement('div');
  actionsDiv.style.display = 'flex';
  actionsDiv.style.alignItems = 'center';
  actionsDiv.style.gap = '8px';
  
  const toggleSwitch = document.createElement('label');
  toggleSwitch.className = 'switch';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = enabled;
  checkbox.addEventListener('change', (e) => {
    e.stopPropagation();
    updateCustomDomain(domain, e.target.checked);
  });
  const slider = document.createElement('span');
  slider.className = 'slider';
  toggleSwitch.appendChild(checkbox);
  toggleSwitch.appendChild(slider);
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-domain-btn';
  deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;
  deleteBtn.title = 'Remove domain';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeCustomDomain(domain);
  });
  
  actionsDiv.appendChild(toggleSwitch);
  actionsDiv.appendChild(deleteBtn);
  
  card.appendChild(domainSpan);
  card.appendChild(actionsDiv);
  
  return card;
}

function updateCustomDomain(domain, enabled) {
  storage.sync.get(['customDomains'], (data) => {
    const customDomains = data.customDomains || {};
    customDomains[domain] = enabled;
    storage.sync.set({ customDomains }, () => {
      console.log(`Updated custom domain ${domain}: ${enabled}`);
      notifyAllTabs();
    });
  });
}

function removeCustomDomain(domain) {
  storage.sync.get(['customDomains'], (data) => {
    const customDomains = data.customDomains || {};
    delete customDomains[domain];
    storage.sync.set({ customDomains }, () => {
      console.log(`Removed custom domain: ${domain}`);
      loadCustomDomains();
      notifyAllTabs();
    });
  });
}

function addCustomDomain(domain) {
  // Improved domain validation - allows domains with or without www, with or without protocol
  let cleanDomain = domain.trim().toLowerCase();
  
  // Remove protocol if user accidentally adds it
  cleanDomain = cleanDomain.replace(/^(https?:\/\/)/i, '');
  
  // Remove trailing slashes
  cleanDomain = cleanDomain.replace(/\/$/, '');
  
  // Remove www. for storage (we'll store clean version)
  cleanDomain = cleanDomain.replace(/^www\./, '');
  
  // Validate domain format
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(cleanDomain)) {
    alert('Please enter a valid domain (e.g., google.com, facebook.com, github.io)');
    return false;
  }
  
  storage.sync.get(['customDomains'], (data) => {
    const customDomains = data.customDomains || {};
    if (customDomains[cleanDomain]) {
      alert('This domain is already in your block list');
      return false;
    }
    
    customDomains[cleanDomain] = true;
    storage.sync.set({ customDomains }, () => {
      console.log(`Added custom domain: ${cleanDomain}`);
      loadCustomDomains();
      notifyAllTabs();
    });
  });
  return true;
}

function showAddDomainModal() {
  if (domainModalOverlay) {
    domainModalOverlay.remove();
  }
  
  domainModalOverlay = document.createElement('div');
  domainModalOverlay.className = 'modal-overlay';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.innerHTML = `
    <h3>Add Custom Domain</h3>
    <p>Enter a domain to block (e.g., facebook.com)</p>
    <input type="text" id="domainInput" class="modal-input" placeholder="example.com" autocomplete="off">
    <div class="modal-buttons">
      <button id="modalCancelBtn" class="modal-btn modal-btn-secondary">Cancel</button>
      <button id="modalAddBtn" class="modal-btn modal-btn-primary">Add</button>
    </div>
  `;
  
  domainModalOverlay.appendChild(modalContent);
  document.body.appendChild(domainModalOverlay);
  
  const input = document.getElementById('domainInput');
  const cancelBtn = document.getElementById('modalCancelBtn');
  const addBtn = document.getElementById('modalAddBtn');
  
  if (input) {
    input.focus();
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const domain = input.value.trim().toLowerCase();
        if (domain) {
          addCustomDomain(domain);
          closeDomainModal();
        }
      }
    });
  }
  
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const domain = input.value.trim().toLowerCase();
      if (domain) {
        addCustomDomain(domain);
        closeDomainModal();
      } else {
        input.style.borderColor = '#dc3545';
        setTimeout(() => {
          input.style.borderColor = '';
        }, 1500);
      }
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeDomainModal);
  }
  
  domainModalOverlay.addEventListener('click', (e) => {
    if (e.target === domainModalOverlay) {
      closeDomainModal();
    }
  });
}

function closeDomainModal() {
  if (domainModalOverlay) {
    domainModalOverlay.remove();
    domainModalOverlay = null;
  }
}

async function checkForUpdates() {
  const updateStatus = document.getElementById('updateStatus');
  const checkUpdateBtn = document.getElementById('checkUpdateBtn');
  const installUpdateBtn = document.getElementById('installUpdateBtn');
  
  if (!updateStatus) return;
  
  updateStatus.textContent = 'Checking for updates...';
  updateStatus.className = 'update-status checking';
  if (checkUpdateBtn) checkUpdateBtn.style.display = 'none';
  if (installUpdateBtn) installUpdateBtn.style.display = 'none';
  
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
    
    if (compareVersions(latestVersion, CURRENT_VERSION) > 0) {
      updateStatus.textContent = `New version ${latestVersion} available!`;
      updateStatus.className = 'update-status available';
      latestVersionInfo = release;
      if (installUpdateBtn) {
        installUpdateBtn.textContent = 'Download Update';
        installUpdateBtn.style.display = 'block';
      }
    } else {
      updateStatus.textContent = 'Up to date';
      updateStatus.className = 'update-status up-to-date';
      if (checkUpdateBtn) checkUpdateBtn.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Update check failed:', error);
    updateStatus.textContent = 'Failed to check for updates';
    updateStatus.className = 'update-status error';
    if (checkUpdateBtn) checkUpdateBtn.style.display = 'block';
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

function showDownloadOptions() {
  if (!latestVersionInfo) {
    console.error('No update available');
    return;
  }
  
  const assets = latestVersionInfo.assets;
  let zipUrl = null;
  let crxUrl = null;
  
  for (const asset of assets) {
    if (asset.name.endsWith('.zip')) {
      zipUrl = asset.browser_download_url;
    }
    if (asset.name.endsWith('.crx')) {
      crxUrl = asset.browser_download_url;
    }
  }
  
  if (modalOverlay) {
    modalOverlay.remove();
  }
  
  modalOverlay = document.createElement('div');
  modalOverlay.id = 'download-modal';
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    z-index: 10000000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  const modalContent = document.createElement('div');
  const isLightTheme = document.body.classList.contains('light-theme');
  
  modalContent.style.cssText = `
    background: ${isLightTheme ? '#ffffff' : '#1f1f1f'};
    border-radius: 24px;
    padding: 28px 24px;
    max-width: 320px;
    width: 85%;
    text-align: center;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border: 1px solid ${isLightTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
  `;
  
  const version = latestVersionInfo.tag_name.replace(/^v/, '');
  
  modalContent.innerHTML = `
    <div style="margin-bottom: 16px; display: flex; justify-content: center;">
      <img src="icons/icon128.png" alt="Logo" style="width: 56px; height: 56px; border-radius: 14px;">
    </div>
    <h3 style="margin: 0 0 4px 0; font-size: 1.2rem; font-weight: 600;">Update Available</h3>
    <p style="margin: 0 0 16px 0; font-size: 0.8rem; opacity: 0.6;">
      ${CURRENT_VERSION} → ${version}
    </p>
    <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
      ${zipUrl ? `<button id="modal-zip-btn" style="padding: 12px 16px; background: ${isLightTheme ? '#f0f0f0' : '#2a2a2a'}; border: 1px solid ${isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}; border-radius: 12px; color: ${isLightTheme ? '#1a1a1a' : 'white'}; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>ZIP File (Load Unpacked)</span></button>` : ''}
      ${crxUrl ? `<button id="modal-crx-btn" style="padding: 12px 16px; background: #3ea6ff; border: none; border-radius: 12px; color: white; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg><span>CRX File (Drag and Drop)</span></button>` : ''}
    </div>
    <button id="modal-close-btn" style="padding: 8px 20px; background: transparent; border: 1px solid ${isLightTheme ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}; border-radius: 8px; color: inherit; font-size: 12px; cursor: pointer;">Cancel</button>
  `;
  
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);
  
  const zipBtn = document.getElementById('modal-zip-btn');
  const crxBtn = document.getElementById('modal-crx-btn');
  const closeBtn = document.getElementById('modal-close-btn');
  
  if (zipBtn && zipUrl) {
    zipBtn.addEventListener('click', () => {
      window.open(zipUrl, '_blank');
      closeDownloadModal();
    });
  }
  
  if (crxBtn && crxUrl) {
    crxBtn.addEventListener('click', () => {
      window.open(crxUrl, '_blank');
      closeDownloadModal();
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDownloadModal);
  }
  
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeDownloadModal();
    }
  });
}

function closeDownloadModal() {
  if (modalOverlay) {
    modalOverlay.remove();
    modalOverlay = null;
  }
}