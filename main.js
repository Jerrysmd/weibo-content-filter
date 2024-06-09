const getSettings = () => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
};

const callback = async (mutationsList, observer) => {
    try {
        const items = await getSettings();
        mutationsList.forEach(mutation => {
            if (mutation.type === 'childList') {
                const divs = document.querySelectorAll('#scroller > div.vue-recycle-scroller__item-wrapper > div');
                divs.forEach(function (div) {
                    const targetDiv = div.querySelector('div.wbpro-tag.wbpro-tag-c2.head-info_tag_3iMJw > div');
                    const targetContent = targetDiv ? targetDiv.textContent.trim() : '';
                    const isPromotedPost =
                        (items.hotPush && targetContent.match(/^(热推)$/))
                        || (items.recommend && targetContent.match(/^(推荐)$/))
                        || (items.mediaRecommend && targetContent.match(/^(媒体推荐)$/))
                        || (items.ad && div.querySelector('div[mark*="reallog_mark_ad"]') && !div.querySelector('div[mark*="999_reallog_mark_ad"]') && !targetContent.match(/^(热推)$/))
                        || (items.fansTop && (targetContent.match(/^(粉丝头条)$/) || div.querySelector('div[mark*="FansTop"]')));
                    const hasRepost = !!div.querySelector("div.Feed_retweet_JqZJb");
                    const displayValue = isPromotedPost ? 'none' : '';
                    if (hasRepost) {
                        div.querySelectorAll("div.wbpro-feed-content, div.Feed_retweet_JqZJb, footer").forEach(el => {
                            el.style.display = displayValue;
                        });
                    } else {
                        div.querySelectorAll("div.wbpro-feed-content, footer").forEach(el => {
                            el.style.display = displayValue;
                        });
                    }
                });
            }
        });
    } catch (error) {
        console.error('Failed to get settings:', error);
    }
};

const observer = new MutationObserver(callback);

const config = {
    childList: true,
    subtree: true
};

const checkForTargetNode = () => {
    const targetNode = document.querySelector('#scroller');
    if (targetNode) {
        observer.observe(targetNode, config);
        console.log('Observer started');
    } else {
        console.log('Target node not found, retrying...');
        setTimeout(checkForTargetNode, 1);
    }
};

window.addEventListener('load', checkForTargetNode);