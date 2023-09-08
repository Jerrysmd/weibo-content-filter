document.addEventListener('DOMNodeInserted', function (event) {
    var node = event.target;
    // if (node.tagName !== 'DIV') { return; }
    document.querySelectorAll('#scroller > div.vue-recycle-scroller__item-wrapper > div').forEach(function (div) {
        //console.log(div.querySelector('div.wbpro-auth-tag.head-info_authtag_29zK2'));
        // if(div.querySelectorAll('i[title="负反馈"').length > 0){
        const targetDiv = div.querySelector('div.wbpro-auth-tag.head-info_authtag_29zK2 > div');
        const targetContent = targetDiv ? targetDiv.textContent.trim() : '';
        if (div.querySelector('img[src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAeCAQAAADTehW+AAAB7ElEQVR42sWWv0tbURTHE7RoIVjQobhEikPBJXSpViWBQBcJpQh20tKlFao4CB26Kg7+A5Xv9yZKwSkBoQQCjYODiLkhRDqIW0uH4uAgtOAPMJyS+HjEmJfcoO/lfJd777nczzuHcx7H52uPJTsKQR3aH3ZHOlQIJjuqcLkeHdWxYtgtYDGsYzqa67Gj09F8ZCfgZgZ3AvmIjlpR7g3omLu4a6SOFYKVpQ4Vw42uxnu5+rXPyYvBTStV6glT6qXzO8WwDlUW5Sw3AvINhFuO3gOebnRXPuwZBLPO79icZkCfj98gjNTzJF5AACsTdwEyxXSV9vnnxj6tJqx7mxBmeW1bEOyyytBvDMQ/XuK3szhTiek5SjjBkaVfEBzbu7IGWwAi17TuOvmDl4mndnHdJaUmQDUHwUpVNbsNzHSpT8mHngExz9Ma/YXg7OYZvphW6XkzYHwMS82lJo2A6jGE2/f9c2sAxDiEKZNHMKU+OAkPjIF8B+GaEfAQ4qRkwDzCFQjfmwGZFf9tcbklIDOQ9SHDCL/XPV9qAchRCH+K3yOg+JmHcNGs8u4BqN5CcIJHxsASLm6LV8ZAfobwlWlv4RBH/FhHmQbA2hFDjZg3s5rG67rnI1io7UN7xCgEPR6iPB8TPR+E2zDqe2n/AbTUmNJLBBZ5AAAAAElFTkSuQmCC"]')
            || targetContent === "热推"
            || targetContent === "推荐"
            || targetContent === "媒体推荐") {
            if (div.querySelector("div.Feed_retweet_JqZJb")) {
                const body = div.querySelector("div.wbpro-feed-content")
                body.style.display = 'none';
                const repost = div.querySelector("div.Feed_retweet_JqZJb")
                repost.style.display = 'none';
                const footer = div.querySelector("footer")
                footer.style.display = 'none';
            } else {
                const body = div.querySelector("div.wbpro-feed-content")
                body.style.display = 'none';
                const footer = div.querySelector("footer")
                footer.style.display = 'none';
            }
        } else {
            if (div.querySelector("div.Feed_retweet_JqZJb")) {
                const body = div.querySelector("div.wbpro-feed-content")
                body.style.display = '';
                const repost = div.querySelector("div.Feed_retweet_JqZJb")
                repost.style.display = '';
                const footer = div.querySelector("footer")
                footer.style.display = '';
            } else {
                const body = div.querySelector("div.wbpro-feed-content")
                body.style.display = '';
                const footer = div.querySelector("footer")
                footer.style.display = '';
            }
        }
    });
});