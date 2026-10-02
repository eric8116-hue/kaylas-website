import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import worker from '../worker/chatbot-api.js';
import {sanitizeAnswers,questionForReview} from '../worker/chatbot-support.mjs';
const core=createRequire(import.meta.url)('../chatbot-core.js');
test('spa routing handles accents, word boundaries, prices and personal treatment questions',()=>{
 assert.equal(core.answer('¿Cuánto cuesta el láser?','es').id,'prices');
 assert.equal(core.answer('What are your hours?').id,'hours');
 assert.equal(core.answer('Do you have electrolysis?').id,'electrolysis');
 assert.equal(core.answer('scholarly submarine').kind,'fallback');
 assert.equal(core.answer('I am pregnant, can I have laser?','en',[{triggers:['laser'],en:'Book now'}]).kind,'handoff');
 assert.equal(core.answer('¿Puedo hacerme láser embarazada?','es').kind,'handoff');
});
test('specific custom phrases outrank generic matches and Spanish does not silently become English',()=>{
 const qa=[{triggers:['gift'],en:'Generic',es:'General'},{triggers:['gift card'],en:'Card',es:'Tarjeta'}];
 assert.equal(core.answer('gift card','es',qa).text,'Tarjeta');
 assert.match(core.answer('gift','es',[{triggers:['gift'],reply:'Old English'}]).text,/español/);
});
test('English legacy answers and Spanish replies survive validation; invalid saves fail whole',()=>{
 assert.deepEqual(sanitizeAnswers([{triggers:['Gift Card'],reply:'Yes',es:'Sí'}]),[{label:'',triggers:['gift card'],reply:'Yes',en:'Yes',es:'Sí'}]);
 assert.equal(sanitizeAnswers([{triggers:[],reply:'Invalid'}]),null);
 assert.equal(questionForReview({q:'Question without consent'}),null);
 assert.equal(questionForReview({q:'Email me user@example.com',consent:true}),null);
});
test('CRM tester ships the identical engine and admin controller',()=>{
 for(const filename of ['chatbot-core.js','chatbot-admin.js','chatbot-admin.css'])
 assert.equal(readFileSync(new URL('../'+filename,import.meta.url),'utf8'),readFileSync(new URL('../../precise-laser-crm/public/'+filename,import.meta.url),'utf8'));
});
test('worker keeps save/read bilingual, rejects stale editors, requires authentication for shared questions',async()=>{
 const data=new Map();
 const env={ADMIN_PASSWORD:'test-only',CHATBOT_KV:{
  get:async(k,options)=>{const v=data.get(k)||null;return options?.type==='json'&&v?JSON.parse(v):v;},
  put:async(k,v)=>data.set(k,v),
  list:async({prefix})=>({keys:[...data.keys()].filter(k=>k.startsWith(prefix)).map(name=>({name})),list_complete:true})
 }};
 const request=(path,method='GET',body,password)=>worker.fetch(new Request('https://chatbot-api.example'+path,{method,headers:{'Content-Type':'application/json',...(password?{'X-Admin-Password':password}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);
 let r=await request('/qa');assert.deepEqual(await r.json(),{qa:[],revision:''});
 r=await request('/qa','POST',{qa:[{label:'Gift',triggers:['gift'],en:'Ask the team.',es:'Pregunta al equipo.'}],revision:''},'test-only');assert.equal(r.status,200);
 r=await request('/qa');const saved=await r.json();assert.equal(saved.qa[0].es,'Pregunta al equipo.');assert.equal(saved.qa[0].reply,'Ask the team.');
 r=await request('/qa','POST',{qa:[],revision:''},'test-only');assert.equal(r.status,409);
 r=await request('/miss');assert.equal(r.status,401);
 r=await request('/miss','POST',{q:'Do you offer gift cards?',consent:true,lang:'en'});assert.equal(r.status,200);
 r=await request('/miss','GET',undefined,'test-only');assert.equal((await r.json()).rows.length,1);
 r=await request('/qa','POST',{qa:[],revision:saved.revision},'test-only');assert.equal(r.status,200);
});
test('an unconfigured admin password never authenticates an empty login',async()=>{
 const r=await worker.fetch(new Request('https://example.com/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:''})}),{});assert.equal(r.status,401);
});
test('shared-question endpoint limits repeated submissions without storing raw addresses',async()=>{
 const data=new Map(),writes=[];
 const env={CHATBOT_KV:{get:async k=>data.get(k),put:async(k,v,options)=>{data.set(k,v);writes.push({k,options});}}};
 const send=()=>worker.fetch(new Request('https://example.com/miss',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.8'},body:JSON.stringify({q:'Is bicycle parking available?',consent:true})}),env);
 for(let i=0;i<10;i++)assert.equal((await send()).status,200);
 assert.equal((await send()).status,429);
 assert.equal([...data.keys()].some(k=>k.includes('192.0.2.8')),false);
 assert.ok(writes.every(x=>x.options.expirationTtl>0));
});
