document.addEventListener('DOMNodeInserted', function (event) {
    const node = event.target;
    const items = document.querySelectorAll('#scroller > div.vue-recycle-scroller__item-wrapper > div');
    items.forEach(function (div) {
        const targetDiv = div.querySelector('div.wbpro-tag.wbpro-tag-c2.head-info_tag_3iMJw > div');
        const targetContent = targetDiv ? targetDiv.textContent.trim() : '';
        const isPromotedPost = div.querySelector('img[src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAeCAQAAADTehW+AAAB7ElEQVR42sWWv0tbURTHE7RoIVjQobhEikPBJXSpViWBQBcJpQh20tKlFao4CB26Kg7+A5Xv9yZKwSkBoQQCjYODiLkhRDqIW0uH4uAgtOAPMJyS+HjEmJfcoO/lfJd777nczzuHcx7H52uPJTsKQR3aH3ZHOlQIJjuqcLkeHdWxYtgtYDGsYzqa67Gj09F8ZCfgZgZ3AvmIjlpR7g3omLu4a6SOFYKVpQ4Vw42uxnu5+rXPyYvBTStV6glT6qXzO8WwDlUW5Sw3AvINhFuO3gOebnRXPuwZBLPO79icZkCfj98gjNTzJF5AACsTdwEyxXSV9vnnxj6tJqx7mxBmeW1bEOyyytBvDMQ/XuK3szhTiek5SjjBkaVfEBzbu7IGWwAi17TuOvmDl4mndnHdJaUmQDUHwUpVNbsNzHSpT8mHngExz9Ma/YXg7OYZvphW6XkzYHwMS82lJo2A6jGE2/f9c2sAxDiEKZNHMKU+OAkPjIF8B+GaEfAQ4qRkwDzCFQjfmwGZFf9tcbklIDOQ9SHDCL/XPV9qAchRCH+K3yOg+JmHcNGs8u4BqN5CcIJHxsASLm6LV8ZAfobwlWlv4RBH/FhHmQbA2hFDjZg3s5rG67rnI1io7UN7xCgEPR6iPB8TPR+E2zDqe2n/AbTUmNJLBBZ5AAAAAElFTkSuQmCC"]')
            || targetContent.match(/^(热推|推荐|媒体推荐)$/);
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