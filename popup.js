const youtubeFeatureIds = ["speed", "sidebar", "comments"];
const blockIds = ["shorts", "instagram", "twitter", "tiktok", "reddit", "pinterest", "blockYoutube"];
const allIds = [...youtubeFeatureIds, ...blockIds];

const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
const runtime = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime : browser.runtime;

const CURRENT_VERSION = runtime.getManifest().version;
const DEFAULT_PASSWORD = "000";
let currentPassword = null;
let isFirstTimeLock = true;

let domainModalOverlay = null;
let isLocked = false;
let editingHotkeyIndex = null;

// Default blockable sites configuration
const DEFAULT_BLOCK_SITES = [
  { id: "blockYoutube", name: "YouTube", deletable: false },
  { id: "shorts", name: "YouTube Shorts", deletable: false },
  { id: "instagram", name: "Instagram", deletable: true },
  { id: "twitter", name: "X (Twitter)", deletable: true },
  { id: "tiktok", name: "TikTok", deletable: true },
  { id: "pinterest", name: "Pinterest", deletable: true },
  { id: "reddit", name: "Reddit", deletable: true }
];

// Key for storing removed default sites
const REMOVED_SITES_KEY = "removedDefaultSites";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded - initializing...");
  
  const versionDisplay = document.getElementById('versionDisplay');
  if (versionDisplay) {
    versionDisplay.textContent = `Version ${CURRENT_VERSION}`;
  }
  
  storage.sync.get(['customPassword'], (data) => {
    if (data.customPassword) {
      currentPassword = data.customPassword;
      isFirstTimeLock = false;
    } else {
      currentPassword = null;
      isFirstTimeLock = true;
    }
  });
  
  storage.sync.get(['isLocked'], (data) => {
    isLocked = data.isLocked === true;
    updateLockUI();
    setTimeout(() => {
      initClickableCards();
      makeCustomDomainsClickable();
      makeDefaultSitesClickable();
    }, 100);
  });
  
  storage.sync.get([...allIds, "hideFeedMode", "theme", "youtubeCollapsed", "blockCollapsed", "fontFamily", "themePreset", "particlesEnabled"], (data) => {
    console.log("Loaded settings:", data);
    
    allIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.checked = data[id] === true;
      }
    });
    
    const savedFont = data.fontFamily || 'system-ui';
    applyFontToPopup(savedFont);
    
    const savedPreset = data.themePreset || 'default';
    applyThemePreset(savedPreset);
    
    if (data.particlesEnabled === true && savedPreset === 'sakura') {
      startSakuraParticles();
    }
    
    const youtubeContent = document.getElementById('youtubeContent');
    const blockContent = document.getElementById('blockContent');
    const youtubeArrow = document.getElementById('youtubeArrow');
    const blockArrow = document.getElementById('blockArrow');
    
    if (youtubeContent) youtubeContent.style.transition = 'none';
    if (blockContent) blockContent.style.transition = 'none';
    
    if (youtubeContent && youtubeArrow) {
      if (data.youtubeCollapsed === true) {
        youtubeContent.classList.add('collapsed');
        youtubeArrow.classList.add('collapsed');
      } else {
        youtubeContent.classList.remove('collapsed');
        youtubeArrow.classList.remove('collapsed');
      }
    }
    
    if (blockContent && blockArrow) {
      if (data.blockCollapsed === true) {
        blockContent.classList.add('collapsed');
        blockArrow.classList.add('collapsed');
      } else {
        blockContent.classList.remove('collapsed');
        blockArrow.classList.remove('collapsed');
      }
    }
    
    setTimeout(() => {
      if (youtubeContent) youtubeContent.style.transition = '';
      if (blockContent) blockContent.style.transition = '';
    }, 50);
  });

  loadCustomDomains();
  loadDefaultSites();

  document.addEventListener('keydown', handleHotkeyPress);

  allIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("change", (e) => {
        if (isLocked) {
          e.preventDefault();
          return;
        }
        const value = e.target.checked;
        storage.sync.set({ [id]: value }, () => {
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

  // Add this after the themeToggle event listener code, before setupCollapseHandlers call

const homeBtn = document.getElementById('homeBtn');
if (homeBtn) {
  homeBtn.addEventListener('click', () => {
    const blockerUrl = chrome.runtime.getURL('blocker.html');
    chrome.tabs.create({ url: blockerUrl });
  });
}

  const addDomainBtn = document.getElementById('addDomainBtn');
  if (addDomainBtn) {
    addDomainBtn.addEventListener('click', () => {
      if (isLocked) return;
      showAddDomainModal();
    });
  }

  const lockBtn = document.getElementById('lockBtn');
  if (lockBtn) {
    lockBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (isLocked) {
        showPasswordModal();
      } else {
        if (currentPassword === null || isFirstTimeLock) {
          showSetupPasswordModal();
        } else {
          setLocked(true);
        }
      }
    });
  }

  const settingsWheelBtn = document.getElementById('settingsWheelBtn');
  if (settingsWheelBtn) {
    const newSettingsWheelBtn = settingsWheelBtn.cloneNode(true);
    settingsWheelBtn.parentNode.replaceChild(newSettingsWheelBtn, settingsWheelBtn);
    
    newSettingsWheelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openSettingsModal();
    });
  }

  setupCollapseHandlers();
  setupSettingsModal();
  
  setTimeout(() => {
    initClickableCards();
  }, 100);
});

function applyFontToPopup(fontFamily) {
  document.body.style.fontFamily = fontFamily;
  const elements = document.querySelectorAll('.settings-label, .card span, .section-title span, .version-number, .github-link, button, input, .settings-version-value');
  elements.forEach(el => {
    el.style.fontFamily = fontFamily;
  });
}

