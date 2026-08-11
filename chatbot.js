/* ═══════════════════════════════════════════════════════════════════
   PRECISE — SITE CHAT WIDGET
   Single self-contained file: knowledge base + custom instructions
   (both editable below) plus the widget engine. Include on any page
   with:  <script src="chatbot.js" defer></script>
   ═══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";

/* ═══════════════════ EDITABLE: CUSTOM INSTRUCTIONS ═══════════════════
   Add canned answers here for anything you want the bot to say a
   specific way, or promos/notes you always want mentioned. These are
   checked FIRST, before anything else, so they always win.
   Format:
   { triggers:['word or phrase','another phrase'], reply:'Exact text to show.' }
   ═══════════════════════════════════════════════════════════════════ */
const CUSTOM_INSTRUCTIONS = [
  // Example — delete the // to activate, edit the text, add more as needed:
  // { triggers:['gift card','gift certificate'], reply:'Yes — gift cards are available in any amount. Call us at (631) 923-1174 and we can set one up for you.' }
];

/* ═══════════════════ EDITABLE: TREATMENT KNOWLEDGE BASE ═══════════════════
   Same data as the self-assessment tool. "tags" are the words/phrases
   that trigger this treatment when someone mentions them in chat. */
const TREATMENTS = [
{ id:'laser', name:'Laser Hair Removal', page:'services-hair-removal.html',
  blurb:'A concentrated beam of light targets pigment in the hair follicle, damaging it so future growth slows — up to 95% permanent reduction on most skin types.',
  expect:'6–12 sessions typical, spaced a few weeks apart to catch hair in every growth cycle. No downtime.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services',
  tags:['laser hair','laser','unwanted hair','shaving','waxing','ingrown','facial hair'] },
{ id:'electrolysis', name:'Electrolysis', page:'services-hair-removal.html#electrolysis',
  blurb:'Reaches hair a laser can\'t — blonde, red, grey, fine — by sending current directly into the follicle. The only FDA-approved method for permanent removal of all hair types.',
  expect:'Multiple sessions over months, since hair grows in three separate cycles.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/VQT3OY4IK4KP4ITGJWXWGQ5Z',
  tags:['electrolysis','grey hair','gray hair','blonde hair'] },
/* Dermaplaning listed a second time under Hair Removal as the temporary option.
   It also appears in the Rejuvenating Facials category as a skin treatment. */
{ id:'dermaplaning-hr', name:'Dermaplaning (temporary)', page:'services-facials.html',
  blurb:'A skin treatment that uses an exfoliating blade to remove dead skin cells and vellus hair — "peach fuzz" — from your face. Dermaplaning aims to make your skin\'s surface smooth, youthful, and radiant.',
  expect:'Immediate results with no downtime. Temporary, unlike laser and electrolysis.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/Y72LAGIZQI2WA6U3O6EHYON4',
  tags:['temporary hair removal'] },
{ id:'hydrafacial', name:'HydraFacial', page:'services-facials.html',
  blurb:'A four-step medical-grade resurfacing treatment — cleanse, exfoliate, extract, hydrate — that detoxifies pores and infuses the skin with serums.',
  expect:'About 30–45 minutes, no downtime, visible glow immediately after.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/RZI72QMTVG4DMSSC4562SXMI',
  tags:['hydrafacial','hydra facial','pores','blackhead','dull skin','congestion'] },
{ id:'hyperpig', name:'Hyperpigmentation Correction', page:'services-beautification.html',
  blurb:'Corrects uneven skin tone and diminishes hyperpigmentation anywhere on the body, including delicate areas, without disturbing natural pH.',
  expect:'Gradual improvement over a short course of sessions.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/6HVGLGVJQM6YTWY5WWZUSVAK',
  tags:['hyperpigmentation','dark spot','dark patch','discoloration','uneven skin tone'] },
{ id:'peels', name:'Chemical Peels', page:'services-facials.html',
  blurb:'A chemical solution exfoliates and peels the top layer of skin — used for age spots, fine lines and wrinkles, freckles, and moderate discoloration.',
  expect:'Some visible peeling over the following days as new skin surfaces. Sun protection matters more than usual afterward.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/Y2EVHTJXMZDIKJFXQEHIT6KN',
  tags:['chemical peel','peel','wrinkle','fine line','sun damage','age spot','freckle','rough texture'] },
{ id:'microneedling', name:'Microneedling', page:'services-facials.html',
  blurb:'Generates new collagen and skin tissue for smoother, firmer, more toned skin.',
  expect:'Mild redness for a day or so afterward, similar to a light sunburn, as the skin rebuilds collagen.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/K7OVRV2ARB7A66TDDDYUY2VQ',
  tags:['microneedling','collagen','skin texture','elasticity'] },
{ id:'dermaplaning', name:'Dermaplaning', page:'services-facials.html',
  blurb:'An exfoliating blade removes dead skin cells and peach fuzz, instantly brightening and smoothing the surface.',
  expect:'Immediate results, no downtime — a popular pre-event treatment for flawless makeup application.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/Y72LAGIZQI2WA6U3O6EHYON4',
  tags:['dermaplaning','peach fuzz','exfoliate'] },
{ id:'acne-facial', name:'Acne Facial', page:'services-facials.html',
  blurb:'Focuses on extractions for blocked pores, releasing built-up oil and clearing out congestion.',
  expect:'Some redness immediately after extractions, settling within a day.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/USWYMBELIX5KWS2DG6MT63ZP',
  tags:['acne','breakout','blackhead','clogged pore'] },
{ id:'anti-aging', name:'Anti-Aging Facial', page:'services-facials.html',
  blurb:'Generates new collagen and skin tissue for smoother, firmer, more toned skin.',
  expect:'A relaxing, non-invasive session with a visible glow immediately after.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/2U7OZUOMOFXK5T3B4OBJUCQC',
  tags:['anti-aging','anti aging','wrinkle','fine line'] },
{ id:'back-facial', name:'Back Facial', page:'services-facials.html',
  blurb:'A facial for your back — cleanses, exfoliates, and hydrates, leaving skin velvety smooth.',
  expect:'No downtime; skin may look slightly flushed for a few hours after extractions.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/7FGWCAYW4NYGAHSJU4NYMSEF',
  tags:['back facial','back acne','bacne'] },
{ id:'lash-lift', name:'Keratin Lash Lift', page:'services-beautification.html',
  blurb:'Curls, lifts, and tints your own lashes for a brighter, more open look — nothing attached, nothing extended.',
  expect:'Lasts 4–6 weeks, the natural life cycle of an eyelash. No mascara needed afterward.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/URGO3WEIP2ODMHHXJDVFZPTE',
  tags:['lash lift','lashes','eyelash'] },
{ id:'teeth-whitening', name:'Teeth Whitening', page:'services-beautification.html',
  blurb:'Professional whitening removes persistent stains and brightens your smile.',
  expect:'Instant results, no downtime.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/WTPSHKZCRHFO6LQ3U7TOORGC',
  tags:['teeth whitening','whitening','stained teeth','yellow teeth','stained'] },
{ id:'lip-blushing', name:'Lip Blushing (PMU)', page:'services-beautification.html',
  blurb:'Semi-permanent pigment deposited in the lips to correct tone and create the look of fuller lips without fillers.',
  expect:'Touch-ups recommended every two years.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/QY7N47DI3HBAGCKQL7AWZ2N6',
  tags:['lip blushing','lip pmu','fuller lips','lip tattoo'] },
{ id:'tooth-gems', name:'Swarovski Tooth Gems', page:'services-beautification.html',
  blurb:'A fashion trend that has added a new meaning to your smile.',
  expect:'Quick, painless application with no downtime.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/ANYILHQJ35FQTCESRFG2C2SI',
  tags:['tooth gem','tooth gems','teeth gem'] },
{ id:'sauna', name:'Infrared Sauna', page:'services-detox.html',
  blurb:'Infrared heat supports detoxification, circulation, pain relief, and stress reduction across six wellness programs.',
  expect:'A single session runs 30–45 minutes in a private room. Sweating is the point — hydrate well beforehand.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/DEWX6Q3C7S7IYKKQZ72AC5NT',
  tags:['infrared sauna','sauna','circulation','joint pain','muscle soreness','inflammation','detox','immunity','stress','fatigue','low energy'] },
{ id:'colonics', name:'Colon Hydrotherapy', page:'services-detox.html',
  blurb:'A gentle, thorough cleanse — warm purified water clears accumulated waste, gas, and toxins to support digestion and immunity.',
  expect:'A private, one-on-one session with a trained technician. Most people feel lighter within a day.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/ND5YRLKZGKZRZN2K3UR6NBT4',
  tags:['colon hydrotherapy','colonic','colonics','bloating','digestion','constipation'] },
{ id:'bodywrap', name:'FIT Bodywrap', page:'services-detox.html',
  blurb:'A full-body far infrared heat wrap — contactless and self-controlled — that supports circulation, muscle recovery, and cellulite appearance.',
  expect:'A relaxing, cocoon-style session. Effects on weight are temporary and work best paired with diet and exercise.',
  bookUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services/4MQ75TQVR4E34LLS6W7WZYRN',
  tags:['fit bodywrap','body wrap','cellulite','weight loss','water retention'] }
];

