document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get(['hotPush', 'recommend', 'mediaRecommend', 'ad'], function(items) {
      document.getElementById('hotPush').checked = items.hotPush || false;
      document.getElementById('recommend').checked = items.recommend || false;
      document.getElementById('mediaRecommend').checked = items.mediaRecommend || false;
      document.getElementById('ad').checked = items.ad || false;
    });
  
    document.getElementById('hotPush').addEventListener('change', function() {
      chrome.storage.sync.set({ 'hotPush': this.checked });
    });
    document.getElementById('recommend').addEventListener('change', function() {
      chrome.storage.sync.set({ 'recommend': this.checked });
    });
    document.getElementById('mediaRecommend').addEventListener('change', function() {
      chrome.storage.sync.set({ 'mediaRecommend': this.checked });
    });
    document.getElementById('ad').addEventListener('change', function() {
      chrome.storage.sync.set({ 'ad': this.checked });
    });
  });