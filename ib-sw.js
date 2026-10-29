/* InternalBeyond Mobile — ib-sw.js（Service Worker · 缓存优先，后台更新）
   与手机端 HTML 放在同一目录，经 HTTPS 访问时页面会自动注册本文件。
   只接管本站的 GET 请求；发往 AI 服务商 / 中转站的请求原样放行、绝不缓存。

   【本地修改 2026-10-29 · 对应 V3.2.0】
   上游原版是「联网优先，离线回退」（ib-cache-v3）。这里保留你一直在用的
   「缓存优先 + 后台更新」手感 —— 点图标秒开、不依赖 GitHub 可达 —— 同时吸收
   上游 V3.2.0 新加的两样东西：
     1) 本机还没有离线副本、网络又不通时，显示友好的「暂时加载不上」页，
        而不是浏览器自带的报错页；
     2) 缓存名升到 ib-cache-v3，手机装上新版后会自动清掉 v2 旧缓存，
        真正换成新的 index.html。

   行为：
     · 有缓存 → 立刻返回缓存，同时后台拉最新版本写回缓存，下次打开即是新版
     · 没缓存 → 等网络（页面 20 秒、其它资源 9 秒），超时落离线页 */
const IB_CACHE='ib-cache-v3';
const NAV_TIMEOUT=20000,ASSET_TIMEOUT=9000;

self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==IB_CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});

function withTimeout(p,ms){return new Promise(function(res,rej){var t=setTimeout(function(){rej(new Error('timeout'))},ms);p.then(function(v){clearTimeout(t);res(v)},function(e){clearTimeout(t);rej(e)})})}

function offlinePage(){return new Response('<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Internal Beyond</title><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,\'PingFang SC\',\'Noto Sans SC\',sans-serif;background:#eef2f8;color:#132a52"><div style="text-align:center;padding:24px"><div style="font-size:1.05rem;margin-bottom:10px">暂时加载不上</div><div style="font-size:0.84rem;color:#3b5686;line-height:1.7">本机还没有离线副本，网络也没回应。<br>检查网络后点下面重试。</div><button onclick="location.reload()" style="margin-top:18px;height:40px;padding:0 22px;border-radius:999px;border:1px solid rgba(120,168,222,.6);background:#fff;color:#3f74ad;font-size:0.9rem">重试</button></div></body>',{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}})}

self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var u=new URL(e.request.url);
  if(u.origin!==self.location.origin)return;

  var isNav=e.request.mode==='navigate'||e.request.destination==='document';

  /* 网络请求：成功就顺手写回缓存（不阻塞这次打开） */
  var net=fetch(e.request).then(function(r){
    if(r&&r.ok){var cp=r.clone();caches.open(IB_CACHE).then(function(c){c.put(e.request,cp)}).catch(function(){})}
    return r;
  });
  /* 后台更新必须在事件还活着的时候同步注册，否则浏览器会报 InvalidStateError */
  e.waitUntil(net.then(function(){},function(){}));

  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(function(cached){
    if(cached)return cached;                                   /* 有缓存 → 秒开 */
    return withTimeout(net,isNav?NAV_TIMEOUT:ASSET_TIMEOUT).catch(function(){
      if(isNav)return offlinePage();                           /* 首次打开又断网 → 友好离线页 */
      throw new Error('offline');
    });
  }));
});
