const youtubeFeatureIds = ["speed", "sidebar", "comments"];
const blockIds = ["shorts", "instagram", "twitter", "tiktok", "reddit", "pinterest", "blockYoutube"];
const allIds = [...youtubeFeatureIds, ...blockIds];

const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
const runtime = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime : browser.runtime;

const CURRENT_VERSION = runtime.getManifest().version;
const GITHUB_REPO = "reapertakumi/YouTube-Study-Enhancer";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const WEBSTORE_URL = "https://chromewebstore.google.com/detail/pamglonmkhcpoilnohgaoghgfnjjmjne?utm_source=item-share-cb";

let latestVersionInfo = null;
let modalOverlay = null;
let domainModalOverlay = null;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded - initializing...");
  
  // Display version
  const versionDisplay = document.getElementById('versionDisplay');
  if (versionDisplay) {
    versionDisplay.textContent = `Version ${CURRENT_VERSION}`;
  }
  
  // Load all settings
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
        modeDescription.textContent = 'Remove Mode: Removes feed and expands video to full width';
      } else {
        modeDescription.textContent = 'Hide Mode: Hides feed but keeps original video size';
      }
    }
  });

  // Load custom domains
  loadCustomDomains();

  // Add change listeners to all toggles
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

  // Theme toggle
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

  // Add custom domain button
  const addDomainBtn = document.getElementById('addDomainBtn');
  if (addDomainBtn) {
    addDomainBtn.addEventListener('click', () => {
      showAddDomainModal();
    });
  }

  // Feed mode modal
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
      storage.sync.set({ hideFeedMode: mode }, () => {
        console.log(`Hide feed mode set to: ${mode}`);
        notifyAllTabs();
      });
      if (modeDescription) {
        if (mode === 'remove') {
          modeDescription.textContent = 'Remove Mode: Removes feed and expands video to full width';
        } else {
          modeDescription.textContent = 'Hide Mode: Hides feed but keeps original video size';
        }
      }
    });
  }

  // Check for updates on load and periodically
  checkForUpdates();
  setInterval(checkForUpdates, 60 * 60 * 1000); // check every hour

  // Initialize clickable cards
  initClickableCards();
});

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
    
    setTimeout(() => {
      makeCustomDomainsClickable();
    }, 50);
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
  let cleanDomain = domain.trim().toLowerCase();
  cleanDomain = cleanDomain.replace(/^(https?:\/\/)/i, '');
  cleanDomain = cleanDomain.replace(/\/$/, '');
  cleanDomain = cleanDomain.replace(/^www\./, '');
  
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
  if (!updateStatus) return;
  
  updateStatus.textContent = 'Checking for updates...';
  updateStatus.className = 'update-status checking';
  
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
      updateStatus.textContent = `New version ${latestVersion} available! Click to update`;
      updateStatus.className = 'update-status available';
      latestVersionInfo = release;
      updateStatus.style.cursor = 'pointer';
      updateStatus.onclick = () => {
        window.open(WEBSTORE_URL, '_blank');
      };
    } else {
      updateStatus.textContent = 'Up to date';
      updateStatus.className = 'update-status up-to-date';
      updateStatus.onclick = null;
      updateStatus.style.cursor = 'default';
    }
    
  } catch (error) {
    console.error('Update check failed:', error);
    updateStatus.textContent = 'Failed to check for updates';
    updateStatus.className = 'update-status error';
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

// ==================== CLICKABLE CARDS FEATURE ====================

function initClickableCards() {
  const clickableCards = document.querySelectorAll('.card:not(.updater-card)');
  
  clickableCards.forEach(card => {
    const checkbox = card.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    
    if (card._clickHandler) {
      card.removeEventListener('click', card._clickHandler);
    }
    
    const clickHandler = (event) => {
      let target = event.target;
      let isSwitchElement = false;
      
      while (target && target !== card) {
        if (target.classList && target.classList.contains('switch')) {
          isSwitchElement = true;
          break;
        }
        if (target.tagName === 'LABEL' && target.classList.contains('switch')) {
          isSwitchElement = true;
          break;
        }
        if (target.tagName === 'INPUT' && target.type === 'checkbox') {
          isSwitchElement = true;
          break;
        }
        if (target.classList && target.classList.contains('slider')) {
          isSwitchElement = true;
          break;
        }
        target = target.parentNode;
      }
      
      if (isSwitchElement) {
        return;
      }
      
      event.preventDefault();
      checkbox.checked = !checkbox.checked;
      const changeEvent = new Event('change', { bubbles: true });
      checkbox.dispatchEvent(changeEvent);
    };
    
    card._clickHandler = clickHandler;
    card.addEventListener('click', clickHandler);
    card.style.cursor = 'pointer';
  });
  
  makeCustomDomainsClickable();
}

function makeCustomDomainsClickable() {
  const customCards = document.querySelectorAll('.custom-domain-card');
  
  customCards.forEach(card => {
    const checkbox = card.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    
    if (card._customClickHandler) {
      card.removeEventListener('click', card._customClickHandler);
    }
    
    const clickHandler = (event) => {
      let target = event.target;
      let isDeleteClick = false;
      while (target && target !== card) {
        if (target.classList && target.classList.contains('delete-domain-btn')) {
          isDeleteClick = true;
          break;
        }
        if (target.tagName === 'BUTTON' && target.classList.contains('delete-domain-btn')) {
          isDeleteClick = true;
          break;
        }
        target = target.parentNode;
      }
      
      if (isDeleteClick) {
        return;
      }
      
      target = event.target;
      let isSwitchClick = false;
      while (target && target !== card) {
        if (target.classList && target.classList.contains('switch')) {
          isSwitchClick = true;
          break;
        }
        if (target.tagName === 'INPUT' && target.type === 'checkbox') {
          isSwitchClick = true;
          break;
        }
        if (target.classList && target.classList.contains('slider')) {
          isSwitchClick = true;
          break;
        }
        target = target.parentNode;
      }
      
      if (isSwitchClick) {
        return;
      }
      
      event.preventDefault();
      checkbox.checked = !checkbox.checked;
      const changeEvent = new Event('change', { bubbles: true });
      checkbox.dispatchEvent(changeEvent);
    };
    
    card._customClickHandler = clickHandler;
    card.addEventListener('click', clickHandler);
    card.style.cursor = 'pointer';
  });
}