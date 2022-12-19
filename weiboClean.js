document.addEventListener('DOMNodeInserted', function (event) {
    var node = event.target;
    if (node.tagName !== 'DIV') { return; }
    document.querySelectorAll('#scroller > div.vue-recycle-scroller__item-wrapper > div').forEach(function (div) {
        //console.log(div);
        if(div.querySelectorAll('i[title="负反馈"').length > 0){
            div.style.display = 'none';
        }else{
            div.style.display = '';
        }
    });

});