function applyThemePreset(preset) {
  const presetClasses = [
    'theme-default', 'theme-sunset', 'theme-ocean', 'theme-forest',
    'theme-midnight', 'theme-coffee', 'theme-aurora', 'theme-sakura', 'theme-old'
  ];
  presetClasses.forEach(className => {
    document.body.classList.remove(className);
  });
  
  if (preset && preset !== 'default') {
    document.body.classList.add(`theme-${preset}`);
  }
  
  storage.sync.set({ themePreset: preset });
  
  storage.sync.get(['particlesEnabled'], (data) => {
    if (data.particlesEnabled === true && preset === 'sakura') {
      startSakuraParticles();
    } else {
      stopSakuraParticles();
    }
  });
}

function updateLockUI() {
  const lockBtn = document.getElementById('lockBtn');
  const openIcon = lockBtn?.querySelector('.lock-icon.open');
  const closedIcon = lockBtn?.querySelector('.lock-icon.closed');
  
  if (isLocked) {
    document.body.classList.add('locked');
    if (openIcon) openIcon.style.display = 'none';
    if (closedIcon) closedIcon.style.display = 'block';
  } else {
    document.body.classList.remove('locked');
    if (openIcon) openIcon.style.display = 'block';
    if (closedIcon) closedIcon.style.display = 'none';
  }
}

function setLocked(locked) {
  isLocked = locked;
  storage.sync.set({ isLocked: locked });
  updateLockUI();
  
  setTimeout(() => {
    initClickableCards();
    makeCustomDomainsClickable();
    makeDefaultSitesClickable();
  }, 50);
}

function showPasswordModal() {
  const passwordModal = document.getElementById('passwordModal');
  const passwordInput = document.getElementById('passwordInput');
  const passwordError = document.getElementById('passwordError');
  
  if (passwordInput) passwordInput.value = '';
  if (passwordError) passwordError.textContent = '';
  
  if (passwordModal) {
    passwordModal.style.display = 'flex';
    setTimeout(() => {
      passwordInput?.focus();
    }, 100);
  }
  
  const submitBtn = document.getElementById('passwordSubmitBtn');
  const cancelBtn = document.getElementById('passwordCancelBtn');
  
  const newSubmitBtn = submitBtn?.cloneNode(true);
  const newCancelBtn = cancelBtn?.cloneNode(true);
  
  if (submitBtn && newSubmitBtn) {
    submitBtn.parentNode?.replaceChild(newSubmitBtn, submitBtn);
    newSubmitBtn.addEventListener('click', () => {
      const enteredPassword = passwordInput?.value || '';
      if (enteredPassword === currentPassword) {
        passwordModal.style.display = 'none';
        setLocked(false);
      } else {
        if (passwordError) passwordError.textContent = 'Incorrect password';
        if (passwordInput) {
          passwordInput.value = '';
          passwordInput.focus();
        }
      }
    });
  }
  
  if (cancelBtn && newCancelBtn) {
    cancelBtn.parentNode?.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', () => {
      passwordModal.style.display = 'none';
    });
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      const enteredPassword = passwordInput?.value || '';
      if (enteredPassword === currentPassword) {
        passwordModal.style.display = 'none';
        setLocked(false);
      } else {
        if (passwordError) passwordError.textContent = 'Incorrect password';
        if (passwordInput) {
          passwordInput.value = '';
          passwordInput.focus();
        }
      }
    }
  };
  
  passwordInput?.removeEventListener('keypress', handleKeyPress);
  passwordInput?.addEventListener('keypress', handleKeyPress);
  
  const closeOnOutside = (e) => {
    if (e.target === passwordModal) {
      passwordModal.style.display = 'none';
      document.removeEventListener('click', closeOnOutside);
    }
  };
  document.addEventListener('click', closeOnOutside);
}

function showSetupPasswordModal() {
  const changePasswordModal = document.getElementById('changePasswordModal');
  const currentPasswordInput = document.getElementById('currentPasswordInput');
  const newPasswordInput = document.getElementById('newPasswordInput');
  const confirmPasswordInput = document.getElementById('confirmPasswordInput');
  const changePasswordError = document.getElementById('changePasswordError');
  
  if (currentPasswordInput) {
    currentPasswordInput.style.display = 'none';
    currentPasswordInput.value = '';
  }
  
  const modalHeader = changePasswordModal?.querySelector('.password-modal-header span');
  if (modalHeader) modalHeader.textContent = 'Set Password';
  
  if (newPasswordInput) newPasswordInput.value = '';
  if (confirmPasswordInput) confirmPasswordInput.value = '';
  if (changePasswordError) changePasswordError.textContent = '';
  
  if (changePasswordModal) {
    changePasswordModal.style.display = 'flex';
    setTimeout(() => {
      newPasswordInput?.focus();
    }, 100);
  }
  
  const submitBtn = document.getElementById('changePasswordSubmitBtn');
  const cancelBtn = document.getElementById('changePasswordCancelBtn');
  
  const newSubmitBtn = submitBtn?.cloneNode(true);
  const newCancelBtn = cancelBtn?.cloneNode(true);
  
  if (submitBtn && newSubmitBtn) {
    submitBtn.parentNode?.replaceChild(newSubmitBtn, submitBtn);
    newSubmitBtn.addEventListener('click', () => {
      const newPwd = newPasswordInput?.value || '';
      const confirmPwd = confirmPasswordInput?.value || '';
      
      if (newPwd.length === 0) {
        if (changePasswordError) changePasswordError.textContent = 'Password cannot be empty';
        return;
      }
      
      if (newPwd !== confirmPwd) {
        if (changePasswordError) changePasswordError.textContent = 'Passwords do not match';
        return;
      }
      
      currentPassword = newPwd;
      isFirstTimeLock = false;
      storage.sync.set({ customPassword: currentPassword });
      changePasswordModal.style.display = 'none';
      
      if (currentPasswordInput) currentPasswordInput.style.display = 'block';
      if (modalHeader) modalHeader.textContent = 'Change Password';
      
      setLocked(true);
    });
  }
  
  if (cancelBtn && newCancelBtn) {
    cancelBtn.parentNode?.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', () => {
      changePasswordModal.style.display = 'none';
      if (currentPasswordInput) currentPasswordInput.style.display = 'block';
      if (modalHeader) modalHeader.textContent = 'Change Password';
    });
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      const newPwd = newPasswordInput?.value || '';
      const confirmPwd = confirmPasswordInput?.value || '';
      
      if (newPwd.length === 0) {
        if (changePasswordError) changePasswordError.textContent = 'Password cannot be empty';
        return;
      }
      
      if (newPwd !== confirmPwd) {
        if (changePasswordError) changePasswordError.textContent = 'Passwords do not match';
        return;
      }
      
      currentPassword = newPwd;
      isFirstTimeLock = false;
      storage.sync.set({ customPassword: currentPassword });
      changePasswordModal.style.display = 'none';
      
      if (currentPasswordInput) currentPasswordInput.style.display = 'block';
      if (modalHeader) modalHeader.textContent = 'Change Password';
      setLocked(true);
    }
  };
  
  newPasswordInput?.removeEventListener('keypress', handleKeyPress);
  newPasswordInput?.addEventListener('keypress', handleKeyPress);
  confirmPasswordInput?.removeEventListener('keypress', handleKeyPress);
  confirmPasswordInput?.addEventListener('keypress', handleKeyPress);
  
  const closeOnOutside = (e) => {
    if (e.target === changePasswordModal) {
      changePasswordModal.style.display = 'none';
      if (currentPasswordInput) currentPasswordInput.style.display = 'block';
      if (modalHeader) modalHeader.textContent = 'Change Password';
      document.removeEventListener('click', closeOnOutside);
    }
  };
  document.addEventListener('click', closeOnOutside);
}

