---
layout:	post
title: "Nginx 配置 https 证书"
date:  2022-06-30
category: 原创
tags: ["Nginx","https证书","Linux"]
---

有人可能说 Nginx 配置 https 证书这么简单的事情，也需要写篇文章来讲解吗，我之前也是这样觉得的，直到我给团队写文档的时候才发现自己之前的想法太局限了，从自己的角度出发，在自己已经熟悉的场景和上下文中谈简单。

当需要向没怎么接触过 Nginx 的人讲解如何配置 https 证书这件事时，我发现需要交代很多上下文，配置证书的这件本来十几分钟就能搞定的事情，当时写文档花了一个多小时，这里根据当时的文档去掉业务系统信息重新整理记录下，或许以后还有参考价值。

我们当时的情况是系统使用的 https 证书快到期了，需要重新申请证书，替换掉老的证书，这件事可以分成如下步骤：

1. 查看证书过期时间
2. 申请证书
3. 验证域名
4. Nginx 配置 https 证书
5. 验证新证书是否生效

## 查看证书过期时间

先通过 https 协议访问域名地址，看下当前证书的过期时间，方便后面验证证书信息是否更新成功，这里以百度为例：

![](http://image.qinbaichao.com/images/20220630/image-20220630182527020.png)

![](http://image.qinbaichao.com/images/20220630/image-20220630184902537.png)

## 申请证书

很多平台可以免费申请到单域名的 ssl 证书，我们使用的是阿里云，接下来基于阿里云平台来演示如何申请证书。先找个账号通过谷歌浏览器登录阿里云官网，然后按如下步骤操作：

![](http://image.qinbaichao.com/images/20220630/image-20220630195055521.png)

![](http://image.qinbaichao.com/images/20220630/image-20220630195517421.png)

![](http://image.qinbaichao.com/images/20220630/image-20220630195821001.png)

![](http://image.qinbaichao.com/images/20220630/image-20220630201120267.png)

![](http://image.qinbaichao.com/images/20220630/image-20220630202119631.png)

## 验证域名

经过前面的步骤之后，我们已经拿到了验证文件，接下来需要配置域名指向的服务器使其支持通过 https 或者 http 协议访问指定路径能访问到验证文件里面的内容。上面申请证书步骤最后一张截图中的两个 url 并没有指定端口，那就是使用默认的端口，https 协议默认端口是 443，http 协议默认端口是 80，我们系统请求链路中前面使用 Nginx 作为反向代理，接下来基于 Nginx 讲解下如何配置验证域名的链接。

网上很多文章都说将域名验证文件放在指定目录下，但这是别人服务器环境，我们要结合自己的服务器环境来决定将文件放在哪个目录下，甚至都不用将文件上传到服务器，这需要你了解 Nginx 以及清楚自己要做的事情。

首先要明白我们要做的事情是配置服务器支持通过指定 url 访问到验证文件的内容，而不是将验证文件放在服务器指定的目录。这里可以深挖一下，别人是怎么验证能不能通过指定 url 访问到验证文件内容的呢？从技术角度来说，是访问 url 之后返回了 200 响应码，并且响应报文就是文件内容对不对，这是 http 协议的知识。

那我们只要配置 Nginx 访问指定路径的时候以 200 响应码返回验证文件的内容就行了，至于上不上传验证文件到服务器根本不重要对吧，基于这个需求，登录服务器之后按照如下操作配置 Nginx 即可：

```bash
#我系统 Nginx 安装目录是 /usr/local/openresty/nginx
cd /usr/local/openresty/nginx/conf/conf.d/
#编辑配置文件
vim default.conf
#在80、443 端口下加入如下内容
#其中 202206300000005lyywss12g8vqgnhzbl 为文件内容
location /.well-known/pki-validation/fileauth.txt {
    return 200 "202206300000005lyywss12g8vqgnhzbl";
}
```

配置完之后大概类似如下（为了隐藏业务系统信息，这里我以自己的域名来举例）：

![](http://image.qinbaichao.com/images/20220630/image-20220630213147665.png)

有人可能会好奇，证书还没申请下来，哪来的证书支持 https 访问呢？这种场景就是你之前的证书还没过期，但快过期了，需要更换证书，这时是可以支持 https 访问的，如果你的之前没有申请过 https 证书，那么只需要支持 http 访问即可，如下：

![](http://image.qinbaichao.com/images/20220630/image-20220630213906189.png)

根据我的实践经验，域名验证一般是通过 http 协议来验证的，只要能通过 http 协议来访问即可，所以一般只需要在 80 端口下配置 location 即可。

在配置业务系统的过程中，我们还遇到一个棘手的事情，由于我们系统有安全上的要求，只允许通过 https 协议来访问，对于不必要的端口是不能暴露到公网的，也就是服务器不开放 80 端口，这给域名验证带来了一定的障碍，当时虽然通过 https 链接能访问文件内容，但就是死活验证不通过。

幸亏这个端口开放的控制是在主机防火墙上做的，而我对主机防火墙还算有点了解，要不然就无法通过文件验证的方式来验证域名了，这里也讲下如何配置主机防火墙暂时开放 80 端口，方便后人避坑。

我们系统 Nginx 服务器使用的防火墙工具是 iptables，目前 iptables 所有访问控制规则都是配置在文件 /etc/sysconfig/iptables 下的，按如下操作修改配置文件，重启 iptables 即可：

```bash
#以下操作请切换到 root 账号
vim  /etc/sysconfig/iptables

#找到 filter 链中开放 443 端口的访问控制规则，参考443端口开放规则加入如下访问控制规则
-A INPUT -p tcp -m multiport --dports 80 -j ACCEPT
#修改配置文件之后，执行如下命令重启 iptables
service iptables restart
```

修改之后的防火墙配置文件如下：

![](http://image.qinbaichao.com/images/20220630/image-20220630221812312.png)

重启防火墙之后就可以通过 80 端口访问验证 url 了，需要注意的是，域名验证完之后需要马上关闭 80 端口，否则就是安全事故，关闭 80 端口的操作就是将刚添加的访问控制规则从 iptables 配置文件中删除，然后重启 iptables。

最后验证通过之后就可以提交审核了，如下：

![](http://image.qinbaichao.com/images/20220630/image-20220630212354923.png)

审核通过就可以在证书列表页下载指定格式的证书了，我们这里需要下载的是 Nginx 格式的证书，如下：

![](http://image.qinbaichao.com/images/20220630/image-20220630222758048.png)

![](http://image.qinbaichao.com/images/20220630/image-20220630222919687.png)

## Nginx 配置 https 证书

经过前面的部署我们已经拿到了 https 证书，通过 sftp 上传到服务器指定目录，修改 Nginx 配置文件，重新加载配置文件就算完成证书更换，具体操作命令如下：

```bash

#拿到的Nginx 证书文件有两个，分别是：
#8039229_qinbaichao.com.pem
#8039229_qinbaichao.com.key
#/usr/local/openresty/nginx/conf/CA 目录是我们系统 Nginx 存放证书的目录
#假设两个证书文件已经上传到这个目录下，以下操作需要切换到 root 账号
vim /usr/local/openresty/nginx/conf/conf.d/default.conf
#修改 443 端口下的 server 块的证书配置指令，指向新的证书文件，如下：
ssl_certificate CA/8039229_qinbaichao.com.pem;
ssl_certificate_key CA/8039229_qinbaichao.com.key;

#修改文件之后，执行如下命令重新加载配置文件
nginx -s reload

#如果你的环境中 nginx 命令没有加入到 PATH 环境变量中，那么执行如下命令
#假设 /usr/local/openresty/nginx 是 nginx 安装目录
#/usr/local/openresty/nginx/sbin/nginx -s reload
```

最后 Nginx 配置如下：

![](http://image.qinbaichao.com/images/20220630/image-20220630225339837.png)

## 验证新证书是否生效

配置完之后通过第一步说的方式查看证书过期时间，就可以知道证书是否已经生效了，如下：

![](http://image.qinbaichao.com/images/20220630/image-20220630225818493.png)

## 总结

说起来很简单的 Nginx 配置 https 证书这么一件事情，从头到尾讲出来还是要花不少时间，如果仅仅讲述下 Nginx 配置证书的指令没什么，随便一搜就能找到这样的指令，但放到实际系统场景中，复杂的配置，不同的服务器环境，遇到问题时还是很考验操作人对 Nginx、服务器和证书配置这件事的理解，综合起来就涉及很多东西。

我的同事一开始也笑我说这么简单的一件事有啥可写的，感觉很多时候我们说一件事简单，背后其实是有前提条件的，对于没有达到前提条件的人来说，简单无疑是开玩笑。
