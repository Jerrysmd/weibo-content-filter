![weiboFilter](images/weiboFilter.png)

# Weibo Adblocker

# 微博广告屏蔽插件

[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)

## Features

+ Block Weibo post with label  `广告` 
+ Block Weibo post with label  `热推` 
+ Block Weibo post with label  `推荐` 
+ Block Weibo post with label  `媒体推荐` 
+ Support custom label blocking

## Screenshot

![image-20240415010728677](images/image-20240415010728677.png)

![image-20240415010800906](images/image-20240415010800906.png)

## How to install this extension

The following uses Chrome on Windows 11 as an example

1. `Download` or `Clone` this repository to your local

2. Go to `chrome://extensions/` in your chrome

   ![image-20240415011557376](images/image-20240415011557376.png)

3. Click `Load unpacked`

   ![image-20240415011737405](images/image-20240415011737405.png)

4. Open the Weibo `https://weibo.com/`

   ![image-20240415012251267](images/image-20240415012251267.png)

## How to customize

If you want to increase the blocking of post with the other label like `粉丝头条` 

1. Open `./weiboClean.js`

2. Add the `粉丝头条` at the end of the code 

   `targetContent.match(/^(热推|推荐|媒体推荐)$/);`

   `targetContent.match(/^(热推|推荐|媒体推荐|粉丝头条)$/);`

3. Reload the `https://weibo.com/`

   ![image-20240415013013879](images/image-20240415013013879.png)

## Why do I keep AD post avatar

+ Make sure the blocker is in effect
+ It is important to know who the advertisers are