/* ═══════════════════ EDITABLE: SERVICE CATEGORIES ═══════════════════
   The four buttons shown when the chat opens. Tapping one shows every
   treatment in that category (pulled from TREATMENTS above) in one go. */
const CATEGORIES = [
{ id:'hair-removal', label:'Hair Removal Services', page:'services-hair-removal.html',
  intro:'Two permanent options depending on your hair and skin — including the only FDA-approved method for every hair color — plus one temporary treatment.',
  triggers:['hair removal service','hair removal services','remove hair','hair removal'],
  treatmentIds:['laser','electrolysis','dermaplaning-hr'] },
{ id:'detox', label:'Detoxification Services', page:'services-detox.html',
  intro:'Three whole-body treatments supporting circulation, digestion, hydration, and recovery.',
  triggers:['detox service','detox services','detoxification service','detoxification services'],
  treatmentIds:['sauna','colonics','bodywrap'] },
{ id:'facials', label:'Rejuvenating Facials', page:'services-facials.html',
  intro:'Seven treatments aimed at texture, tone, congestion, hydration, and fine lines and wrinkles.',
  triggers:['rejuvenating facial','facial service','what facials','facials do you','facial menu','facial options'],
  treatmentIds:['hydrafacial','peels','microneedling','dermaplaning','acne-facial','anti-aging','back-facial'] },
{ id:'beauty', label:'Precise Beauty Enhancements', page:'services-beautification.html',
  intro:'The finishing details — lashes, lips, teeth, and tone, done conservatively.',
  triggers:['beauty enhancement','beautification','precise beauty','what beauty','beauty options'],
  treatmentIds:['lash-lift','teeth-whitening','lip-blushing','hyperpig','tooth-gems'] }
];

