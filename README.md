# 矿石镇 Live Pro

本项目基于[矿石镇Plus](https://github.com/mineraltown/Mineraltown_Plus)，是用于《牧场物语 重聚矿石镇》直播的信息提醒的工具。

## 启动

先启动服务端`server/server.py`  
然后打开`index.html`，在这里可以调整游戏日期及下一天。  
现在要手动点下一天，等以后了解下OCR技术，之后估计就可以全自动了。  
然后打开obs，并添加一个浏览器URL选择本地文件的`live.html`，宽度`1920`，高度`1080`  

然后就可以正常使用了。

信息提醒放在了屏幕右边，因为按照我的习惯，左边是直播弹幕。  
如果想改成其他的样式，可以自己修改`live.css`。  

`mineraltown.service`是用于`systemd`的启动脚本，给Linux并且自己有服务器的人准备的。

## 其他说明

使用前，粉丝群记得换成自己的。

### 关于字体

字体使用精简后的[975圆体](https://github.com/lxgw/975maru)  
如果进行修改内容后，出现字体错误。  
请下载原字体文件，并替换`975MaruSC-Bold.ttf`及`975MaruSC-Regular.ttf`这两个文件。
