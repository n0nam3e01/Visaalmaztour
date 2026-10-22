import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.mjs';
const lead={name:'Тестовый клиент',phone:'+77061234567',destination:'США',consent:true};
async function fixture(t,options={}) {
 const server=createApp({env:{},...options});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const base='http://127.0.0.1:'+server.address().port;
 return {base,post:(body,headers={})=>fetch(base+'/api/consultation',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)})};
}
test('unconfigured API does not falsely acknowledge a lead',async t=>{
 const {post}=await fixture(t);const response=await post(lead);
 assert.equal(response.status,503);assert.equal((await response.json()).ok,false);
});
test('invalid data and malformed JSON fail without contacting WhatsApp',async t=>{
 const {post}=await fixture(t,{fetcher:()=>{throw Error('must not send');}});
 assert.equal((await post({...lead,consent:false})).status,400);
 assert.equal((await post('{')).status,400);
 assert.equal((await post({...lead,website:'bot'})).status,400);
});
test('cross-origin and oversized requests are rejected',async t=>{
 const {post}=await fixture(t);
 assert.equal((await post(lead,{Origin:'https://unrelated.example'})).status,403);
 assert.equal((await post({name:'x'.repeat(9000)})).status,413);
});
test('private source and environment files cannot be served',async t=>{
 const {base}=await fixture(t);
 for(const file of ['.env','.git/config','server.mjs','whatsapp.mjs','README.md','package.json'])
 assert.equal((await fetch(base+'/'+file)).status,404,file);
 const config=await (await fetch(base+'/api/config')).json();
 assert.deepEqual(config,{googleMapsKey:''});
});
test('API forwards validated lead through template with server-side recipient',async t=>{
 let captured;
 const env={WA_ACCESS_TOKEN:'test-only',WA_PHONE_NUMBER_ID:'123456',WA_NOTIFY_TO:'77018887932',WA_TEMPLATE_NAME:'visa_lead'};
 const {post}=await fixture(t,{env,fetcher:async(url,options)=>{captured={url,...options};return new Response(JSON.stringify({messages:[{id:'test-id'}]}),{status:200});}});
 const response=await post(lead);assert.equal(response.status,200);assert.equal((await response.json()).ok,true);
 assert.equal(captured.url,'https://graph.facebook.com/v26.0/123456/messages');
 assert.equal(JSON.parse(captured.body).to,'77018887932');
 assert.equal(captured.headers.Authorization,'Bearer test-only');
});
test('provider failure does not expose upstream credentials or claim success',async t=>{
 const env={WA_ACCESS_TOKEN:'private-test-token',WA_PHONE_NUMBER_ID:'123456',WA_NOTIFY_TO:'77018887932',WA_TEMPLATE_NAME:'visa_lead'};
 const {post}=await fixture(t,{env,fetcher:async()=>new Response(JSON.stringify({error:{message:'private-test-token'}}),{status:400})});
 const response=await post(lead);assert.equal(response.status,502);assert.doesNotMatch(await response.text(),/private-test-token/);
});
test('rate limit rejects repeated submissions',async t=>{
 const {post}=await fixture(t);
 for(let i=0;i<5;i++)await post(lead);
 assert.equal((await post(lead)).status,429);
});
test('malformed URL returns 400 instead of rejecting the request listener',async()=>{
 const server=createApp({env:{}});
 const response={status:0,setHeader(){},writeHead(status){this.status=status;},end(){}};
 await assert.doesNotReject(()=>server.listeners('request')[0]({url:'//%',method:'GET',headers:{}},response));
 assert.equal(response.status,400);
});
test('Cyrillic survives a multibyte character split across request chunks',async()=>{
 const {Readable}=await import('node:stream');
 let captured;
 const env={WA_ACCESS_TOKEN:'test-only',WA_PHONE_NUMBER_ID:'123456',WA_NOTIFY_TO:'77018887932',WA_TEMPLATE_NAME:'visa_lead'};
 const server=createApp({env,fetcher:async(url,options)=>{captured=JSON.parse(options.body);return new Response(JSON.stringify({messages:[{id:'test-id'}]}));}});
 const body=Buffer.from(JSON.stringify(lead));
 const split=body.indexOf(Buffer.from('Т'))+1;
 const request=Readable.from([body.subarray(0,split),body.subarray(split)]);
 Object.assign(request,{url:'/api/consultation',method:'POST',headers:{'content-type':'application/json',host:'localhost'},socket:{remoteAddress:'test'}});
 const response={setHeader(){},writeHead(){},end(){}};
 await server.listeners('request')[0](request,response);
 assert.equal(captured.template.components[0].parameters[0].text,lead.name);
});
test('browser motion dependencies are served with correct content types',async t=>{
 const {base}=await fixture(t);
 for(const [route,mime] of [['/motion.mjs','text/javascript'],['/assets/lenis.mjs','text/javascript'],['/assets/lenis.css','text/css']]){
  const response=await fetch(base+route);
  assert.equal(response.status,200,route);
  assert.ok(response.headers.get('content-type').startsWith(mime),route);
 }
});
