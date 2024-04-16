document.addEventListener('DOMNodeInserted', function (event) {
    const node = event.target;
    const items = document.querySelectorAll('#scroller > div.vue-recycle-scroller__item-wrapper > div');
    items.forEach(function (div) {
        const targetDiv = div.querySelector('div.wbpro-tag.wbpro-tag-c2.head-info_tag_3iMJw > div');
        const targetContent = targetDiv ? targetDiv.textContent.trim() : '';
        const isPromotedPost = targetContent.match(/^(热推|推荐|媒体推荐)$/)
            || div.querySelector('div[mark*="reallog_mark_ad"]')
            && !div.querySelector('div[mark*="999_reallog_mark_ad"]');
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
});