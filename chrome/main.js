// 借助自定义事件实现page script（注入页面的主程序）与content script（运行在沙箱中）
//   之间的异步通讯，使前者可以间接调用chrome.* API
document.addEventListener('wbpGet', function (event) {
	event.stopPropagation();
	var name = event.detail.name;
	var post = function (value) {
		//#if DEBUG
		console.log('Data read from storage:', value);
		//#endif
		// 注意：不能在此处直接调用callback，否则回调函数将在本程序所在的沙箱环境中运行，在Chrome 27及更高版本下会出错
		document.dispatchEvent(new CustomEvent("wbpPost", { detail: {
			value : value,
			id : event.detail.id
		}}));
	};
	if (event.detail.sync) {
		// 一次性读取所有设置
		chrome.storage.sync.get(null, function (items) {
			//#if DEBUG
			console.log('Items in sync storage:', items);
			//#endif
			var i = 0, value = '';
			while ((name + '_' + i) in items) {
				value += items[name + '_' + (i++)]; 
			}
			post(i ? value : event.detail.defVal);
		});
	} else {
		// 注意：使用chrome.storage.StorageArea.get()时，如果通过{name:defVal}的形式传送默认值，
		//   且defVal为null或undefined，即使name存在也会返回空对象{}，详见crbug.com/145081
		chrome.storage.local.get(name, function (items) {
			post(name in items ? items[name] : event.detail.defVal);
		});
	}
});
document.addEventListener('wbpSet', function (event) {
	event.stopPropagation();
	var data = {}, name = event.detail.name, value = event.detail.value;
	data[name] = value;
	if (event.detail.sync) { // 将设置保存到同步存储
		// 一次性读取所有设置
		chrome.storage.sync.get(null, function (items) {
			var data = {}, i = 0, errorHandler = function () {
				if (chrome.runtime && chrome.runtime.lastError) {
					console.error('Error writing to storage.sync: ' + chrome.runtime.lastError.message);
				}
			}, partLength = Math.round(chrome.storage.sync.QUOTA_BYTES_PER_ITEM * 0.8);
			// chrome.storage.sync的存储条数（MAX_ITEMS=512）与单条长度（QUOTA_BYTES_PER_ITEM=4,096）
			// 均受限制，当设置过长时需要拆分；chrome.storage.storageArea.set()会对输入项
			// 做一次JSON.stringify()，且Unicode字符将被转换为\uXXXX的转义形式，都会导致字符串膨胀
			// 因此拆分时需要事先留出一定裕度（此处保留20%），并将字符串转为Unicode转义格式
			for (var j = 0, l = 0, s = '', u; j < value.length; ++j) {
				if (value.charCodeAt(j) < 0x80) { // ASCII字符
					s += value.charAt(j);
					++l;
				} else { // Unicode字符
					u = value.charCodeAt(j).toString(16);
					s += '\\u' + (u.length === 2 ? '00' + u : u.length === 3 ? '0' + u : u);
					l += 6;
				}
				if (l >= partLength) { data[name + '_' + (i++)] = s; l = 0; s = ''; }
			}
			if (l > 0) { data[name + '_' + (i++)] = s; }
			//#if DEBUG
			console.log('Writing to sync storage:', data);
			//#endif
			// 保存新的设置
			chrome.storage.sync.set(data, errorHandler);
			// 清除多余的旧设置块
			var keys = [];
			while ((name + '_' + i) in items) {
				keys.push(name + '_' + (i++));
			}
			chrome.storage.sync.remove(keys, errorHandler);
		});
	} else { // 将设置保存到本地存储
		//#if DEBUG
		console.log('Writing to local storage:', data);
		//#endif
		chrome.storage.local.set(data);
	}
});
//#if DEBUG
document.addEventListener('wbpDebug', function (event) {
	event.stopPropagation();
	try {
		console.log(eval('(function(){' + event.detail.snippet + '})();'));
	} catch (err) {
		console.error(err);
	}
});
//#endif
// 将脚本注入页面环境
var script = document.createElement('script');
script.setAttribute('type', 'text/javascript');
script.src = chrome.runtime.getURL("/weiboFilter.js");
document.head.appendChild(script);