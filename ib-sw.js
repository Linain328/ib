/* InternalBeyond Mobile — ib-sw.js（联网优先 · 6 秒超时回退缓存）
   只接管本站的 GET 请求；发往 AI 服务商 / 中转站的请求原样放行、绝不缓存。
   【2026-09-12】从「缓存优先」改回「联网优先」，并加 6 秒超时：
   开梯子时打开直接拉到最新版（秒更新）；关梯子时最多等 6 秒就回退本地缓存（不再无限卡）。 */
const IB_CACHE='ib-cache-v2';
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==IB_CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var u=new URL(e.request.url);
  if(u.origin!==self.location.origin)return;
  e.respondWith(new Promise(function(resolve){
    var done=false;
    var timer=setTimeout(function(){if(!done){done=true;resolve(caches.match(e.request,{ignoreSearch:true}));}},6000);
    fetch(e.request).then(function(r){
      if(done)return;done=true;clearTimeout(timer);
      if(r&&r.ok){var cp=r.clone();caches.open(IB_CACHE).then(function(c){c.put(e.request,cp)})}
      resolve(r);
    }).catch(function(){if(!done){done=true;clearTimeout(timer);resolve(caches.match(e.request,{ignoreSearch:true}));}});
  }).then(function(res){if(res)return res;throw new Error('offline');}));
});
