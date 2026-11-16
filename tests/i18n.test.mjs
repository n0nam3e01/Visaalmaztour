import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { pairs, renderKk } from '../i18n/kk.mjs';
import { createApp } from '../scripts/dev-server.mjs';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
test('every Kazakh dictionary fragment still exists in index.html',()=>{
 for(const [ru] of pairs)assert.ok(html.includes(ru),'missing in index.html: '+ru);
});
test('Kazakh page keeps structure and leaves no translated Russian fragment behind',()=>{
 const kk=renderKk(html);
 assert.match(kk,/<html lang="kk">/);
 assert.match(kk,/rel="canonical" href="https:\/\/visaalmaztourkz\.vercel\.app\/kk\/"/);
 assert.equal((kk.match(/<section/g)||[]).length,(html.match(/<section/g)||[]).length);
 for(const [ru,kkText] of pairs)if(!kkText.includes(ru))assert.ok(!kk.includes(ru),'left untranslated: '+ru);
 assert.match(kk,/class="lang-switch" href="\/" lang="ru"/);
});
test('all images referenced by the page exist',async()=>{
 for(const [,file] of html.matchAll(/["' ](\/assets\/[a-z0-9-]+\.(?:webp|jpg|png|svg))/g))await access(new URL('..'+file,import.meta.url));
});
test('dev server serves the Kazakh page, SEO files and new image types',async t=>{
 const server=createApp({env:{}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const base='http://127.0.0.1:'+server.address().port;
 const kk=await fetch(base+'/kk/');
 assert.equal(kk.status,200);assert.match(await kk.text(),/Визаға <br>көмектесеміз/);
 assert.equal((await fetch(base+'/kk',{redirect:'manual'})).status,308);
 for(const [route,mime] of [['/robots.txt','text/plain'],['/sitemap.xml','application/xml'],['/assets/logo.webp','image/webp'],['/assets/favicon.svg','image/svg+xml'],['/404.html','text/html']]){
  const response=await fetch(base+route);
  assert.equal(response.status,200,route);assert.ok(response.headers.get('content-type').startsWith(mime),route);
 }
 assert.equal((await fetch(base+'/i18n/kk.mjs')).status,404);
});
