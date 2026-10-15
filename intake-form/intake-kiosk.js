/* A handoff guard, NOT authentication or an OS lock. Use iPad Guided Access. */
(() => {
  if(new URLSearchParams(location.search).get('kiosk')!=='1')return;
  document.body.classList.add('kiosk-mode');
  const KEY='precise_kiosk_pin_v1';let dirty=false,staffLeaving=false,failures=0,lockedUntil=0;
  const banner=document.createElement('div');banner.className='kiosk-banner';
  banner.innerHTML='<div><strong>Client intake · Focus mode</strong><span>Please return this iPad to the front desk when finished.</span></div><button class="pill outline" type="button">Staff controls</button>';
  document.body.prepend(banner);
  const read=()=>{try{return JSON.parse(sessionStorage.getItem(KEY)||'null')}catch{return null}};
  async function digest(pin,salt){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+pin)))).map(b=>b.toString(16).padStart(2,'0')).join('')}
  function clearClient(){if(typeof window.clearDraft==='function')window.clearDraft({disable:true});else sessionStorage.removeItem('precise_intake_draft');dirty=false;}
  document.addEventListener('input',e=>{if(!e.target.closest('.kiosk-shield'))dirty=true;});
  window.addEventListener('beforeunload',e=>{if(dirty&&!staffLeaving){e.preventDefault();e.returnValue='';}});
  document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(a&&!staffLeaving&&!a.getAttribute('href').startsWith('#')){e.preventDefault();openControls(false);}},true);
  const next=document.querySelector('[data-i18n="newForm"]');if(next){next.onclick=e=>{e.preventDefault();openControls(false)};}
  function openControls(setup,onDismiss){
    if(document.querySelector('.kiosk-shield'))return;
    const shield=document.createElement('div');shield.className='kiosk-shield';
    shield.innerHTML='<section class="kiosk-dialog" role="dialog" aria-modal="true" aria-labelledby="kiosk-title"><h2 id="kiosk-title">'+(setup?'Prepare the iPad':'Staff controls')+'</h2><p>'+(setup?'Choose a temporary six-digit staff PIN for this intake session. Use a unique PIN, not your account password.':'Enter the staff PIN to reset for the next client or return to the workspace.')+'</p><form><label for="kiosk-pin">'+(setup?'Create six-digit staff PIN':'Staff PIN')+'</label><input id="kiosk-pin" type="password" inputmode="numeric" pattern="[0-9]{6}" minlength="6" maxlength="6" autocomplete="off" required><p class="kiosk-error" role="alert"></p><div class="btn-row"><button class="pill rose" type="submit">'+(setup?'Prepare client form':'Unlock controls')+'</button>'+(setup?'':'<button class="pill outline" type="button" data-cancel>Back to form</button>')+'</div></form><p class="note">This PIN prevents accidental form resets. It does not lock Safari or the iPad. Before handoff, enable <strong>Settings → Accessibility → Guided Access</strong>, then triple-click the top or Home button while the intake form is open.</p></section>';
    if(setup)shield.querySelector('.kiosk-dialog').dataset.mode='prepare';
    const siblings=[...document.body.children];siblings.forEach(el=>{if(!['SCRIPT','STYLE'].includes(el.tagName))el.inert=true;});document.body.append(shield);
    const close=()=>{shield.remove();siblings.forEach(el=>el.inert=false);banner.querySelector('button').focus();};
    const cancel=()=>{close();onDismiss?.();};
    shield.querySelector('[data-cancel]')?.addEventListener('click',cancel);
    shield.addEventListener('keydown',e=>{if(e.key==='Escape'&&!setup)cancel();if(e.key==='Tab'){const nodes=[...shield.querySelectorAll('button,input')];const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
    shield.querySelector('input').focus();
    shield.querySelector('form').addEventListener('submit',async e=>{
      e.preventDefault();const error=shield.querySelector('.kiosk-error');const pin=shield.querySelector('input').value;
      if(Date.now()<lockedUntil){error.textContent='Please wait 30 seconds before trying again.';return;}
      if(!/^\d{6}$/.test(pin)){error.textContent='Enter exactly six digits.';return;}
      if(setup){const salt=crypto.randomUUID();try{sessionStorage.setItem(KEY,JSON.stringify({salt,hash:await digest(pin,salt)}));}catch{error.textContent='Session storage is unavailable. Please use a normal Safari window.';return;}clearClient();staffLeaving=true;location.replace('intake.html?kiosk=1');return;}
      const saved=read();if(!saved||await digest(pin,saved.salt)!==saved.hash){failures++;if(failures>=5){lockedUntil=Date.now()+30000;failures=0;}error.textContent='That PIN did not match.';shield.querySelector('input').value='';return;}
      failures=0;const form=shield.querySelector('form');form.innerHTML='<p>Only reset when the current client is finished. Starting again clears this device’s unfinished form.</p><div class="btn-row"><button class="pill rose" type="button" data-new>Start next client</button><button class="pill outline" type="button" data-continue>Keep current form</button><button class="pill outline" type="button" data-exit>Exit to workspace</button></div>';
      form.querySelector('[data-continue]').onclick=close;
      form.querySelector('[data-new]').onclick=()=>{clearClient();staffLeaving=true;location.replace('intake.html?kiosk=1');};
      form.querySelector('[data-exit]').onclick=()=>{clearClient();sessionStorage.removeItem(KEY);staffLeaving=true;location.replace('index.html');};
      form.querySelector('button').focus();
    });
  }
  banner.querySelector('button').onclick=()=>openControls(!read());
  window.addEventListener('precise:staff-controls',event=>openControls(!read(),event.detail?.onDismiss));
  if(!read())openControls(true);
})();
