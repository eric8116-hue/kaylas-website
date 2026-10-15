/* Anchored mobile select menus. Original selects remain the form data source. */
(() => {
  if (window.preciseAlignedSelects) return;
  window.preciseAlignedSelects = true;
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'aligned-selects.css?v=2'; document.head.append(css);
  const mobile = matchMedia('(max-width:700px), (pointer:coarse)');
  const seen = new WeakSet(); let active, serial = 0;
  function close(focus = false) {
    if (!active) return;
    const {button,menu} = active; active = null;
    button.setAttribute('aria-expanded','false'); menu.remove();
    if (focus) button.focus();
  }
  function position() {
    if (!active) return;
    const {button,menu} = active, rect = button.getBoundingClientRect();
    const viewport = window.visualViewport;
    const leftEdge = viewport?.offsetLeft || 0, topEdge = viewport?.offsetTop || 0;
    const width = viewport?.width || innerWidth, height = viewport?.height || innerHeight;
    const menuWidth = Math.min(rect.width, width - 16);
    const below = topEdge + height - rect.bottom - 12, above = rect.top - topEdge - 12;
    menu.style.width = menuWidth + 'px';
    menu.style.left = Math.max(leftEdge + 8, Math.min(rect.left + rect.width / 2 - menuWidth / 2, leftEdge + width - menuWidth - 8)) + 'px';
    const upward = below < 150 && above > below;
    menu.style.maxHeight = Math.max(80, Math.min(320, upward ? above : below)) + 'px';
    menu.style.top = (upward ? rect.top - 5 - menu.getBoundingClientRect().height : rect.bottom + 5) + 'px';
  }
  function enhance(select) {
    if (seen.has(select) || select.multiple || select.size > 1) return;
    seen.add(select);
    let wrap = select.parentElement;
    if (!wrap.classList.contains('aligned-select')) {
      wrap = document.createElement('span'); wrap.className = 'aligned-select'; select.before(wrap); wrap.append(select);
    } else wrap.querySelectorAll('.aligned-select-trigger').forEach(el => el.remove());
    const button = document.createElement('button'); button.type = 'button'; button.className = 'aligned-select-trigger';
    button.setAttribute('aria-haspopup','listbox'); button.setAttribute('aria-expanded','false');
    wrap.append(button);
    const label = select.labels?.[0];
    const labelText = select.getAttribute('aria-label') || (select.getAttribute('aria-labelledby') || '').split(/\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ').trim() || (label ? [...label.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').trim() : '') || 'Select option';
    function sync() {
      const selected = select.selectedOptions[0];
      button.textContent = (selected?.textContent || 'Select option') + ' ▾';
      button.setAttribute('aria-label', labelText + ': ' + (selected?.textContent || 'Select option'));
      button.disabled = select.disabled;
      select.tabIndex = mobile.matches ? -1 : 0;
      select.setAttribute('aria-hidden', mobile.matches ? 'true' : 'false');
    }
    // Existing forms assign .value directly while loading saved records.
    for (const prop of ['value','selectedIndex']) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,prop);
      Object.defineProperty(select,prop,{configurable:true,get(){return descriptor.get.call(this);},set(value){descriptor.set.call(this,value);sync();}});
    }
    select.addEventListener('change',sync); select.addEventListener('input',sync);
    select.addEventListener('invalid', () => { if(mobile.matches) button.focus(); });
    new MutationObserver(sync).observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected','label']});
    mobile.addEventListener('change',sync);
    button.addEventListener('click', () => {
      if(active?.button === button) {close();return;} close();
      const menu = document.createElement('div'); menu.className = 'aligned-select-menu'; menu.id = 'aligned-menu-' + ++serial;
      menu.setAttribute('role','listbox'); menu.setAttribute('aria-label',labelText);
      button.setAttribute('aria-controls',menu.id); button.setAttribute('aria-expanded','true');
      [...select.children].forEach(child => {
        const options = child.tagName === 'OPTGROUP' ? [...child.children] : [child];
        if(child.tagName === 'OPTGROUP') {const group = document.createElement('div');group.className='aligned-select-group';group.textContent=child.label;menu.append(group);}
        options.forEach(option => {
          if(option.tagName !== 'OPTION' || option.hidden) return;
          const row = document.createElement('button'); row.type='button';row.className='aligned-select-option';row.setAttribute('role','option');row.textContent=option.textContent;
          row.setAttribute('aria-selected',String(option.selected));row.disabled=option.disabled || child.disabled;
          row.addEventListener('click', () => {select.value=option.value;close(true);select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));});
          menu.append(row);
        });
      });
      document.body.append(menu); active={select,button,menu};
      if(typeof menu.showPopover === 'function') {menu.setAttribute('popover','manual');menu.showPopover();}
      position();
      (menu.querySelector('[aria-selected="true"]:not(:disabled)') || menu.querySelector('button:not(:disabled)'))?.focus({preventScroll:true});
      menu.addEventListener('keydown',event => {
        if(event.key==='Escape'){event.preventDefault();close(true);return;}
        if(event.key==='Tab'){close();return;}
        const rows=[...menu.querySelectorAll('button:not(:disabled)')], index=rows.indexOf(document.activeElement);
        let next;
        if(event.key==='ArrowDown') next=rows[(index+1)%rows.length];
        if(event.key==='ArrowUp') next=rows[(index-1+rows.length)%rows.length];
        if(event.key==='Home') next=rows[0];
        if(event.key==='End') next=rows.at(-1);
        if(event.key.length===1) next=rows.slice(index+1).concat(rows.slice(0,index+1)).find(row=>row.textContent.toLowerCase().startsWith(event.key.toLowerCase()));
        if(next){event.preventDefault();next.focus();}
      });
    });
    select.form?.addEventListener('reset', () => setTimeout(sync,0)); sync();
  }
  const scan = () => document.querySelectorAll('select').forEach(enhance);
  scan(); new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('pointerdown', event => {if(active && !active.menu.contains(event.target) && !active.button.contains(event.target)) close();},true);
  document.addEventListener('scroll',position,true); window.addEventListener('resize',position);
  window.visualViewport?.addEventListener('resize',position); window.visualViewport?.addEventListener('scroll',position);
  mobile.addEventListener('change',()=>close());
})();
