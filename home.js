/* ═══════════════════════════════════════════════════════════════════════
★★★ THE ONLY BLOCK YOU NEED TO EDIT ★★★
Change the special here. Nothing else in the file has to change.
═══════════════════════════════════════════════════════════════════════ */
/* Where the contact form + text widget actually deliver to. */
const NOTIFY_API = 'https://chatbot-api.eric8116.workers.dev/notify';

/* Other editable values */
const CONFIG = {
// Direct "write a review" composer for the Business Profile (place ID
// ChIJ672a9s0o6IkRq2rrf_v_490 — sourced from a third-party geocode tied to
// this exact address; Eric: click it once live and confirm it opens Kayla's
// listing before treating this as final).
googleWriteReview : 'https://search.google.com/local/writereview?placeid=ChIJ672a9s0o6IkRq2rrf_v_490',
googleReadReviews : 'https://www.google.com/maps/search/?api=1&query=Precise+Laser+Hair+Removal+%26+Esthetics+626+Deer+Park+Ave+Babylon+NY',
reviewsApi : 'https://precise-laser-crm.pages.dev/api/public-reviews',
// Off until the dashboard's sign-in lets /api/public-reviews through to the public.
// While it is behind the sign-in every call fails, so leave this false until then.
reviewsFeedEnabled : false
};

const SERVICES = [
'Laser Hair Removal','Electrolysis','HydraFacial','Chemical Peels','Microneedling',
'Anti-Aging Facial','Acne Facial','Back Facial','Dermaplaning','Keratin Lash Lift',
'Lip Blushing (PMU)','Teeth Whitening','Swarovski Tooth Gems','Hyperpigmentation Correction',
'Infrared Sauna','Colon Hydrotherapy','FIT Bodywrap','Not sure yet — help me choose'
];
/* ═══════════════════ END OF EDITABLE BLOCK ═══════════════════ */

/* ---------- wire up config ---------- */
async function loadFeaturedReviews(){
  if (!CONFIG.reviewsFeedEnabled) return;
  if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') return;
  try {
    const response = await fetch(CONFIG.reviewsApi, {cache:'no-store'});
    if (!response.ok) return;
    const data = await response.json();
    const reviews = (Array.isArray(data.reviews) ? data.reviews : [])
      .filter(review => [4,5].includes(Number(review.rating)) && typeof review.comment === 'string' && review.comment.trim())
      .slice(0,12);
    if (!reviews.length) return;
    const home = document.querySelector('#reviews .quotes');
    home.replaceChildren(...reviews.slice(0,3).map(review => {
      const card=document.createElement('div');card.className='quote';
      const stars=document.createElement('div');stars.className='quote-stars';stars.textContent='★'.repeat(review.rating);stars.style.color='#FFD37A';stars.style.fontSize='20px';
      const body=document.createElement('p');body.className='quote-body';body.textContent=review.comment;
      const author=document.createElement('div');author.className='quote-who';author.textContent=`— ${review.reviewer_name || 'Google reviewer'}, Google`;
      card.append(stars,body,author);return card;
    }));
    const pane=document.getElementById('paneRead');
    document.getElementById('reviewEmpty').hidden=true;
    pane.querySelector('.eyebrow').textContent='Featured Google reviews';
    pane.querySelectorAll('.rev-card').forEach(card=>card.remove());
    const allLink=document.getElementById('readAllLink').parentElement;
    reviews.forEach(review=>{
      const card=document.createElement('div');card.className='rev-card';
      const name=document.createElement('div');name.className='rev-name';name.textContent=review.reviewer_name || 'Google reviewer';
      const meta=document.createElement('div');meta.className='rev-meta';meta.textContent=`${review.rating}.0 ★ · ${review.update_time ? new Date(review.update_time).toLocaleDateString() : 'Google review'}`;
      const body=document.createElement('p');body.className='rev-body';body.textContent=review.comment;
      card.append(name,meta,body);pane.insertBefore(card,allLink);
    });
  } catch { /* The direct Google link remains available when the feed is unavailable. */ }
}
loadFeaturedReviews();
document.getElementById('interestGrid').innerHTML = SERVICES.map(s => `
<button type="button" class="opt" aria-pressed="false" data-on-click="pickMany(this)">
<span class="opt-box"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg></span>${s}
</button>`).join('');

