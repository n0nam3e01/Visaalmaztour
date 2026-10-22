import { mkdir, copyFile, cp, rm } from 'node:fs/promises';
const root=new URL('../',import.meta.url),dist=new URL('../dist/',import.meta.url);
await mkdir(dist,{recursive:true});
// Remove the old browser entry from prior builds after its rename.
await rm(new URL('app.mjs',dist),{force:true});
for(const file of ['index.html','styles.css','client.mjs','contact.mjs','motion.mjs'])
 await copyFile(new URL(file,root),new URL(file,dist));
await cp(new URL('assets/',root),new URL('assets/',dist),{recursive:true});
console.log('Built dist/ — 5 browser files + local assets. Server code and secrets excluded.');
