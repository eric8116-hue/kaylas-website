const CONCERNS = {
  "head": [
    "Unwanted hair",
    "Peach fuzz",
    "Fine lines & wrinkles",
    "Acne & breakouts",
    "Uneven skin tone",
    "Dull-looking skin",
    "Enlarged pores",
    "Rough texture",
    "Sun damage / age spots",
    "Thin, sparse lashes",
    "Uneven or thin lips",
    "Stained or dull teeth",
    "Blackheads & clogged pores",
    "Freckles / moderate discoloration"
  ],
  "arms": [
    "Unwanted hair",
    "Ingrown hairs",
    "Rough or bumpy texture",
    "Sun damage",
    "Uneven skin tone",
    "Skin dullness"
  ],
  "torso": [
    "Unwanted hair",
    "Ingrown hairs",
    "Acne / body breakouts",
    "Uneven skin tone",
    "Rough texture",
    "Sun damage",
    "Skin dullness",
    "Back acne & congestion"
  ],
  "stomach": [
    "Unwanted hair",
    "Uneven skin tone",
    "Skin dullness",
    "Sun damage"
  ],
  "hips": [
    "Unwanted hair",
    "Ingrown hairs",
    "Uneven skin tone",
    "Skin dullness"
  ],
  "thighs": [
    "Unwanted hair",
    "Ingrown hairs",
    "Uneven skin tone",
    "Skin dullness / roughness",
    "Sun damage"
  ],
  "calves": [
    "Unwanted hair",
    "Ingrown hairs",
    "Rough, dry skin",
    "Skin dullness",
    "Uneven skin tone"
  ]
};
const ZONE_LABELS = {head:"Head / Face", arms:"Arms", torso:"Upper Torso / Chest", stomach:"Stomach", hips:"Hip Area", thighs:"Thighs", calves:"Calves & Feet"};

let state = { gender:'female', activeZone:null, concernsByZone:{}, hear:null };

function setGender(g){
state.gender = g;
document.getElementById('tgFemale').setAttribute('aria-pressed',String(g==='female'));
document.getElementById('tgMale').setAttribute('aria-pressed',String(g==='male'));
document.getElementById('tgFemale').classList.toggle('active', g==='female');
document.getElementById('tgMale').classList.toggle('active', g==='male');
document.getElementById('genderToggle').classList.toggle('is-male', g==='male');
document.getElementById('figFemale').style.display = g==='female' ? '' : 'none';
document.getElementById('figMale').style.display = g==='male' ? '' : 'none';
}

function paintFigure(){
document.querySelectorAll('.zone-btn').forEach(el => {
const z = el.dataset.zone;
const hasConcerns = state.concernsByZone[z] && state.concernsByZone[z].length > 0;
const isActive = z === state.activeZone;
el.setAttribute('aria-pressed',String(isActive));
const color = (hasConcerns || isActive) ? 'var(--fig-sel)' : 'var(--fig)';
el.querySelectorAll('circle,rect,path,ellipse').forEach(s => s.setAttribute('fill', color));
});
}

function toggleZone(zone){
state.activeZone = zone;
if (!state.concernsByZone[zone]) state.concernsByZone[zone] = [];
document.getElementById('panelPrompt').style.display = 'none';
const pc = document.getElementById('panelConcerns');
pc.style.display = 'flex';
document.getElementById('panelZoneName').textContent = ZONE_LABELS[zone];
renderConcerns(zone);
paintFigure();
document.getElementById('panelZoneName').focus();
}

function renderConcerns(zone){
const list = document.getElementById('concernList');
list.innerHTML = '';
CONCERNS[zone].forEach(c => {
const sel = state.concernsByZone[zone].includes(c);
const chip = document.createElement('button');
chip.type = 'button';
chip.setAttribute('aria-pressed',String(sel));
chip.className = 'concern-chip' + (sel ? ' selected' : '');
chip.onclick = () => toggleConcern(zone, c);
chip.innerHTML = `<span class="concern-check"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></span><span>${c}</span>`;
list.appendChild(chip);
});
}