/* ═══════════════════ EDITABLE: GENERAL SITE INFO ═══════════════════ */
const GENERAL = [
{ id:'hours', triggers:['hour','open today','close','same day','same-day','availability'],
  a:'By appointment, same-day appointments are available. Open seven days a week.' },
{ id:'contact', triggers:['phone number','call you','email address','contact you','reach you','e-mail'],
  a:'You can call us at (631) 923-1174 or email Preciselaserspa@gmail.com.' },
{ id:'location', triggers:['where are you','location','address','directions','parking','babylon'],
  a:'We\'re located at 626 Deer Park Ave, Babylon, NY 11702.',
  link:{label:'Get Directions', url:'https://www.google.com/maps/search/?api=1&query=626+Deer+Park+Ave+Babylon+NY+11702'} },
{ id:'consult', triggers:['consultation','how much','price','pricing','cost','package'],
  a:'Every treatment starts with a free, no-pressure consultation — that\'s where we look at your specific situation and give you honest pricing and a plan, rather than guessing here.' },
{ id:'services-overview', triggers:['what do you offer','what services do you have','full menu','list of services','everything you offer'],
  a:'We offer four categories: hair removal (laser & electrolysis), detoxification (infrared sauna, colon hydrotherapy, FIT Bodywrap), rejuvenating facials (HydraFacial, peels, microneedling, and more), and beautification (lash lift, teeth whitening, lip blushing, and more).' },
{ id:'assessment', triggers:['assessment','which treatment is right','not sure what i need','not sure which'],
  a:'Try our free self-assessment — tap where it bothers you and we\'ll match you to the right treatments.',
  link:{label:'Take the Assessment', url:'precise-self-assessment-v2.html'} },
{ id:'reviews', triggers:['review','rating','reputation'],
  a:'We\'re rated 5.0 stars from 300+ Google reviews.',
  link:{label:'Read Reviews', url:'index.html#reviews'} }
];

const BOOKING = { triggers:['book','appointment','schedule','reserve','sign up','set up a time'],
  a:'You can book directly online, or call and we\'ll get you set up.' };