function showChangePasswordModal() {
  const changePasswordModal = document.getElementById('changePasswordModal');
  const currentPasswordInput = document.getElementById('currentPasswordInput');
  const newPasswordInput = document.getElementById('newPasswordInput');
  const confirmPasswordInput = document.getElementById('confirmPasswordInput');
  const changePasswordError = document.getElementById('changePasswordError');
  const modalHeader = changePasswordModal?.querySelector('.password-modal-header span');
  
  if (currentPasswordInput) {
    currentPasswordInput.style.display = 'block';
    currentPasswordInput.value = '';
  }
  if (modalHeader) modalHeader.textContent = 'Change Password';
  if (newPasswordInput) newPasswordInput.value = '';
  if (confirmPasswordInput) confirmPasswordInput.value = '';
  if (changePasswordError) changePasswordError.textContent = '';
  
  if (changePasswordModal) {
    changePasswordModal.style.display = 'flex';
    setTimeout(() => {
      currentPasswordInput?.focus();
    }, 100);
  }
  
  const submitBtn = document.getElementById('changePasswordSubmitBtn');
  const cancelBtn = document.getElementById('changePasswordCancelBtn');
  
  const newSubmitBtn = submitBtn?.cloneNode(true);
  const newCancelBtn = cancelBtn?.cloneNode(true);
  
  if (submitBtn && newSubmitBtn) {
    submitBtn.parentNode?.replaceChild(newSubmitBtn, submitBtn);
    newSubmitBtn.addEventListener('click', () => {
      const currentPwd = currentPasswordInput?.value || '';
      const newPwd = newPasswordInput?.value || '';
      const confirmPwd = confirmPasswordInput?.value || '';
      
      if (currentPwd !== currentPassword) {
        if (changePasswordError) changePasswordError.textContent = 'Current password is incorrect';
        return;
      }
      
      if (newPwd.length === 0) {
        if (changePasswordError) changePasswordError.textContent = 'New password cannot be empty';
        return;
      }
      
      if (newPwd !== confirmPwd) {
        if (changePasswordError) changePasswordError.textContent = 'New passwords do not match';
        return;
      }
      
      currentPassword = newPwd;
      storage.sync.set({ customPassword: currentPassword });
      changePasswordModal.style.display = 'none';
      console.log('Password changed successfully');
    });
  }
  
  if (cancelBtn && newCancelBtn) {
    cancelBtn.parentNode?.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', () => {
      changePasswordModal.style.display = 'none';
    });
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      const currentPwd = currentPasswordInput?.value || '';
      const newPwd = newPasswordInput?.value || '';
      const confirmPwd = confirmPasswordInput?.value || '';
      
      if (currentPwd !== currentPassword) {
        if (changePasswordError) changePasswordError.textContent = 'Current password is incorrect';
        return;
      }
      
      if (newPwd.length === 0) {
        if (changePasswordError) changePasswordError.textContent = 'New password cannot be empty';
        return;
      }
      
      if (newPwd !== confirmPwd) {
        if (changePasswordError) changePasswordError.textContent = 'New passwords do not match';
        return;
      }
      
      currentPassword = newPwd;
      storage.sync.set({ customPassword: currentPassword });
      changePasswordModal.style.display = 'none';
    }
  };
  
  currentPasswordInput?.removeEventListener('keypress', handleKeyPress);
  currentPasswordInput?.addEventListener('keypress', handleKeyPress);
  newPasswordInput?.removeEventListener('keypress', handleKeyPress);
  newPasswordInput?.addEventListener('keypress', handleKeyPress);
  confirmPasswordInput?.removeEventListener('keypress', handleKeyPress);
  confirmPasswordInput?.addEventListener('keypress', handleKeyPress);
  
  const closeOnOutside = (e) => {
    if (e.target === changePasswordModal) {
      changePasswordModal.style.display = 'none';
      document.removeEventListener('click', closeOnOutside);
    }
  };
  document.addEventListener('click', closeOnOutside);
}

