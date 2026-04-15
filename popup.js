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
    }, 100);
  });
  
  storage.sync.get([...allIds, "hideFeedMode", "theme", "youtubeCollapsed", "blockCollapsed"], (data) => {
    console.log("Loaded settings:", data);
    
    allIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.checked = data[id] === true;
      }
    });
    
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
    settingsWheelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log("Cogwheel clicked - opening settings modal");
      openSettingsModal();
    });
  }

  setupCollapseHandlers();
  setupSettingsModal();
  
  setTimeout(() => {
    initClickableCards();
  }, 100);
});

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
  storage.sync.get([...blockIds, 'customDomains', 'hideFeedMode'], (data) => {
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

function initClickableCards() {
  console.log("Initializing clickable cards...");
  const clickableCards = document.querySelectorAll('.card');
  
  clickableCards.forEach(card => {
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
            (target.tagName === 'INPUT' && target.type === 'checkbox') ||
            target.classList?.contains('delete-domain-btn')) {
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

let settingsModalOpen = false;

function openSettingsModal() {
  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.style.display = 'flex';
    settingsModalOpen = true;
    loadSettingsModalValues();
  }
}

function closeSettingsModal() {
  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.style.display = 'none';
    settingsModalOpen = false;
  }
}

function loadSettingsModalValues() {
  storage.sync.get(['theme', 'hideFeedMode'], (data) => {
    const darkThemeBtn = document.querySelector('.toggle-option[data-theme="dark"]');
    const lightThemeBtn = document.querySelector('.toggle-option[data-theme="light"]');
    
    if (data.theme === 'light') {
      lightThemeBtn?.classList.add('active');
      darkThemeBtn?.classList.remove('active');
    } else {
      darkThemeBtn?.classList.add('active');
      lightThemeBtn?.classList.remove('active');
    }
    
    const removeFeedBtn = document.querySelector('.toggle-option[data-feedmode="remove"]');
    const hideFeedBtn = document.querySelector('.toggle-option[data-feedmode="hide"]');
    const settingsModeDescription = document.getElementById('settingsModeDescription');
    
    if (data.hideFeedMode === 'hide') {
      hideFeedBtn?.classList.add('active');
      removeFeedBtn?.classList.remove('active');
      if (settingsModeDescription) {
        settingsModeDescription.textContent = 'Hide Mode: Hides feed but keeps original video size';
      }
    } else {
      removeFeedBtn?.classList.add('active');
      hideFeedBtn?.classList.remove('active');
      if (settingsModeDescription) {
        settingsModeDescription.textContent = 'Remove Mode: Removes feed and expands video to full width';
      }
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

function saveFeedMode(mode) {
  storage.sync.set({ hideFeedMode: mode }, () => {
    notifyAllTabs();
  });
}

function setupSettingsModal() {
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  
  const settingsVersion = document.getElementById('settingsVersion');
  if (settingsVersion) {
    settingsVersion.textContent = CURRENT_VERSION;
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
        saveTheme('dark');
      }
    });
  }
  
  if (lightThemeBtn) {
    lightThemeBtn.addEventListener('click', () => {
      if (!lightThemeBtn.classList.contains('active')) {
        lightThemeBtn.classList.add('active');
        darkThemeBtn?.classList.remove('active');
        saveTheme('light');
      }
    });
  }
  
  const removeFeedBtn = document.querySelector('.toggle-option[data-feedmode="remove"]');
  const hideFeedBtn = document.querySelector('.toggle-option[data-feedmode="hide"]');
  const settingsModeDescription = document.getElementById('settingsModeDescription');
  
  if (removeFeedBtn) {
    removeFeedBtn.addEventListener('click', () => {
      if (!removeFeedBtn.classList.contains('active')) {
        removeFeedBtn.classList.add('active');
        hideFeedBtn?.classList.remove('active');
        if (settingsModeDescription) {
          settingsModeDescription.textContent = 'Remove Mode: Removes feed and expands video to full width';
        }
        saveFeedMode('remove');
      }
    });
  }
  
  if (hideFeedBtn) {
    hideFeedBtn.addEventListener('click', () => {
      if (!hideFeedBtn.classList.contains('active')) {
        hideFeedBtn.classList.add('active');
        removeFeedBtn?.classList.remove('active');
        if (settingsModeDescription) {
          settingsModeDescription.textContent = 'Hide Mode: Hides feed but keeps original video size';
        }
        saveFeedMode('hide');
      }
    });
  }
  
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      showChangePasswordModal();
    });
  }
  
  const tabBtns = document.querySelectorAll('.settings-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const tabContents = document.querySelectorAll('.settings-tab-content');
      tabContents.forEach(content => content.classList.remove('active'));
      
      if (tabName === 'basic') {
        document.getElementById('basicTab').classList.add('active');
      } else if (tabName === 'youtube') {
        document.getElementById('youtubeTab').classList.add('active');
      }
    });
  });
}