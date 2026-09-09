/* InternalBeyond Mobile — ib-sw.js（Service Worker 模板 · 缓存优先，后台更新）
   与手机端 HTML 放在同一目录，经 HTTPS 访问时页面会自动注册本文件。
   只接管本站的 GET 请求；发往 AI 服务商 / 中转站的请求原样放行、绝不缓存。
   【本地修改 2026-09-09】原版为「联网优先，离线回退」；改为「缓存优先 + 后台更新」：
   有缓存立即返回（点图标秒开，不依赖 GitHub 可达），同时后台拉最新版本更新缓存，
   下次打开即新版。 */
const IB_CACHE='ib-cache-v2';
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==IB_CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var u=new URL(e.request.url);
  if(u.origin!==self.location.origin)return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(function(m){
    var net=fetch(e.request).then(function(r){
      if(r&&r.ok){var cp=r.clone();caches.open(IB_CACHE).then(function(c){c.put(e.request,cp)})}
      return r;
    }).catch(function(){return m});
    return m||net;
  }));
});