function toggleConcern(zone, concern){
const arr = state.concernsByZone[zone];
const i = arr.indexOf(concern);
if (i === -1) arr.push(concern); else arr.splice(i, 1);
renderConcerns(zone);
const index = CONCERNS[zone].indexOf(concern);
document.getElementById('concernList').children[index].focus();
paintFigure();
updateContinue();
}

function updateContinue(){
const any = Object.values(state.concernsByZone).some(a => a.length > 0);
document.getElementById('selectNext').disabled = !any;
}

function goConfirm(){
const box = document.getElementById('confirmSummary');
box.innerHTML = '';
Object.keys(state.concernsByZone).forEach(zone => {
const c = state.concernsByZone[zone];
if (!c.length) return;
const g = document.createElement('div');
g.className = 'confirm-zone-group';
g.innerHTML = `<div class="confirm-zone-name">${ZONE_LABELS[zone]}</div><div class="confirm-tags">${c.map(x=>`<span class="confirm-tag">${x}</span>`).join('')}</div>`;
box.appendChild(g);
});
goScreen('confirm');
}

/* ═══════════════════ TREATMENT CATEGORIES ═══════════════════
Results are fixed to these 5 umbrella areas — never a sprawling list of
every individual procedure. Each lists the keyword "tags" that map it to
concern phrases in the CONCERNS object above (matched as substrings,
case-insensitive) — add a tag here any time new concern wording should
trigger this category. Every card gets both a Book Now and a Learn More
link, no exceptions, so the two never drift out of sync again. */
const CATEGORIES = [
{ id:'electrolysis', name:'Electrolysis', page:'/services-hair-removal.html#electrolysis',
  blurb:'Reaches hair a laser can\'t — blonde, red, grey, fine — by sending current directly into the follicle. Electrolysis can permanently remove unwanted hair, including light-colored hairs.',
  expect:'Multiple sessions over months, since hair grows in three separate cycles.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/VQT3OY4IK4KP4ITGJWXWGQ5Z',
  tags:['hair','ingrown'] },
{ id:'laser', name:'Laser Hair Removal', page:'/services-hair-removal.html',
  blurb:'A concentrated beam of light targets pigment in the hair follicle, to reduce future hair growth. Results vary. We\'ll confirm the right method for your hair and skin type at your free consultation.',
  expect:'A series of sessions is usually needed. Your consultation covers timing, expected results, and aftercare.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services',
  tags:['hair','ingrown','chafing'] },
/* Dermaplaning is face-only by nature — a blade treatment for the facial
   surface. onlyZones keeps it from ever being suggested for leg or torso
   hair, which would read as nonsense to a client. "Peach fuzz" appears
   only on the face's concern list and carries no other tag, so selecting
   it returns this card and nothing else. */
{ id:'dermaplaning', name:'Dermaplaning Facial', page:'/services-facials.html#dermaplaning',
  blurb:'A skin treatment where a small, sharp blade is used to gently scrape off dead skin cells and fine facial hair — peach fuzz. Benefits: better product absorption, deep exfoliation, softer fine lines and wrinkles, and noticeably smoother makeup application.',
  expect:'Your consultation covers suitability, possible irritation, and aftercare. Results vary.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/Y72LAGIZQI2WA6U3O6EHYON4',
  onlyZones:['head'],
  tags:['peach fuzz','unwanted hair'] },
{ id:'facials', name:'Facials', page:'/services-facials.html',
  blurb:'Facials cover a lot of ground — texture, tone, congestion, hydration, fine lines and wrinkles. We offer HydraFacial, chemical peels, microneedling, dermaplaning, acne facials, anti-aging facials, and back facials — we\'ll confirm which one is the right fit at your free consultation.',
  expect:'Timing and recovery depend on the treatment. Peels and microneedling may require aftercare and healing time.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services',
  tags:['acne','breakout','dull','tired','pore','blackhead','uneven skin','redness','congestion',
        'wrinkle','fine line','hyperpigmentation','dark spot','dark patch','sun damage','age spot',
        'freckle','discoloration','rough','dry skin','elasticity','back acne','texture'] },
{ id:'lash-lift', name:'Lash Lift', page:'/services-beautification.html#lash-lift',
  blurb:'A lash lift changes the curl of your natural lashes. Discuss the look you want and whether the service suits your lashes at a consultation.',
  expect:'The team will explain preparation, aftercare, and how long your result may last.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/URGO3WEIP2ODMHHXJDVFZPTE',
  onlyZones:['head'], tags:['lashes'] },
{ id:'lip-blushing', name:'Lip Blushing', page:'/services-beautification.html#lip-blushing',
  blurb:'Lip blushing deposits cosmetic pigment to add color and definition to the lips. A consultation covers your preferred shade and expected result.',
  expect:'Discuss suitability, healing, aftercare, and possible touch-ups before booking.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/QY7N47DI3HBAGCKQL7AWZ2N6',
  onlyZones:['head'], tags:['lips'] },
{ id:'teeth-whitening', name:'Teeth Whitening', page:'/services-beautification.html#teeth-whitening',
  blurb:'Teeth whitening can lighten some stains on natural teeth. Results depend on the cause of discoloration.',
  expect:'Ask your dentist about suitability, especially if you have sensitive teeth, fillings, crowns, or gum concerns.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/WTPSHKZCRHFO6LQ3U7TOORGC',
  tags:['teeth','stained'] },

];