const SMALLTALK = [
{ triggers:['hello','hi there','hey','good morning','good afternoon','good evening'],
  a:'Hi! I can point you to the right treatment or answer questions about Precise. What\'s on your mind?' },
{ triggers:['thank you','thanks'], a:'You\'re welcome! Anything else I can help with?' },
{ triggers:['bye','goodbye'], a:'Take care — we hope to see you soon!' }
];

const GENERAL_BOOK_URL = 'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services';
const PHONE = 'tel:6319231174';

/* ═══════════════════ MATCHING ENGINE ═══════════════════ */
function norm(s){ return (s || '').toLowerCase(); }
function treatmentById(id){ return TREATMENTS.find(t => t.id === id); }

function tagHits(text, tags){
  const t = norm(text);
  let hits = 0;
  tags.forEach(tag => {
    const lc = tag.toLowerCase();
    if (lc.indexOf(' ') === -1){
      // word-boundary at the start, optional plural/verb suffix at the end
      // (so "hour" also matches "hours", "joint" also matches "joints", etc.)
      const re = new RegExp('\\b' + lc.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '(?:s|es|ing|ed)?\\b', 'i');
      if (re.test(t)) hits++;
    } else if (t.includes(lc)){
      hits++;
    }
  });
  return hits;
}

function findReply(message){
  const text = norm(message);

  // 1. custom instructions always win
  for (const ci of CUSTOM_INSTRUCTIONS){
    if (tagHits(text, ci.triggers) > 0) return { text: ci.reply };
  }

  // 2. small talk
  for (const s of SMALLTALK){
    if (tagHits(text, s.triggers) > 0) return { text: s.a };
  }

  // 3. direct booking intent
  if (tagHits(text, BOOKING.triggers) > 0){
    return { text: BOOKING.a, book:true };
  }

  // 4. score treatments + general + categories together, take best.
  // Order matters only for tie-breaks: specific treatment answers win
  // over generic FAQ answers, which win over a whole-category browse.
  const treatScored = TREATMENTS.map(t => ({ kind:'treatment', item:t, score: tagHits(text, t.tags) }));
  const generalScored = GENERAL.map(g => ({ kind:'general', item:g, score: tagHits(text, g.triggers) }));
  const catScored = CATEGORIES.map(c => ({ kind:'category', item:c, score: tagHits(text, c.triggers) }));
  const best = treatScored.concat(generalScored, catScored).filter(x => x.score > 0).sort((a,b) => b.score - a.score)[0];

  if (!best){
    return { text:'I don\'t have a specific answer for that in what\'s on our site — but our team can help directly.', fallback:true };
  }
  if (best.kind === 'category'){
    return { category: best.item };
  }
  if (best.kind === 'general'){
    return { text: best.item.a, link: best.item.link };
  }
  const t = best.item;
  return { text: `${t.name} — ${t.blurb} What to expect: ${t.expect}`, treatment:t };
}