function setupCollapseHandlers() {
  const youtubeHeader = document.getElementById('youtubeHeader');
  const youtubeContent = document.getElementById('youtubeContent');
  const youtubeArrow = document.getElementById('youtubeArrow');
  
  if (youtubeHeader && youtubeContent && youtubeArrow) {
    youtubeHeader.addEventListener('click', (e) => {
      if (e.target.closest('#settingsWheelBtn')) return;
      if (e.target.closest('#lockBtn')) return;
      e.stopPropagation();
      youtubeContent.classList.toggle('collapsed');
      youtubeArrow.classList.toggle('collapsed');
      const isCollapsed = youtubeContent.classList.contains('collapsed');
      storage.sync.set({ youtubeCollapsed: isCollapsed });
    });
  }
  
  const blockHeader = document.getElementById('blockHeader');
  const blockContent = document.getElementById('blockContent');
  const blockArrow = document.getElementById('blockArrow');
  
  if (blockHeader && blockContent && blockArrow) {
    blockHeader.addEventListener('click', (e) => {
      if (e.target.closest('#settingsWheelBtn')) return;
      if (e.target.closest('#lockBtn')) return;
      e.stopPropagation();
      blockContent.classList.toggle('collapsed');
      blockArrow.classList.toggle('collapsed');
      const isCollapsed = blockContent.classList.contains('collapsed');
      storage.sync.set({ blockCollapsed: isCollapsed });
    });
  }
}

function notifyAllTabs() {
  storage.sync.get([...blockIds, 'customDomains', 'hideFeedMode', 'fontFamily', 'themePreset', REMOVED_SITES_KEY], (data) => {
    const message = { type: 'SETTINGS_UPDATED', settings: data };
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {});
        });
      });
    }
  });
}

// ============ DEFAULT SITES FUNCTIONS ============

function loadDefaultSites() {
  storage.sync.get([...DEFAULT_BLOCK_SITES.map(s => s.id), REMOVED_SITES_KEY], (data) => {
    const removedSites = data[REMOVED_SITES_KEY] || [];
    const container = document.getElementById('defaultSitesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    DEFAULT_BLOCK_SITES.forEach(site => {
      if (removedSites.includes(site.id)) return;
      
      const card = createDefaultSiteCard(site, data[site.id] === true);
      container.appendChild(card);
    });
    
    setTimeout(() => {
      makeDefaultSitesClickable();
    }, 50);
  });
}

function createDefaultSiteCard(site, isEnabled) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.siteId = site.id;
  
  const nameSpan = document.createElement('span');
  nameSpan.textContent = site.name;
  
  const actionsDiv = document.createElement('div');
  actionsDiv.style.display = 'flex';
  actionsDiv.style.alignItems = 'center';
  actionsDiv.style.gap = '8px';
  
  const toggleSwitch = document.createElement('label');
  toggleSwitch.className = 'switch';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = site.id;
  checkbox.checked = isEnabled;
  checkbox.addEventListener('change', (e) => {
    if (isLocked) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    storage.sync.set({ [site.id]: e.target.checked }, () => {
      notifyAllTabs();
    });
  });
  const slider = document.createElement('span');
  slider.className = 'slider';
  toggleSwitch.appendChild(checkbox);
  toggleSwitch.appendChild(slider);
  
  actionsDiv.appendChild(toggleSwitch);
  
  if (site.deletable) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-default-btn';
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;
    deleteBtn.title = `Remove ${site.name} from block list`;
    deleteBtn.addEventListener('click', (e) => {
      if (isLocked) return;
      e.stopPropagation();
      removeDefaultSite(site.id, site.name);
    });
    actionsDiv.appendChild(deleteBtn);
  }
  
  card.appendChild(nameSpan);
  card.appendChild(actionsDiv);
  return card;
}

function removeDefaultSite(siteId, siteName) {
  storage.sync.get([REMOVED_SITES_KEY, siteId], (data) => {
    const removedSites = data[REMOVED_SITES_KEY] || [];
    
    if (!removedSites.includes(siteId)) {
      removedSites.push(siteId);
    }
    
    storage.sync.set({ 
      [REMOVED_SITES_KEY]: removedSites,
      [siteId]: false 
    }, () => {
      const card = document.querySelector(`.card[data-site-id="${siteId}"]`);
      if (card) {
        card.style.animation = 'cardFadeOut 0.2s ease-out forwards';
        setTimeout(() => {
          loadDefaultSites();
        }, 200);
      }
      notifyAllTabs();
    });
  });
}

function makeDefaultSitesClickable() {
  const defaultCards = document.querySelectorAll('#defaultSitesContainer .card');
  defaultCards.forEach(card => {
    const checkbox = card.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    
    if (card._defaultClickHandler) {
      card.removeEventListener('click', card._defaultClickHandler);
    }
    
    const clickHandler = (event) => {
      if (isLocked) return;
      if (event.target.closest('.delete-default-btn')) return;
      if (event.target.closest('.switch')) return;
      event.preventDefault();
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    };
    
    card._defaultClickHandler = clickHandler;
    card.addEventListener('click', clickHandler);
    card.style.cursor = 'pointer';
  });
}

// ============ CUSTOM DOMAIN FUNCTIONS ============

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
  actionsDiv.style.marginLeft = 'auto';
  
  const toggleSwitch = document.createElement('label');
  toggleSwitch.className = 'switch';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = enabled;
  checkbox.addEventListener('change', (e) => {
    if (isLocked) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
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
    if (isLocked) return;
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
      notifyAllTabs();
    });
  });
}

function removeCustomDomain(domain) {
  storage.sync.get(['customDomains'], (data) => {
    const customDomains = data.customDomains || {};
    delete customDomains[domain];
    storage.sync.set({ customDomains }, () => {
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
      loadCustomDomains();
      notifyAllTabs();
    });
  });
  return true;
}

function showAddDomainModal() {
  if (isLocked) return;
  
  if (domainModalOverlay) domainModalOverlay.remove();
  
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
      }
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeDomainModal);
  }
  
  domainModalOverlay.addEventListener('click', (e) => {
    if (e.target === domainModalOverlay) closeDomainModal();
  });
}

function closeDomainModal() {
  if (domainModalOverlay) {
    domainModalOverlay.remove();
    domainModalOverlay = null;
  }
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
      if (isLocked) return;
      if (event.target.closest('.delete-domain-btn')) return;
      if (event.target.closest('.switch')) return;
      event.preventDefault();
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    };
    
    card._customClickHandler = clickHandler;
    card.addEventListener('click', clickHandler);
    card.style.cursor = 'pointer';
  });
}

