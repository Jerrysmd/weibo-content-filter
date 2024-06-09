chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSettings') {
        chrome.storage.sync.get(['hotPush', 'recommend', 'mediaRecommend', 'ad', 'fansTop'], function (items) {
            sendResponse(items);
        });
        return true;
    }
});