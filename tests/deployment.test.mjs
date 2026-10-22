import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
test('Vercel uses explicit static output and no browser module can be detected as server entry',async()=>{
 const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.equal(config.framework,null);
 assert.equal(config.outputDirectory,'dist');
 assert.equal(config.buildCommand,'npm run build');
 for(const name of ['app.mjs','server.mjs'])await assert.rejects(access(new URL('../'+name,import.meta.url)));
});
test('production output contains all browser modules referenced by the page',async()=>{
 execFileSync(process.execPath,['scripts/build.mjs'],{cwd:root});
 const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 assert.match(html,/src="\/client\.mjs"/);
 for(const name of ['client.mjs','contact.mjs','motion.mjs','styles.css','assets/lenis.mjs','assets/lenis.css'])
 await access(new URL('../dist/'+name,import.meta.url));
 for(const name of ['server.mjs','app.mjs','whatsapp.mjs','.env'])await assert.rejects(access(new URL('../dist/'+name,import.meta.url)));
});
test('serverless map config only exposes the public browser key',async()=>{
 const { publicConfig }=await import('../public-config.mjs');
 assert.deepEqual(publicConfig({GOOGLE_MAPS_API_KEY:'browser-key',WA_ACCESS_TOKEN:'private-token'}),{googleMapsKey:'browser-key'});
 assert.deepEqual(publicConfig({}),{googleMapsKey:''});
});
test('Vercel config endpoint supports GET, disables caching and rejects unsupported methods',async()=>{
 const {default:handler}=await import('../api/config.js');
 const get=await handler.fetch(new Request('https://example.test/api/config'));
 assert.equal(get.status,200);
 assert.equal(get.headers.get('cache-control'),'no-store');
 assert.deepEqual(Object.keys(await get.json()),['googleMapsKey']);
 const post=await handler.fetch(new Request('https://example.test/api/config',{method:'POST'}));
 assert.equal(post.status,405);
 assert.equal(post.headers.get('allow'),'GET, HEAD');
});
