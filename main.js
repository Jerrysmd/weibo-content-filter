// 将脚本注入页面环境
var script = document.createElement('script');
script.setAttribute('type', 'text/javascript');
script.src = chrome.runtime.getURL("/weiboClean.js");
document.head.appendChild(script);