function initClickableCards() {
  const youtubeCards = document.querySelectorAll('#youtubeContent .card');
  
  youtubeCards.forEach(card => {
    const checkbox = card.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    
    if (card._clickHandler) {
      card.removeEventListener('click', card._clickHandler);
    }
    
    const clickHandler = (event) => {
      if (isLocked) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      
      let target = event.target;
      let isSwitchElement = false;
      
      while (target && target !== card) {
        if (target.classList?.contains('switch') || 
            target.classList?.contains('slider') ||
            target.tagName === 'LABEL' ||
            (target.tagName === 'INPUT' && target.type === 'checkbox')) {
          isSwitchElement = true;
          break;
        }
        target = target.parentNode;
      }
      
      if (isSwitchElement) return;
      
      event.preventDefault();
      checkbox.checked = !checkbox.checked;
      const changeEvent = new Event('change', { bubbles: true });
      checkbox.dispatchEvent(changeEvent);
    };
    
    card._clickHandler = clickHandler;
    card.addEventListener('click', clickHandler);
    card.style.cursor = 'pointer';
  });
}

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes cardFadeOut {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.95);
      display: none;
    }
  }
`;
document.head.appendChild(styleSheet);

let settingsModalOpen = false;

function openSettingsModal() {
  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.style.display = 'flex';
    settingsModalOpen = true;
    loadSettingsModalValues();
    requestAnimationFrame(() => {
      const tabUnderline = document.querySelector('.settings-tab-underline');
      const activeBtn = document.querySelector('.settings-tab-btn.active');
      if (tabUnderline && activeBtn) {
        const activeSpan = activeBtn.querySelector('span');
        const barRect = activeBtn.parentElement.getBoundingClientRect();
        const spanRect = activeSpan.getBoundingClientRect();
        tabUnderline.style.width = `${spanRect.width}px`;
        tabUnderline.style.left = `${spanRect.left - barRect.left}px`;
      }
    });
  }
}

function closeSettingsModal() {
  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.style.display = 'none';
    settingsModalOpen = false;
  }
}

function updateToggleGroupPosition(group) {
  if (!group) return;
  const buttons = Array.from(group.querySelectorAll('.toggle-option'));
  const activeIndex = buttons.findIndex(btn => btn.classList.contains('active'));
  group.classList.toggle('toggle-selected-right', activeIndex === 1);
  group.classList.toggle('toggle-selected-left', activeIndex === 0);
}

function loadSettingsModalValues() {
  storage.sync.get(['theme', 'hideFeedMode', 'fontFamily', 'themePreset', 'particlesEnabled'], (data) => {
    const darkThemeBtn = document.querySelector('.toggle-option[data-theme="dark"]');
    const lightThemeBtn = document.querySelector('.toggle-option[data-theme="light"]');
    
    if (data.theme === 'light') {
      lightThemeBtn?.classList.add('active');
      darkThemeBtn?.classList.remove('active');
    } else {
      darkThemeBtn?.classList.add('active');
      lightThemeBtn?.classList.remove('active');
    }
    
    const fontSelect = document.getElementById('fontSelect');
    if (fontSelect && data.fontFamily) {
      fontSelect.value = data.fontFamily;
    }
    
    const themePresetSelect = document.getElementById('themePresetSelect');
    if (themePresetSelect) {
      const preset = data.themePreset || 'default';
      themePresetSelect.value = preset;
    }
    
    const removeFeedBtn = document.querySelector('.toggle-option[data-feedmode="remove"]');
    const hideFeedBtn = document.querySelector('.toggle-option[data-feedmode="hide"]');
    
    if (data.hideFeedMode === 'hide') {
      hideFeedBtn?.classList.add('active');
      removeFeedBtn?.classList.remove('active');
    } else {
      removeFeedBtn?.classList.add('active');
      hideFeedBtn?.classList.remove('active');
    }

    const themeToggleGroup = darkThemeBtn?.closest('.settings-toggle-group');
    const feedModeGroup = removeFeedBtn?.closest('.settings-toggle-group');
    updateToggleGroupPosition(themeToggleGroup);
    updateToggleGroupPosition(feedModeGroup);

    const particleToggle = document.getElementById('particleToggle');
    if (particleToggle) {
      particleToggle.checked = data.particlesEnabled === true;
    }
  });
}

function saveTheme(theme) {
  storage.sync.set({ theme: theme }, () => {
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');
    
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      if (moonIcon) moonIcon.style.display = 'none';
      if (sunIcon) sunIcon.style.display = 'block';
    } else {
      document.body.classList.remove('light-theme');
      if (moonIcon) moonIcon.style.display = 'block';
      if (sunIcon) sunIcon.style.display = 'none';
    }
    notifyAllTabs();
  });
}

function saveFont(fontFamily) {
  storage.sync.set({ fontFamily: fontFamily }, () => {
    applyFontToPopup(fontFamily);
    notifyAllTabs();
  });
}

function saveFeedMode(mode) {
  storage.sync.set({ hideFeedMode: mode }, () => {
    notifyAllTabs();
  });
}

function resetToDefaultSettings() {
  const defaultSettings = {
    speed: false,
    sidebar: false,
    comments: false,
    shorts: false,
    blockYoutube: false,
    instagram: false,
    twitter: false,
    tiktok: false,
    reddit: false,
    pinterest: false,
    hideFeedMode: 'remove',
    theme: 'dark',
    themePreset: 'default',
    fontFamily: 'system-ui',
    customDomains: {},
    [REMOVED_SITES_KEY]: [],
    customPassword: null,
    isLocked: false,
    youtubeCollapsed: false,
    blockCollapsed: false,
    hotkeys: []
  };
  
  storage.sync.clear(() => {
    storage.sync.set(defaultSettings, () => {
      console.log('Settings reset to default');
      
      currentPassword = null;
      isFirstTimeLock = true;
      isLocked = false;
      updateLockUI();
      
      allIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.checked = defaultSettings[id] === true;
        }
      });
      
      loadCustomDomains();
      loadDefaultSites();
      
      if (defaultSettings.theme === 'light') {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
      
      applyFontToPopup(defaultSettings.fontFamily);
      applyThemePreset(defaultSettings.themePreset);
      
      const removeFeedBtn = document.querySelector('.toggle-option[data-feedmode="remove"]');
      const hideFeedBtn = document.querySelector('.toggle-option[data-feedmode="hide"]');
      
      if (defaultSettings.hideFeedMode === 'hide') {
        hideFeedBtn?.classList.add('active');
        removeFeedBtn?.classList.remove('active');
      } else {
        removeFeedBtn?.classList.add('active');
        hideFeedBtn?.classList.remove('active');
      }
      
      const confirmModal = document.getElementById('confirmResetModal');
      if (confirmModal) confirmModal.style.display = 'none';
      
      closeSettingsModal();
      notifyAllTabs();
    });
  });
}

function showConfirmResetModal() {
  const confirmModal = document.getElementById('confirmResetModal');
  if (!confirmModal) return;
  
  confirmModal.style.display = 'flex';
  
  const cancelBtn = document.getElementById('confirmResetCancelBtn');
  const confirmBtn = document.getElementById('confirmResetOkBtn');
  
  const newCancelBtn = cancelBtn?.cloneNode(true);
  const newConfirmBtn = confirmBtn?.cloneNode(true);
  
  if (cancelBtn && newCancelBtn) {
    cancelBtn.parentNode?.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', () => {
      confirmModal.style.display = 'none';
    });
  }
  
  if (confirmBtn && newConfirmBtn) {
    confirmBtn.parentNode?.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => {
      resetToDefaultSettings();
    });
  }
  
  const closeOnOutside = (e) => {
    if (e.target === confirmModal) {
      confirmModal.style.display = 'none';
      document.removeEventListener('click', closeOnOutside);
    }
  };
  document.addEventListener('click', closeOnOutside);
}

function setupSettingsModal() {
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  
  const settingsVersion = document.getElementById('settingsVersion');
  if (settingsVersion) {
    settingsVersion.textContent = CURRENT_VERSION;
  }
  
  const githubVersionLink = document.getElementById('githubVersionLink');
  if (githubVersionLink) {
    githubVersionLink.textContent = 'Loading...';
    fetch('https://api.github.com/repos/reapertakumi/YouTube-Study-Enhancer/releases/latest')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        if (data && data.tag_name) {
          githubVersionLink.textContent = data.tag_name;
        } else {
          githubVersionLink.textContent = 'Not found';
        }
      })
      .catch(error => {
        console.error('Error fetching GitHub version:', error);
        githubVersionLink.textContent = 'Error loading';
      });
  }
  
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', closeSettingsModal);
  }
  
  window.addEventListener('click', (e) => {
    if (e.target === settingsModal && settingsModalOpen) {
      closeSettingsModal();
    }
  });
  
  const darkThemeBtn = document.querySelector('.toggle-option[data-theme="dark"]');
  const lightThemeBtn = document.querySelector('.toggle-option[data-theme="light"]');
  
  if (darkThemeBtn) {
    darkThemeBtn.addEventListener('click', () => {
      if (!darkThemeBtn.classList.contains('active')) {
        darkThemeBtn.classList.add('active');
        lightThemeBtn?.classList.remove('active');
        const themeToggleGroup = darkThemeBtn.closest('.settings-toggle-group');
        updateToggleGroupPosition(themeToggleGroup);
        saveTheme('dark');
      }
    });
  }
  
  if (lightThemeBtn) {
    lightThemeBtn.addEventListener('click', () => {
      if (!lightThemeBtn.classList.contains('active')) {
        lightThemeBtn.classList.add('active');
        darkThemeBtn?.classList.remove('active');
        const themeToggleGroup = lightThemeBtn.closest('.settings-toggle-group');
        updateToggleGroupPosition(themeToggleGroup);
        saveTheme('light');
      }
    });
  }
  
  const themePresetSelect = document.getElementById('themePresetSelect');
  if (themePresetSelect) {
    themePresetSelect.addEventListener('change', (e) => {
      applyThemePreset(e.target.value);
    });
  }
  
  const fontSelect = document.getElementById('fontSelect');
  if (fontSelect) {
    fontSelect.addEventListener('change', (e) => {
      saveFont(e.target.value);
    });
  }
  
  const removeFeedBtn = document.querySelector('.toggle-option[data-feedmode="remove"]');
  const hideFeedBtn = document.querySelector('.toggle-option[data-feedmode="hide"]');
  const particleToggle = document.getElementById('particleToggle');
  
  if (removeFeedBtn) {
    removeFeedBtn.addEventListener('click', () => {
      if (!removeFeedBtn.classList.contains('active')) {
        removeFeedBtn.classList.add('active');
        hideFeedBtn?.classList.remove('active');
        const feedModeGroup = removeFeedBtn.closest('.settings-toggle-group');
        updateToggleGroupPosition(feedModeGroup);
        saveFeedMode('remove');
      }
    });
  }
  
  if (hideFeedBtn) {
    hideFeedBtn.addEventListener('click', () => {
      if (!hideFeedBtn.classList.contains('active')) {
        hideFeedBtn.classList.add('active');
        removeFeedBtn?.classList.remove('active');
        const feedModeGroup = hideFeedBtn.closest('.settings-toggle-group');
        updateToggleGroupPosition(feedModeGroup);
        saveFeedMode('hide');
      }
    });
  }
  
  if (particleToggle) {
    particleToggle.addEventListener('change', () => {
      storage.sync.set({ particlesEnabled: particleToggle.checked });
      const currentPreset = document.body.classList.contains('theme-sakura') ? 'sakura' : '';
      if (particleToggle.checked && currentPreset === 'sakura') {
        startSakuraParticles();
      } else {
        stopSakuraParticles();
      }
    });
  }
  
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      showChangePasswordModal();
    });
  }
  
  const revertToDefaultBtn = document.getElementById('revertToDefaultBtn');
  if (revertToDefaultBtn) {
    revertToDefaultBtn.addEventListener('click', () => {
      showConfirmResetModal();
    });
  }
  
  // Hotkey UI
  const addHotkeyBtn = document.getElementById('addHotkeyBtn');
  const hotkeyForm = document.getElementById('hotkeyForm');
  const cancelHotkeyBtn = document.getElementById('cancelHotkeyBtn');
  const saveHotkeyBtn = document.getElementById('saveHotkeyBtn');
  const hotkeyUrl = document.getElementById('hotkeyUrl');
  const hotkeyKey = document.getElementById('hotkeyKey');

  if (addHotkeyBtn && hotkeyForm) {
    addHotkeyBtn.addEventListener('click', () => {
      if (hotkeyForm.style.display === 'none') {
        hotkeyForm.style.display = 'flex';
        editingHotkeyIndex = null;
        if (saveHotkeyBtn) saveHotkeyBtn.textContent = 'Save';
        if (hotkeyUrl) {
          hotkeyUrl.value = '';
          hotkeyUrl.focus();
        }
        if (hotkeyKey) hotkeyKey.value = '';
      } else {
        hotkeyForm.style.display = 'none';
        editingHotkeyIndex = null;
        if (saveHotkeyBtn) saveHotkeyBtn.textContent = 'Save';
      }
    });
  }

  if (cancelHotkeyBtn && hotkeyForm) {
    cancelHotkeyBtn.addEventListener('click', () => {
      hotkeyForm.style.display = 'none';
      if (hotkeyUrl) hotkeyUrl.value = '';
      if (hotkeyKey) hotkeyKey.value = '';
      editingHotkeyIndex = null;
      if (saveHotkeyBtn) saveHotkeyBtn.textContent = 'Save';
    });
  }

  if (saveHotkeyBtn && hotkeyForm) {
    saveHotkeyBtn.addEventListener('click', () => {
      saveHotkeyMapping();
    });
  }

  if (hotkeyKey) {
    hotkeyKey.addEventListener('keydown', (e) => {
      e.preventDefault();
      hotkeyKey.value = normalizeKeyCombo(e);
    });
  }

  loadHotkeysList();

  const tabUnderline = document.querySelector('.settings-tab-underline');
  const tabBtns = document.querySelectorAll('.settings-tab-btn');
  const updateTabUnderline = () => {
    const activeBtn = document.querySelector('.settings-tab-btn.active');
    if (!activeBtn || !tabUnderline) return;
    const activeSpan = activeBtn.querySelector('span');
    if (!activeSpan) return;
    const barRect = activeBtn.parentElement.getBoundingClientRect();
    const spanRect = activeSpan.getBoundingClientRect();
    tabUnderline.style.width = `${spanRect.width}px`;
    tabUnderline.style.left = `${spanRect.left - barRect.left}px`;
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const tabContents = document.querySelectorAll('.settings-tab-content');
      tabContents.forEach(content => content.classList.remove('active'));
      
      if (tabName === 'general') {
        document.getElementById('generalTab').classList.add('active');
      } else if (tabName === 'appearance') {
        document.getElementById('appearanceTab').classList.add('active');
      } else if (tabName === 'hotkey') {
        document.getElementById('hotkeyTab').classList.add('active');
      }
      updateTabUnderline();
    });
  });

  updateTabUnderline();
  window.addEventListener('resize', updateTabUnderline);

  // Tooltip functionality
  const tooltipElements = document.querySelectorAll('.toggle-option[data-tooltip]');
  tooltipElements.forEach(el => {
    let timeout;
    el.addEventListener('mouseenter', () => {
      timeout = setTimeout(() => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = el.dataset.tooltip;
        document.body.appendChild(tooltip);
        const rect = el.getBoundingClientRect();
        tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = (rect.bottom + 5) + 'px';
      }, 1000);
    });
    el.addEventListener('mouseleave', () => {
      clearTimeout(timeout);
      const tooltip = document.querySelector('.tooltip');
      if (tooltip) tooltip.remove();
    });
  });
}

/* ============================================ */
/* SAKURA PARTICLES */
/* ============================================ */

let sakuraInterval = null;
let sakuraPetals = [];

function startSakuraParticles() {
  if (sakuraInterval) return;
  
  const container = document.getElementById('sakuraParticles');
  if (!container) return;
  
  const isLight = document.body.classList.contains('light-theme');
  
  // Spawn a petal every 300-800ms
  sakuraInterval = setInterval(() => {
    createSakuraPetal(container, isLight);
  }, 300 + Math.random() * 500);
  
  // Spawn initial batch
  for (let i = 0; i < 5; i++) {
    setTimeout(() => createSakuraPetal(container, isLight), i * 200);
  }
}

function stopSakuraParticles() {
  if (sakuraInterval) {
    clearInterval(sakuraInterval);
    sakuraInterval = null;
  }
  const container = document.getElementById('sakuraParticles');
  if (container) {
    container.innerHTML = '';
  }
  sakuraPetals = [];
}

function createSakuraPetal(container, isLight) {
  const petal = document.createElement('div');
  const size = 6 + Math.random() * 10;
  const startLeft = Math.random() * 100;
  const duration = 4 + Math.random() * 5;
  const delay = Math.random() * 2;
  const swayType = Math.random() > 0.5 ? 'sakuraSway' : 'sakuraSwayWide';
  const variant = Math.random();
  
  petal.classList.add('sakura-petal');
  if (isLight) {
    petal.classList.add('white');
  } else if (variant > 0.7) {
    petal.classList.add('dark');
  }
  
  petal.style.left = `${startLeft}%`;
  petal.style.width = `${size}px`;
  petal.style.height = `${size}px`;
  petal.style.animation = `sakuraFall ${duration}s linear ${delay}s forwards, ${swayType} ${duration * 0.8}s ease-in-out ${delay}s infinite`;
  petal.style.opacity = 0.6 + Math.random() * 0.4;
  
  container.appendChild(petal);
  sakuraPetals.push(petal);
  
  // Remove after animation completes
  setTimeout(() => {
    if (petal.parentNode) {
      petal.remove();
    }
    sakuraPetals = sakuraPetals.filter(p => p !== petal);
  }, (duration + delay) * 1000);
}

/* ============================================ */
/* HOTKEY FUNCTIONS */
/* ============================================ */

function saveHotkeyMapping() {
  const urlInput = document.getElementById('hotkeyUrl');
  const keyInput = document.getElementById('hotkeyKey');
  const hotkeyForm = document.getElementById('hotkeyForm');
  const saveHotkeyBtn = document.getElementById('saveHotkeyBtn');

  if (!urlInput || !keyInput) return;

  let url = urlInput.value.trim();
  const key = keyInput.value.trim();

  if (!url || !key) return;

  // Reject bare modifier keys
  if (['Ctrl', 'Alt', 'Shift', 'Meta'].includes(key)) return;

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  storage.sync.get(['hotkeys'], (data) => {
    const hotkeys = data.hotkeys || [];

    if (editingHotkeyIndex !== null && editingHotkeyIndex >= 0 && editingHotkeyIndex < hotkeys.length) {
      hotkeys[editingHotkeyIndex] = { url, key };
    } else {
      hotkeys.push({ url, key });
    }

    storage.sync.set({ hotkeys }, () => {
      urlInput.value = '';
      keyInput.value = '';
      if (hotkeyForm) hotkeyForm.style.display = 'none';
      if (saveHotkeyBtn) saveHotkeyBtn.textContent = 'Save';
      editingHotkeyIndex = null;
      loadHotkeysList();
    });
  });
}

function loadHotkeysList() {
  const list = document.getElementById('hotkeysList');
  if (!list) return;

  const svgX = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:14px;height:14px;stroke:currentColor;stroke-width:2;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`;
  const svgPen = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:14px;height:14px;stroke:currentColor;stroke-width:2;"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg>`;

  storage.sync.get(['hotkeys'], (data) => {
    const hotkeys = data.hotkeys || [];
    list.innerHTML = '';

    // Default non-deletable entry: Open Extension
    if (chrome.commands && chrome.commands.getAll) {
      chrome.commands.getAll((commands) => {
        const openCmd = commands.find(c => c.name === '_execute_action');
        const shortcut = openCmd && openCmd.shortcut ? openCmd.shortcut : 'Ctrl+Shift+Y';

        const defaultItem = document.createElement('div');
        defaultItem.className = 'hotkey-item hotkey-item-default';
        defaultItem.innerHTML = `
          <div class="hotkey-item-content">
            <span class="hotkey-item-url">Open Extension</span>
            <span class="hotkey-item-kbd">${escapeHtml(shortcut)}</span>
          </div>
        `;
        list.appendChild(defaultItem);

        renderUserHotkeys(list, hotkeys, svgX, svgPen);
      });
    } else {
      renderUserHotkeys(list, hotkeys, svgX, svgPen);
    }
  });
}

