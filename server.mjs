import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateLead, sendLead } from './whatsapp.mjs';
const projectRoot=fileURLToPath(new URL('.',import.meta.url));
try{process.loadEnvFile(path.join(projectRoot,'.env'));}catch(error){if(error.code!=='ENOENT')throw error;}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg'};
export function createApp({env=process.env,fetcher=fetch,root=projectRoot}={}) {
 const limits=new Map();
 const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  let pathname; try{pathname=new URL(req.url,'http://localhost').pathname;}catch{return json(400,{error:'Неверный адрес.'});}
  if(pathname==='/api/config' && req.method==='GET')return json(200,{googleMapsKey:env.GOOGLE_MAPS_API_KEY||''});
  if(pathname==='/api/consultation'){
   if(req.method!=='POST'){res.setHeader('Allow','POST');return json(405,{ok:false,error:'Метод не поддерживается.'});}
   const expected=env.SITE_ORIGIN || 'http://' + req.headers.host;
   if(req.headers.origin && req.headers.origin!==expected)return json(403,{ok:false,error:'Отправьте заявку со страницы сайта.'});
   if(!req.headers['content-type']?.startsWith('application/json'))return json(415,{ok:false,error:'Неверный формат запроса.'});
   const now=Date.now();
   for(const [key,value] of limits)if(value.expires<now)limits.delete(key);
   const ip=req.socket.remoteAddress;
   const limit=limits.get(ip)||{count:0,expires:now+600000};
   if(limit.count>=5 || limits.size>10000){res.setHeader('Retry-After','600');return json(429,{ok:false,error:'Слишком много обращений. Попробуйте позже или напишите в WhatsApp.'});}
   limit.count++;limits.set(ip,limit);
   let body='';const chunks=[];let bodySize=0;
   try{
    for await(const chunk of req){bodySize+=chunk.length;if(bodySize>8192){json(413,{ok:false,error:'Заявка слишком большая.'});return;}chunks.push(chunk);}body=Buffer.concat(chunks).toString('utf8');
    let input;
    try{input=JSON.parse(body);}catch{return json(400,{ok:false,error:'Проверьте данные заявки.'});}
    if(input?.website)return json(400,{ok:false,error:'Не удалось отправить заявку.'});
    const valid=validateLead(input);
    if(!valid.ok)return json(400,{ok:false,error:valid.error});
    const result=await sendLead(valid.data,env,fetcher);
    return json(result.status,{ok:result.ok,...(result.ok?{message:result.message}:{error:result.error})});
   }catch{if(!res.writableEnded)json(400,{ok:false,error:'Не удалось обработать заявку.'});return;}
  }
  if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return json(405,{ok:false,error:'Метод не поддерживается.'});}
  let relative;
  try{relative=decodeURIComponent(pathname);}catch{return json(400,{error:'Неверный адрес.'});}
  if(relative==='/')relative='/index.html';
  if(!/^\/(index\.html|styles\.css|app\.mjs|contact\.mjs|motion\.mjs|assets\/(?:[a-z0-9-]+\.(?:png|jpg)|lenis\.(?:mjs|css)))$/.test(relative))return json(404,{error:'Страница не найдена.'});
  try{
   const body=await readFile(path.join(root,relative.slice(1)));
   res.writeHead(200,{'Content-Type':mime[path.extname(relative)]||'application/octet-stream','Cache-Control':'no-cache'});
   res.end(req.method==='HEAD'?undefined:body);
  }catch{return json(404,{error:'Страница не найдена.'});}
 });
 server.requestTimeout=20000;server.headersTimeout=20000;
 return server;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const production=process.argv.includes('--production');
 const root=production?path.join(projectRoot,'dist'):projectRoot;
 if(!existsSync(path.join(root,'index.html')))throw new Error('Run npm run build before production start.');
 const server=createApp({root});
 server.listen(Number(process.env.PORT)||4173,process.env.HOST||'127.0.0.1',()=>console.log('Visa Almaz Tour: http://localhost:'+(Number(process.env.PORT)||4173)));
}
