// Load settings
chrome.storage.sync.get(['timelineEnabled'], (result) => {
  const timelineEnabled = result.timelineEnabled !== undefined ? result.timelineEnabled : true;
  document.getElementById('timelineEnabled').checked = timelineEnabled;
});

// Save settings
document.getElementById('timelineEnabled').addEventListener('change', (e) => {
  chrome.storage.sync.set({ timelineEnabled: e.target.checked }, () => {
    console.log('Timeline setting saved:', e.target.checked);
  });
});