function renderUserHotkeys(list, hotkeys, svgX, svgPen) {
  hotkeys.forEach((hk, index) => {
    const item = document.createElement('div');
    item.className = 'hotkey-item';
    item.innerHTML = `
      <div class="hotkey-item-content">
        <span class="hotkey-item-url" title="${escapeHtml(hk.url)}">${escapeHtml(hk.url)}</span>
        <span class="hotkey-item-kbd">${escapeHtml(hk.key)}</span>
      </div>
      <div class="hotkey-item-actions">
        <button class="hotkey-item-edit" data-index="${index}">${svgPen}</button>
        <button class="hotkey-item-delete" data-index="${index}">${svgX}</button>
      </div>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll('.hotkey-item-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      startEditHotkey(idx);
    });
  });

  list.querySelectorAll('.hotkey-item-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      deleteHotkey(idx);
    });
  });
}

function deleteHotkey(index) {
  storage.sync.get(['hotkeys'], (data) => {
    const hotkeys = data.hotkeys || [];
    hotkeys.splice(index, 1);
    storage.sync.set({ hotkeys }, () => {
      loadHotkeysList();
    });
  });
}

function startEditHotkey(index) {
  const hotkeyUrl = document.getElementById('hotkeyUrl');
  const hotkeyKey = document.getElementById('hotkeyKey');
  const hotkeyForm = document.getElementById('hotkeyForm');
  const saveHotkeyBtn = document.getElementById('saveHotkeyBtn');

  storage.sync.get(['hotkeys'], (data) => {
    const hotkeys = data.hotkeys || [];
    const hk = hotkeys[index];
    if (!hk) return;

    editingHotkeyIndex = index;
    if (hotkeyUrl) hotkeyUrl.value = hk.url;
    if (hotkeyKey) hotkeyKey.value = hk.key;
    if (hotkeyForm) hotkeyForm.style.display = 'flex';
    if (saveHotkeyBtn) saveHotkeyBtn.textContent = 'Update';
    if (hotkeyUrl) hotkeyUrl.focus();
  });
}

function handleHotkeyPress(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const combo = normalizeKeyCombo(e);
  if (!combo) return;

  storage.sync.get(['hotkeys'], (data) => {
    const hotkeys = data.hotkeys || [];
    const match = hotkeys.find(hk => hk.key === combo);
    if (match && match.url) {
      chrome.tabs.create({ url: match.url });
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function normalizeKeyCombo(e) {
  const modMap = {
    'Control': 'Ctrl',
    'Alt': 'Alt',
    'Shift': 'Shift',
    'Meta': 'Meta'
  };

  const heldMods = [];
  if (e.ctrlKey) heldMods.push('Ctrl');
  if (e.altKey) heldMods.push('Alt');
  if (e.metaKey) heldMods.push('Meta');
  if (e.shiftKey) heldMods.push('Shift');

  let key = e.key;
  if (key.length === 1) {
    key = key.toUpperCase();
  }

  // Bare modifier press (only that modifier is held): show short name for feedback
  if (modMap[key] && heldMods.length === 1) {
    return modMap[key];
  }

  // Modifier held + another modifier pressed: show all held modifiers
  // e.g. Ctrl held, Shift pressed -> "Ctrl+Shift"
  if (modMap[key]) {
    return heldMods.join('+');
  }

  // Non-modifier key
  if (heldMods.length === 0) {
    return key;
  }

  return heldMods.join('+') + '+' + key;
}