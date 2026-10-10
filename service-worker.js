const CACHE='miy-avtor-v2.6.2';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.json','./icon-192.png','./icon-512.png','./characters/grandma.webp','./characters/vampire.webp','./characters/madness.webp','./characters/death.webp','./characters/mummy.webp','./characters/demoness.webp','./characters/grandma-friend.png','./characters/vampire-friend.png','./characters/madness-friend.png','./characters/death-friend.png','./characters/mummy-friend.png','./characters/demoness-friend.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;

  const reqUrl=new URL(event.request.url);
  const sameOrigin=reqUrl.origin===self.location.origin;

  // Не перехоплюємо запити до Booknet, Аркуша та інших зовнішніх сайтів.
  // Інакше при помилці мережі наш index.html може помилково виглядати як відповідь зовнішнього сайту.
  if(!sameOrigin) return;

  event.respondWith(
    fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      return response;
    }).catch(async()=>{
      const cached=await caches.match(event.request);
      if(cached) return cached;
      if(event.request.mode==='navigate') return caches.match('./index.html');
      throw new Error('Offline asset not cached');
    })
  );
});
