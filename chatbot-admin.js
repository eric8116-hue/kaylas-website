/* The website and CRM share this editor and the exact chatbot matching core. */
(function(){
'use strict';
const core=window.PreciseChat,$=id=>document.getElementById(id),local=['127.0.0.1','localhost'].includes(location.hostname);
const API=local?(location.port==='8818'?'/response-api':'http://127.0.0.1:8815'):'https://chatbot-api.eric8116.workers.dev';
let qa=[],revision='',password='',editing=null,busy=false,loaded=false;
function notice(text,error=false){$('notice').textContent=text;$('notice').classList.toggle('error',error);}
async function request(path,options={}){
 const r=await fetch(API+path,{...options,headers:{'Content-Type':'application/json',...(password?{'X-Admin-Password':password}:{}),...options.headers},cache:'no-store',signal:AbortSignal.timeout(7000)});
 const d=await r.json();if(!r.ok)throw Error(d.error||'The service could not complete this request.');return d;
}
const triggers=s=>s.split(',').map(x=>x.trim()).filter(Boolean);
function draft(){const en=$('answerEnglish').value.trim();return {label:$('answerLabel').value.trim(),triggers:triggers($('answerTriggers').value),reply:en,en,es:$('answerSpanish').value.trim()};}
function current(){const list=qa.slice();if(!$('editPanel').hidden){const d=draft();if(d.en&&d.triggers.length){if(editing===null)list.push(d);else list[editing]=d;}}return list;}
function test(){const a=core.answer($('testQuestion').value,$('testLanguage').value,current());$('testResult').textContent=(a.kind==='custom'?'Your answer':a.kind==='handoff'?'Team handoff':a.kind==='fallback'?'No approved answer':'Built-in answer')+'\n\n'+a.text;}
function element(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function action(text,fn,cls=''){const b=element('button',text,'pill '+cls);b.type='button';b.disabled=!password||busy;b.addEventListener('click',fn);return b;}
function render(){
 $('qaCount').textContent=qa.length;$('esCount').textContent=qa.filter(x=>x.es?.trim()).length;$('baseCount').textContent=core.services.length+core.faqs.length;
 const query=core.normalize($('searchAnswers').value),list=$('answers');list.replaceChildren();
 qa.forEach((a,i)=>{
  if(query&&!core.normalize([a.label,...a.triggers,a.en||a.reply,a.es].join(' ')).includes(query))return;
  const row=element('details',undefined,'answer-row'),sum=element('summary',a.label||a.triggers[0]);
  sum.append(element('small',a.es?'EN + ES ready':'English ready · Spanish awaiting review'));row.append(sum);
  row.append(element('p',a.triggers.join(' · ')),element('strong','ENGLISH'),element('p',a.en||a.reply),element('strong','ESPAÑOL'),element('p',a.es||'No Spanish answer yet.'));
  const actions=element('div',undefined,'answer-actions');actions.append(action('EDIT ANSWER',()=>edit(i),'violet'),action('REMOVE',()=>remove(i),'danger'));row.append(actions);list.append(row);
 });
 if(!list.children.length)list.append(element('p',qa.length?'No answers match this search.':'Your custom answers will appear here. Built-in answers are already available.','answer-note'));
 $('newAnswer').disabled=!password||!loaded||busy;$('loadQuestions').disabled=!password||busy;
}
async function load(){
 const d=await request('/qa');qa=Array.isArray(d.qa)?d.qa:[];revision=typeof d.revision==='string'?d.revision:'';
 loaded=true;render();
}
function edit(index=null){
 if(!$('editPanel').hidden&&!confirm('Replace the current unsaved draft?'))return false;
 editing=index;const a=index===null?{}:qa[index];$('editTitle').textContent=index===null?'New answer':'Edit answer';
 $('answerLabel').value=a.label||'';$('answerTriggers').value=(a.triggers||[]).join(', ');$('answerEnglish').value=a.en||a.reply||'';$('answerSpanish').value=a.es||'';
 $('editPanel').hidden=false;$('editPanel').scrollIntoView({block:'start',behavior:'smooth'});$('answerLabel').focus();return true;
}
async function save(list){
 if(busy||!password||!loaded)return false;busy=true;$('saveAnswer').disabled=true;render();
 try{
  await request('/qa',{method:'POST',body:JSON.stringify({qa:list,revision})});
  await load();notice(local?'Saved in local preview. Production was not changed.':'Saved. Website answers refresh within about a minute.');return true;
 }catch(e){notice(e.message+' Your draft is still available.',true);return false;}
 finally{busy=false;$('saveAnswer').disabled=false;render();}
}
async function remove(index){
 if(!confirm('Remove "'+(qa[index].label||qa[index].triggers[0])+'"?'))return;
 const next=qa.filter((_,i)=>i!==index);if(await save(next)){$('editPanel').hidden=true;editing=null;}
}
async function questions(){
 try{
 const d=await request('/miss');$('questions').replaceChildren();
 for(const q of d.rows||[]){
  const row=element('div',undefined,'question-row');row.append(element('small',(q.lang==='es'?'Español':'English')+' · '+new Date(q.at).toLocaleDateString()),element('p',q.q));
  row.append(action('DRAFT AN ANSWER',()=>{if(!edit())return;$('answerLabel').value=q.q;$('answerTriggers').value=q.q;$('testQuestion').value=q.q;$('testLanguage').value=q.lang;},'rose'));$('questions').append(row);
 }
 if(!$('questions').children.length)$('questions').textContent='No shared questions are waiting.';
 if(d.limited)$('questions').append(element('p','Showing up to 100 questions.','answer-note'));
 }catch(e){notice(e.message,true);}
}
async function unlock(pw){
 const d=await request('/login',{method:'POST',body:JSON.stringify({password:pw})});if(!d.ok)throw Error('Password not accepted.');
 password=pw;$('password').value='';$('gate').hidden=true;await load();await questions();
}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();try{await unlock($('password').value);notice('Editor unlocked for this tab.');}catch(err){notice(err.message,true);}});
$('testForm').addEventListener('submit',e=>{e.preventDefault();test();});$('testDraft').addEventListener('click',()=>{test();$('testResult').scrollIntoView({block:'center',behavior:'smooth'});});
$('searchAnswers').addEventListener('input',render);$('newAnswer').addEventListener('click',()=>edit());$('loadQuestions').addEventListener('click',questions);
$('cancelAnswer').addEventListener('click',()=>{$('editPanel').hidden=true;editing=null;});
$('answerForm').addEventListener('submit',async e=>{e.preventDefault();const d=draft();if(!d.en||!d.triggers.length){notice('Add an English answer and at least one trigger phrase.',true);return;}const list=qa.slice();if(editing===null)list.push(d);else list[editing]=d;if(await save(list)){$('editPanel').hidden=true;editing=null;test();}});
for(const f of core.faqs){const row=element('details',undefined,'answer-row');row.append(element('summary',f.label.en),element('p',f.answer.en),element('p',f.answer.es));$('baseAnswers').append(row);}
for(const c of core.categories){const row=element('details',undefined,'answer-row');row.append(element('summary',c.label.en),element('p',c.names.en),element('p',c.names.es));$('baseAnswers').append(row);}
load().then(test).catch(e=>{notice('Custom answers could not load. Built-in answers are available. '+e.message,true);test();});
if(local)unlock('local-preview-only').then(()=>notice('Local preview editor · saves stay on this computer.')).catch(()=>{});
})();