document.getElementById('writeGoogleLink').href = CONFIG.googleWriteReview;
document.getElementById('readAllLink').href = CONFIG.googleReadReviews;
document.getElementById('proofWrite').href = CONFIG.googleWriteReview;
document.getElementById('footReviewLink').href = CONFIG.googleWriteReview;
document.getElementById('yr').textContent = new Date().getFullYear();

/* ---------- allow service pages to deep-link an overlay open ----------
e.g. index.html?open=contact or index.html?open=reviews */
(function deepLinkOverlay(){
const which = new URLSearchParams(location.search).get('open');
if (which === 'contact' || which === 'reviews'){
document.getElementById('ov-' + which).classList.add('open');
document.body.classList.add('locked');
}
})();

/* ---------- coupon popup ---------- */
const PROMOTIONS_DISABLED = true;
(function initPromo(){
if (PROMOTIONS_DISABLED) return;
const preview = new URLSearchParams(location.search).has('preview');
const local = ['127.0.0.1','localhost'].includes(location.hostname);
const endpoint = local ? 'http://127.0.0.1:8818/api/offer' : 'https://precise-laser-crm.pages.dev/api/offer';
const lang = document.documentElement.lang === 'es' ? 'es' : 'en';
const seenKey = 'preciseOfferSeen';
try { if (!preview && sessionStorage.getItem(seenKey)) return; } catch(e){}
fetch(endpoint + '?lang=' + lang, { cache:'no-store' })
  .then(r => r.ok ? r.json() : {active:false})
  .then(offer => {
    if (!offer.active) {
      if (!(preview && local)) return;
      offer = { active:true, badge:'PREVIEW OFFER', headline:'A little extra for your next visit', subline:'A flexible offer card for laser, skincare, or wellness services—set the real details in Kayla’s dashboard.', code:'', cta:'Explore appointment times', bookingUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services', fine:'Sample preview only. No discount is live or being advertised.', delaySeconds:0 };
    }
    document.getElementById('promoBadge').textContent = offer.badge || (lang === 'es' ? 'Oferta especial' : 'A little something');
    document.getElementById('promoHead').textContent = offer.headline;
    document.getElementById('promoSub').textContent = offer.subline;
    document.getElementById('promoCta').textContent = offer.cta || (lang === 'es' ? 'Reservar una consulta' : 'Book a consultation');
    document.getElementById('promoCta').href = offer.bookingUrl;
    document.getElementById('promoFine').textContent = offer.fine || '';
    if (offer.code) document.getElementById('promoCode').textContent = offer.code;
    else document.getElementById('promoCodeBox').hidden = true;
    window.setTimeout(() => {
      if (document.querySelector('.overlay.open')) return;
      document.getElementById('promoScrim').classList.add('open');
      document.body.classList.add('locked');
    }, preview ? 0 : Math.min(60, Number(offer.delaySeconds) || 0) * 1000);
  }).catch(() => {
    if (!(preview && local)) return;
    const sample = { badge:'PREVIEW OFFER', headline:'A little extra for your next visit', subline:'A flexible offer card for laser, skincare, or wellness services—set the real details in Kayla’s dashboard.', cta:'Explore appointment times', bookingUrl:'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services', fine:'Sample preview only. No discount is live or being advertised.' };
    document.getElementById('promoBadge').textContent = sample.badge;
    document.getElementById('promoHead').textContent = sample.headline;
    document.getElementById('promoSub').textContent = sample.subline;
    document.getElementById('promoCta').textContent = sample.cta;
    document.getElementById('promoCta').href = sample.bookingUrl;
    document.getElementById('promoFine').textContent = sample.fine;
    document.getElementById('promoCodeBox').hidden = true;
    document.getElementById('promoScrim').classList.add('open');
    document.body.classList.add('locked');
  });
})();

function closePromo(){
document.getElementById('promoScrim').classList.remove('open');
document.body.classList.remove('locked');
try { sessionStorage.setItem('preciseOfferSeen','1'); } catch(e){}
}

/* ---------- drawer and overlays ---------- */
let modalReturnFocus = null;
let modalInertState = [];
let contactMode = 'general';
function restoreModalBackground(){
modalInertState.forEach(([el, wasInert]) => { el.inert = wasInert; });
modalInertState = [];
}
function isolateModal(modal){
restoreModalBackground();
Array.from(document.body.children).forEach(el => {
if (el === modal || el.tagName === 'SCRIPT') return;
modalInertState.push([el, el.inert]);
el.inert = true;
});
}
function openDrawer(){
const drawer = document.getElementById('drawer');
modalReturnFocus = document.activeElement;
closePromo();
drawer.classList.add('open');
document.querySelector('.burger').setAttribute('aria-expanded', 'true');
document.body.classList.add('locked');
isolateModal(drawer);
drawer.querySelector('.drawer-x').focus();
}
function closeDrawer(){
const drawer = document.getElementById('drawer');
if (!drawer.classList.contains('open')) return;
drawer.classList.remove('open');
document.querySelector('.burger').setAttribute('aria-expanded', 'false');
restoreModalBackground();
if (!document.querySelector('.overlay.open')) document.body.classList.remove('locked');
if (modalReturnFocus?.isConnected) modalReturnFocus.focus();
modalReturnFocus = null;
}
function openOverlay(which){
closeDrawer();
closePromo();
if (which === 'contact') setContactMode('general');
const current = document.querySelector('.overlay.open');
if (!current) modalReturnFocus = document.activeElement;
document.querySelectorAll('.overlay').forEach(o => o.classList.remove('open'));
const overlay = document.getElementById('ov-' + which);
overlay.classList.add('open');
document.body.classList.add('locked');
isolateModal(overlay);
overlay.querySelector('.ov-x').focus();
}
function setContactMode(mode){
contactMode = mode;
const feedback = mode === 'feedback';
document.querySelector('#ov-contact .ov-bar-title').textContent = feedback ? 'Private message' : 'Contact';
document.getElementById('ov-contact').setAttribute('aria-label', feedback ? 'Private message' : 'Contact');
document.getElementById('contactMarketing').hidden = feedback;
document.getElementById('contactTrust').hidden = feedback;
document.getElementById('contactMessageLabel').textContent = feedback ? 'Tell us about your experience *' : 'Anything else we should know?';
document.getElementById('cMsg').setAttribute('aria-required',String(feedback));
document.getElementById('cMsg').placeholder = feedback ? 'What happened? How can we help?' : 'Tell us about your goals, questions, or scheduling preferences (optional)';
document.getElementById('contactSuccessText').textContent = feedback ? 'Your message was sent to Precise. Someone from the team will follow up within one business day.' : "Your message is on its way. We'll reach out within one business day — or book now if you'd rather lock in a time.";
document.getElementById('contactSuccessActions').hidden = feedback;
}
function openFeedback(){
openOverlay('contact');
setContactMode('feedback');
document.getElementById('cFirst').focus();
}
function closeOverlay(e){
if (e) e.preventDefault();
if (!document.querySelector('.overlay.open')) return;
document.querySelectorAll('.overlay').forEach(o => o.classList.remove('open'));
restoreModalBackground();
document.body.classList.remove('locked');
if (modalReturnFocus?.isConnected) modalReturnFocus.focus();
modalReturnFocus = null;
}

/* ---------- option pickers ---------- */
function pickOne(el, gridId){
document.querySelectorAll('#' + gridId + ' .opt').forEach(o => {o.classList.remove('sel');o.setAttribute('aria-pressed','false');});
el.classList.add('sel');
el.setAttribute('aria-pressed','true');
}
function pickMany(el){ el.setAttribute('aria-pressed',String(el.classList.toggle('sel'))); }

/* ---------- contact form ---------- */
function contactError(message,fieldId){
  const error=document.getElementById('cErr');error.textContent=message;error.style.display='block';
  const field=fieldId && document.getElementById(fieldId);
  if(field){field.setAttribute('aria-invalid','true');field.focus();}else{error.focus();}
}
document.getElementById('contactForm').addEventListener('input',event=>event.target.removeAttribute('aria-invalid'));

async function submitContact(){
const feedback = contactMode === 'feedback';
const first = document.getElementById('cFirst').value.trim();
const email = document.getElementById('cEmail').value.trim();
const phone = document.getElementById('cPhone').value.trim();
const hear = document.querySelector('#hearGrid .opt.sel');
const interests = [...document.querySelectorAll('#interestGrid .opt.sel')].map(o => o.textContent.trim());

if (!first || !email || !phone){ contactError('Please add your first name, email, and phone number.',!first?'cFirst':!email?'cEmail':'cPhone'); return; }
if (!/^\S+@\S+\.\S+$/.test(email)){ contactError('Please enter a valid email address.','cEmail'); return; }
if (contactMode === 'general' && !hear){ contactError('Please let us know how you heard about us.'); return; }
if (contactMode === 'general' && !interests.length){ contactError('Please select at least one service you\'re interested in.'); return; }
if (contactMode === 'feedback' && !document.getElementById('cMsg').value.trim()){ contactError('Please tell us what happened.','cMsg'); return; }

const btn = document.getElementById('cSendBtn');
const errEl = document.getElementById('cErr');
errEl.style.display = 'none';
btn.disabled = true;
const originalLabel = btn.textContent;
btn.textContent = 'Sending…';

try {
const res = await fetch(NOTIFY_API, {
method: 'POST',
signal: AbortSignal.timeout(20000),
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
kind: 'contact',
firstName: first, lastName: document.getElementById('cLast').value.trim(),
email, phone, heardVia: feedback ? 'Private feedback' : hear.textContent.trim(), interests: feedback ? [] : interests,
message: feedback ? 'Private feedback: ' + document.getElementById('cMsg').value.trim() : document.getElementById('cMsg').value.trim(),
hp: document.getElementById('cHp').value
})
});
if (!res.ok) throw new Error('notify failed');
if (!feedback && window.preciseTrack) window.preciseTrack('contact_form_sent');

document.getElementById('contactForm').style.display = 'none';
document.getElementById('contactSuccess').classList.add('show');
const success = document.getElementById('contactSuccess');
success.setAttribute('tabindex', '-1');
success.focus();
document.querySelector('#ov-contact .ov-scroll').scrollTop = 0;
} catch (err) {
contactError(err.name === 'TimeoutError' ? 'We could not confirm delivery. Please call or text us before sending again.' : 'Something went wrong sending your message — please call or text us instead.');
} finally {
btn.disabled = false;
btn.textContent = originalLabel;
}
}

/* ---------- reviews ---------- */
function revTab(which){
const read = which === 'read';
document.getElementById('tabRead').classList.toggle('on', read);
document.getElementById('tabWrite').classList.toggle('on', !read);
document.getElementById('paneRead').classList.toggle('on', read);
document.getElementById('paneWrite').classList.toggle('on', !read);
}

document.addEventListener('keydown', e => {
if (e.key === 'Escape'){ closeOverlay(); closeDrawer(); closePromo(); return; }
if (e.key !== 'Tab') return;
const modal = document.querySelector('.overlay.open') || document.querySelector('.drawer.open');
if (!modal) return;
const focusable = Array.from(modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])'))
.filter(el => el.getClientRects().length && !el.closest('[hidden]'));
if (!focusable.length) return;
const first = focusable[0], last = focusable[focusable.length - 1];
if (!modal.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
