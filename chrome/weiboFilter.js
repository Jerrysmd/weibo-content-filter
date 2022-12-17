(function () {

// 工具函数
var $ = (function () {
	// 按id选择元素（默认操作）
	var $ = function (id) {
		return document.getElementById(id);
	};
	$.version = Number('91');
	// 按CSS选择元素
	$.select = function (css) {
		return document.querySelector(css);
	};
	var CHROME_KEY_ROOT = 'weiboPlus.';
	//#if GREASEMONKEY
	if (window.chrome) {
		if (localStorage.getItem(CHROME_KEY_ROOT + 'chromeExtInstalled')) {
			console.warn('已安装插件版本，脚本停止运行！');
			// return undefined; // 如果已经（曾经）安装过插件则不再继续运行脚本
		}
		var version = window.navigator.userAgent.match(/Chrome\/(\d+)/) && RegExp.$1;
		if (version === null || version >= 27) {
			// Chrome 27开始不再支持通过脚本注入方式获取unsafeWindow，也不再提供unsafeWindow符号
			if (typeof unsafeWindow === 'undefined') {
				console.warn('不支持Chrome ' + version + '，脚本停止运行！');
				// return undefined;
			} else {
				// Chrome 26以上仍然可以通过Tampermonkey获得unsafeWindow
				console.warn('使用第三方扩展提供的unsafeWindow');
				$.window = unsafeWindow;
			}
		} else {
			// Chrome 26及以前版本虽然存在unsafeWindow符号，但实际是沙箱中的window，但可以通过脚本注入方式获取unsafeWindow
			$.window = (function () {
				console.warn('Chrome ' + version + ': 通过注入脚本获取unsafeWindow');
				var div = document.createElement('div');
				div.setAttribute('onclick', 'return window;');
				return div.onclick();
			})();
		}
	} else if (typeof unsafeWindow === 'undefined') {
		alert('当前版本的“眼不见心不烦”1.1.12不支持您使用的浏览器。\n\n插件目前只对Firefox和Chrome浏览器提供官方支持。');
		return undefined;
	} else {
		$.window = unsafeWindow;
	}
	//#elseif CHROME
	// Chrome插件版本主程序注入页面环境，可直接获取window对象
	$.window = window;
	localStorage.setItem(CHROME_KEY_ROOT + 'chromeExtInstalled', true);
	//#endif
	$.config = $.window.$CONFIG;
	if (!$.config) {
		//#if DEBUG
		console.warn('找不到$CONFIG，脚本停止运行！');
		//#endif
		return undefined;
	}
	$.uid = $.config.uid;
	if (!$.uid) {
		//#if DEBUG
		console.warn('找不到$CONFIG.uid，脚本停止运行！');
		//#endif
		return undefined;
	}
	$.oid = $.config.oid; // 页面uid（个人主页或单条微博的uid）
	//#if GREASEMONKEY
	// if (!GM_getValue || (GM_getValue.toString && GM_getValue.toString().indexOf("not supported") > -1)) {
	// 	$.get = function (name, defVal, callback) {
	// 		var result = localStorage.getItem(CHROME_KEY_ROOT + name);
	// 		if (result === null) { result = defVal; }
	// 		if (typeof callback === 'function') {
	// 			callback(result);
	// 		} else {
	// 			return result;
	// 		}
	// 	};
	// 	$.set = function (name, value) {
	// 		localStorage.setItem(CHROME_KEY_ROOT + name, value);
	// 	};
	// } else {
	// 	$.get = function (name, defVal, callback) {
	// 		var result = GM_getValue(name, defVal);
	// 		if (typeof callback === 'function') {
	// 			callback(result);
	// 		} else {
	// 			return result;
	// 		}
	// 	};
	// 	$.set = GM_setValue;
	// }
	//#elseif CHROME
	var callbacks = {}, messageID = 0;
	document.addEventListener('wbpPost', function (event) {
		event.stopPropagation();
		callbacks[event.detail.id](event.detail.value);
		delete callbacks[event.detail.id];
	});
	$.get = function (name, defVal, callback, sync) {
		// == LEGACY CODE START ==
		// 将先前版本插件的设置从localStorage转移到chrome.storage.local
		var lsName = 'weiboPlus.' + name, value = localStorage.getItem(lsName);
		if (value !== null) {
			localStorage.removeItem(lsName);
			$.set(name, value);
			return callback(value);
		}
		// == LEGACY CODE END ==
		callbacks[++messageID] = callback;
		document.dispatchEvent(new CustomEvent('wbpGet', { detail: {
			name : name,
			defVal : defVal,
			id : messageID,
			sync : sync
		}}));
	};
	$.set = function (name, value, sync) {
		document.dispatchEvent(new CustomEvent('wbpSet', { detail: {
			name : name,
			value : value,
			sync : sync
		}}));
	};
	//#endif
	// 删除节点
	$.remove = function (el) {
		if (el) { el.parentNode.removeChild(el); }
	};
	// 绑定click事件
	$.click = function (el, handler) {
		if (el) { el.addEventListener('click', handler, false); }
	};
	// 返回当前页面的位置
	$.scope = function () {
		return document.body.classList.contains('B_index') ? 1 : document.body.classList.contains('B_profile') ? 2 : 0;
	};
	return $;
})();

if (!$) { 
	console.warn("!$ return false")
	return false; }

// == LEGACY CODE START ==
// 如果正在运行旧版微博则停止运行并显示提示
if ($.config.any && $.config.any.indexOf('wvr=5') === -1) {
	if (confirm('您使用的“眼不见心不烦”版本不支持旧版微博。\n请升级到新版微博（V5），或使用较低版本（v1.0.6）的“眼不见心不烦”插件。\n如果您希望安装旧版“眼不见心不烦”，请点击“确认”。')) {
		window.open('http://code.google.com/p/weibo-content-filter/downloads/list', '_blank');
	}
	return false;
}
// == LEGACY CODE END ==

function Options () {
	// 各类型默认值
	var typeDefault = {
		keyword : [],
		string : '',
		bool : false,
		radio : '',
		array : [],
		object : {},
		internal : null
	};
	for (var option in this.items) {
		if (this.items[option].length > 1) {
			// 使用属性默认值
			this[option] = this.items[option][1];
		} else {
			// 使用类型默认值
			this[option] = typeDefault[this.items[option][0]];
		}
	}
}

Options.prototype = {
	// 选项类型与默认值
	items : {
		version : ['internal', 0], // 内部变量：不在设置界面出现，不随设置导出
		whiteKeywords : ['keyword'],
		blackKeywords : ['keyword'],
		grayKeywords : ['keyword'],
		URLKeywords : ['keyword'],
		sourceKeywords : ['keyword'],
		sourceGrayKeywords : ['keyword'],
		userBlacklist : ['array'],
		tipBackColor : ['string', '#FFD0D0'],
		tipTextColor : ['string', '#FF8080'],
		readerModeIndex : ['bool'],
		readerModeProfile : ['bool'],
		readerModeTip : ['internal', false], // 内部变量：不在设置界面出现，不随设置导出
		readerModeWidth : ['string', 750],
		readerModeBackColor : ['string', 'rgba(100%,100%,100%,0.8)'],
		mergeSidebars : ['bool'],
		floatSetting : ['radio', 'Groups'],
		unwrapText : ['bool'],
		directBigImg : ['bool'],
		directFeeds : ['bool'],
		showAllGroups : ['bool'],
		showAllMsgNav : ['bool'],
		noDefaultFwd : ['bool'],
		noDefaultCmt : ['bool'],
		noDefaultGroupPub : ['bool'],
		clearDefTopic : ['bool'],
		overrideMyBack : ['bool'],
		overrideOtherBack : ['bool'],
		backColor : ['string', 'rgba(100%,100%,100%,0.2)'],
		overrideMySkin : ['bool'],
		overrideOtherSkin : ['bool'],
		skinID : ['string', 'skinvip001'],
		filterOthersOnly : ['bool'],
		filterPaused : ['bool'],
		filterSmiley : ['bool'],
		filterPromotions : ['bool', true],
		filterDeleted : ['bool'],
		filterFeelings : ['bool'],
		filterTaobao : ['bool'],
		filterDupFwd : ['bool'],
		maxDupFwd : ['string', 1],
		filterFlood : ['bool'],
		maxFlood : ['string', 5],
		updateNotify : ['bool', true],
		//#if CHROME
		autoSync : ['bool', true],
		//#endif
		floatBtn : ['bool', true],
		useCustomStyles : ['bool', true],
		customStyles : ['string'],
		hideMods : ['array']
	},
	// 去除内部变量并转换为字符串
	strip : function () {
		var stripped = {};
		for (var option in this.items) {
			if (this.items[option][0] !== 'internal') {
				stripped[option] = this[option];
			}
		}
		return JSON.stringify(stripped);
	},
	// 保存设置
	save : function (noSync) {
		this.version = $.version;
		$.set($.uid.toString(), JSON.stringify(this));
		//#if CHROME
		if (!noSync && $options.autoSync) {
			// 不必同步内部变量
			$.set($.uid.toString(), this.strip(), true);
		}
		//#endif
	},
	// 载入/导入设置，输入的str为undefined（首次使用时）或string（非首次使用和导入设置时）
	load : function (str) {
		var parsed = {};
		if (str) {
			try {
				parsed = JSON.parse(str.replace(/\n/g, ''));
				if (typeof parsed !== 'object') { throw 0; }
			} catch (e) {
				parsed = {};
				str = null; // 出错，最后返回false
			}
		}
		// 填充选项
		for (var option in this.items) {
			if (option in parsed) {
				this[option] = parsed[option];
			}
		}
		return (str !== null);
	}
};

var $options = new Options();

var $dialog = (function () {
	var shown = false, dialog, content, STK;
	var getDom = function (node) {
		// 首页与主页API不一致
		return content ? content.getDom(node) : dialog.getDomList()[node];
	};
	var bind = function (node, func, event) {
		STK.core.evt.addEvent(getDom(node), event || 'click', func);
	};
	// 从显示列表建立关键词数组
	var getKeywords = function (id, attr) {
		return Array.prototype.map.call(getDom(id).childNodes, function (keyword) {
			return attr ? keyword.getAttribute(attr) : keyword.textContent;
		});
	};
	// 将关键词添加到显示列表
	var addKeywords = function (id, list, attr) {
		var keywords;
		if (list instanceof Array) {
			keywords = list;
		} else {
			keywords = []; 
			var str = ' ' + getDom(list).value + ' ', regex = new RegExp('(\\s"([^"]+)"\\s|\\s([^\\s]+)\\s)', 'g'), result;
			while ((result = regex.exec(str)) !== null) {
				keywords.push(result[2] || result[3]); // 提取关键词
				--regex.lastIndex;
			}
		}
		var illegalRegex = keywords.filter(function (keyword) {
			if (!keyword || getKeywords(id, attr).indexOf(keyword) > -1) { return false; }
			var keywordLink = document.createElement('a');
			// 关键词是正则表达式？
			if (keyword.length > 2 && keyword.charAt(0) === '/' && keyword.charAt(keyword.length - 1) === '/') {
				try {
					// 尝试创建正则表达式，检验正则表达式的有效性
					// 调用test()是必须的，否则浏览器可能跳过该语句
					RegExp(keyword.substring(1, keyword.length - 1)).test('');
				} catch (e) {
					return true;
				}
				keywordLink.className = 'regex';
			}
			keywordLink.title = '点击删除';
			keywordLink.setAttribute('action-type', 'remove');
			if (attr) { keywordLink.setAttribute(attr, keyword); }
			keywordLink.href = 'javascript:void(0)';
			keywordLink.textContent = keyword;
			getDom(id).appendChild(keywordLink);
			return false;
		});
		if (!(list instanceof Array)) {
			// 在文本框中显示无效的正则表达式并闪烁提示
			getDom(list).value = illegalRegex.join(' ');
			if (illegalRegex.length) {
				// 首页与主页API不一致
				(STK.common.extra ? STK.common.extra.shine : STK.kit.extra.shine)(getDom(list));
			}
		}
	};
	var usercardLoaded = false;
	// 将用户添加到屏蔽用户列表
	var addUsers = function (id, list) {
		var updateOnly = !list, div = getDom(id);
		// 整个列表只载入一次
		if (updateOnly && usercardLoaded) { return; }
		var users = updateOnly ? getKeywords(id, 'uid') : getDom(list).value.split(' '),
			unprocessed = users.length, unfound = [], searcher, params = 
				{ onComplete : function (result, data) {
						var link;
						if (updateOnly) {
							link = div.querySelector('a[uid="' + data.id + '"]');
						} else {
							link = document.createElement('a');
						}
						if (result.code === '100000') { // 成功
							var img = result.data.match(/<img[^>]+>/)[0];
							if (!updateOnly) { data.id = img.match(/uid="([^"]+)"/)[1]; }
							// 防止重复添加
							if (updateOnly || getKeywords(id, 'uid').indexOf(data.id) === -1) {
								link.innerHTML = '<img width="50" height="50" ' + img.match(/src="[^"]+"/)[0] + ' /><br />' + img.match(/title="([^"]+)"/)[1];
								if (!updateOnly) {
									// 添加新的用户
									link.title = '点击删除';
									link.href = 'javascript:void(0)';
									link.setAttribute('uid', data.id);
									link.setAttribute('action-type', 'remove');
									div.appendChild(link);
								}
							}
						} else if (updateOnly) {
							link.innerHTML += '<br />（未找到）';
						} else {
							unfound.push(data.name);
						}
						if (--unprocessed === 0) {
							// 全部处理完成，在文本框中显示未被添加的用户并闪烁提示
							getDom(list).value = unfound.join(' ');
							if (unfound.length) {
								// 首页与主页API不一致
								(STK.common.extra ? STK.common.extra.shine : STK.kit.extra.shine)(getDom(list));
							}
						}
					}
				};
		// 首页与主页API不一致
		if (STK.common.trans) {
			searcher = STK.common.trans.relation.getTrans(document.domain === 'www.weibo.com' ? 'userCard2_abroad' : 'userCard2', params);
		} else {
			searcher = STK.conf.trans.card.getTrans(document.domain === 'www.weibo.com' ? 'userCard_abroad' : 'userCard', params);
		}
		users.forEach(function (user) {
			var request = { type : 1 };
			if (updateOnly) {
				request.id = user;
			} else {
				request.name = user;
			}
			searcher.request(request);
		});
		usercardLoaded = true;
	};
	// 返回当前设置（可能未保存）
	var exportSettings = function () {
		var options = new Options(), radio;
		for (var option in options.items) {
			switch (options.items[option][0]) {
			case 'keyword':
				options[option] = getKeywords(option + 'List');
				break;
			case 'string':
				options[option] = getDom(option).value;
				break;
			case 'bool':
				options[option] = getDom(option).checked;
				break;
			case 'radio':
				radio = getDom('tabs').querySelector('input[type="radio"][name="' + option + '"]:checked');
				options[option] = radio ? radio.value : '';
				break;
			case 'array':
				options[option] = [];
				break;
			case 'object':
				options[option] = {};
				break;
			case 'internal':
				// 内部变量保持不变
				// WARNING: 内部变量如果是数组或对象，以下的浅拷贝方式可能导致设置的意外改变
				options[option] = $options[option];
				break;
			}
		}
		options.userBlacklist = getKeywords('userBlacklist', 'uid');
		for (var module in $page.modules) {
			if (getDom('hide' + module).checked) {
				options.hideMods.push(module);
			}
		}
		getDom('settingsString').value = options.strip();
		return options;
	};
	// 更新设置窗口内容，exportSettings()的反过程
	var importSettings = function (options) {
		var radio;
		for (var option in options.items) {
			switch (options.items[option][0]) {
			case 'keyword':
				getDom(option).value = '';
				getDom(option + 'List').innerHTML = '';
				addKeywords(option + 'List', options[option]);
				break;
			case 'string':
				getDom(option).value = options[option];
				break;
			case 'bool':
				getDom(option).checked = options[option];
				break;
			case 'radio':
				radio = getDom('tabs').querySelector('input[type="radio"][name="' + option + '"][value="' + options[option] + '"]');
				if (radio) { radio.checked = true; }
				break;
			}
		}
		getDom('userBlacklistNew').value = '';
		getDom('userBlacklist').innerHTML = '';
		addKeywords('userBlacklist', options.userBlacklist, 'uid');
		usercardLoaded = false;
		var tipBackColor = getDom('tipBackColor').value,
			tipTextColor = getDom('tipTextColor').value,
			tipSample = getDom('tipSample');
		tipSample.style.backgroundColor = tipBackColor;
		tipSample.style.borderColor = tipTextColor;
		tipSample.style.color = tipTextColor;
		for (var module in $page.modules) {
			getDom('hide' + module).checked = (options.hideMods.indexOf(module) > -1);
		}
		getDom('settingsString').value = options.strip();
	};
	// 创建设置窗口
	var createDialog = function () {
		// 由于操作是异步进行的，脚本载入时STK可能尚未载入，尤其是在Firefox中
		// 鉴于只有$dialog使用STK，将其设置为内部变量，仅在打开设置窗口时载入
		STK = $.window.STK;
		if (!STK) {
			console.warn('页面尚未载入完成，无法打开设置页面！');
			return false;
		}
		var HTML = 'settings.html', events;
		dialog = STK.ui.dialog({isHold: true});
		dialog.setTitle('“眼不见心不烦”1.1.12设置');
		// 首页与主页API不一致
		if (dialog.getDom) {
			content = STK.ui.mod.layer(HTML);
			dialog.setContent(content.getOuter());
			events = STK.core.evt.delegatedEvent(content.getDom('tabs'));
		} else {
			//content = STK.ui.mod.layer({template: HTML, appendTo: null});
			dialog.setContent(HTML);
			events = STK.core.evt.delegatedEvent(dialog.getDomList(true).tabs); // true用于更新DOM缓存（只需做一次）
		}
		// 修改屏蔽提示颜色事件
		bind('tipBackColor', function () {
			getDom('tipSample').style.backgroundColor = this.value;
		}, 'blur');
		bind('tipTextColor', function () {
			getDom('tipSample').style.borderColor = this.value;
			getDom('tipSample').style.color = this.value;
		}, 'blur');
		// 添加关键词按钮点击事件
		events.add('add', 'click', function (action) {
			addKeywords(action.data.list, action.data.text);
		});
		// 清空关键词按钮点击事件
		events.add('clear', 'click', function (action) {
			getDom(action.data.list).innerHTML = '';
		});
		// 删除关键词事件
		events.add('remove', 'click', function (action) {
			$.remove(action.el);
		});
		// 添加用户按钮点击事件
		events.add('addUser', 'click', function (action) {
			addUsers(action.data.list, action.data.text);
		});
		// 复选框标签点击事件
		bind('outer', function (event) {
			var node = event.target;
			// 标签下可能有span等元素
			if (node.parentNode && node.parentNode.tagName === 'LABEL') {
				node = node.parentNode;
			}
			if (node.tagName === 'LABEL') {
				event.preventDefault();
				event.stopPropagation();
				if (node.getAttribute('for')) {
					// 有for属性则使用之
					getDom(node.getAttribute('for')).click();
				} else {
					// 默认目标在标签之前（同级）
					node.previousSibling.click();
				}
			}
		});
		// 标签点击事件
		bind('tabHeaders', function (event) {
			var node = event.target;
			if (node && node.tagName === 'A') {
				node.className = 'current';
				getDom(node.getAttribute('tab')).style.display = '';
				Array.prototype.forEach.call(this.childNodes, function (child) {
					if (node !== child) {
						child.className = '';
						getDom(child.getAttribute('tab')).style.display = 'none';
					}
				});
			}
		});
		// 点击“设置导入/导出”标签时更新内容
		bind('tabHeaderSettings', exportSettings);
		// 点击“用户”标签时载入用户黑名单头像
		bind('tabHeaderUser', function () { addUsers('userBlacklist'); });
		bind('hideAll', function () {
			for (var module in $page.modules) {
				getDom('hide' + module).checked = true;
			}
		});
		bind('hideInvert', function () {
			for (var module in $page.modules) {
				var item = getDom('hide' + module);
				item.checked = !item.checked;
			}
		});
		// 对话框按钮点击事件
		bind('import', function () {
			var options = new Options();
			if (options.load(getDom('settingsString').value)) {
				importSettings(options);
				alert('设置导入成功！');
			} else {
				alert('设置导入失败！\n设置信息格式有问题。');
			}
		});
		//#if DEBUG
		bind('execute', function () {
			var snippet = getDom('debugSnippet').value;
			//#if CHROME
			if (getDom('extScope').checked) {
				document.dispatchEvent(new CustomEvent('wbpDebug', { detail: { 
					snippet : snippet
				}}));
				return;
			}
			//#endif
			try {
				console.log(eval('(function(){' + snippet + '})();'));
			} catch (err) {
				console.error(err);
			}
		});
		//#endif
		bind('OK', function () {
			$options = exportSettings();
			$options.save();
			$filter();
			$page();
			dialog.hide();
		});
		bind('cancel', dialog.hide);
		STK.custEvent.add(dialog, 'hide', function () {
			shown = false;
		});
		return true;
	};
	// 显示设置窗口
	var show = function () {
		if (!dialog && !createDialog()) {
			return;
		}
		shown = true;
		importSettings($options);
		if (getDom('tabHeaderUser').classList.contains('current')) {
			addUsers('userBlacklist');
		}
		dialog.show().setMiddle();
	};
	show.shown = function () {
		return shown;
	};

	return show;
})();

// 关键词过滤器
var $filter = (function () {
	var forwardFeeds = {}, floodFeeds = {};
	// 搜索指定文本中是否包含列表中的关键词
	var search = function  (str, key) {
		var text = str.toLowerCase(), keywords = $options[key];
		if (str === '' || keywords.length === 0) { return ''; }
		var matched = keywords.filter(function (keyword) {
			if (!keyword) { return false; }
			if (keyword.length > 2 && keyword.charAt(0) === '/' && keyword.charAt(keyword.length - 1) === '/') {
				try {
					// 尝试匹配正则表达式
					return (RegExp(keyword.substring(1, keyword.length - 1)).test(str));
				} catch (e) { }
			} else {
				return keyword.split('+').every(function (k) { return text.indexOf(k.toLowerCase()) > -1; });
			}
			return false;
		});
		return matched.length ? matched[0] : '';
	};
	// 获取微博正文
	var converter = document.createElement('div');
	var getText = function (content) {
		// 替换表情，去掉标签
		if ($options.filterSmiley) {
			converter.innerHTML = content.innerHTML.replace(/<img[^>]+alt="(\[[^\]">]+\])"[^>]*>/g, '$1')
					.replace(/<\/?[^>]+>/g, '').replace(/[\r\n\t]/g, '').trim();
			// 利用未插入文档的div进行HTML反转义
			return converter.textContent;
		}
		return content.textContent.replace(/[\r\n\t]/g, '').trim();
	};
	// 过滤微博来源
	var searchSource = function (source, keywords) {
		if (!source) {
			source = '未通过审核应用';
		} else {
			// 过长的应用名称会被压缩，完整名称存放在title属性中
			source = source.title || source.textContent;
		}
		return search(source, keywords);
	};
	// 过滤单条微博
	var apply = function (feed) {
		if (feed.firstChild && feed.firstChild.className === 'wbpTip') {
			// 已被灰名单屏蔽过，移除屏蔽提示和分隔线
			feed.removeChild(feed.firstChild);
			feed.removeChild(feed.firstChild);
		}
		var mid = feed.getAttribute('mid');
		if (!mid) { return false; } // 动态没有mid
		var scope = $.scope(), isForward = (feed.getAttribute('isforward') === '1');
		var author = (scope === 1) ? feed.querySelector('.WB_detail>.WB_info .WB_name') : null,
			content = feed.querySelector('.WB_detail>.WB_text'),
			source = feed.querySelector('.WB_detail>.WB_func .WB_from>em+a'),
			fwdAuthor = feed.querySelector('.WB_media_expand .WB_info .WB_name'),
			fwdContent = feed.querySelector('.WB_media_expand .WB_text'),
			fwdSource = feed.querySelector('.WB_media_expand .WB_func .WB_from>em+a'),
			fwdLink = feed.querySelector('.WB_media_expand .WB_func .WB_time'),
			fmid = isForward ? (fwdLink ? fwdLink.href : null) : null,
			uid = author ? author.getAttribute('usercard').match(/id=(\d+)/)[1] : null,
			fuid = fwdAuthor ? fwdAuthor.getAttribute('usercard').match(/id=(\d+)/)[1] : null;

		if (!content) { return false; }
		var text = (scope === 1) ? '@' + author.getAttribute('nick-name') + ': ' : ''; 
		text += getText(content);
		if (isForward && fwdAuthor && fwdContent) {
			// 转发内容
			text += '////@' + fwdAuthor.getAttribute('nick-name') + ': ' + getText(fwdContent);
		}
		//#if DEBUG
		console.log(text);
		//#endif

		if ($options.filterPaused || // 暂停屏蔽
			($options.filterOthersOnly && feed.querySelector('.WB_screen a[action-type="feed_list_delete"]')) || // 不要屏蔽自己的微博（判据：工具栏是否有“删除”）
			search(text, 'whiteKeywords')) { // 白名单条件
			//#if DEBUG
			console.warn('↑↑↑【白名单微博不会被屏蔽】↑↑↑');
			//#endif
		} else if ((function () { // 黑名单条件
			// 屏蔽推广微博
			if (scope === 1 && $options.filterPromotions && feed.getAttribute('feedtype') === 'ad') {
				//#if DEBUG
				console.warn('↑↑↑【推广微博被屏蔽】↑↑↑');
				//#endif
				return true;
			}
			// 屏蔽已删除微博的转发（是转发但无转发作者）
			if ($options.filterDeleted && isForward && !fwdAuthor) {
				//#if DEBUG
				console.warn('↑↑↑【已删除微博的转发被屏蔽】↑↑↑');
				//#endif
				return true;
			}
			// 用户黑名单
			if ((scope === 1 && author && $options.userBlacklist.indexOf(uid) > -1) ||
					(isForward && fwdAuthor && (scope === 1 || fuid !== $.oid) && $options.userBlacklist.indexOf(fuid) > -1)) {
				//#if DEBUG
				console.warn('↑↑↑【被用户黑名单屏蔽】↑↑↑');
				//#endif
				return true;
			}
			// 屏蔽写心情微博
			if ($options.filterFeelings && feed.querySelector('div.feelingBoxS')) {
				//#if DEBUG
				console.warn('↑↑↑【写心情微博被屏蔽】↑↑↑');
				//#endif
				return true;
			}
			// 屏蔽淘宝和天猫链接微博
			if ($options.filterTaobao && feed.querySelector('a>i.icon_fl_tb, a>i.icon_fl_tmall')) {
				//#if DEBUG
				console.warn('↑↑↑【含有淘宝或天猫商品链接的微博被屏蔽】↑↑↑');
				//#endif
				return true;
			}			
			// 屏蔽指定来源
			if (searchSource(source, 'sourceKeywords') ||
					(isForward && searchSource(fwdSource, 'sourceKeywords'))) {
				//#if DEBUG
				console.warn('↑↑↑【被来源黑名单屏蔽】↑↑↑');
				//#endif
				return true;
			}
			// 反版聊（屏蔽重复转发）
			if ($options.filterDupFwd && fmid && forwardFeeds[fmid]) {
				if (forwardFeeds[fmid].length >= Number($options.maxDupFwd) && forwardFeeds[fmid].indexOf(mid) === -1) {
					//#if DEBUG
					console.warn('↑↑↑【被反版聊功能屏蔽】↑↑↑');
					//#endif
					return true;
				}
			}
			// 反刷屏（屏蔽同一用户大量发帖）
			if ($options.filterFlood && uid && floodFeeds[uid]) {
				if (floodFeeds[uid] >= Number($options.maxFlood) && floodFeeds[uid].indexOf(mid) === -1) {
					//#if DEBUG
					console.warn('↑↑↑【被反刷屏功能屏蔽】↑↑↑');
					//#endif
					return true;
				}
			}
			// 在微博内容中搜索屏蔽关键词
			if (search(text, 'blackKeywords')) {
				//#if DEBUG
				console.warn('↑↑↑【被关键词黑名单屏蔽】↑↑↑');
				//#endif
				return true;
			}
			// 搜索t.cn短链接
			return Array.prototype.some.call(feed.getElementsByTagName('A'), function (link) {
				if (link.href.substring(0, 12) === 'http://t.cn/' && search(link.title, 'URLKeywords')) {
					//#if DEBUG
					console.warn('↑↑↑【被链接黑名单屏蔽】↑↑↑');
					//#endif
					return true;
				}
				return false;
			});
		})()) {
			feed.style.display = 'none'; // 直接隐藏，不显示屏蔽提示
			return true;
		} else { // 灰名单条件
			// 搜索来源灰名单
			var sourceKeyword = searchSource(source, 'sourceGrayKeywords'), 
				keyword = search(text, 'grayKeywords');
			if (!sourceKeyword && isForward) {
				sourceKeyword = searchSource(fwdSource, 'sourceGrayKeywords');
			}
			if (keyword || sourceKeyword) {
				// 找到了待隐藏的微博
				var authorClone;
				if (scope === 1) {
					// 添加隐藏提示链接
					authorClone = author.cloneNode(false);
					authorClone.textContent = '@' + author.getAttribute('nick-name');
					authorClone.className = '';
				}
				var showFeedLink = document.createElement('a');
				showFeedLink.href = 'javascript:void(0)';
				showFeedLink.className = 'wbpTip';
				var keywordLink = document.createElement('a');
				keywordLink.href = 'javascript:void(0)';
				keywordLink.className = 'wbpTipKeyword';
				keywordLink.textContent = keyword || sourceKeyword;
				if (scope === 1) {
					showFeedLink.appendChild(document.createTextNode('本条来自'));
					showFeedLink.appendChild(authorClone);
					showFeedLink.appendChild(document.createTextNode('的微博因'));
				} else if (scope === 2) {
					showFeedLink.appendChild(document.createTextNode('本条微博因'));
				}
				showFeedLink.appendChild(document.createTextNode(keyword ? '内容包含“' : '来源名称包含“'));
				showFeedLink.appendChild(keywordLink);
				showFeedLink.appendChild(document.createTextNode('”而被隐藏，点击显示'));
				var line = document.createElement('div');
				line.className = 'S_line2 wbpTipLine';
				feed.insertBefore(line, feed.firstChild);
				feed.insertBefore(showFeedLink, line);
				return true;
			}
		}
		// 显示微博并记录
		feed.style.display = '';
		if (!$options.filterPaused) {
			if ($options.filterDupFwd && fmid) {
				if (!forwardFeeds[fmid]) {
					forwardFeeds[fmid] = [];
				}
				if (forwardFeeds[fmid].indexOf(mid) === -1) {
					forwardFeeds[fmid].push(mid);
				}
			}
			if ($options.filterFlood && uid) {
				if (!floodFeeds[uid]) {
					floodFeeds[uid] = [];
				}
				if (floodFeeds[uid].indexOf(mid) === -1) {
					floodFeeds[uid].push(mid);
				}
			}
		}
		return false;
	};
	// 过滤所有微博
	var applyToAll = function () {
		// 过滤所有微博
		if ($.scope()) {
			forwardFeeds = {}; floodFeeds = {};
			Array.prototype.forEach.call(document.querySelectorAll('.WB_feed_type'), apply);
		}
	};
	// 屏蔽提示相关事件的冒泡处理
	var bindTipOnClick = function (node) { 
		if (!node) { return; }
		$.click(node, function (event) {
			var node = event.target;
			if (node && node.tagName === 'A') {
				if (node.className === 'wbpTipKeyword') {
					$dialog();
					event.stopPropagation(); // 防止事件冒泡触发屏蔽提示的onclick事件
				} else if (node.className === 'wbpTip') {
					$.remove(node.nextSibling); // 分隔线
					$.remove(node);
				}
			}
		});
	};

	// 处理动态载入的微博
	if ($.scope()) {
		bindTipOnClick($.select('.WB_feed'));
	}
	// 点击“查看大图”事件拦截处理
	document.addEventListener('click', function (event) {
		if (!$options.directBigImg || !event.target) { return true; }
		var actionType = event.target.getAttribute('action-type'), actionData = event.target.getAttribute('action-data');
		if ((actionType === 'images_view_tobig' || actionType === 'widget_photoview') &&
				actionData && actionData.match(/pid=(\w+)&mid=(\d+)&uid=(\d+)/)) {
			window.open('http://photo.weibo.com/' + RegExp.$3 + 
				'/wbphotos/large/mid/' + RegExp.$2 +
				'/pid/' + RegExp.$1, '_blank');
			event.stopPropagation();
		}
	}, true); // 使用事件捕捉以尽早触发事件，避免与新浪自带事件撞车
	document.addEventListener('DOMNodeInserted', function (event) {
		var node = event.target;
		if ($.scope() === 0 || node.tagName !== 'DIV') { return; }
		if (node.classList.contains('WB_feed_type')) {
			// 处理动态载入的微博
			apply(node);
		} else if (node.classList.contains('W_loading')) {
			var requestType = node.getAttribute('requesttype');
			// 仅在搜索和翻页时需要初始化反刷屏/反版聊记录
			// 其它情况（新微博：newFeed，同页接续：lazyload）下不需要
			if (requestType === 'search' || requestType === 'page') {
				forwardFeeds = {}; floodFeeds = {};
			}
		} else if (node.classList.contains('WB_feed') || node.querySelector('.WB_feed')) {
			// 微博列表作为pagelet被一次性载入
			bindTipOnClick(node);
			applyToAll();
		}
	}, false);

	return applyToAll;
})();

// 修改页面
var $page = (function () {
	// 模块屏蔽设置
	var modules = {
			Ads : '#plc_main [id^="pl_rightmod_ads"], #Box_right [id^="ads_"], #trustPagelet_zt_hottopicv5 [class*="hot_topicad"], div[ad-data], .WB_feed .popular_buss',
			Stats : '#pl_rightmod_myinfo .user_atten',
			ToMe : '#pl_leftnav_common a[href^="/direct/tome"]',
			Friends : '#pl_leftnav_group > div[node-type="groupList"] > .level_1_Box, #pl_leftnav_common .level_1_Box > form.left_nav_line',
			InterestUser : '#trustPagelet_recom_interestv5', // 动态右边栏
			Topic : '#trustPagelet_zt_hottopicv5', // 动态右边栏
			Member : '#trustPagelet_recom_memberv5',			
			WeiboRecom : '#trustPagelet_recom_weibo', // 动态右边栏
			LocationRecom : '#trustPagelet_recom_location', // 动态右边栏
			MusicRecom : '#trustPagelet_recom_music', // 动态右边栏
			MovieRecom : '#trustPagelet_recom_movie', // 动态右边栏
			BookRecom : '#trustPagelet_recom_book', // 动态右边栏
			Notice : '#pl_rightmod_noticeboard',
			Footer : 'div.global_footer',
			RecommendedTopic : '#pl_content_publisherTop div[node-type="recommendTopic"]',
			App : '#pl_leftnav_app',
			Avatar : 'dl.W_person_info',
			CommentTip : 'div[node-type="feed_privateset_tip"]',
			MemberTip : 'div[node-type="feed_list_shieldKeyword"]',
			TimelineMods : '.B_index .WB_feed .WB_feed_type:not([mid])',
			TopicCard : '.WB_feed_spec[exp-data*="value=1022-topic"]',
			LocationCard : '.WB_feed_spec[exp-data*="value=1022-place"]',
			FollowGuide : '.layer_userguide_brief',
			HomeTip : '#pl_content_hometip',
			IMNews : '.WBIM_news',
			TopComment : '#pl_content_commentTopNav',
			RecomFeed : 'div[node-type="feed_list_recommend"]',
			MyRightSidebar : '.B_profile .W_main_c, .B_profile .WB_feed .repeat .input textarea { width: 100% } .B_profile .WB_feed .WB_screen { margin-left: 928px } .B_profile .W_main_2r',
			ProfCover : '.profile_top .pf_head { top: 10px } .profile_top .pf_info { margin-top: 20px } .profile_top .S_bg5 { background-color: transparent !important } .profile_pic_top',
			ProfStats : '.profile_top .user_atten',
			MyMicroworld : '.W_main_c div[id^="Pl_Official_MyMicroworld__"]',
			Relation : '.W_main_2r div[id^="Pl_Core_RightUserGrid__"]',
			Album : '.W_main_2r div[id^="Pl_Core_RightPicMulti__"]',
			ProfHotTopic : '.W_main_2r div[id^="Pl_Core_RightTextSingle__"]',
			ProfHotWeibo : '.W_main_2r div[id^="Pl_Core_RightPicText__"]',
			FeedRecom : '.W_main_2r div[id^="Pl_Third_Inline__"]',
			MemberIcon : '.W_ico16[class*="ico_member"], .ico_member_dis',
			VerifyIcon : '.approve, .approve_co',
			DarenIcon : '.ico_club',
			VgirlIcon : '.ico_vlady',
			TaobaoIcon : '.ico_taobao',
			FifaIcon : '.icon_fifa'
		};
	// 显示设置链接
	var showSettingsBtn = function () {
		if (!$('wbpShowSettings')) {
			var groups = $.select('ul.sort') || $.select('ul.sort_profile');
			if (!groups) {
				console.warn("!groups return false") 
				return false; }
			var tab = document.createElement('li');
			tab.id = 'wbpShowSettings';
			tab.className = 'item';
			tab.innerHTML = '<a href="javascript:void(0)" class="item_link S_func1">眼不见心不烦</a>';
			$.click(tab, $dialog);
			groups.appendChild(tab);
		}
		return true;
	};
	// 应用浮动按钮设置
	var toggleFloatSettingsBtn = (function () {
		var floatBtn = null, lastTime = null, lastTimerID = null;
		// 仿照STK.comp.content.scrollToTop延时100ms显示/隐藏，防止scroll事件调用过于频繁
		function scrollDelayTimer() {
			if ((lastTime !== null && (new Date()).getTime() - lastTime < 500)) {
				clearTimeout(lastTimerID);
				lastTimerID = null;
			}
			lastTime = (new Date()).getTime();
			lastTimerID = setTimeout(function () {
				if (floatBtn) {
					floatBtn.style.visibility = window.scrollY > 0 ? 'visible' : 'hidden';
				}
			}, 100);
		}
		return function () {
			if (!$options.floatBtn && floatBtn) {
				window.removeEventListener('scroll', scrollDelayTimer, false);
				$.remove(floatBtn);
				floatBtn = null;
				return true;
			} else if ($options.floatBtn && !floatBtn) {
				var scrollToTop = $('base_scrollToTop');
				if (!scrollToTop) { return false; }
				floatBtn = document.createElement('a');
				floatBtn.href = 'javascript:void(0)';
				floatBtn.title = '眼不见心不烦';
				floatBtn.id = 'wbpFloatBtn';
				floatBtn.innerHTML = '<span class="S_line5" style="padding: 4px 0 6px; height: auto">★</span>';
				floatBtn.className = 'W_gotop S_line3';
				floatBtn.style.bottom = '75px';
				floatBtn.style.height = '24px';
				$.click(floatBtn, $dialog);
				scrollToTop.parentNode.appendChild(floatBtn);
				window.addEventListener('scroll', scrollDelayTimer, false);
				scrollDelayTimer();
				return true;
			}
			return false;
		};
	})();
	// 极简阅读模式（仅在个人首页生效）
	var toggleReaderMode = function () {
		var readerModeStyles = $('wbpReaderModeStyles');
		if ($options.readerModeIndex || $options.readerModeProfile) {
			if (!readerModeStyles) {
				readerModeStyles = document.createElement('style');
				readerModeStyles.type = 'text/css';
				readerModeStyles.id = 'wbpReaderModeStyles';
				document.head.appendChild(readerModeStyles);
			}
			var width = Number($options.readerModeWidth);
			readerModeStyles.innerHTML = '';
			if ($options.readerModeIndex) {
				readerModeStyles.innerHTML += '.B_index .W_main_l, .B_index .W_main_r, .B_index #Box_center>div:not(#pl_content_homeFeed), .B_index .group_read, .B_index .global_footer { display: none }\n' +
						'.B_index #pl_content_top, .B_index .WB_global_nav { top: -40px }\n' +
						'.B_index { background-position-y: -40px }\n' +
						'.B_index .W_miniblog { padding-top: 20px; background-position-y: -40px }\n' +
						'.B_index .W_main { width: ' + width + 'px !important; background: ' + $options.readerModeBackColor + ' }\n' +
						'.B_index #Box_center, .B_index .W_main_a { width: ' + width + 'px }\n' +
						'.B_index .WB_feed .repeat .input textarea { width: 100% }\n' +
						'.B_index .WB_feed .WB_screen { margin-left: ' + (width-48) + 'px }\n' +
						'.B_index .WB_feed .type_text { margin-left: ' + (width-165) + 'px }\n' +
						'.B_index .W_gotop { margin-left: ' + (width/2) + 'px !important }\n';
			}
			if ($options.readerModeProfile) { // 个人主页
				readerModeStyles.innerHTML += '.B_profile #Pl_Official_Header__1, .B_profile #Pl_Core_Nav__2, .B_profile .group_read, .B_profile .W_main_2r, .B_profile .group_read, .B_profile .global_footer { display: none }\n' +
						'.B_profile #pl_content_top, .B_profile .WB_global_nav { top: -40px }\n' +
						'.B_profile { background-position-y: -40px }\n' +
						'.B_profile .W_miniblog { padding-top: 20px; background-position-y: -40px }\n' +
						'.B_profile .W_main { width: ' + width + 'px !important; background: ' + $options.readerModeBackColor + ' }\n' +
						'.B_profile .W_main_c { padding-top: 0; width: ' + width + 'px }\n' +
						'.B_profile .WB_feed .repeat .input textarea { width: 100% }\n' +
						'.B_profile .WB_feed .WB_screen { margin-left: ' + (width-48) + 'px }\n' +
						'.B_profile .WB_feed .type_text { margin-left: ' + (width-165) + 'px }\n' +
						'.B_profile .W_gotop { margin-left: ' + (width/2) + 'px !important }\n';
			}
			if (!$options.readerModeTip && (
					($.scope() === 1 && $options.readerModeIndex) ||
					($.scope() === 2 && $options.readerModeProfile))) {
				alert('欢迎进入极简阅读模式！\n\n您可以按【F8】键快速开关本模式，也可以在“眼不见心不烦”插件设置“改造版面”页进行选择。');
				$options.readerModeTip = true;
				$options.save(true);
			}
		} else if (readerModeStyles) {
			$.remove(readerModeStyles);
		}
	};
	// 覆盖当前模板设置
	var overrideSkin = function () {
		var formerStyle = $('custom_style') || document.head.querySelector('link:not([id])[href*="/skin/"]'),
			skinCSS = $('wbpOverrideSkin');
		if (!formerStyle) { return; }
		if (($.uid === $.config.oid && $options.overrideMySkin) ||
			($.uid !== $.config.oid && $options.overrideOtherSkin)) {
			if (!skinCSS) {
				skinCSS = document.createElement('link');
				skinCSS.id = 'wbpOverrideSkin';
				skinCSS.type = 'text/css';
				skinCSS.rel = 'stylesheet';
				skinCSS.charset = 'utf-8';
				document.head.insertBefore(skinCSS, formerStyle);
			}
			skinCSS.href = $.config.cssPath + 'skin/' + $options.skinID + 
					'/skin' + ($.config.lang !== 'zh-cn' ? '_CHT' : '') +
					'.css?version=' + $.config.version;
			formerStyle.disabled = true;
		} else if (skinCSS) {
			$.remove(skinCSS);
			formerStyle.disabled = false;
		}
	};
	// 2013年6月起右边栏模块不再有固定ID，为其打上ID
	var tagRightbarMods = function (rightBar) {
		if (!rightBar) { return; }
		var identifiers = {
			'.right_content.hot_topic' : 'Topic',
			'.right_content.person_list' : 'InterestUser',
			'[change-data*="key=index_weibo"]' : 'WeiboRecom',
			'[change-data*="key=index_LBS"]' : 'LocationRecom',
			'[change-data*="key=index_song"]' : 'MusicRecom',
			'[change-data*="key=index_mov"]' : 'MovieRecom',
			'[change-data*="key=index_book"]' : 'BookRecom'			
		}, mods = rightBar.querySelectorAll('.WB_right_module');
		for (var i = 0; i < mods.length; ++i) {
			for (var id in identifiers) {
				if (mods[i].querySelector(id)) {
					mods[i].id = modules[identifiers[id]].substring(1);
					break;
				}
			}
		}
	};
	// 屏蔽模块
	var hideModules = function () {
		var cssText = '';
		$options.hideMods.forEach(function (module) {
			if (modules[module]) {
				cssText += modules[module] + ' { display: none !important }\n';
			}
		});
		if ($options.hideMods.indexOf('ProfCover') !== -1) { // 屏蔽封面时的特别处理
			cssText += '.profile_top { min-height: ' + ($options.hideMods.indexOf('ProfStats') === -1 ? 250 : 200) + 'px }\n';
		}
		// 屏蔽提示相关CSS
		var tipBackColor = $options.tipBackColor;
		var tipTextColor = $options.tipTextColor;
		cssText += '.wbpTip:not(:hover) { background-color: ' + tipBackColor + '; border-color: ' + tipTextColor + '; color: ' + tipTextColor + '; }';
		// 更新CSS
		var styles = $('wbpModuleStyles');
		if (!styles) {
			styles = document.createElement('style');
			styles.type = 'text/css';
			styles.id = 'wbpModuleStyles';
			document.head.appendChild(styles);
		}
		styles.innerHTML = cssText + '\n';
		// 单独处理“为你推荐”弹窗
		if ($options.hideMods.indexOf('FollowGuide') > -1) {
			// 载入页面时，如果DOM中包含#pl_guide_homeguide > div[node-type="follow_dialog"]则会弹出
			// 如果能抢在pl.guide.homeguide.index()之前去除，可以避免弹窗出现
			$.remove($.select('#pl_guide_homeguide > div[node-type="follow_dialog"]'));
			// 如果弹窗已经显示，则关闭之
			//var closeBtn = $.select('.layer_userguide_brief .W_close');
			//if (closeBtn) { closeBtn.click(); }
			// 模拟点击关闭按钮会导致页面刷新，改为去除弹窗DOM及其下的overlay
			var followGuide = $.select('.layer_userguide_brief');
			if (followGuide) {
				while (!followGuide.classList.contains('W_layer')) { followGuide = followGuide.parentNode; }
				if (followGuide.previousSibling.style.zIndex === followGuide.style.zIndex) {
					$.remove(followGuide.previousSibling); // 覆盖层
				}
				$.remove(followGuide);
			}
		}
	};
	// 禁止默认发布新微博到当前浏览的分组
	var disableDefaultGroupPub = function (node) {
		if (!$options.noDefaultGroupPub) { return; }
		var groupLink = node.querySelector('.limits a[node-type="showPublishTo"]');
		if (groupLink) {
			groupLink.firstChild.innerHTML = '公开';
			groupLink.setAttribute('action-data', 'rank=0');
		}
	};
	// 清除发布框中的默认话题
	var clearDefTopic = function () {
		if ($options.clearDefTopic && $.scope() === 1) {
			var inputBox = $.select('#pl_content_publisherTop .send_weibo .input textarea');
			if (inputBox && inputBox.hasAttribute('hottopic')) {
				// IFRAME载入方式，hotTopic可能尚未启动，直接清除相关属性即可
				inputBox.removeAttribute('hottopic');
				inputBox.removeAttribute('hottopicid');
				// 在发布框中模拟输入，欺骗STK.common.editor.plugin.hotTopic
				inputBox.value = 'DUMMY';
				inputBox.focus();
				inputBox.value = '';
				inputBox.blur();
			}
		}
	};
	// 将左边栏合并到右边栏
	var leftBar = $.select('.W_main_l'), navBar;
	if (leftBar) { navBar = leftBar.querySelector('.WB_left_nav'); }
	var mergeSidebars = function () {
		// 不要作用于“我关注的人”页面
		if (!navBar || navBar.id === 'pl_leftNav_relation') { return; }
		// 浮动边栏设置
		var navBox = navBar.querySelector('#pl_leftnav_common'), node, next;
		if ($options.floatSetting === 'Nav' && navBox.parentNode.getAttribute('node-type') === 'left_all') {
			navBar.querySelector('[node-type="left_fixed_item"]').insertBefore(navBox, navBar.querySelector('#pl_leftnav_group'));
		} else if ($options.floatSetting !== 'Nav' && navBox.parentNode.getAttribute('node-type') === 'left_fixed_item') {
			navBar.querySelector('[node-type="left_all"]').insertBefore(navBox, navBar.querySelector('[node-type="left_fixed"]'));
		}
		if ((!$options.mergeSidebars || $options.floatSetting === 'None') && navBar.hasAttribute('modsMoved')) {
			// 将右边栏原来的浮动模块移回原位
			node = navBar.parentNode.querySelector('#trustPagelet_indexright_recom [node-type="right_module_fixed"]');
			console.log(node.parentNode);
			while ((next = node.parentNode.firstChild) !== node) {
				node.appendChild(next);
			}
			// 将原属于右边栏的模块移出
			next = navBar.querySelector('#pl_leftnav_app').nextSibling;
			while (node = next) {
				next = node.nextSibling;
				navBar.parentNode.appendChild(node); // 移动回原位置
			}
			navBar.removeAttribute('modsMoved');
		}
		// 合并边栏
		if ($options.mergeSidebars) {
			if (!navBar.id) {
				var rightBar = $.select('.W_main_r'), myInfo = $('pl_rightmod_myinfo');
				if (!rightBar) { return; }
				leftBar.style.display = 'none';
				navBar.id = 'wbpNavBar';
				// 注意：Firefox不支持background-position-x
				$.select('.W_main').style.cssText = 'width: 830px; background-position: -150px 0';
				// 左边栏移动到右边栏
				rightBar.insertBefore(navBar, myInfo ? myInfo.nextSibling : rightBar.firstChild);
			}
			// 移动右边栏模块的操作需在完成合并边栏后进行
			if ($options.floatSetting !== 'None' && !navBar.hasAttribute('modsMoved')) {
				node = navBar.querySelector('[node-type="left_all"]');
				while (next = navBar.nextSibling) {
					node.appendChild(next);
				}
				navBar.setAttribute('modsMoved', '');
				// 如果左边栏有浮动模块，则禁止右边栏浮动
				node = navBar.querySelector('#trustPagelet_indexright_recom [node-type="right_module_fixed"]');
				if (node) { // 此时浮动模块可能尚未载入，交由DOMNodeInserted事件处理
					while (next = node.firstChild) {
						node.parentNode.insertBefore(next, node);
					}
				}
			}
		} else if (navBar.id) {
			navBar.id = '';
			leftBar.style.display = 'none';
			$.select('.W_main').style.cssText = '';
			// 移动回原位置
			leftBar.appendChild(navBar);
			leftBar.style.display = '';
		}
	};
	// 首次进入用户主页时直接跳转到微博列表
	var redirectToFeeds = (function () {
		var required, link;
		return function (node, req) {
			if (arguments.length === 2 && required === undefined) { required = req; }
			if (required === false) { return; }
			if (!link) { link = node.querySelector('.PRF_tab_noicon li.pftb_itm>a[href*="/weibo?"]'); }
			if (required && link) { link.click(); required = false; }
		};
	})();
	// 用户自定义样式及程序附加样式
	var customStyles = function () {
		var cssText = '.W_person_info { margin: 0 20px 20px !important }\n' + 
			'.layer_personcard .name_card_new .cover .btn_item { margin-right: 7px !important } ' +
			'.layer_personcard .name_card_new .cover .btn_item span { padding: 0 5px !important }\n',
			styles = $('wbpCustomStyles');
		if (!styles) {
			styles = document.createElement('style');
			styles.type = 'text/css';
			styles.id = 'wbpCustomStyles';
			document.head.appendChild(styles);
		}
		if ($options.showAllGroups) {
			cssText += '#pl_leftnav_group div[node-type="moreList"] { display: block !important } #pl_leftnav_group > div[node-type="groupList"] > .level_2_Box > .levmore { display: none }\n';
		}
		if ($options.showAllMsgNav) {
			cssText += '#pl_leftnav_common > .level_1_Box > .lev2_new { display: block !important }\n';
		}
		if ($options.unwrapText) {
			cssText += '.WB_info, .WB_text { display: inline } .WB_info+.WB_text:before { content: "：" } .WB_func { margin-top: 5px } .B_index .WB_feed .W_ico16 { vertical-align: -3px !important }\n';
		}
		if ($options.mergeSidebars) {
			cssText += 'body:not(.S_profile) .W_gotop { margin-left: 415px } body:not(.S_profile) .WB_left_nav .FIXED { width: 230px !important } \n';
		}
		if ($options.floatSetting === 'None') {
			cssText += 'body:not(.S_profile) .WB_left_nav [node-type="left_fixed"] { position: static !important; height: auto !important }\n';
		}
		if ($options.overrideMyBack) {
			cssText += 'body:not(.S_profile) .W_main { background: none ' + $options.backColor + ' !important } body:not(.S_profile) .S_bg4, body:not(.S_profile) .W_main_a, body:not(.S_profile) .W_main_bg { background: none transparent !important }\n';
		}
		if ($options.overrideOtherBack) {
			cssText += '.S_profile .W_profile_bg, .S_profile .S_bg5 { background-color: ' + $options.backColor + ' } .S_profile .S_bg4:not(.W_profile_bg) { background: none transparent !important }\n';
		}
		if ($options.useCustomStyles) {
			cssText += $options.customStyles;
		}
		styles.innerHTML = cssText + '\n';
	};
	// 在用户信息气球或用户主页上添加屏蔽链接
	var showUserFilterBtn = function (node) {
		if (!node) { node = document.body; }
		var balloon = node.classList.contains('name_card_new'), userData, toolbar, uid;
		if (balloon) {
			// 获得关注链接
			userData = node.querySelector('.related_info>.name a[uid]');
			if (!userData) { return false; }
			uid = userData.getAttribute('uid');
			toolbar = node.querySelector('.action');
		} else if ($.scope() === 2) {
			if (userData = $('wbpUserFilter')) {
				// 按钮已存在时只更新状态
				userData.update();
				return false;
			}
			uid = $.oid;
			toolbar = node.querySelector('.pf_info .pf_do');
		}
		if (!toolbar || uid === $.uid) { return false; }
		// 创建分隔符
		var button = document.createElement('div');
		if (balloon) {
			button.className = 'btn_item';
		} else {
			button.id = 'wbpUserFilter';
			button.className = 'btn_bed W_fl';
		}
		// 创建操作链接
		var link = document.createElement('a');
		button.appendChild(link);
		link.href = 'javascript:void(0)';
		(button.update = function () {
			if ($options.userBlacklist.indexOf(uid) === -1) {
				link.className = 'W_btn_b';
				link.innerHTML = '<span>屏蔽</span>';
			} else {
				link.className = 'W_btn_c';
				link.innerHTML = '<span><em class="W_ico12 icon_addone"></em>已屏蔽</span>';	
			}
		})();
		$.click(link, function () {
			// 切换屏蔽状态
			var i = $options.userBlacklist.indexOf(uid);
			if (i === -1) {
				$options.userBlacklist.push(uid);
			} else {
				$options.userBlacklist.splice(i, 1);
			}
			$options.save();
			$filter();
			if (balloon) {
				// 回溯到顶层，关闭信息气球
				while (node.className !== 'W_layer') {
					node = node.parentNode;
				}
				node.style.display = 'none';
			}
			if (i = $('wbpUserFilter')) { i.update(); }
		});
		toolbar.insertBefore(button, toolbar.querySelector('div+div'));
	};
	// 根据当前设置修改页面
	var apply = function (init) {
		// 极简阅读模式
		toggleReaderMode();
		// 设置链接
		showSettingsBtn();
		// 浮动设置按钮
		toggleFloatSettingsBtn();
		// 屏蔽用户按钮
		showUserFilterBtn();
		// 合并边栏
		mergeSidebars();
		// 屏蔽版面模块
		hideModules();
		// 清除发布框中的默认话题
		clearDefTopic();
		// 覆盖当前模板设置
		overrideSkin();
		// 应用自定义CSS
		customStyles();
		// 禁止默认发布新微博到当前浏览的分组
		disableDefaultGroupPub(document);
		// 首次进入用户主页时直接跳转到微博列表
		if (init) {
			redirectToFeeds(document, $.scope() === 2 && $.config.location.substr(-5) === '_home' && $options.directFeeds);
		}
	};

	// IFRAME载入不会影响head中的CSS，只添加一次即可
	var myStyles = document.createElement('style');
	myStyles.type = 'text/css';
	myStyles.id = 'wbpDialogStyles';
	myStyles.innerHTML = 'settings.css';
	document.head.appendChild(myStyles);
	// 为右边栏动态模块打屏蔽标记
	tagRightbarMods($('trustPagelet_indexright_recom'));
	// 处理动态载入内容
	document.addEventListener('DOMNodeInserted', function (event) {
		var scope = $.scope(), node = event.target;
		//if (node.tagName !== 'SCRIPT') { console.log(node); }
		if (node.tagName !== 'DIV') { return; }
		if (scope && node.classList.contains('group_read')) {
			// 重新载入设置按钮
			showSettingsBtn();
		} else if (node.classList.contains('name_card_new') || node.classList.contains('PRF_profile_header')) {
			// 在用户信息气球或个人主页信息栏中显示屏蔽按钮
			showUserFilterBtn(node);
		} else if (node.classList.contains('W_main_r') || node.querySelector('.W_main_r')) {
			// 合并边栏
			mergeSidebars();
		} else if (node.getAttribute('node-type') === 'follow_dialog' && $options.hideMods.indexOf('FollowGuide') > -1) {
			// 动态载入的div[node-type="follow_dialog"]会使后续运行的pl.guide.homeguide.index显示“为你推荐”弹窗
			$.remove(node);
		} else if (node.querySelector('.commoned_list') && $options.noDefaultFwd) {
			// 禁止评论时默认选中“同时转发”
			var fwdCheckbox = node.querySelector('.commoned_list .W_checkbox[name="forward"]');
			if (fwdCheckbox && fwdCheckbox.checked) {
				fwdCheckbox.checked = false;
			}
		} else if (node.classList.contains('feed_repeat') && $options.noDefaultCmt) {
			// 禁止转发时默认选中“同时评论”
			var runs = 0,
				cmtFwdCheckbox = node.parentNode.parentNode.querySelector('.W_checkbox[node-type="forwardInput"]'),
				cmtOrgCheckbox = node.parentNode.parentNode.querySelector('.W_checkbox[node-type="originInput"]');
			// 如果满足指定条件（uid倒数第二位是8或9），在转发窗口“当前已转发”微博列表
			// 成功载入后会自动选中“同时评论”，此处采用短时间延时器将其取消选中
			(function waitForUncheck() {
				if (cmtFwdCheckbox && cmtFwdCheckbox.checked) {
					cmtFwdCheckbox.checked = false;
				} else if (cmtOrgCheckbox && cmtOrgCheckbox.checked) {
					cmtOrgCheckbox.checked = false;
				} else if (++runs < 10) { // 最多等待10ms*10=0.1s
					setTimeout(waitForUncheck, 10);
				}
			})();
		} else if (node.classList.contains('send_weibo')) {
			// 禁止默认发布新微博到当前浏览的分组
			disableDefaultGroupPub(node);
			// 清除发布框中的默认话题
			clearDefTopic();
		} else if (node.classList.contains('PRF_tab_noicon')) {
			// 首次进入用户主页时直接跳转到微博列表
			redirectToFeeds(node);
		} else if (node.hasAttribute('ucardconf') && node.parentNode.id === 'trustPagelet_indexright_recom') {
			// 微博新首页右边栏模块处理
			tagRightbarMods(node.parentNode);
			if ($options.mergeSidebars && $options.floatSetting !== 'None') {
				// 如果左边栏有浮动模块，则禁止右边栏浮动
				var fixed = node.querySelector('[node-type="right_module_fixed"]'), next;
				while (next = fixed.firstChild) {
					node.insertBefore(next, fixed.parentNode.firstChild);
				}
			}
		}
	}, false);
	document.addEventListener('DOMNodeRemoved', function (event) {
		if (!navBar || !navBar.id) { return; }
		var node = event.target;
		if (node.tagName === 'DIV' && node.querySelector('#wbpNavBar')) {
			if (navBar.hasAttribute('modsMoved')) {
				// 将原属于右边栏的模块移出，注意node变量此处被重用
				var next = navBar.querySelector('#pl_leftnav_app').nextSibling;
				while (node = next) {
					next = node.nextSibling;
					navBar.parentNode.appendChild(node); // 移动回原位置
				}
				navBar.removeAttribute('modsMoved');
				// 右边栏即将被移除，无需将浮动模块移动回原位置
			}
			// 原左边栏所属模块即将随着右边栏被移除，需要将其暂时移动回左边栏（必须在DOM中时刻保持一个副本）
			navBar.id = '';
			leftBar.appendChild(navBar);
		}
	});
	// 检测按键，开关极简阅读模式
	document.addEventListener('keyup', function onKeyPress(event) {
		if ($dialog.shown()) { return; }
		var scope = $.scope();
		if (scope && event.keyCode === 119) {
			if (scope === 1) {
				$options.readerModeIndex = !$options.readerModeIndex;
			} else {
				$options.readerModeProfile = !$options.readerModeProfile;
			}
			$options.save();
			toggleReaderMode();
		}
	}, false);

	apply.modules = modules;
	return apply;
})();

// 先读取本地设置
$.get($.uid.toString(), undefined, function (options) {
	var init = function () {
		// 如果第一次运行时就在作用范围内，则直接屏蔽关键词（此时页面已载入完成）；
		// 否则交由$filter中注册的DOMNodeInserted事件处理
		if ($.scope()) { $filter(); }
		// 直接应用页面设置（此时页面已载入完成）
		// 与IFRAME相关的处理由$page中注册的DOMNodeInserted事件完成
		$page(true);
	};
	if (!$options.load(options)) {
		alert('“眼不见心不烦”设置读取失败！\n设置信息格式有问题。');
	} else if (options && $options.version < $.version) {
		$options.save(true); // 更新版本信息
		if ($options.updateNotify) {
			alert('您已更新到“眼不见心不烦”1.1.12：\n\n- ' + '增加对天猫链接的屏蔽；增加对2014世界杯国旗标识的屏蔽'.split('；').join('\n- '));
		}
	}
	//#if CHROME
	if ($options.autoSync) {
		// 如果本地设置中开启了设置同步，则读取云端设置
		return $.get($.uid.toString(), undefined, function (options) {
				if (options) {
					$options.load(options);
				} else {
					// 如果云端尚无设置，则将本地设置保存至云端
					$options.save();
				}
				init();
			}, true);
	}
	//#endif
	init();
});

})();