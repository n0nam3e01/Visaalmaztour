import { mkdir, copyFile, cp, rm, readFile, writeFile } from 'node:fs/promises';
import { renderKk } from '../i18n/kk.mjs';
const root=new URL('../',import.meta.url),dist=new URL('../dist/',import.meta.url);
await rm(new URL('assets/',dist),{recursive:true,force:true});
await mkdir(new URL('kk/',dist),{recursive:true});
// Remove the old browser entry from prior builds after its rename.
await rm(new URL('app.mjs',dist),{force:true});
for(const file of ['index.html','404.html','robots.txt','sitemap.xml','styles.css','client.mjs','contact.mjs','motion.mjs'])
 await copyFile(new URL(file,root),new URL(file,dist));
await cp(new URL('assets/',root),new URL('assets/',dist),{recursive:true});
await writeFile(new URL('kk/index.html',dist),renderKk(await readFile(new URL('index.html',root),'utf8')));
console.log('Built dist/ — browser files, Kazakh page and local assets. Server code and secrets excluded.');
