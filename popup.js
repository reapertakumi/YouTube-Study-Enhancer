const ids = ["shorts", "speed", "sidebar"];

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(ids, data => {
    ids.forEach(id => {
      document.getElementById(id).checked = data[id] || false;
    });
  });

  ids.forEach(id => {
    document.getElementById(id).addEventListener("change", e => {
      chrome.storage.sync.set({ [id]: e.target.checked });
    });
  });
});