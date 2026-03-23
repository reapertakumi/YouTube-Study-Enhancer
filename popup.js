const youtubeIds = ["speed", "sidebar", "comments"];
const blockIds = ["shorts", "instagram", "twitter", "tiktok", "reddit", "pinterest"];
const allIds = [...youtubeIds, ...blockIds];

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
});