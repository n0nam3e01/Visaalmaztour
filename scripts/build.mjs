import { mkdir, copyFile, cp } from 'node:fs/promises';
const root=new URL('../',import.meta.url),dist=new URL('../dist/',import.meta.url);
await mkdir(dist,{recursive:true});
for(const file of ['index.html','styles.css','app.mjs','contact.mjs','motion.mjs'])await copyFile(new URL(file,root),new URL(file,dist));
await cp(new URL('assets/',root),new URL('assets/',dist),{recursive:true});
console.log('Built dist/ — 5 application files + local assets. Server secrets excluded.');