function matchCategories(){
const selected = [];
Object.keys(state.concernsByZone).forEach(zone => {
state.concernsByZone[zone].forEach(c => selected.push({zone, concern:c}));
});
const results = CATEGORIES.map(t => {
const matches = selected.filter(s =>
  (!t.onlyZones || t.onlyZones.includes(s.zone)) &&
  t.tags.some(tag => s.concern.toLowerCase().includes(tag)));
return Object.assign({}, t, {matches});
}).filter(t => t.matches.length > 0);
/* Sort is stable, so an equal number of matches falls back to the order
   of CATEGORIES above — which is why Electrolysis is listed first there. */
results.sort((a,b) => b.matches.length - a.matches.length);
return results;
}

function goResults(){
const results = matchCategories();
const list = document.getElementById('resultsList');
list.innerHTML = '';
if (!results.length){
list.innerHTML = '<div class="result-card"><div class="result-name">Let\'s talk it through</div><div class="result-blurb">Your combination of concerns is specific enough that we\'d rather look at it in person. Book a free consultation and we\'ll build a plan together.</div></div>';
} else {
results.forEach(t => {
const tagsHtml = t.matches.map(m => `<span class="result-tag">${m.concern}</span>`).join('');
const card = document.createElement('div');
card.className = 'result-card';
card.innerHTML = `<div class="result-name">${t.name}</div><div class="result-blurb">${t.blurb}</div><div class="result-expect"><b>What to expect:</b> ${t.expect}</div><div class="result-tags">${tagsHtml}</div><div class="result-actions"><a class="btn btn-primary" href="${t.bookUrl}" target="_blank" rel="noopener">Book Now</a><a class="btn btn-secondary" href="${t.page}">Learn More</a></div>`;
list.appendChild(card);
});
}
goScreen('results');
}

const PROGRESS = {select:33, confirm:66, results:100};
function goScreen(name){
document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
const screen = document.getElementById('screen-'+name);
screen.classList.add('active');
screen.querySelector('h1,h2').focus({preventScroll:true});
document.getElementById('progressFill').style.width = PROGRESS[name] + '%';
window.scrollTo({top:0, behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
}
document.querySelectorAll('.zone-btn').forEach(zone=>zone.addEventListener('keydown',event=>{
if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleZone(zone.dataset.zone);}
}));
