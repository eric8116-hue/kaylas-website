(() => {
  const PROMOTIONS_DISABLED=true;
  if(PROMOTIONS_DISABLED)return;
  const card=document.querySelector('#promoCard');
  if(!card)return;
  card.classList.add('promo-card');
  const close=card.querySelector('.promo-x');close?.classList.add('promo-close');
  const cta=card.querySelector('#promoCta');cta?.classList.add('promo-cta');
  card.querySelector('.promo-skip')?.classList.add('promo-dismiss');
  const lang=document.documentElement.lang==='es'?'es':'en';
  const preview=new URLSearchParams(location.search).has('preview');
  const local=['127.0.0.1','localhost'].includes(location.hostname);
  const endpoint=local?'http://127.0.0.1:8818/api/offer':'https://precise-laser-crm.pages.dev/api/offer';
  const apply=offer=>{
    if(!offer.active)return;
    card.classList.toggle('has-image',!!offer.imageUrl);card.classList.toggle('is-background',offer.layout==='background');card.classList.toggle('has-brand',offer.showHeader!==false);card.style.background=offer.layout==='background'?(offer.imageUrl?'#16302e':'linear-gradient(140deg,#1e8a85,#14615d)'):'';card.style.setProperty('--offer-ink',/^#[\da-f]{6}$/i.test(offer.textColor||'')?offer.textColor:'#fff');
    let image=card.querySelector('.promo-image');if(!image){image=document.createElement('div');image.className='promo-image';image.id='promoImage';card.prepend(image);}image.hidden=!offer.imageUrl;if(offer.imageUrl)image.style.backgroundImage=`url("${new URL(offer.imageUrl,endpoint)}")`;
    let bullets=card.querySelector('.promo-bullets');if(!bullets){bullets=document.createElement('ul');bullets.className='promo-bullets';card.querySelector('.promo-body')?.prepend(bullets);}bullets.replaceChildren(...(offer.bullets||[]).slice(0,5).map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));bullets.hidden=!bullets.children.length;
    let price=card.querySelector('.promo-price');if(!price){price=document.createElement('strong');price.className='promo-price';card.querySelector('.promo-body')?.prepend(price);}price.textContent=offer.price||'';price.hidden=!offer.price;
  };
  const demo={active:true,layout:'side',showHeader:true,bullets:[],price:'',textColor:'#ffffff'};
  fetch(`${endpoint}?lang=${lang}`,{cache:'no-store'}).then(r=>r.ok?r.json():{active:false}).then(offer=>{if(!offer.active&&preview&&local)offer=demo;apply(offer);}).catch(()=>{if(preview&&local)apply(demo);});
})();