/* ═══════════════════ WIDGET UI ═══════════════════ */
function escapeHtml(s){
  return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

const CSS = `
/* keep the rail's teal gradient — only strip the default <button> chrome.
   Rounded-square shape (not a circle) so the bot is distinguishable from
   the other four rail widgets at a glance. */
.cb-btn{border:none; padding:0; cursor:pointer; font:inherit; color:#fff; -webkit-appearance:none; appearance:none; border-radius:16px}
.cb-btn svg{stroke:#fff; fill:none}
@media (max-width:640px){ .cb-btn{border-radius:13px} }
.cb-panel{position:fixed; right:16px; bottom:24px; width:360px; max-width:calc(100vw - 24px); max-height:min(560px,calc(100vh - 100px)); background:var(--paper); border:1px solid var(--line); border-radius:20px; box-shadow:0 30px 60px -14px rgba(20,97,93,.35); z-index:950; display:none; flex-direction:column; overflow:hidden; font-family:'Inter',system-ui,sans-serif}
.cb-panel.open{display:flex; animation:cbFade .22s ease}
@keyframes cbFade{from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:translateY(0)}}
.cb-head{background:linear-gradient(135deg,var(--teal),var(--teal-deep)); color:#fff; padding:16px 18px; display:flex; align-items:center; justify-content:space-between}
.cb-head-title{font-family:'Cormorant Garamond',serif; font-style:italic; font-weight:600; font-size:19px}
.cb-head-sub{font-size:11.5px; opacity:.85; margin-top:1px}
.cb-close{background:none; border:none; color:#fff; opacity:.85; cursor:pointer; padding:4px}
.cb-close:hover{opacity:1}
.cb-body{flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; background:var(--sand); position:relative}
.cb-msg{max-width:86%; padding:10px 14px; border-radius:14px; font-size:13.5px; line-height:1.5}
.cb-msg.bot{background:var(--paper); border:1px solid var(--line); color:var(--ink); align-self:flex-start; border-bottom-left-radius:4px}
.cb-msg.user{background:linear-gradient(135deg,var(--teal-deep),var(--teal-darker)); color:#fff; align-self:flex-end; border-bottom-right-radius:4px}
.cb-msg-link{display:inline-block; margin-top:8px; font-size:12.5px; font-weight:700; color:var(--teal-deep); text-decoration:underline}
.cb-msg-actions{display:flex; gap:8px; flex-wrap:wrap; margin-top:10px}
.cb-msg-actions a{font-size:12px; font-weight:700; padding:8px 13px; border-radius:99px; text-decoration:none}
.cb-msg-actions .cb-book{background:var(--teal); color:#fff}
.cb-msg-actions .cb-learn{background:var(--teal-light); color:var(--teal-deep)}
.cb-chips{display:flex; flex-wrap:wrap; gap:6px; padding:0 16px 12px}
.cb-chip{background:var(--paper); border:1px solid var(--line); color:var(--ink-soft); font-size:11.5px; font-weight:600; padding:7px 12px; border-radius:99px; cursor:pointer; transition:border-color .15s, color .15s}
.cb-chip:hover{border-color:var(--teal); color:var(--teal-deep)}
.cb-foot{border-top:1px solid var(--line); padding:12px; display:flex; gap:8px; background:var(--paper)}
.cb-input{flex:1; border:1.5px solid var(--line); border-radius:11px; padding:11px 13px; font-size:13.5px; font-family:inherit}
.cb-input:focus{outline:none; border-color:var(--teal)}
.cb-send{background:linear-gradient(135deg,var(--teal-deep),var(--teal-darker)); color:#fff; border:none; border-radius:11px; width:42px; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0}
.cb-bookbar{padding:10px 12px; background:var(--teal-light); text-align:center}
.cb-bookbar a{font-size:12.5px; font-weight:700; color:var(--teal-deep)}
@media (max-width:480px){ .cb-panel{right:12px; bottom:80px; width:calc(100vw - 24px)} }
`;

function buildPanel(){
  const panel = document.createElement('div');
  panel.className = 'cb-panel';
  panel.id = 'cbPanel';
  panel.innerHTML = `
    <div class="cb-head">
      <div><div class="cb-head-title">Chat with Precise</div><div class="cb-head-sub">Usually replies instantly</div></div>
      <button class="cb-close" id="cbClose" aria-label="Close chat"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
    </div>
    <div class="cb-body" id="cbBody"></div>
    <div class="cb-chips" id="cbChips"></div>
    <div class="cb-bookbar"><a href="${GENERAL_BOOK_URL}" target="_blank" rel="noopener">Book an appointment →</a></div>
    <div class="cb-foot">
      <input class="cb-input" id="cbInput" type="text" placeholder="Ask a question..." maxlength="240">
      <button class="cb-send" id="cbSend" aria-label="Send"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/></svg></button>
    </div>`;
  return panel;
}

function categoryHtml(cat){
  let html = `<div style="font-weight:700; color:var(--teal-deep); margin-bottom:5px">${escapeHtml(cat.label)}</div>`;
  html += `<div style="margin-bottom:4px">${escapeHtml(cat.intro)}</div>`;
  cat.treatmentIds.forEach(id => {
    const t = treatmentById(id);
    if (!t) return;
    html += `<div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--line)">`;
    html += `<div style="font-weight:700; margin-bottom:3px">${escapeHtml(t.name)}</div>`;
    html += `<div style="margin-bottom:8px">${escapeHtml(t.blurb)}</div>`;
    html += `<div class="cb-msg-actions"><a class="cb-book" href="${t.bookUrl}" target="_blank" rel="noopener">Book ${escapeHtml(t.name)}</a></div>`;
    html += `</div>`;
  });
  html += `<div style="margin-top:14px"><a class="cb-msg-link" href="${cat.page}">See full ${escapeHtml(cat.label)} page →</a></div>`;
  return html;
}

function addMsg(body, role, data){
  const div = document.createElement('div');
  div.className = 'cb-msg ' + role;
  if (role === 'user'){
    div.textContent = data;
  } else if (data.category){
    div.style.maxWidth = '96%';
    div.innerHTML = categoryHtml(data.category);
  } else {
    let html = escapeHtml(data.text);
    if (data.link){
      html += `<div><a class="cb-msg-link" href="${data.link.url}">${escapeHtml(data.link.label)} →</a></div>`;
    }
    if (data.treatment){
      html += `<div class="cb-msg-actions"><a class="cb-book" href="${data.treatment.bookUrl}" target="_blank" rel="noopener">Book ${escapeHtml(data.treatment.name)}</a><a class="cb-learn" href="${data.treatment.page}">Learn more</a></div>`;
    }
    if (data.book || data.fallback){
      html += `<div class="cb-msg-actions"><a class="cb-book" href="${GENERAL_BOOK_URL}" target="_blank" rel="noopener">Book Now</a><a class="cb-learn" href="${PHONE}">Call Us</a></div>`;
    }
    div.innerHTML = html;
  }
  body.appendChild(div);
  if (role === 'bot'){
    // Land on the TOP of the new reply so it reads from the beginning.
    // Instant jump (no smooth animation — it can be interrupted mid-flight
    // and strand the view partway down the message).
    // .cb-body is position:relative, so offsetTop is measured from the
    // scroll container itself — no parent-offset guesswork.
    body.scrollTop = Math.max(0, div.offsetTop - 8);
  } else {
    body.scrollTop = body.scrollHeight;
  }
}

const CHIPS = CATEGORIES.map(c => c.label);

function init(){
  const rail = document.querySelector('.action-rail');
  if (!rail) return;

  const btn = document.createElement('button');
  btn.className = 'rail-btn cb-btn';
  btn.id = 'cbRailBtn';
  btn.setAttribute('aria-label', 'Chat with us');
  btn.innerHTML = `<span class="rail-label">Chat With Us</span><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2.4v2.4"/>
    <circle cx="12" cy="1.9" r="1.1" fill="#fff" stroke="none"/>
    <rect x="4" y="4.8" width="16" height="12.4" rx="3.6"/>
    <path d="M4 9.6H2.4v3.2H4M20 9.6h1.6v3.2H20"/>
    <circle cx="9.2" cy="10.4" r="1.35" fill="#fff" stroke="none"/>
    <circle cx="14.8" cy="10.4" r="1.35" fill="#fff" stroke="none"/>
    <path d="M9.4 14.1h5.2"/>
    <path d="M8.6 17.2v2.2M15.4 17.2v2.2"/>
  </svg>`;
  // first position in the rail — above the Self-Assessment button
  rail.insertBefore(btn, rail.firstChild);

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const panel = buildPanel();
  document.body.appendChild(panel);

  const body = panel.querySelector('#cbBody');
  const chips = panel.querySelector('#cbChips');
  const input = panel.querySelector('#cbInput');

  function renderChips(){
    chips.innerHTML = '';
    CHIPS.forEach(c => {
      const el = document.createElement('div');
      el.className = 'cb-chip';
      el.textContent = c;
      el.onclick = () => {
        const cat = CATEGORIES.find(x => x.label === c);
        if (cat){
          addMsg(body, 'user', c);
          setTimeout(() => addMsg(body, 'bot', { category:cat }), 260);
        } else {
          sendMessage(c);
        }
      };
      chips.appendChild(el);
    });
  }

  function sendMessage(text){
    text = (text || input.value).trim();
    if (!text) return;
    addMsg(body, 'user', text);
    input.value = '';
    const reply = findReply(text);
    setTimeout(() => addMsg(body, 'bot', reply), 260);
  }

  let opened = false;
  function openPanel(){
    panel.classList.add('open');
    if (!opened){
      opened = true;
      addMsg(body, 'bot', { text:'Hi! Tap a service below to see what it includes, or ask me anything — hours, location, a specific concern, whatever you need.' });
      renderChips();
    }
    input.focus();
  }
  function closePanel(){ panel.classList.remove('open'); }

  btn.addEventListener('click', () => panel.classList.contains('open') ? closePanel() : openPanel());
  panel.querySelector('#cbClose').addEventListener('click', closePanel);
  panel.querySelector('#cbSend').addEventListener('click', () => sendMessage());
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
})();
