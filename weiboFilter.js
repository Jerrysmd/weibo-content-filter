(function (source) {
	var script = document.createElement('script');
	script.setAttribute('type', 'text/javascript');
	script.textContent = '(' + source + ')();';
	// console.log(script);
	document.head.appendChild(script);
	document.head.removeChild(script);
})(function () {
	// 工具函数
	var $ = (function () {
		// 按id选择元素（默认操作）
		var $ = function (id) {
			return document.getElementById(id);
		};
		$.version = Number('111');
		// 按CSS选择元素
		$.select = function (css) {
			return document.querySelector(css);
		};
		var CHROME_KEY_ROOT = 'weiboPlus.';
		localStorage.setItem(CHROME_KEY_ROOT + 'chromeExtInstalled', true);
		$.window = window;
		$.config = $.window.$CONFIG;
		if (!$.config) {
			return undefined;
		}
		$.uid = $.config.uid;
		if (!$.uid) {
			return undefined;
		}
		$.oid = $.config.oid; // 页面uid（个人主页或单条微博的uid）
		var callbacks = {};
		document.addEventListener('wbpPost', function (event) {
			event.stopPropagation();
			var pos = event.detail.indexOf('=');
			var id = event.detail.slice(0, pos), value = event.detail.slice(pos + 1);
			callbacks[id](value);
			delete callbacks[id];
		});
		$.get = function (name, defVal, callback, sync) {
			var messageID = Math.random().toString(36).slice(2); // 生成随机ID
			callbacks[messageID] = callback;
			document.dispatchEvent(new CustomEvent('wbpGet', {
				detail: {
					name: name,
					defVal: defVal,
					id: messageID,
					sync: sync
				}
			}));
		};
		$.set = function (name, value, sync) {
			document.dispatchEvent(new CustomEvent('wbpSet', {
				detail: {
					name: name,
					value: value,
					sync: sync
				}
			}));
		};
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
			//console.log('document.body.classList: ' + document.body.classList);
			// return document.body.classList.contains('FRAME_main') ? 1 : document.body.classList.contains('FRAME_page') ? (document.domain === 'd.weibo.com' ? 3 : 2) : 0;
			return 1;
		};
		return $;
	})();

	if (!$) { return false; }

	function Options() {
		// 各类型默认值
		var typeDefault = {
			keyword: [],
			string: '',
			bool: false,
			radio: '',
			array: [],
			object: {},
			internal: null
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
		items: {
			version: ['internal', 0], // 内部变量：不在设置界面出现，不随设置导出
			whiteKeywords: ['keyword'],
			blackKeywords: ['keyword'],
			grayKeywords: ['keyword'],
			sourceKeywords: ['keyword'],
			sourceGrayKeywords: ['keyword'],
			userBlacklist: ['array'],
			tipBackColor: ['string', '#FFD0D0'],
			tipTextColor: ['string', '#FF8080'],
			readerModeIndex: ['bool'],
			readerModeProfile: ['bool'],
			readerModeTip: ['internal', false], // 内部变量：不在设置界面出现，不随设置导出
			readerModeWidth: ['string', 750],
			smallImgLayout: ['bool'],
			customImgSize: ['string', 80],
			customTotalWidth: ['string', 250],
			customVideoSize: ['string', 120],
			squareAvatar: ['bool'],
			moveSrcToBtm: ['bool'],
			unwrapText: ['bool'],
			compactFeedToolbar: ['bool'],
			noHomeRightBar: ['bool'],
			noHomeMargins: ['bool'],
			noHotYellowTags: ['bool'],
			directBigImg: ['bool'],
			directAllFeeds: ['bool'],
			showAllArticleText: ['bool'],
			showAllText: ['bool'],
			showAllGroups: ['bool'],
			showAllMsgNav: ['bool'],
			showAllSonFeeds: ['bool'],
			noDefaultGroupPub: ['bool'],
			clearDefTopic: ['bool'],
			overrideMyBack: ['bool'],
			overrideOtherBack: ['bool'],
			backColor: ['string', 'rgba(100%,100%,100%,0.2)'],
			overrideMySkin: ['bool'],
			overrideOtherSkin: ['bool'],
			skinID: ['string', 'skinvip001'],
			filterOthersOnly: ['bool'],
			filterPaused: ['bool'],
			filterSmiley: ['bool'],
			filterName: ['bool', true],
			filterPromotions: ['bool'],
			filterHot: ['bool'],
			filterLiked: ['bool'],
			filterTopic: ['bool'],
			filterDeleted: ['bool'],
			filterTaobao: ['bool'],
			filterFlood: ['bool'],
			maxFlood: ['string', 5],
			updateNotify: ['bool', true],
			autoSync: ['bool', true],
			useCustomStyles: ['bool', true],
			customStyles: ['string'],
			hideMods: ['array']
		},
		// 去除内部变量并转换为字符串
		strip: function () {
			var stripped = {};
			for (var option in this.items) {
				if (this.items[option][0] !== 'internal') {
					stripped[option] = this[option];
				}
			}
			return JSON.stringify(stripped);
		},
		// 保存设置
		save: function (noSync) {
			this.version = $.version;
			$.set($.uid.toString(), JSON.stringify(this));
			if (!noSync && $options.autoSync) {
				// 不必同步内部变量
				$.set($.uid.toString(), this.strip(), true);
			}
		},
		// 载入/导入设置，输入的str为undefined（首次使用时）或string（非首次使用和导入设置时）
		load: function (str) {
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
			// == LEGACY CODE START ==
			// 自动转换“大家正在热搜”选项
			if (parsed.clearHotSearch) {
				this.hideMods.push("HotSearch");
			}
			// 采用“紧凑型工具栏”或“微博作者后不折行”时自动将微博来源置于底部
			if (parsed.unwrapText || parsed.compactFeedToolbar) {
				this.moveSrcToBtm = true;
			}
			// == LEGACY CODE END
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
				if (!keyword || getKeywords(id, attr).indexOf(keyword) !== -1) { return false; }
				var keywordLink = document.createElement('a');
				// 关键词是正则表达式？
				if (keyword.length > 2 && keyword.charAt(0) === '/' && keyword.charAt(keyword.length - 1) === '/') {
					try {
						// 尝试创建正则表达式，检验正则表达式的有效性
						// 调用test()是必须的，否则浏览器可能跳过该语句
						RegExp(keyword.slice(1, -1)).test('');
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
				unprocessed = users.length, unfound = [];
			users.forEach(function (user) {
				var request = { type: 1 };
				if (updateOnly) {
					request.id = user;
				} else {
					request.name = user;
				}
				STK.jsonp({
					url: '/aj/v6/user/newcard?ajwvr=6',
					args: request,
					method: 'get',
					responseType: 'json',
					varkey: 'callback',
					timeout: 3e4,
					onComplete: function (result) {
						var link;
						if (updateOnly) {
							link = div.querySelector('a[uid="' + request.id + '"]');
						} else {
							link = document.createElement('a');
						}
						if (result.code === '100000') { // 成功
							var img = result.data.match(/<img[^>]+>/)[0];
							if (!updateOnly) { request.id = img.match(/uid="([^"]+)"/)[1]; }
							// 防止重复添加
							if (updateOnly || getKeywords(id, 'uid').indexOf(request.id) === -1) {
								link.innerHTML = '<img width="50" height="50" ' + img.match(/src="[^"]+"/)[0] + ' /><br />' + img.match(/title="([^"]+)"/)[1];
								if (!updateOnly) {
									// 添加新的用户
									link.title = '点击删除';
									link.href = 'javascript:void(0)';
									link.setAttribute('uid', request.id);
									link.setAttribute('action-type', 'remove');
									div.appendChild(link);
								}
							}
						} else if (updateOnly) {
							link.innerHTML += '<br />（未找到）';
						} else {
							unfound.push(request.name);
						}
						if (--unprocessed === 0) {
							// 全部处理完成，在文本框中显示未被添加的用户并闪烁提示
							getDom(list).value = unfound.join(' ');
							if (unfound.length) {
								// 首页与主页API不一致
								(STK.common.extra ? STK.common.extra.shine : STK.kit.extra.shine)(getDom(list));
							}
						}
					},
					onTraning: STK.funcEmpty,
					onFail: STK.funcEmpty,
					isEncode: true
				});
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
				getDom('hide' + module).checked = (options.hideMods.indexOf(module) !== -1);
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
			var HTML = '<div node-type="outer" class="detail wbpSettings" style="padding: 0 20px 20px"><div class="clearfix"><div style="float: left">新浪微博<span style="color: red">非官方</span>功能增强脚本。</div><div style="float: right; display: inline; position: relative"><a href="https://chrome.google.com/webstore/detail/aognaapdfnnldnjglanfbbklaakbpejm" target="_blank">插件主页</a><em class="W_vline"></em><a href="https://bitbucket.org/salviati/weibo-cleaner/wiki/FAQ" title="遇到问题请先阅读FAQ" target="_blank">常见问题</a><em class="W_vline"></em><a href="/salviati" title="欢迎私信、评论或@作者提出建议" target="_blank">联系作者</a></div></div><div class="clearfix"><div node-type="tabHeaders" class="wbpTabHeaders"><a tab="tabKeywords" href="javascript:void(0);" class="current">关键词</a><a node-type="tabHeaderUser" tab="tabUser" href="javascript:void(0);">用户</a><a tab="tabSource" href="javascript:void(0);">来源</a><a tab="tabAdvanced" href="javascript:void(0);">高级</a><a tab="tabModules" href="javascript:void(0);">模块</a><a tab="tabModify" href="javascript:void(0);">改造版面</a><a node-type="tabHeaderSettings" tab="tabSettings" href="javascript:void(0);">设置</a></div><div node-type="tabs" style="float: right; width: 440px"><div node-type="tabKeywords"><div class="clearfix"><div style="float: left"><input type="checkbox" node-type="filterSmiley"><label title="如果选中，[呵呵]等表情也可以作为关键词被屏蔽">允许表情关键词</label><input type="checkbox" node-type="filterName" style="margin-left: 10px"><label title="如果选中，@富平侯 等用户名也可以作为关键词被屏蔽">在用户名中搜索关键词</label></div><div style="float: right; display: inline; position: relative"><span class="link"><a href="javascript:void(0);" style="cursor: help">关键词设置帮助<span><ul><li>如果要添加的关键词中有空格，可将其置于一对<span style="color: blue">半角双引号</span>内，如<span style="color: green">"I love you"</span></li><li>使用<span style="color: blue">加号</span>分隔需要同时出现的关键词，如<span style="color: green">A+B+C</span>代表A、B、C三个词必须同时出现</li><li>使用<span style="color: blue">斜杠</span>设置正则表达式关键词，如<span style="color: green">/转发并@.{2,3}好友/</span></li></ul></span></a></span></div></div><div class="wbpKeywordBlock"><em>白名单</em>包含下列关键词的微博不会被屏蔽<table width="100%" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td><div class="wbpInput"><input type="text" node-type="whiteKeywords" class="input" placeholder="多个关键词用空格隔开；不区分大小写；区分简繁体"></div></td><td class="wbpToolBtns"><a href="javascript:void(0);" class="W_btn_b" action-type="add" action-data="list=whiteKeywordsList&text=whiteKeywords"><span>添加</span></a><a href="javascript:void(0);" class="W_btn_b" action-type="clear" action-data="list=whiteKeywordsList"><span>清空</span></a></td></tr></tbody></table><div class="wbpListWrapper"><div node-type="whiteKeywordsList" class="wbpKeywordsList wbpWhiteKeywordsList"></div></div></div><div class="wbpKeywordBlock"><em>黑名单</em>包含下列关键词的微博将被屏蔽<table width="100%" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td><div class="wbpInput"><input type="text" node-type="blackKeywords" class="input" placeholder="多个关键词用空格隔开；不区分大小写；区分简繁体"></div></td><td class="wbpToolBtns"><a href="javascript:void(0);" class="W_btn_b" action-type="add" action-data="list=blackKeywordsList&text=blackKeywords"><span>添加</span></a><a href="javascript:void(0);" class="W_btn_b" action-type="clear" action-data="list=blackKeywordsList"><span>清空</span></a></td></tr></tbody></table><div class="wbpListWrapper"><div node-type="blackKeywordsList" class="wbpKeywordsList wbpBlackKeywordsList"></div></div></div><div class="wbpKeywordBlock"><em>灰名单</em>包含下列关键词的微博将被屏蔽<span style="color: red">并提示</span><table width="100%" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td><div class="wbpInput"><input type="text" node-type="grayKeywords" class="input" placeholder="多个关键词用空格隔开；不区分大小写；区分简繁体"></div></td><td class="wbpToolBtns"><a href="javascript:void(0);" class="W_btn_b" action-type="add" action-data="list=grayKeywordsList&text=grayKeywords"><span>添加</span></a><a href="javascript:void(0);" class="W_btn_b" action-type="clear" action-data="list=grayKeywordsList"><span>清空</span></a></td></tr></tbody></table><div class="wbpListWrapper"><div node-type="grayKeywordsList" class="wbpKeywordsList wbpGrayKeywordsList"></div></div><table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 0px"><tbody><tr><td style="width: 110px">屏蔽提示背景颜色：</td><td><div class="wbpInput"><input type="text" node-type="tipBackColor" class="input"></div></td><td style="width: 15px"></td><td style="width: 110px">屏蔽提示文字颜色：</td><td><div class="wbpInput"><input type="text" node-type="tipTextColor" class="input"></div></td></tr></tbody></table><table width="100%" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td style="width: 40px">示例：</td><td><div node-type="tipSample" class="wbpTip" style="margin-bottom: 10px">本条来自<a href="javascript:void(0);">@某人</a>的微博因包含关键词“<a href="javascript:void(0);">XXXX</a>”而被隐藏，点击显示</div></td></tr></tbody></table></div></div><div node-type="tabUser" style="display: none"><p>如果一条微博的发布者或转发原文的作者为下列用户之一，微博将被屏蔽。除了在此处添加屏蔽用户，您还可以将鼠标悬停在用户链接上，在弹出的信息气球上点击“屏蔽”。</p><table width="100%" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td><div class="wbpInput"><input type="text" node-type="userBlacklistNew" class="input" placeholder="多个用户名用空格隔开；不要加上前面的@；不区分大小写"></div></td><td class="wbpToolBtns"><a href="javascript:void(0);" class="W_btn_b" action-type="addUser" action-data="list=userBlacklist&text=userBlacklistNew"><span>添加</span></a><a href="javascript:void(0);" class="W_btn_b" action-type="clear" action-data="list=userBlacklist"><span>清空</span></a></td></tr></tbody></table><div class="wbpListWrapper" style="max-height: 230px"><div node-type="userBlacklist" class="wbpUserList wbpBlackKeywordsList"></div></div></div><div node-type="tabSource" style="display: none"><p>如果一条微博的来源（包括转发原文的来源）名称中包含指定关键词，微博将被屏蔽。如将“时光机”设为关键词可屏蔽所有来自<a href="http://time.xuapp.com/" target="_blank">时光机</a>或<a href="http://weibo.pp.cc/time/" target="_blank">皮皮时光机</a>等应用的微博。</p><div class="wbpKeywordBlock"><em>黑名单</em>来源名称包含下列关键词的微博将被屏蔽<table width="100%" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td><div class="wbpInput"><input type="text" node-type="sourceKeywords" class="input" placeholder="多个关键词用空格隔开；不区分大小写；区分简繁体"></div></td><td class="wbpToolBtns"><a href="javascript:void(0);" class="W_btn_b" action-type="add" action-data="list=sourceKeywordsList&text=sourceKeywords"><span>添加</span></a><a href="javascript:void(0);" class="W_btn_b" action-type="clear" action-data="list=sourceKeywordsList"><span>清空</span></a></td></tr></tbody></table><div class="wbpListWrapper"><div node-type="sourceKeywordsList" class="wbpKeywordsList wbpBlackKeywordsList"></div></div></div><div class="wbpKeywordBlock"><em>灰名单</em>来源名称包含下列关键词的微博将被屏蔽<span style="color: red">并提示</span><table width="100%" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td><div class="wbpInput"><input type="text" node-type="sourceGrayKeywords" class="input" placeholder="多个关键词用空格隔开；不区分大小写；区分简繁体"></div></td><td class="wbpToolBtns"><a href="javascript:void(0);" class="W_btn_b" action-type="add" action-data="list=sourceGrayKeywordsList&text=sourceGrayKeywords"><span>添加</span></a><a href="javascript:void(0);" class="W_btn_b" action-type="clear" action-data="list=sourceGrayKeywordsList"><span>清空</span></a></td></tr></tbody></table><div class="wbpListWrapper"><div node-type="sourceGrayKeywordsList" class="wbpKeywordsList wbpGrayKeywordsList"></div></div></div></div><div node-type="tabAdvanced" style="display: none"><p>注意：对于所有屏蔽微博的功能，白名单具有最高优先级；如果一条微博包含白名单中的关键词，则<span style="color: red">一定不会</span>被屏蔽。</p><p><input type="checkbox" node-type="filterOthersOnly"><label>不要屏蔽我自己发布的微博</label></p><p><input type="checkbox" node-type="filterPaused"><label><span style="color: red">暂停屏蔽</span>：选中时暂时停止屏蔽微博</label></p><p><input type="checkbox" node-type="filterPromotions"><label>屏蔽推广微博</label></p><p><input type="checkbox" node-type="filterHot"><label>屏蔽热门微博（粉丝头条）</label></p><p><input type="checkbox" node-type="filterLiked"><label>屏蔽好友赞过的微博</label></p><p><input type="checkbox" node-type="filterTopic"><label>屏蔽关注话题推荐的微博</label></p><p><input type="checkbox" node-type="filterDeleted"><label>屏蔽已删除微博的转发</label></p><p><input type="checkbox" node-type="filterTaobao"><label class="WB_text">屏蔽带有 <a class="W_btn_b W_btn_cardlink btn_22px"><span class="ico_spe"><i class="W_icon icon_cd_tb"></i></span><span class="W_autocut">淘宝商品</span></a> 或 <a class="W_btn_b W_btn_cardlink btn_22px"><span class="ico_spe"><i class="W_icon icon_cd_tmall"></i></span><span class="W_autocut">天猫商品</span></a> 的微博</label></p><div style="margin-top: 5px"><input type="checkbox" node-type="filterFlood"><label>反刷屏：来自同一用户的微博最多显示</label><div class="wbpInput wbpInlineInput"><input type="text" node-type="maxFlood" class="input"></div>条</div></div><div node-type="tabModules" class="wbpTabModules" style="display: none"><p>请选择要屏蔽的版面内容。</p><table width="100%" border="0" cellspacing="0" cellpadding="0" style="line-height: 24px; margin-top: 15px"><tbody><tr><td><input type="checkbox" node-type="hideAds"><label>版面广告及嵌入式广告</label></td><td><input type="checkbox" node-type="hideHotSearch"><label>大家正在热搜（搜索栏）</label></td></tr><tr><td><input type="checkbox" node-type="hideFooter"><label>页底链接模块</label></td><td><input type="checkbox" node-type="hideRecommendedTopic"><label>热点微话题（发布框右上）</label></td></tr><tr><td><input type="checkbox" node-type="hideIMNews"><label>右下角新闻快讯</label></td><td><input type="checkbox" node-type="hideCommentTip"><label>评论栏顶端横幅</label></td></tr><tr><td><input type="checkbox" node-type="hideMusicPlayer"><label>微音乐播放器（左下角）</label></td><td><input type="checkbox" node-type="hideMemberTip"><label>微博会员推广横幅（页底）</label></td></tr><tr class="wbpRowSpacing"><td><input type="checkbox" node-type="hideRecomFeed"><label>精彩微博推荐（首页时间线）</label></td><td><input type="checkbox" node-type="hideTimelineMods"><label>时间线嵌入模块（好友关注等）</label></td></tr><tr><td><input type="checkbox" node-type="hideTopicCard"><label>微博话题卡片</label></td><td><input type="checkbox" node-type="hideLocationCard"><label>微博位置卡片</label></td></tr><tr><td><input type="checkbox" node-type="hideAppCard"><label>微博应用卡片</label></td><td><input type="checkbox" node-type="hideMemberCover"><label>会员微博背景</label></td></tr><tr class="wbpRowSpacing"><td><input type="checkbox" node-type="hideFriends"><label>好友圈</label></td><td><input type="checkbox" node-type="hideToMe"><label>群微博</label></td></tr><tr><td><input type="checkbox" node-type="hideHotWeibo"><label>热门微博</label></td><td><input type="checkbox" node-type="hideHongbao"><label>让红包飞（右边栏）</label></td></tr><tr><td><input type="checkbox" node-type="hideStats"><label>关注/粉丝/微博数</label></td><td><input type="checkbox" node-type="hideLevel"><label>用户等级</label></td></tr><tr><td><input type="checkbox" node-type="hideTopic"><label>热门话题</label></td><td><input type="checkbox" node-type="hideAttFeed"><label>好友关注动态</label></td></tr><tr><td><input type="checkbox" node-type="hideMusicRecom"><label>亚洲新歌榜/好书榜</label></td><td><input type="checkbox" node-type="hideMovieRecom"><label>电影热议榜</label></td></tr><tr><td><input type="checkbox" node-type="hideMember"><label>会员专区</label></td><td><input type="checkbox" node-type="hideNotice"><label>公告栏</label></td></tr><tr class="wbpRowSpacing"><td><input type="checkbox" node-type="hideVerifyIcon"><label>个人/机构认证标识</label><a href="http://verified.weibo.com/verify" target="_blank"><i class="W_icon icon_approve"></i><i class="W_icon icon_approve_gold"></i><i class="W_icon icon_approve_co"></i></a></td><td><input type="checkbox" node-type="hideDarenIcon"><label>微博达人标识</label><a href="http://club.weibo.com/intro" target="_blank"><i class="W_icon icon_club"></i></a></td></tr><tr><td><input type="checkbox" node-type="hideMemberIcon"><label>微博会员标识</label><a href="http://vip.weibo.com/" target="_blank"><i class="W_icon icon_member"></i></a></td><td><input type="checkbox" node-type="hideVgirlIcon"><label>微博女郎标识</label><a href="http://vgirl.weibo.com/" target="_blank"><i class="W_icon icon_vlady"></i></a></td></tr><tr><td><input type="checkbox" node-type="hideTaobaoIcon"><label>淘宝商户</label><a href="http://e.weibo.com/taobao/introduce" target="_blank"><i class="W_icon icon_taobao"></i><i class="W_icon icon_tmall"></i></a></td><td><input type="checkbox" node-type="hideGongyiIcon"><label>微公益</label><a href="http://gongyi.weibo.com/" target="_blank"><i class="W_icon icon_gongyi"></i></a></td></tr><tr><td><input type="checkbox" node-type="hideHongbaoIcon"><label>让红包飞</label><a href="http://chunjie.hongbao.weibo.com/hongbao2017" target="_blank"><i class="W_icon icon_redpack"></i><i class="W_icon icon_wealth"></i></a></td><td><input type="checkbox" node-type="hidePaiIcon"><label>随手拍2017</label><a href="http://huodong.weibo.com/pai2017" target="_blank"><i class="W_icon icon_suishoupai2014"></i></a></td></tr><tr><td><input type="checkbox" node-type="hideTravelIcon"><label>带着微博去旅行</label><a href="http://huodong.weibo.com/travel2017" target="_blank"><i class="W_icon icon_airball"></i></a></td></tr><tr class="wbpRowSpacing"><td><input type="checkbox" node-type="hideProfCover"><label>封面图（个人主页）</label></td><td><input type="checkbox" node-type="hideProfStats"><label>关注/粉丝/微博数（个人主页）</label></td></tr><tr><td><input type="checkbox" node-type="hideRelation"><label>关注/粉丝/微关系（个人主页）</label></td><td><input type="checkbox" node-type="hideAlbum"><label>微相册（个人主页）</label></td></tr><tr class="wbpRowSpacing"><td colspan="2"><input type="checkbox" node-type="hideFeedRecom"><label>相关推荐：单条微博右边栏</label></td></tr></tbody></table><p style="margin-top: 15px"><a href="javascript:void(0);" class="W_btn_b" node-type="hideAll"><span>全选</span></a><a href="javascript:void(0);" class="W_btn_b" node-type="hideInvert" style="margin-left: 5px"><span>反选</span></a></p></div><div node-type="tabModify" style="display: none"><p><input type="checkbox" node-type="squareAvatar"><label>使用方形头像</label></p><p><input type="checkbox" node-type="moveSrcToBtm"><label>微博来源移动至微博底部</label></p><p style="margin-left: 20px"><input type="checkbox" node-type="unwrapText"><label>微博作者与正文间不折行</label></p><p style="margin-left: 20px"><input type="checkbox" node-type="compactFeedToolbar"><label>使用紧凑型（V5样式）微博工具栏（收藏 | 转发 | 评论 | 赞）</label></p><p><input type="checkbox" node-type="noHomeRightBar"><label>去除首页右边栏</label></p><p><input type="checkbox" node-type="noHomeMargins"><label>在首页使用紧凑版式（去除卡片间空隙）</label></p><p><input type="checkbox" node-type="noHotYellowTags"><label>禁止弹出“有新的热门微博”等提示</label></p><p><input type="checkbox" node-type="showAllArticleText"><label>显示未关注作者的长微博全文</label></p><p><input type="checkbox" node-type="showAllText"><label>展开字数超长的微博内容</label></p><p><input type="checkbox" node-type="showAllGroups"><label>展开分组栏中的所有分组</label></p><p><input type="checkbox" node-type="showAllMsgNav"><label>在左边栏增加消息导航（“评论”、“私信”等）</label></p><p><input type="checkbox" node-type="showAllSonFeeds"><label>展开所有子微博（“还有?条对原微博的转发”）</label></p><p><input type="checkbox" node-type="directBigImg"><label>点击“查看大图”或“查看图片”直接打开大图</label></p><p><input type="checkbox" node-type="directAllFeeds"><label>进入未关注人主页时默认查看全部微博</label></p><p><input type="checkbox" node-type="noDefaultGroupPub"><label>禁止在浏览分组时默认发布新微博到该分组</label></p><p><input type="checkbox" node-type="clearDefTopic"><label title="关闭此选项后需要刷新页面生效">清除微博发布框中的默认话题</label></p><div style="margin-top: 15px"><p><input type="checkbox" node-type="smallImgLayout"><label>启用小图版式（自定义微博配图尺寸）</label></p><table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 3px"><tbody><tr><td style="width: 60px; padding-left: 19px">插图尺寸：</td><td><div class="wbpInput" style="width: 40px"><input type="text" node-type="customImgSize" class="input"></div></td><td style="width: 50px">总宽度：</td><td><div class="wbpInput" style="width: 40px"><input type="text" node-type="customTotalWidth" class="input"></div></td><td style="width: 100px">视频缩略图尺寸：</td><td><div class="wbpInput" style="width: 40px"><input type="text" node-type="customVideoSize" class="input"></div></td></tr></tbody></table></div><div style="margin-top: 10px">在<input type="checkbox" node-type="readerModeIndex" style="margin: 0 2px 0 8px"><label>我的首页</label><input type="checkbox" node-type="readerModeProfile" style="margin: 0 2px 0 8px"><label style="margin-right: 8px">个人主页</label>启用极简阅读模式<span style="color: red">（可按F8切换）</span><table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 3px"><tbody><tr><td style="width: 85px; padding-left: 19px">宽度（像素）：</td><td><div class="wbpInput" style="width: 40px"><input type="text" node-type="readerModeWidth" class="input"></div></td></tr></tbody></table></div><div style="margin-top: 10px">设置<input type="checkbox" node-type="overrideMyBack" style="margin: 0 2px 0 8px"><label>我的首页</label><input type="checkbox" node-type="overrideOtherBack" style="margin: 0 2px 0 8px"><label style="margin-right: 8px">个人主页</label>透明背景色<div class="wbpInput wbpInlineInput" style="width: 190px" title="最后一个参数为透明度，0为全透明，1为不透明"><input type="text" node-type="backColor" class="input"></div></div><div style="margin-top: 10px">覆盖<input type="checkbox" node-type="overrideMySkin" style="margin: 0 2px 0 8px"><label>我的首页</label><input type="checkbox" node-type="overrideOtherSkin" style="margin: 0 2px 0 8px"><label style="margin-right: 8px">个人主页</label>模板设置为<div class="wbpInput wbpInlineInput" style="width: 80px" title="普通模板为“skin+三位数字编号”，如skin012\n会员专属模板为“skinvip+三位数字编号”，如skinvip012\n默认模板为default"><input type="text" node-type="skinID" class="input"></div>（仅自己可见）</div><p style="margin-top: 10px"><input type="checkbox" node-type="useCustomStyles"><label><span style="color: red">自定义样式</span>（CSS）：可用于屏蔽模块、改造版面，</label><a href="https://bitbucket.org/salviati/weibo-cleaner/wiki/CustomCSS" target="_blank">点此查看示例</a></p><textarea node-type="customStyles" rows="6" style="margin-top: 5px"></textarea></div><div node-type="tabSettings" style="display: none"><p><input type="checkbox" node-type="updateNotify"><label>更新后首次使用时显示新功能</label></p><p><input type="checkbox" node-type="autoSync"><label title="在开启了本选项并使用同一Google账户登录的设备之间同步插件设置"><span style="color: red">自动同步设置</span></label>：需要使用您的Google账户<a href="https://support.google.com/chrome/bin/answer.py?hl=zh-Hans&answer=185277&topic=1693469&ctx=topic" target="_blank">登录Chrome浏览器</a></p><div class="clearfix" style="margin-top: 8px"><div style="float: left; width: 375px"><p>当前账号的设置信息在以下文本框中，您可以将其复制到其它位置保存。导入设置时，请将设置信息粘贴到文本框中，然后点击“导入”。</p></div><a href="javascript:void(0)" class="W_btn_b" node-type="import" style="float: right; margin-top: 6px"><span>导入</span></a></div><textarea node-type="settingsString" rows="10"></textarea></div></div></div><p style="margin-top: 10px"><a href="javascript:void(0);" class="W_btn_a" node-type="OK"><span>确定</span></a><a href="javascript:void(0);" class="W_btn_b" node-type="cancel" style="margin-left: 10px"><span>取消</span></a></p></div>', events;
			dialog = STK.ui.dialog({ isHold: true });
			dialog.setTitle('“眼不见心不烦”(v2.6.1)设置');
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
			bind('OK', function () {
				$options = exportSettings();
				$options.save();
				$filter();
				$page();
				dialog.hide();
				shown = false;
			});
			bind('cancel', function () {
				dialog.hide();
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
		var search = function (str, key) {
			var text = str.toLowerCase(), keywords = $options[key];
			if (str === '' || keywords.length === 0) { return ''; }
			var matched = keywords.filter(function (keyword) {
				if (!keyword) { return false; }
				if (keyword.length > 2 && keyword.charAt(0) === '/' && keyword.charAt(keyword.length - 1) === '/') {
					try {
						// 尝试匹配正则表达式
						return (RegExp(keyword.slice(1, -1)).test(str));
					} catch (e) { }
				} else {
					return keyword.split('+').every(function (k) { return text.indexOf(k.toLowerCase()) !== -1; });
				}
				return false;
			});
			return matched.length ? matched[0] : '';
		};
		// 获取微博正文
		var getText = function (content) {
			var node = content.firstChild, text = '';
			// 只保留ID（如果用户要求）与话题，去掉其它链接（如淘宝链接、短链接、地点等）
			while (node) {
				if (node.nodeType === Node.TEXT_NODE) {
					text += node.nodeValue.trim();
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					if (node.tagName === 'A' && node.getAttribute('extra-data') === 'type=topic') { // 话题
						text += node.textContent;
					} else if ($options.filterName && node.tagName === 'A' && node.hasAttribute('usercard')) { // 用户ID
						text += node.textContent;
					} else if ($options.filterSmiley && node.tagName === 'IMG' && node.getAttribute('type') === 'face') {
						text += node.getAttribute('alt');
					}
				}
				node = node.nextSibling;
			}
			return text;
		};
		// 过滤微博来源
		var searchSource = function (source, keywords) {
			if (!source) {
				source = '';
			} else {
				// 过长的应用名称会被压缩，完整名称存放在title属性中
				source = source.title || source.textContent;
			}
			return search(source, keywords);
		};
		// 过滤单条微博
		var apply = function (feed) {
			console.log('进入判断过滤单条微博条件');
			if (feed.firstChild && feed.firstChild.className === 'wbpTip') {
				// 已被灰名单屏蔽过，移除屏蔽提示和分隔线
				feed.removeChild(feed.firstChild);
			}
			// var mid = feed.getAttribute('mid');
			// if (!mid) { return false; } // 动态没有mid
			var scope = $.scope()
			// 判断是不是转发
			var isForward = (feed.getAttribute('isforward') === '1');
			var author, content, source, fwdAuthor, fwdContent, fwdSource;
			// if (scope === 3) { scope = 1; } // 热门微博的展现形式类似主页
			// // V6版单条微博页面与用户主页结构类似，不要屏蔽
			// if (scope === 2 && feed.parentNode.getAttribute('node-type') === 'feedconfig') { return false; }
			// if (scope === 1 && feed.getAttribute('feedtype') === 'subfeed') { // “还有?条对原微博的转发”
			// 	author = feed.querySelector('.WB_detail>.WB_text>a[usercard]');
			// 	content = feed.querySelector('.WB_detail>.WB_text>[node-type="feed_list_content"]');
			// 	source = feed.querySelector('.WB_detail>.WB_func>.WB_from>a[date]+a');
			// } else {
			// 	author = (scope === 1) ? feed.querySelector('.WB_detail>.WB_info>a[usercard]') : null;
			// 	// 对于字数超长微博，优先采用展开后的完整内容（如果有）
			// 	content = feed.querySelector('.WB_detail>.WB_text[node-type="feed_list_content_full"]') || feed.querySelector('.WB_detail>.WB_text[node-type="feed_list_content"]');
			// 	source = feed.querySelector('.WB_detail>.WB_from>a[date]+a');
			// 	fwdAuthor = feed.querySelector('.WB_feed_expand .WB_info>a[usercard]');
			// 	fwdContent = feed.querySelector('.WB_feed_expand .WB_text');
			// 	fwdSource = feed.querySelector('.WB_feed_expand .WB_func .WB_from>a[date]+a');
			// }
			var uid = author ? author.getAttribute('usercard').match(/id=(\d+)/)[1] : null,
				fuid = fwdAuthor ? fwdAuthor.getAttribute('usercard').match(/id=(\d+)/)[1] : null,
				text = '';
			// if (!content) { return false; }
			console.log('进入判断过滤单条微博条件2');
			// if (scope === 1 && $options.filterName) { text = '@' + author.getAttribute('nick-name') + ': '; }
			// text += getText(content);
			// if (isForward && fwdAuthor && fwdContent) {
			// 	// 转发内容
			// 	text += '////' + ($options.filterName ? '@' + fwdAuthor.getAttribute('nick-name') + ': ' : '') + getText(fwdContent);
			// }

			console.log('进入判断过滤单条微博条件3');
			// 处理子微博
			if (feed.querySelector('.WB_feed_together')) {
				var sonFeeds = feed.querySelectorAll('.WB_feed_detail[feedtype="subfeed"]'),
					sonFeedsLeft = sonFeeds.length - Array.prototype.filter.call(sonFeeds, apply).length;
				if (sonFeedsLeft === 0) {
					feed.querySelector('.WB_feed_together').style.display = 'none'; // 隐藏整个子微博栏目
				} else {
					feed.querySelector('.WB_feed_together').style.display = '';
					feed.querySelector('.WB_feed_together [node-type="followNum"]').innerHTML = sonFeedsLeft;
				}
			}

			console.log('进入判断过滤单条微博条件4');
			// if ($options.filterPaused || // 暂停屏蔽
			// 	($options.filterOthersOnly && feed.querySelector('.WB_screen a[action-type="feed_list_delete"]')) || // 不要屏蔽自己的微博（判据：工具栏是否有“删除”）
			// 	search(text, 'whiteKeywords')) { // 白名单条件
			if(0){
			} else if ((function () { // 黑名单条件
				console.log('进入判断黑名单条件');
				// 屏蔽推广微博
				console.log('feed.groupList：'+ feed.groupList );
				console.log('feed.classList：'+ feed.classList );
				// if (scope === 1 && feed.getAttribute('feedtype') === 'ad') {
				if (scope === 1) {
					// function hasClass(element, className) {
					// 	if (element.classList.contains(className)) {
					// 	  return true;
					// 	}
					// 	const children = element.children;
					// 	for (let i = 0; i < children.length; i++) {
					// 	  if (hasClass(children[i], className)) {
					// 		if(chi)
					// 		return true;
					// 	  }
					// 	}
					// 	return false;
					//   }
					  
					  if (feed.querySelectorAll('i[title="负反馈"').length > 0) {
						console.log('The container element or one of its children has the 负反馈 title');
						return true;
					  } else {
						console.log('The container element and all of its children do not have the 负反馈 title');
						return false;;
					  }
					//return true;
				}
				// 屏蔽热门微博
				// if (scope === 1 && $options.filterHot && feed.getAttribute('feedtype') === 'top') {
				// 	return true;
				// }
				// 屏蔽好友赞过的微博（首页和个人主页）
				// if ($options.filterLiked && (
				// 	(scope === 1 && feed.querySelector('.WB_cardtitle_b [suda-uatrack*="key=insert_like"]')) ||
				// 	(scope === 2 && feed.querySelector('.WB_face a[action-type="follow"]')))) {
				// 	return true;
				// }
				// 屏蔽关注话题推荐的微博
				// if (scope === 1 && $options.filterTopic && feed.querySelector('.WB_cardtitle_b .main_title>a[href*="//weibo.com/p/"]')) {
				// 	return true;
				// }
				// 屏蔽已删除微博的转发（是转发但无转发作者）
				// if ($options.filterDeleted && isForward && !fwdAuthor) {
				// 	return true;
				// }
				// 用户黑名单
				// if ((scope === 1 && author && $options.userBlacklist.indexOf(uid) !== -1) ||
				// 	(isForward && fwdAuthor && (scope === 1 || fuid !== $.oid) && $options.userBlacklist.indexOf(fuid) !== -1)) {
				// 	return true;
				// }
				// 屏蔽淘宝和天猫链接微博
				// if ($options.filterTaobao && feed.querySelector('a[href*="tb.cn"] i.icon_cd_tb, a[href*="tb.cn"] i.icon_cd_tmall')) {
				// 	return true;
				// }
				// 屏蔽指定来源
				// if (searchSource(source, 'sourceKeywords') ||
				// 	(isForward && searchSource(fwdSource, 'sourceKeywords'))) {
				// 	return true;
				// }
				// 反刷屏（屏蔽同一用户大量发帖）
				// if ($options.filterFlood && uid && floodFeeds[uid]) {
				// 	if (floodFeeds[uid].length >= Number($options.maxFlood) && floodFeeds[uid].indexOf(mid) === -1) {
				// 		return true;
				// 	}
				// }
				// 在微博内容中搜索屏蔽关键词
				// if (search(text, 'blackKeywords')) {
				// 	return true;
				// }
				return false;
			})()) {
				feed.style.display = 'none'; // 直接隐藏，不显示屏蔽提示
				feed.style.background = 'red';
				feed.style.color = 'red';
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
					feed.insertBefore(showFeedLink, feed.firstChild);
					return false; // 灰名单不作为屏蔽处理
				}
			}
			// 显示微博并记录
			feed.style.display = '';
			if (!$options.filterPaused) {
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
			var actionType = event.target.getAttribute('action-type'), actionData = event.target.getAttribute('action-data'), actionDataList = {};
			if (actionType !== 'widget_commentPhotoView' && actionType !== 'images_view_tobig' && actionType !== 'widget_photoview') { return true; }
			if (actionData) {
				actionData.split("&").forEach(function (item) {
					actionDataList[item.split('=')[0]] = unescape(item.split('=')[1]);
				});
			}
			if (actionType === 'widget_commentPhotoView' && actionDataList.pid) {
				// 评论图片
				window.open('http://ww4.sinaimg.cn/large/' + actionDataList.pid + '.jpg', '_blank');
				event.stopPropagation();
			} else if ((actionType === 'images_view_tobig' || actionType === 'widget_photoview') &&
				actionDataList.pid && actionDataList.mid && actionDataList.uid) {
				// 微博配图
				window.open('http://photo.weibo.com/' + actionDataList.uid +
					'/wbphotos/large/mid/' + actionDataList.mid +
					'/pid/' + actionDataList.pid, '_blank');
				event.stopPropagation();
			} else if (actionType === 'widget_photoview' && event.target.getAttribute('alt')) {
				// 图片链接
				window.open(event.target.getAttribute('alt'));
				event.stopPropagation();
			}
		}, true);
		// 使用事件捕捉以尽早触发事件，避免与新浪自带事件撞车
		document.addEventListener('DOMNodeInserted', function (event) {
			var node = event.target;
			console.log('node.tagName = ' + node.tagName);
			if ($.scope() === 0 || node.tagName !== 'DIV') { return; }
			console.log("node.classList: " + node.classList)
			// if(node.classList.contains('head-info_authtag_29zK2')){return true;}
			if (node.classList.contains('WB_feed_type') || node.classList.contains('vue-recycle-scroller__item-view')) {
				// 处理动态载入的微博
				apply(node);
			}
			//  else if (node.classList.contains('W_loading')) {
			// 	var requestType = node.getAttribute('requesttype');
			// 	// 仅在搜索和翻页时需要初始化反刷屏/反版聊记录
			// 	// 其它情况（新微博：newFeed，同页接续：lazyload）下不需要
			// 	if (requestType === 'search' || requestType === 'page') {
			// 		forwardFeeds = {}; floodFeeds = {};
			// 	}
			// } else if (node.classList.contains('WB_feed') || node.querySelector('.WB_feed')) {
			// 	// 微博列表作为pagelet被一次性载入
			// 	bindTipOnClick(node);
			// 	applyToAll();
			// } else if (node.classList.contains('WB_text') && node.getAttribute('node-type') === 'feed_list_content_full') {
			// 	// 字数超长微博的完整部分展开时才会载入，需重新处理
			// 	do { node = node.parentNode; } while (!node.classList.contains('WB_feed_type'));
			// 	apply(node);
			// }
		}, false);

		return function (feed) {
			if (feed) {
				apply(feed);
			} else {
				applyToAll();
			}
		};
	})();

	// 修改页面
	var $page = (function () {
		// 模块屏蔽设置
		var modules = {
			Ads: '#plc_main [id^="v6_pl_rightmod_ads"], div[ad-data], #v6_pl_ad_bottomtip, .WB_ad_tm2015',
			Stats: '#v6_pl_rightmod_myinfo .W_person_info { height: auto !important } #v6_pl_rightmod_myinfo .user_atten',
			Level: '.W_icon_level',
			HotSearch: '.WB_global_nav .gn_search_v2 > .placeholder',
			ToMe: '#v6_pl_leftnav_group .lev > a[groupnm="page_group_to_me"]',
			HotWeibo: '#v6_pl_leftnav_group .lev_line_v2, #v6_pl_leftnav_group .lev_line_v2 + .lev_Box',
			Hongbao: '#v6_pl_rightmod_hongbao',
			Friends: '#v6_pl_leftnav_group .lev > a[isfriends]',
			Topic: '#trustPagelet_zt_hottopic', // 动态右边栏
			Member: '#v6_trustPagelet_recom_member',
			MusicRecom: '#v6_pl_rightmod_rank',
			MovieRecom: '#trustPagelet_recom_movie', // 动态右边栏
			AttFeed: '#v6_pl_rightmod_attfeed',
			Notice: '#v6_pl_rightmod_noticeboard',
			Footer: '#plc_bot .WB_footer',
			MusicPlayer: '.PCD_mplayer',
			RecommendedTopic: '#v6_pl_content_publishertop div[node-type="recommendTopic"]',
			CommentTip: 'div[node-type="feed_privateset_tip"]',
			MemberTip: 'div[node-type="feed_list_shieldKeyword"]',
			MemberCover: '.WB_feed_vipcover .WB_feed_detail { background-image: none !important } .WB_feed_vipcover .WB_feed_detail { padding-top: 10px !important } .WB_feed_vipcover .WB_vipcover',
			TimelineMods: '.FRAME_main .WB_feed .WB_feed_type:not([mid]), .FRAME_page .WB_feed .WB_feed_type:not([mid])',
			TopicCard: '.WB_feed_spec[action-data*="huati.weibo.com"]',
			LocationCard: '.WB_feed_spec[exp-data*="value=1022-place"]',
			AppCard: '.WB_feed_spec[exp-data*="value=1022-app"]',
			IMNews: '.webim_news',
			RecomFeed: 'div[node-type="feed_list_recommend"], div[node-type="recommfeed"]',
			ProfCover: '#Pl_Official_Headerv6__1 .PCD_header .S_shadow { background: transparent !important } #Pl_Official_Headerv6__1 .cover_wrap',
			ProfStats: '.WB_frame_b .PCD_counter',
			Relation: '.WB_frame_b .PCD_user_a',
			Album: '.WB_frame_b .PCD_photolist',
			FeedRecom: '.WB_frame_b > div[id^="Pl_Core_RecommendFeed"]',
			MemberIcon: '.W_icon[class*="icon_member"], .icon_member_dis, .W_icon_vipstyle',
			VerifyIcon: '.icon_approve, .icon_approve_gold, .icon_approve_co',
			DarenIcon: '.icon_club',
			VgirlIcon: '.icon_vlady',
			TaobaoIcon: '.icon_taobao, .icon_tmall',
			GongyiIcon: '.W_icon[class*="icon_gongyi"]',
			HongbaoIcon: '.icon_redpack, .icon_wealth',
			PaiIcon: '.icon_suishoupai2014',
			TravelIcon: '.icon_airball',
		};
		// 显示设置链接
		var showSettingsBtn = function (node) {
			console.log('显示设置链接');
			if (!$('wbpShowSettings')) {
				if (!node) {
					// node = $.select('.WB_global_nav .gn_topmenulist_set[node-type="accountLayer"] > ul');
					node = $.select('.Configs_layer_2dw-N');
					if (!node) { return false; }
				}
				// var tab = document.createElement('li');
				var tab = document.createElement('div');
				tab.id = 'wbpShowSettings';
				tab.innerHTML = '<a href="javascript:void(0)" style="color: red ">眼不见心不烦</a>';
				$.click(tab, $dialog);
				node.insertBefore(tab, node.firstChild);
				//node.insertBefore(tab, node.childNodes[2]);
				node.parentNode.style.width = 'auto';
			}
			return true;
		};
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
					readerModeStyles.innerHTML += '.FRAME_main #plc_top, .FRAME_main .WB_main_l, .FRAME_main .WB_main_r, .FRAME_main .WB_main_c>div:not(#v6_pl_content_homefeed), .FRAME_main #v6_pl_content_homefeed .WB_tab_a, .FRAME_main #plc_bot .WB_footer { display: none }\n' +
						'.FRAME_main .WB_frame { background-color: transparent !important; width: ' + width + 'px !important }\n' +
						'.FRAME_main #plc_main, .FRAME_main .WB_main_c { width: 100% !important; margin-right: 0 !important }\n' +
						'.FRAME_main #base_scrollToTop { margin-left: ' + (width / 2) + 'px !important }\n';
				}
				if ($options.readerModeProfile) { // 个人主页
					if ($.config.location.slice(-4) === 'home') { // 排除单条微博页面
						readerModeStyles.innerHTML += '.FRAME_page.B_page #pl_common_top, .FRAME_page.B_page .WB_frame_a, .FRAME_page.B_page .WB_frame_b, .FRAME_page.B_page .WB_frame_c>div:not([id^="Pl_Official_MyProfileFeed"]):not([id^="Pl_Official_TimeBase"]), .FRAME_main #v6_pl_content_homefeed .WB_tab_a, .FRAME_page.B_page #pl_common_footer>:not(#base_scrollToTop) { display: none }\n' +
							'.FRAME_page.B_page .WB_frame { width: ' + width + 'px !important; padding-top: 0 !important }\n' +
							'.FRAME_page.B_page #plc_main, .FRAME_page.B_page .WB_frame_c { width: 100% !important; margin-right: 0 !important }\n' +
							'.FRAME_page.B_page .WB_timeline, .FRAME_page.B_page #base_scrollToTop { margin-left: ' + (width / 2) + 'px !important }';
					}
				}
				if (!$options.readerModeTip && (
					($.scope() === 1 && $options.readerModeIndex) ||
					($.scope() === 2 && $options.readerModeProfile))) { // TODO: 新版微博单条页面不弹出提示
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
			var formerStyle = $('custom_style') || $('skin_style') || document.head.querySelector('link:not([id])[href*="/skin/"]'),
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
				skinCSS.href = $.config.cssPath + 'skin/' + $options.skinID + '/skin.css?version=' + $.config.version;
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
				'[change-data*="hottopic_r2"]': 'Topic',
				'.WB_cardmore[href*="movie.weibo.com"], .main_title>a[href*="taobao.com/market/dianying/"]': 'MovieRecom'
			}, mods = rightBar.querySelectorAll('.WB_cardwrap');
			for (var i = 0; i < mods.length; ++i) {
				for (var id in identifiers) {
					if (mods[i].querySelector(id)) {
						mods[i].id = modules[identifiers[id]].slice(1);
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
			var tipBackColor = $options.tipBackColor, tipTextColor = $options.tipTextColor;
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
			if ($options.hideMods.indexOf('FollowGuide') !== -1) {
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
				var inputBox = $.select('#v6_pl_content_publishertop .send_weibo .input textarea');
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
		// V6版首页没有消息导航条，人工创建一个
		var addMessageNav = function () {
			if ($.scope() === 1) {
				var groupList = $.select('#v6_pl_leftnav_group .WB_left_nav[node-type="groupList"]');
				if (!groupList) { return; }
				var msgNavBox = groupList.querySelector('.wbpMessageNav');
				if ($options.showAllMsgNav) {
					if (!msgNavBox) {
						msgNavBox = document.createElement('div');
						msgNavBox.className = 'lev_Box lev_Box_noborder wbpMessageNav';
						msgNavBox.innerHTML = '<h3 class="lev"><a href="/at/weibo?leftnav=1&amp;wvr=6" class="S_txt1"><span class="levtxt">消息</span></a></h3>\n' +
							'<div class="lev"><a href="/comment/inbox?leftnav=1&amp;wvr=6" class="S_txt1"><span class="ico_block"><em class="W_ficon ficon_dot S_ficon">D</em></span><span class="levtxt">评论</span></a></div>\n' +
							'<div class="lev"><a href="/messages?leftnav=1&amp;wvr=6" class="S_txt1"><span class="ico_block"><em class="W_ficon ficon_dot S_ficon">D</em></span><span class="levtxt">私信</span></a></div>\n' +
							'<div class="lev"><a href="/notesboard?leftnav=1&amp;wvr=6" class="S_txt1"><span class="ico_block"><em class="W_ficon ficon_dot S_ficon">D</em></span><span class="levtxt">未关注人私信</span></a></div>\n';
						groupList.insertBefore(msgNavBox, groupList.children[1]);
					}
					msgNavBox.style.display = '';
				} else if (!$options.showAllMsgNav && msgNavBox) {
					msgNavBox.style.display = 'none';
				}
			}
		};
		// 首次进入用户主页时显示全部微博
		var redirectToAllFeeds = function () {
			if (!$options.directAllFeeds || $.scope() !== 2) { return; }
			(function () {
				if (location.href.indexOf('is_') === -1) {
					// 尚未出现过滤条件则强制跳转至全部微博
					var allFeedsBtn = $.select('li[node-type="tab_all"]');
					if (allFeedsBtn) {
						allFeedsBtn.click();
						return;
					} else {
						// 跳转标签尚未出现，继续等待
						setTimeout(arguments.callee, 100);
					}
				}
			})();
		};
		// 展开字数超长微博
		var expandLongFeeds = function (node) {
			if ($options.showAllText && $.scope()) {
				var expanders = node.querySelectorAll('.WB_detail>.WB_text[node-type="feed_list_content"]>.WB_text_opt, .WB_expand>.WB_text>.WB_text_opt'),
					expand = function (expander) {
						STK.ajax({
							url: '/p/aj/mblog/getlongtext',
							args: STK.queryToJson(expander.getAttribute('action-data')),
							method: 'get',
							responseType: 'json',
							onComplete: function (result) {
								if (result.code !== '100000') return;
								var feed = expander;
								do { feed = feed.parentNode; } while (!feed.classList.contains('WB_feed_type'));
								expander.parentNode.innerHTML = result.data.html;
								$filter(feed);
							},
						});
					};
				for (var i = 0; i < expanders.length; ++i) { expand(expanders[i]); }
			}
		};
		// 显示未关注作者的长微博全文
		var showAllArticleText = function (iframe) {
			if ($options.showAllArticleText && iframe && iframe.tagName === 'IFRAME' && iframe.name.slice(0, 12) === 'articleLayer') {
				// 采用以下方法将CSS写入DOM载入完成后的长微博iframe：
				// http://stackoverflow.com/questions/24603580/how-can-i-access-the-dom-elements-within-an-iframe/24603642#comment38157462_24603642
				var timer, fired = false, doc;
				var ready = function () {
					if (!fired) {
						fired = true;
						clearTimeout(timer);
						var styles = doc.createElement('style');
						styles.type = 'text/css';
						styles.innerHTML = '.WB_artical .WB_editor_iframe { height: auto !important } .WB_artical .artical_add_box { display: none !important }\n';
						doc.head.appendChild(styles);
					}
				};
				var readyState = function () {
					if (this.readyState === 'complete') {
						ready();
					}
				};
				iframe.addEventListener('load', function () {
					doc = iframe.contentDocument || iframe.contentWindow.document;
					ready();
				});
				var checkLoaded = function () {
					doc = iframe.contentDocument || iframe.contentWindow.document;
					if (doc.URL.indexOf('about:') !== 0) {
						if (doc.readyState === 'complete') {
							ready();
						} else {
							doc.addEventListener('DOMContentLoaded', ready);
							doc.addEventListener('readystatechange', readyState);
						}
					} else {
						timer = setTimeout(checkLoaded, 10);
					}
				};
				checkLoaded();
			}
		};
		// 将微博来源移动至底部
		var moveSourceToBottom = function (node) {
			if ($options.moveSrcToBtm) {
				var sources = node.querySelectorAll('.WB_detail>.WB_info+.WB_from');
				for (var i = 0; i < sources.length; ++i) { sources[i].parentNode.appendChild(sources[i]); }
			}
		};
		// 禁止弹出“有新的热门微博”等提示
		var noHotYellowTags = function (tags) {
			if ($options.noHotYellowTags) {
				if (!tags) { tags = $('.gn_topmenulist_tips>ul'); if (!tags) { return; } }
				var hotTags = tags.querySelectorAll('li>a[suda-data*="value=hot_video_remind"], li>a[suda-data*="value=hot_weibo_remind"]');
				for (var i = 0; i < hotTags.length; ++i) {
					hotTags[i].parentNode.style.display = 'none';
				}
				if (hotTags.length > 0 && hotTags.length === tags.childNodes.length) {
					// 黄标签中都是推荐内容则全部隐藏
					tags.style.display = 'none';
				}
			}
		};
		// 用户自定义样式及程序附加样式
		var customStyles = function () {
			var cssText = '', styles = $('wbpCustomStyles');
			if (!styles) {
				styles = document.createElement('style');
				styles.type = 'text/css';
				styles.id = 'wbpCustomStyles';
				document.head.appendChild(styles);
			}
			if ($options.squareAvatar) {
				cssText += '.WB_face .face img { border-radius: 0 !important }\n';
			}
			if ($options.moveSrcToBtm) {
				cssText += '.WB_feed_v3 .WB_detail>.WB_feed_expand { margin-bottom: 10px } .WB_detail>.WB_from { padding-top: 5px }';
				if ($options.unwrapText) {
					cssText += '.WB_detail .WB_info, .WB_detail .WB_text { display: inline } .WB_detail .WB_info:after { content: ": " }\n' +
						'.WB_screen .screen_box .W_ficon { width: 16px !important } .WB_screen .screen_box { margin-left: -6px !important }\n' +
						'.WB_feed_v3 .WB_face .opt { position: relative !important; right: 0px !important }\n';
				}
				if ($options.compactFeedToolbar) {
					cssText += '.WB_feed_detail { position: static !important }\n' + // 修正紧凑型工具栏无法点击的问题
						'.WB_feed_handle { margin-top: -32px } .WB_feed_v3 .WB_feed_handle { margin-top: -30px; margin-bottom: -5px } .WB_feed_handle>.WB_handle { margin-right: 6px } .WB_feed_handle>.WB_handle>ul { border-top: none; text-align: right; margin-right: -1px } .WB_feed_handle>.WB_handle>ul>li { width: auto; display: inline-block; float: none } .WB_feed_handle>.WB_handle>ul>li .line { margin-left: 10px; padding-right: 10px; border-left: none; border-right: 1px solid; line-height: normal; height: auto } .WB_feed_handle>.WB_handle>ul>li .line>[node-type="like_status"]>.W_icon { margin-top: 0 }\n';
				}
			}
			if ($options.showAllArticleText) {
				cssText += '.WB_artical .WB_editor_iframe { height: auto !important } .WB_artical .artical_add_box { display: none !important }\n';
			}
			if ($options.showAllGroups) {
				cssText += '#v6_pl_leftnav_group div[node-type="moreList"] { display: block !important } #v6_pl_leftnav_group .levmore { display: none }\n';
			}
			if ($options.showAllSonFeeds) {
				cssText += '.WB_feed_together [node-type="feed_list_wrapForward"] { display: block !important } .WB_feed_together>a[action-type="feed_list_seeAll"], .WB_feed_together>a[action-type="feed_list_foldForward"] { display: none }\n';
			}
			if ($options.noHomeRightBar) {
				cssText += '.FRAME_main .WB_frame .WB_main_r { display: none }\n';
			}
			if ($options.noHomeMargins) {
				cssText += '.FRAME_main .send_weibo, .FRAME_main .WB_tab_a, .FRAME_main .WB_frame .WB_cardwrap { margin-bottom: 0; border-radius: 0 } .FRAME_main .WB_frame .WB_cardwrap.WB_notes[requesttype="newFeed"] { padding-top: 18px } .FRAME_main #home_new_feed_tip { margin-top: 0; padding-top: 0 } .FRAME_main .WB_main_c, .FRAME_main .WB_main_r { margin-right: 0 } .FRAME_main .WB_tab_a .tab li:nth-child(2) .b .b1 em.l i, .FRAME_main .WB_tab_a .tab li:nth-child(2) .t, .FRAME_main .WB_tab_a .tab_box .fr_box { border-radius: 0 } \n';
			}
			if ($options.noHomeRightBar || $options.noHomeMargins) {
				// 右栏宽度230+10；卡片间隙宽度10+10
				var reducedWidth = 10 + 230 * $options.noHomeRightBar + 10 * $options.noHomeMargins;
				cssText += '.FRAME_main .WB_frame { width: ' + (1000 - reducedWidth) + 'px } .FRAME_main .WB_frame #plc_main { width: ' + (850 - reducedWidth) + 'px } .FRAME_main .W_gotop { margin-left: ' + (1000 - reducedWidth) / 2 + 'px }\n';
			}
			if ($options.overrideMyBack) {
				cssText += '.FRAME_main .S_bg1, .FRAME_main .S_bg2 { background-color: ' + $options.backColor + ' } .FRAME_main .WB_feed_handle .WB_row_line { border-top: none }\n';
			}
			if ($options.overrideOtherBack) {
				cssText += '.FRAME_page .S_bg1, .FRAME_page .S_bg2 { background-color: ' + $options.backColor + ' } .FRAME_page .WB_feed_handle .WB_row_line { border-top: none }\n';
			}
			if ($options.smallImgLayout) {
				if (Number($options.customImgSize) > 0) {
					cssText += '.WB_feed_v3 ul.WB_media_a > li.WB_pic { width: ' + $options.customImgSize + 'px !important; height: ' + $options.customImgSize + 'px !important }\n' +
						'.WB_feed_v3 .WB_feed_repeat ul.WB_media_a > li.WB_pic > img { width: ' + $options.customImgSize + 'px !important; height: ' + $options.customImgSize + 'px !important }\n';
				}
				if (Number($options.customTotalWidth) > 0) {
					cssText += '.WB_feed_v3 ul.WB_media_a[node-type="fl_pic_list"] { width: ' + $options.customTotalWidth + 'px !important }\n';
				}
				if (Number($options.customVideoSize) > 0) {
					cssText += '.WB_feed_v3 ul.WB_media_a > li.WB_video .WB_h5video { width: ' + $options.customVideoSize + 'px; height: ' + Math.round(Number($options.customVideoSize) * 0.564) + 'px }\n' +
						'.WB_feed_v3 ul.WB_media_a > li.WB_video .WB_h5video video { width: 100% !important; height: 100% !important }\n';
				}
				cssText += '.WB_feed_v3 .WB_feed_spec_b .spec_box > .WB_feed_spec_pic, .WB_feed_v3 .WB_feed_spec_c .spec_box > .WB_feed_spec_pic { display: inline-block; width: 150px; height: 90px }\n' +
					'.WB_feed_v3 .WB_feed_spec_c .WB_feed_spec_pic > .WB_feed_spec_clearfix, .WB_feed_v3 .WB_feed_spec_c .WB_feed_spec_pic > .W_icon_tag_artical { display: none }\n' +
					'.WB_feed_v3 .WB_feed_spec_b .spec_box > .WB_feed_spec_pic img, .WB_feed_v3 .WB_feed_spec_c .spec_box > .WB_feed_spec_pic img { width: 150px; min-height: initial }\n' +
					'.WB_feed_v3 .WB_feed_spec_b .spec_box > .WB_feed_spec_pic + .WB_feed_spec_info, .WB_feed_v3 .WB_feed_spec_c .spec_box > .WB_feed_spec_info { display: inline-block; vertical-align: middle; width: 310px }\n' +
					'.WB_feed_v3 .WB_feed_spec_b .spec_box > .WB_feed_spec_info .WB_feed_spec_tit, .WB_feed_v3 .WB_feed_spec_c .spec_box > .WB_feed_spec_info .WB_feed_spec_tit { font-size: 16px; margin-bottom: 0px }\n' +
					'.WB_feed_v3 .WB_feed_spec_b .spec_box > .WB_feed_spec_info { font-size: 12px }\n';
			}
			if ($options.useCustomStyles) {
				cssText += $options.customStyles;
			}
			styles.innerHTML = cssText + '\n';
		};
		// 在用户信息气球或用户主页上添加屏蔽链接
		var showUserFilterBtn = function (node) {
			if (!node) { node = document.body; }
			var balloon = (node.classList.contains('layer_personcard') || node.querySelector('.layer_personcard')), userData, toolbar, uid;
			if (balloon) {
				// 获得关注链接
				userData = node.querySelector('.name a[uid]');
				if (!userData || node.querySelector('#wbpUserFilter')) { return false; }
				uid = userData.getAttribute('uid');
				toolbar = node.querySelector('.c_btnbox');
			} else if ($.scope() === 2) {
				if (userData = $('wbpUserFilter')) {
					// 按钮已存在时只更新状态
					userData.update();
					return false;
				}
				uid = $.oid;
				toolbar = node.querySelector('.pf_opt .opt_box');
			}
			if (!toolbar || uid === $.uid) { return false; }
			// 创建分隔符
			var button = document.createElement('div');
			if (balloon) {
				button.style.display = 'inline-block';
			} else {
				button.className = 'btn_bed W_fl';
			}
			button.id = 'wbpUserFilter';
			// 创建操作链接
			var link = document.createElement('a');
			button.appendChild(link);
			link.href = 'javascript:void(0)';
			(button.update = function () {
				link.className = balloon ? 'W_btn_b' : 'W_btn_d btn_34px';
				if ($options.userBlacklist.indexOf(uid) === -1) {
					link.innerHTML = '<span>屏蔽</span>';
				} else {
					link.innerHTML = '<span><em class="W_ficon ficon_right">Y</em>已屏蔽</span>';
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
					while (!node.classList.contains('W_layer')) {
						node = node.parentNode;
					}
					$.remove(node);
					//node.style.display = 'none';
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
			// 屏蔽用户按钮
			showUserFilterBtn();
			// 屏蔽版面模块
			hideModules();
			// 清除发布框中的默认话题
			clearDefTopic();
			// 人工添加首页消息导航栏
			addMessageNav();
			// 覆盖当前模板设置
			overrideSkin();
			// 应用自定义CSS
			customStyles();
			// 禁止默认发布新微博到当前浏览的分组
			disableDefaultGroupPub(document);
			// 展开字数超长微博
			expandLongFeeds(document);
			// 将微博来源移动至底部
			moveSourceToBottom(document);
			// 禁止弹出“有新的热门微博”等提示
			noHotYellowTags();
			// 首次进入用户主页时显示全部微博
			if (init) {
				redirectToAllFeeds();
			}
		};

		// IFRAME载入不会影响head中的CSS，只添加一次即可
		var myStyles = document.createElement('style');
		myStyles.type = 'text/css';
		myStyles.id = 'wbpDialogStyles';
		myStyles.innerHTML = '.wbpTip{border:1px solid;display:block;line-height:23px;text-align:center}.wbpTip:hover{background-color:#D0FFD0;border-color:#40D040;color:#40D040;margin-bottom:10px}.wbpTip:not(:hover)~:not(.wbpTipLine){display:none !important}.wbpTip:hover~*{opacity:0.5}.wbpTip:hover+.wbpTipLine{display:none}.wbpTipLine{padding-bottom:20px;border-bottom-style:solid;border-bottom-width:1px}#wbpNavBar{margin-bottom:20px}#wbpNavBar .lev a,#wbpNavBar .lev2 a,#wbpNavBar .levmenu,#wbpNavBar .levmenu .lm_li:hover{background-image:none}#wbpNavBar .lev a.lev_curr{background-color:transparent}#wbpNavBar .left_nav_line fieldset .btns{margin-left:148px}#wbpNavBar .WB_left_nav .lev_edit .lev a{width:200px}.wbpSettings p{line-height:150%}.wbpSettings p+p{margin-top:10px}.wbpSettings .W_vline{margin:0 8px}.wbpSettings table{line-height:30px;margin-top:8px}.wbpSettings span.link{position:relative}.wbpSettings span.link a>span{display:none}.wbpSettings span.link a>span li{list-style:circle inside;padding-left:1em;text-indent:-1em}.wbpSettings span.link a>span li+li{margin-top:5px}.wbpSettings span.link a>span p+p{margin-top:10px}.wbpSettings span.link a:hover>span{display:block;position:absolute;margin-top:10px;margin-left:-100px;width:250px;padding:5px;z-index:20000;background:#FFFFB0;color:black;border:1px solid #808000;text-align:left;text-decoration:none;border-radius:3px 3px;box-shadow:3px 3px 3px rgba(0,0,0,0.2)}.wbpTabHeaders{float:left;width:100px;margin-right:10px}.wbpTabHeaders a{display:block;padding:6px 0;text-align:center;text-decoration:none}.wbpTabHeaders a:hover{background-color:#C6E8F4}.wbpTabHeaders a.current{background-color:#79C5E9;color:white;cursor:default}.wbpInput{border:1px solid #D2D5D8;padding:0 2px}.wbpInlineInput{display:inline-block;width:30px;margin:0 3px;vertical-align:middle}.wbpInput input{width:100%;height:22px;border:0;padding:0;margin:0;display:block}.wbpSettings>div{margin-top:15px}.wbpSettings textarea{width:440px;margin-top:10px;border:1px solid #D2D5D8}.wbpSettings input[type="checkbox"],.wbpSettings input[type="radio"]{vertical-align:middle;margin-right:5px}.wbpTabModules tr.wbpRowSpacing td{padding-top:10px}.wbpTabModules a>.W_icon{display:inline-block !important}.wbpTabModules a>.W_icon_EURO{display:inline-block !important}.wbpKeywordBlock{margin-top:10px;border:1px solid #D2D5D8;padding:8px 8px 0}.wbpKeywordBlock em{font-weight:bold;margin-right:15px}.wbpToolBtns{width:135px;text-align:right}.wbpToolBtns a+a{margin-left:5px}.wbpListWrapper{margin:8px 0;max-height:120px;overflow:hidden}.wbpListWrapper:hover{overflow-y:auto}.wbpKeywordsList{margin-top:-5px;line-height:18px}.wbpKeywordsList a{margin:5px 5px 0 0;padding:0 4px;border:1px solid;display:inline-block;height:18px;white-space:nowrap}.wbpKeywordsList a:hover{text-decoration:none}.wbpWhiteKeywordsList a{border-color:#008000;color:#008000}.wbpWhiteKeywordsList a.regex{background-color:#80FF80}.wbpWhiteKeywordsList a:hover{border-color:#008000;background-color:#D0FFD0}.wbpBlackKeywordsList a{border-color:#D00000;color:#D00000}.wbpBlackKeywordsList a.regex{background-color:#FFB0B0}.wbpBlackKeywordsList a:hover{border-color:#FF0000;background-color:#FFD0D0}.wbpGrayKeywordsList a{border-color:#808000;color:#808000}.wbpGrayKeywordsList a.regex{background-color:#FFFF00}.wbpGrayKeywordsList a:hover{border-color:#808000;background-color:#FFFFB0}.wbpUserList>a{margin:5px 5px 0 0;padding:3px;border:1px solid;display:inline-block;cursor:pointer;text-align:center;text-decoration:none}';
		document.head.appendChild(myStyles);
		// 为右边栏动态模块打屏蔽标记
		tagRightbarMods($('v6_pl_rightmod_recominfo'));
		// 处理动态载入内容
		document.addEventListener('DOMNodeInserted', function (event) {
			var scope = $.scope(), node = event.target;
			// if (node.tagName !== 'SCRIPT') { console.log(node); }
			// console.log(scope + ': ' + node.tagName + ': ' + node.parentNode);
			if (scope && node.tagName === 'UL' && node.parentNode.getAttribute('node-type') === 'accountLayer') {
				// 重新载入设置按钮
				showSettingsBtn(node);
			}
			if (node.tagName === 'UL' && node.parentNode.classList.contains('gn_topmenulist_tips')) {
				// 禁止弹出“有新的热门微博”等提示
				noHotYellowTags(node);
			}
			if (node.tagName !== 'DIV') { return; }
			if (node.classList.contains('W_layer')) {
				// 显示未关注作者的长微博全文
				showAllArticleText(node.firstChild);
			}
			if (node.classList.contains('WB_feed_type') || node.classList.contains('WB_feed') || node.querySelector('.WB_feed')) {
				// 展开字数超长微博
				expandLongFeeds(node);
				// 将微博来源移动至底部
				moveSourceToBottom(node);
			}
			if (node.classList.contains('layer_personcard') || node.querySelector('.layer_personcard')) {
				// 在用户信息气球或个人主页信息栏中显示屏蔽按钮
				showUserFilterBtn(node);
			} else if (node.classList.contains('WB_left_nav')) {
				// V6版需要人工添加消息导航栏
				addMessageNav();
			} else if (node.classList.contains('send_weibo')) {
				// 禁止默认发布新微博到当前浏览的分组
				disableDefaultGroupPub(node);
				// 清除发布框中的默认话题
				clearDefTopic();
			} else if (node.classList.contains('WB_cardwrap')) {
				// 微博新首页右边栏模块处理
				tagRightbarMods(node.parentNode);
			}
		}, false);
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
			console.warn('“眼不见心不烦”设置读取失败！\n设置信息格式有问题。');
		} else if (options && $options.version < $.version) {
			$options.save(true); // 更新版本信息
			if ($options.updateNotify) {
				alert('您已更新到“眼不见心不烦”v2.6.1：\n\n- ' + '修正直接查看大图功能失效的问题；修正紧凑版式下部分内容显示错位的问题'.split('；').join('\n- '));
			}
		}
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
		init();
	});
});
