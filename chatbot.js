/* PLS-CHAT-2026.09.27-02 · H&R-inspired fixed answers for Precise. */
(function(){
'use strict';
const source=document.currentScript.src,local=['localhost','127.0.0.1'].includes(location.hostname);
const API=local?'http://127.0.0.1:8815':'https://chatbot-api.eric8116.workers.dev';
const script=document.createElement('script');script.src=new URL('chatbot-core.js?v=2',source).href;script.onload=init;document.head.append(script);
function init(){
 const core=window.PreciseChat,rail=document.querySelector('.action-rail');
 const buttonStyle=document.createElement('link');buttonStyle.rel='stylesheet';buttonStyle.href=new URL('button-refinement.css?v=1',source).href;document.head.append(buttonStyle);
 if(!core||!rail)return;
 let lang=document.documentElement.lang==='es'?'es':'en',qa=[],history=[];
 const pageTargets={hair:'/services-hair-removal.html',facials:'/services-facials.html#facial-treatments',beauty:'/services-beautification.html',wellness:'/services-detox.html'};
 for(const c of core.categories){if(pageTargets[c.id])c.page=pageTargets[c.id];}
 Object.assign(core.ui.en,{more:'Read the rest of the article',book:'Book',call:'Call'});
 Object.assign(core.ui.es,{more:'Leer el resto del artículo',book:'Reservar',call:'Llamar'});
 try{const saved=sessionStorage.getItem('preciseChatLanguage');if(saved==='en'||saved==='es')lang=saved;}catch{}
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('chatbot.css?v=3',source).href;document.head.append(style);
 const languageStyle=document.createElement('link');languageStyle.rel='stylesheet';languageStyle.href=new URL('chatbot-language-toggle.css?v=1',source).href;document.head.append(languageStyle);
 const overlayStyle=document.createElement('link');overlayStyle.rel='stylesheet';overlayStyle.href=new URL('chatbot-open-overlay.css?v=1',source).href;document.head.append(overlayStyle);
 const centeredStyle=document.createElement('link');centeredStyle.rel='stylesheet';centeredStyle.href=new URL('chatbot-centered-controls.css?v=2',source).href;document.head.append(centeredStyle);
 const launcher=document.createElement('button');launcher.id='cbRailBtn';launcher.className='rail-btn cb-btn';
 launcher.innerHTML='<span class="rail-label">Chat with Precise</span><span aria-hidden="true">✦</span><span class="cb-mobile-label">Chat</span>';
 launcher.setAttribute('aria-label','Chat with Precise — drag to move, tap to open');launcher.setAttribute('aria-expanded','false');launcher.setAttribute('aria-controls','cbPanel');rail.prepend(launcher);
 let drag=null,suppressClick=false;
 function placeLauncher(left,top){
  const pad=8,maxLeft=Math.max(pad,window.innerWidth-launcher.offsetWidth-pad),maxTop=Math.max(pad,window.innerHeight-launcher.offsetHeight-pad);
  launcher.style.left=Math.min(maxLeft,Math.max(pad,left))+'px';launcher.style.top=Math.min(maxTop,Math.max(pad,top))+'px';launcher.style.right='auto';launcher.style.bottom='auto';launcher.style.transform='none';
 }
 function moveLauncher(event){
  if(!drag||event.pointerId!==drag.id)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)<4)return;
  drag.moved=true;placeLauncher(drag.left+dx,drag.top+dy);
 }
 function finishLauncherDrag(event){
  if(!drag||event.pointerId!==drag.id)return;
  moveLauncher(event);const moved=drag.moved;drag=null;launcher.classList.remove('cb-dragging');
  if(moved){suppressClick=true;setTimeout(()=>{suppressClick=false;},500);}
 }
 launcher.addEventListener('pointerdown',event=>{
  if(!window.matchMedia('(max-width: 760px)').matches||event.button!==0)return;
  const rect=launcher.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};
  launcher.classList.add('cb-dragging');launcher.setPointerCapture(event.pointerId);event.preventDefault();
 });
 launcher.addEventListener('pointermove',moveLauncher);
 launcher.addEventListener('pointerup',finishLauncherDrag);
 launcher.addEventListener('pointercancel',finishLauncherDrag);
 launcher.addEventListener('keydown',event=>{
  if(!window.matchMedia('(max-width: 760px)').matches)return;
  const step=12,delta={ArrowUp:[0,-step],ArrowDown:[0,step],ArrowLeft:[-step,0],ArrowRight:[step,0]}[event.key];
  if(!delta)return;event.preventDefault();const rect=launcher.getBoundingClientRect();placeLauncher(rect.left+delta[0],rect.top+delta[1]);
 });
 const panel=document.createElement('section');panel.id='cbPanel';panel.className='cb-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','cbTitle');
 panel.innerHTML='<header class="cb-head"><div><strong id="cbTitle"></strong><small id="cbSubtitle"></small></div><button type="button" class="cb-close" id="cbClose">✕</button></header><div class="cb-toolbar"><div id="cbLanguages"><button type="button" data-lang="en" class="cb-lang cb-en">EN</button><button type="button" data-lang="es" class="cb-lang cb-es">ES</button></div><button type="button" id="cbReset" class="cb-chip"></button></div><div class="cb-body" id="cbBody" role="log" aria-live="polite" aria-relevant="additions"></div><div class="cb-chips" id="cbChips"></div><p class="cb-privacy" id="cbPrivacy"></p><form class="cb-foot"><label class="cb-sr" for="cbInput">Question / Pregunta</label><input id="cbInput" class="cb-input" maxlength="240" autocomplete="off"><button class="cb-send" type="submit" id="cbSend"></button></form>';
 document.body.append(panel);
 const $=id=>panel.querySelector('#'+id),body=$('cbBody'),input=$('cbInput');
 const request=(path,options={})=>fetch(API+path,{cache:'no-store',...options,signal:AbortSignal.timeout(5000)});
 request('/qa').then(r=>r.ok?r.json():Promise.reject()).then(d=>{qa=Array.isArray(d.qa)?d.qa:[];}).catch(()=>{});
 function button(text,action,cls='cb-chip'){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;b.addEventListener('click',action);return b;}
 function link(text,href,cls){const a=document.createElement('a');a.textContent=text;a.href=href;a.className=cls;if(href.startsWith('https:')){a.target='_blank';a.rel='noopener';}return a;}
 function append(role,data,question){
  const row=document.createElement('article');row.className='cb-msg '+role;
  const p=document.createElement('p');p.textContent=typeof data==='string'?data:data.text;row.append(p);
  if(role==='bot'&&data.kind!=='greeting'){
   const actions=document.createElement('div');actions.className='cb-msg-actions';
   if(data.url)actions.append(link(data.kind==='faq'?(lang==='es'?'Ver mapa':'Get directions'):core.ui[lang].more,data.url,'cb-learn'));
   actions.append(link(core.ui[lang].book,core.booking,'cb-book'),link(core.ui[lang].call,core.phone,'cb-call'));row.append(actions);
   if(data.kind==='fallback'&&question){
    const share=button(core.ui[lang].share,async()=>{
     share.disabled=true;
     try{const r=await request('/miss',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:question,lang,consent:true})});if(!r.ok)throw Error();share.textContent=core.ui[lang].shared;}
     catch{share.disabled=false;share.textContent=core.ui[lang].shareError;}
    },'cb-share');row.append(share);
   }
  }
  body.append(row);while(body.children.length>40)body.firstElementChild.remove();
  requestAnimationFrame(()=>{if(role==='bot')body.scrollTop=row.offsetTop-body.offsetTop-8;else body.scrollTop=body.scrollHeight;});
 }
 function renderTopics(){
  $('cbChips').replaceChildren(...core.categories.map(c=>button(c.label[lang],()=>{
   history.push({category:c.id});history=history.slice(-20);append('user',c.label[lang]);append('bot',core.category(c.id,lang));
  })));
 for(const id of ['hours','prices']){const f=core.faqs.find(x=>x.id===id);$('cbChips').append(button(f.label[lang],()=>send(id==='hours'?(lang==='es'?'horario':'hours'):(lang==='es'?'precio':'price'))));}
 }
 function repaint(){
  const t=core.ui[lang];panel.lang=lang;$('cbTitle').textContent=t.title;$('cbSubtitle').textContent=t.subtitle;$('cbClose').setAttribute('aria-label',t.close);$('cbReset').textContent=t.reset;$('cbSend').textContent=t.send;input.placeholder=t.placeholder;$('cbPrivacy').textContent=t.privacy;
  $('cbLanguages').setAttribute('aria-label',t.language);panel.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
  body.replaceChildren();append('bot',{text:t.hello,kind:'greeting'});
  for(const item of history){append('user',item.category?core.categories.find(c=>c.id===item.category).label[lang]:item.q);append('bot',item.category?core.category(item.category,lang):core.answer(item.q,lang,qa),item.q);}
  renderTopics();
 }
 function send(value){const q=String(value||input.value).trim();if(!q)return;input.value='';history.push({q});history=history.slice(-20);append('user',q);append('bot',core.answer(q,lang,qa),q);}
 function open(){panel.hidden=false;panel.classList.add('open');launcher.setAttribute('aria-expanded','true');repaint();$('cbClose').focus();}
 function close(){panel.hidden=true;panel.classList.remove('open');launcher.setAttribute('aria-expanded','false');launcher.focus();}
 launcher.addEventListener('click',event=>{if(suppressClick){suppressClick=false;event.preventDefault();return;}panel.hidden?open():close();});$('cbClose').addEventListener('click',close);
 $('cbReset').addEventListener('click',()=>{history=[];repaint();input.focus();});
 panel.querySelector('form').addEventListener('submit',e=>{e.preventDefault();send();});
 panel.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.lang;try{sessionStorage.setItem('preciseChatLanguage',lang);}catch{}repaint();}));
 panel.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
}
})();
