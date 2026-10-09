document.querySelectorAll('.yr').forEach(el => el.textContent = new Date().getFullYear());

// =============================================================================
// SUBMISSION DESTINATION
//
// Both intake forms write to Kayla's CRM D1 database.
// This public website uses its own same-origin Pages Function.
// =============================================================================
const INTAKE_SUBMIT_URL = "/submit-intake";

// When this page was opened, used to measure how long the form took to fill.
const FORM_OPENED_AT = Date.now();

// ---------------------------------------------------------------------------
// SPANISH TOGGLE
//
// Enabled: the Spanish text below was checked word-for-word against Precise's
// own official printed form (Precise-Laser-Intake-ES.pdf) on 2026-08-16 and
// matches exactly, including all 13 consent statements. Flip back to false to
// hide the toggle again if you'd rather hold off.
// ---------------------------------------------------------------------------
const SPANISH_ENABLED = true;

let lang = "en";

const T = {
  pageH1: ["New Client Intake", "Admisión de Clientes Nuevos"],
  pageSub: ["Fill this out once before your first appointment — contact info, medical history, and consent, all on file when you walk in.",
            "Complete esto una sola vez antes de su primera cita — información de contacto, historial médico y consentimiento, todo listo cuando llegue."],
  formTitle: ["Client Intake Form", "Formulario de Admisión"],

  firstName: ["First Name", "Nombre"],
  lastName: ["Last Name", "Apellido"],
  phFirst: ["Jane", "María"],
  phLast: ["Client", "Apellido"],
  birthday: ["Birthday", "Fecha de nacimiento"],
  month: ["Month", "Mes"], day: ["Day", "Día"], year: ["Year", "Año"],
  m1: ["January","Enero"], m2: ["February","Febrero"], m3: ["March","Marzo"],
  m4: ["April","Abril"], m5: ["May","Mayo"], m6: ["June","Junio"],
  m7: ["July","Julio"], m8: ["August","Agosto"], m9: ["September","Septiembre"],
  m10: ["October","Octubre"], m11: ["November","Noviembre"], m12: ["December","Diciembre"],
  address: ["Address", "Dirección"],
  phStreet: ["Street address", "Calle y número"],
  city: ["City", "Ciudad"], stateLbl: ["State", "Estado"], zip: ["Zip", "Código postal"],
  phone: ["Phone", "Teléfono"], email: ["Email", "Correo electrónico"],
  emergName: ["Emergency Contact Name", "Nombre del contacto de emergencia"],
  emergPhone: ["Emergency Contact Number", "Teléfono del contacto de emergencia"],
  referral: ["How did you hear about us?", "¿Cómo se enteró de nosotros?"],
  selectOne: ["Select one", "Seleccione una opción"],
  refReferral: ["Referral", "Recomendación"],
  refSocial: ["Social Media", "Redes sociales"],
  refGoogle: ["Google / Search", "Google / Búsqueda"],
  refWalkin: ["Walk-in", "Vine sin cita"],
  other: ["Other", "Otro"],

  areas: ["What areas are to be treated?", "¿Qué áreas se van a tratar?"],
  phAreas: ["e.g. underarms, bikini, legs", "p. ej. axilas, bikini, piernas"],
  quickYN: ["A few quick yes/no questions", "Unas preguntas rápidas de sí o no"],
  qAccutane: ["Have you ever been on Accutane?", "¿Ha tomado alguna vez Accutane (isotretinoína)?"],
  phHowLong: ["If yes, how long?", "Si contestó sí, ¿por cuánto tiempo?"],
  qHormonal: ["Hormonal problem you've been treated for?", "¿Ha recibido tratamiento por algún problema hormonal?"],
  phTreatment: ["If yes, what treatment?", "Si contestó sí, ¿qué tratamiento?"],
  qPeel: ["Chemical peel or scars in treatment area?", "¿Peeling químico o cicatrices en el área a tratar?"],
  phExplain: ["If yes, explain", "Si contestó sí, explique"],
  qLight: ["Medications that make you sensitive to light?", "¿Toma medicamentos que la hagan sensible a la luz?"],
  meds: ["Medications / herbal supplements / topical creams you use",
         "Medicamentos, suplementos herbales o cremas que usa"],
  allergies: ["Any allergies?", "¿Tiene alguna alergia?"],
  howOften: ["How often do you remove your hair?", "¿Con qué frecuencia se depila?"],
  fDaily: ["Daily", "A diario"], fTwice: ["Twice Daily", "Dos veces al día"], fWeekly: ["Weekly", "Semanalmente"],
  methods: ["Current hair removal methods (tap all that apply)",
            "Métodos de depilación que usa actualmente (marque todos los que apliquen)"],
  mWax: ["Waxing", "Cera"], mShave: ["Shaving", "Rasurado"], mSugar: ["Sugaring", "Azúcar"],
  mCream: ["Creams", "Cremas"], mTweeze: ["Tweezing", "Pinzas"], mElectro: ["Electrolysis", "Electrólisis"],
  lastTx: ["When was your last treatment?", "¿Cuándo fue su último tratamiento?"],
  moreHistory: ["Medical history — a few more", "Historial médico — algunas más"],

  skinTypeLbl: ["Skin Type", "Tipo de piel"],
  st1: ["I — Light, pale white. Always burns, never tans",
        "I — Clara, blanca pálida. Siempre se quema, nunca se broncea"],
  st2: ["II — White, fair. Usually burns, tans with difficulty",
        "II — Blanca. Casi siempre se quema, se broncea con dificultad"],
  st3: ["III — Medium, white to olive. Sometimes mild burn, gradually tans to olive",
        "III — Media, de blanca a olivácea. A veces se quema levemente, se broncea poco a poco"],
  st4: ["IV — Olive, moderate brown. Rarely burns, tans with ease to a moderate brown",
        "IV — Olivácea, morena clara. Rara vez se quema, se broncea con facilidad"],
  st5: ["V — Brown, dark brown. Very rarely burns, tans very easily",
        "V — Morena, morena oscura. Muy rara vez se quema, se broncea muy fácilmente"],
  st6: ["VI — Black, very dark brown to black. Never burns, tans very easily, deeply pigmented",
        "VI — Muy oscura, de café muy oscuro a negro. Nunca se quema, muy pigmentada"],
  fitzTitle: ["The Fitzpatrick Scale", "La Escala de Fitzpatrick"],
  fitzCap: ["Not sure? Find the closest match above — your provider will confirm it at your visit.",
            "¿No está segura? Elija la más parecida — su proveedora lo confirmará en su cita."],

  consentTitle: ["Laser Hair Removal Consent", "Consentimiento para Depilación Láser"],
  consentIntro: ["Tap each statement to initial it. Your initials ({i}) come from your name on step 1.",
                 "Toque cada declaración para poner sus iniciales. Sus iniciales ({i}) vienen de su nombre en el paso 1."],

  photoTitle: ["Photo Consent", "Consentimiento para Fotografías"],
  photoText: ["I consent to clinical before/after photos being taken and stored in my file for treatment tracking.",
              "Doy mi consentimiento para que se tomen fotografías clínicas de antes y después y se guarden en mi expediente para dar seguimiento al tratamiento."],
  communicationsTitle: ["How may Precise Laser contact you?", "¿Cómo puede comunicarse con usted Precise Laser?"],
  communicationsSub: ["Choose only the messages you want. All choices are optional and start unchecked.", "Elija solo los mensajes que desea recibir. Todas las opciones son opcionales y comienzan sin marcar."],
  smsRemindersChoice: ["Text me about appointments, including reminders and schedule changes.", "Envíenme mensajes de texto sobre mis citas, incluidos recordatorios y cambios de horario."],
  smsQuestionsChoice: ["Text me replies to questions I ask Precise Laser.", "Envíenme por mensaje de texto respuestas a las preguntas que haga a Precise Laser."],
  smsPromotionsChoice: ["Text me promotions, birthday offers, discounts, and gift certificate offers.", "Envíenme por mensaje de texto promociones, ofertas de cumpleaños, descuentos y ofertas de certificados de regalo."],
  emailPromotionsChoice: ["Email me promotions, birthday offers, discounts, and gift certificate offers.", "Envíenme por correo electrónico promociones, ofertas de cumpleaños, descuentos y ofertas de certificados de regalo."],
  communicationsNote: ["Consent is optional and does not affect treatment. Message and data rates may apply. You may withdraw text consent by replying STOP or contacting Precise Laser.", "El consentimiento es opcional y no afecta el tratamiento. Pueden aplicarse tarifas de mensajes y datos. Puede retirar el consentimiento para mensajes de texto respondiendo STOP o comunicándose con Precise Laser."],
  specialsTitle: ["Specials, Promotions & Gift Certificates", "Ofertas, Promociones y Certificados de Regalo"],
  specialsSub: ["We run specials throughout the year, including birthday offers, promotions, gift certificates, and discounts.",
                "Tenemos ofertas durante todo el año, incluyendo promociones de cumpleaños, certificados de regalo y descuentos."],
  marketingQ: ["May we send you birthday specials, promotions, gift certificates, and discounts by text and/or email?",
               "¿Podemos enviarle ofertas de cumpleaños, promociones, certificados de regalo y descuentos por mensaje de texto y/o correo electrónico?"],
  required: ["Required", "Obligatorio"],
  ageTitle: ["Age", "Edad"],
  ageQ: ["Are you 18 or over?", "¿Tiene 18 años o más?"],
  guardianNote: ["Because the client is under 18, a parent or guardian must provide their name and signature.",
                 "Como la clienta es menor de 18 años, su padre, madre o tutor debe dar su nombre y firma."],
  guardianName: ["Parent/Guardian Name", "Nombre del padre, madre o tutor"],

  signTitle: ["Sign & Submit", "Firmar y Enviar"],
  signSub: ["Type your name below as your signature.", "Escriba su nombre abajo como firma."],
  draftTitle: ["Unfinished form found", "Se encontró un formulario sin terminar"],
  draftResume: ["Resume it", "Continuar"],
  draftDiscard: ["Start fresh", "Empezar de nuevo"],
  draftSavedAgo: ["Saved ", "Guardado "],
  draftJustNow: ["just now", "hace un momento"],
  draftMinsAgo: [" minutes ago", " minutos atrás"],
  clientSig: ["Client Signature (type full name)", "Firma de la clienta (escriba su nombre completo)"],
  guardianSig: ["Parent/Guardian Signature (type full name)",
                "Firma del padre, madre o tutor (escriba el nombre completo)"],
  submit: ["Submit", "Enviar"],
  submitting: ["Submitting…", "Enviando…"],
  thanks: ["Thank you", "Gracias"],
  thanksSub: ["You're all set. We'll have this on file for your appointment.",
              "Todo listo. Tendremos esto en su expediente para su cita."],
  bookNow: ["Book Your Appointment", "Reservar Su Cita"],
  newForm: ["Start a new form", "Comenzar un formulario nuevo"],

  yes: ["Yes", "Sí"], no: ["No", "No"],
  back: ["Back", "Atrás"], continue: ["Continue", "Continuar"],
  stepWord: ["Step", "Paso"], ofWord: ["of", "de"], complete: ["Complete", "Completado"],
  errGeneric: ["Something went wrong: ", "Algo salió mal: "],
};

const STEP_LABELS = [
  ["Contact Info", "Datos de contacto"],
  ["Medical History", "Historial médico"],
  ["Consent", "Consentimiento"],
  ["Preferences", "Preferencias"],
  ["Sign & Submit", "Firmar y enviar"],
];

const FITZ = [
  ["#F4CFB4", ["TYPE I","TIPO I"], ["Light,<br>pale white","Clara,<br>blanca pálida"], ["Always burns,<br>never tans","Siempre se quema,<br>nunca se broncea"]],
  ["#E7B48F", ["TYPE II","TIPO II"], ["White, fair","Blanca"], ["Usually burns,<br>tans with difficulty","Casi siempre se quema,<br>se broncea con dificultad"]],
  ["#D29E7C", ["TYPE III","TIPO III"], ["Medium,<br>white to olive","Media,<br>blanca a olivácea"], ["Sometimes mild burn,<br>gradually tans","A veces se quema levemente,<br>se broncea poco a poco"]],
  ["#C67F55", ["TYPE IV","TIPO IV"], ["Olive,<br>moderate brown","Olivácea,<br>morena clara"], ["Rarely burns,<br>tans with ease","Rara vez se quema,<br>se broncea con facilidad"]],
  ["#A55D2B", ["TYPE V","TIPO V"], ["Brown,<br>dark brown","Morena,<br>morena oscura"], ["Very rarely burns,<br>tans very easily","Muy rara vez se quema,<br>se broncea muy fácil"]],
  ["#371B1B", ["TYPE VI","TIPO VI"], ["Black, very dark<br>brown to black","Muy oscura,<br>café oscuro a negro"], ["Never burns,<br>deeply pigmented","Nunca se quema,<br>muy pigmentada"]],
];

const ynQuestions = [
  ["q_headaches", ["Do you ever get light-triggered headaches?", "¿Le dan dolores de cabeza provocados por la luz?"]],
  ["q_testosterone", ["Have you had your testosterone levels checked?", "¿Se ha hecho analizar sus niveles de testosterona?"]],
  ["q_laser_resurfacing", ["Have you ever had laser resurfacing?", "¿Se ha hecho alguna vez un rejuvenecimiento con láser?"]],
  ["q_skin_infection", ["Do you have any current skin infections?", "¿Tiene actualmente alguna infección en la piel?"]],
  ["q_sensitive_skin", ["Do you have sensitive skin?", "¿Tiene la piel sensible?"]],
  ["q_genital_herpes", ["Have you ever had genital herpes?", "¿Ha tenido alguna vez herpes genital?"]],
  ["q_microdermabrasion", ["Have you ever had Microdermabrasion?", "¿Se ha hecho alguna vez microdermoabrasión?"]],
  ["q_hirsutism_family", ["Do you have a family history of Hirsutism?", "¿Tiene antecedentes familiares de hirsutismo?"]],
  ["q_cold_sores", ["Do you get cold sores?", "¿Le salen fuegos labiales (herpes labial)?"]],
];

// The 13 consent statements — verbatim, verified against Precise's own PDFs.
const consentItems = [
  ["I confirm I am at least 18 years of age, or have parental permission.",
   "Confirmo que tengo al menos 18 años de edad, o que cuento con el permiso de mi padre, madre o tutor."],
  ["I have elected, by my own decision, to have laser hair removal performed.",
   "He decidido, por mi propia voluntad, someterme a la depilación láser."],
  ["The procedure, including the process and objective, has been explained to me before undergoing laser hair removal.",
   "Se me ha explicado el procedimiento, incluyendo el proceso y su objetivo, antes de someterme a la depilación láser."],
  ["I have been given the opportunity to ask questions regarding any benefits, risks, or possible complications of the procedure.",
   "He tenido la oportunidad de hacer preguntas sobre los beneficios, riesgos y posibles complicaciones del procedimiento."],
  ["I understand my provider has taken measures to minimize any risks or negative reactions, and I acknowledge any reaction or complications associated with the procedure as they have been explained to me.",
   "Entiendo que mi proveedora ha tomado medidas para minimizar cualquier riesgo o reacción negativa, y reconozco las reacciones o complicaciones asociadas con el procedimiento tal como me han sido explicadas."],
  ["I have followed all pre-procedure care instructions as they have been explained to me.",
   "He seguido todas las instrucciones de cuidado previas al procedimiento tal como me fueron explicadas."],
  ["I understand it is important to provide feedback during my treatment, and will inform my provider of any pain or discomfort during the session.",
   "Entiendo que es importante comunicarme durante mi tratamiento, e informaré a mi proveedora de cualquier dolor o molestia durante la sesión."],
  ["I understand that a range of skin discolorations can occur, including permanent lightening or darkening, pigmented lesions, pinpoint bleeding and scarring.",
   "Entiendo que pueden ocurrir diversas alteraciones en el color de la piel, incluyendo aclaramiento u oscurecimiento permanente, lesiones pigmentadas, sangrado puntiforme y cicatrices."],
  ["I understand protective eyewear will be provided and must be kept on at all times during treatment to protect my eyes from accidental laser exposure.",
   "Entiendo que se me proporcionarán gafas protectoras y que debo mantenerlas puestas en todo momento durante el tratamiento para proteger mis ojos de la exposición accidental al láser."],
  ["I understand that more than 6-12 treatments may be needed and results are not guaranteed; hormonal changes, pregnancy, medications, menopause, or steroids can trigger new hair growth.",
   "Entiendo que pueden necesitarse más de 6 a 12 tratamientos y que los resultados no están garantizados; los cambios hormonales, el embarazo, los medicamentos, la menopausia o los esteroides pueden provocar nuevo crecimiento de vello."],
  ["I understand tanning (sun, tanning beds, self-tanners) during treatment is not recommended, and I must inform the provider if my skin is darker than at my last treatment.",
   "Entiendo que broncearme (sol, camas de bronceado, autobronceadores) durante el tratamiento no es recomendable, y que debo informar a mi proveedora si mi piel está más oscura que en mi último tratamiento."],
  ["I understand I should avoid sun/tanning beds 4-6 weeks before and 2 weeks after treatment, and use SPF 30+ on the treated area.",
   "Entiendo que debo evitar el sol y las camas de bronceado de 4 a 6 semanas antes y 2 semanas después del tratamiento, y usar protector solar SPF 30 o superior en el área tratada."],
  ["I confirm I have given an accurate account of my medical history, including allergies and medications I take or intend to take.",
   "Confirmo que he dado un relato veraz de mi historial médico, incluyendo alergias y medicamentos que tomo o que pienso tomar."],
];

let state = { yn: {}, adult: null, freq: null, methods: [], consentDone: new Array(consentItems.length).fill(false) };
let currentStep = 1;

function t(key) {
  const e = T[key];
  return e ? e[lang === "es" ? 1 : 0] : key;
}

function setLang(l) {
  lang = l;
  document.documentElement.lang = l;
  try { localStorage.setItem("precise_intake_lang", l); } catch (e) {}

  document.getElementById("icLangEn").classList.toggle("sel", l === "en");
  document.getElementById("icLangEs").classList.toggle("sel", l === "es");
  document.getElementById("icLangEn").classList.toggle("is-on", l === "en");
  document.getElementById("icLangEs").classList.toggle("is-on", l === "es");

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const v = t(el.getAttribute("data-i18n"));
    if (v.indexOf("<") !== -1) el.innerHTML = v; else el.textContent = v;
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    el.placeholder = t(el.getAttribute("data-i18n-ph"));
  });

  renderFitz();
  renderYNGrid();
  renderConsent();
  updateStepLabel();
  syncIntakeAccessibility();
}

function renderFitz() {
  const g = document.getElementById("fitzGrid");
  const i = lang === "es" ? 1 : 0;
  g.innerHTML = FITZ.map(f =>
    '<div class="ic-fitz-col">' +
      '<div class="ic-fitz-sw" style="background:' + f[0] + '"></div>' +
      '<div class="ic-fitz-t">' + f[1][i] + '</div>' +
      '<div class="ic-fitz-b">' + f[2][i] + '</div>' +
      '<div class="ic-fitz-d">' + f[3][i] + '</div>' +
    '</div>'
  ).join("");
}

(function initDayDropdown() {
  const sel = document.getElementById("birth_day");
  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement("option");
    opt.value = String(d).padStart(2, "0");
    opt.textContent = d;
    sel.appendChild(opt);
  }
})();

function formatPhone(input) {
  let digits = input.value.replace(/\D/g, "").slice(0, 10);
  let out = digits;
  if (digits.length > 6) out = "(" + digits.slice(0,3) + ") " + digits.slice(3,6) + "-" + digits.slice(6);
  else if (digits.length > 3) out = "(" + digits.slice(0,3) + ") " + digits.slice(3);
  else if (digits.length > 0) out = "(" + digits;
  input.value = out;
}

function updateStepLabel() {
  const el = document.getElementById("icStepLabel");
  if (currentStep > 5) { el.textContent = t("complete"); return; }
  const name = STEP_LABELS[currentStep - 1][lang === "es" ? 1 : 0];
  el.textContent = t("stepWord") + " " + currentStep + " " + t("ofWord") + " 5 — " + name;
}

function goStep(n) {
  document.querySelectorAll(".ic-step").forEach(s => s.classList.remove("active"));
  document.querySelector('.ic-step[data-step="' + n + '"]').classList.add("active");
  currentStep = n;
  updateStepLabel();
  document.getElementById("icProgressBar").style.width = (n * 20) + "%";
  window.scrollTo({top: document.querySelector('.ic-card').offsetTop - 100, behavior: "instant"});
  document.getElementById("icStepLabel").focus({preventScroll:true});
  if (n === 3) renderConsent();
  if (n === 5) {
    document.getElementById("guardianSigWrap").style.display = state.adult === false ? "block" : "none";
  }
}

function setYN(field, val, btn) {
  state.yn[field] = val;
  const row = btn.closest(".ic-yn-row");
  row.querySelectorAll("button").forEach(b => b.classList.remove("sel"));
  btn.classList.add("sel");
  syncIntakeAccessibility();
  const followup = document.getElementById(field + "_detail_wrap");
  if (followup) followup.classList.toggle("show", val === true);
}

function setAdult(isAdult, btn) {
  state.adult = isAdult;
  const row = btn.closest(".ic-yn-row");
  row.querySelectorAll("button").forEach(b => b.classList.remove("sel"));
  btn.classList.add("sel");
  syncIntakeAccessibility();
  document.getElementById("guardianWrap").style.display = isAdult ? "none" : "block";
  if (isAdult) document.getElementById("guardian_name").value = "";
  refreshStep4Gate();
}

function refreshStep4Gate() {
  const answered = state.adult !== null;
  document.getElementById("toStep5Btn").disabled = !answered;
}

function renderYNGrid() {
  const grid = document.getElementById("ynGrid");
  const i = lang === "es" ? 1 : 0;
  grid.innerHTML = "";
  ynQuestions.forEach(([field, text]) => {
    const row = document.createElement("div");
    row.className = "ic-yn-row";
    const cur = state.yn[field];
    row.innerHTML = '<div class="ic-q">' + text[i] + '</div><div class="ic-yn-toggle">' +
      '<button class="sel-y' + (cur === true ? " sel" : "") + '" data-on-click="setYN(\'' + field + '\',true,this)">' + t("yes") + '</button>' +
      '<button class="sel-n' + (cur === false ? " sel" : "") + '" data-on-click="setYN(\'' + field + '\',false,this)">' + t("no") + '</button></div>';
    grid.appendChild(row);
  });
}

document.getElementById("freqChips").addEventListener("click", (e) => {
  if (!e.target.classList.contains("ic-chip")) return;
  document.querySelectorAll("#freqChips .ic-chip").forEach(c => c.classList.remove("sel"));
  e.target.classList.add("sel");
  state.freq = e.target.dataset.v;
  syncIntakeAccessibility();
});
document.getElementById("methodChips").addEventListener("click", (e) => {
  if (!e.target.classList.contains("ic-chip")) return;
  e.target.classList.toggle("sel");
  state.methods = [...document.querySelectorAll("#methodChips .ic-chip.sel")].map(c => c.dataset.v);
  syncIntakeAccessibility();
});

function getInitials() {
  const first = (document.getElementById("first_name").value || "").trim();
  const last = (document.getElementById("last_name").value || "").trim();
  if (!first && !last) return "--";
  return [first, last].filter(Boolean).map(w => w[0].toUpperCase()).join("");
}

function renderConsent() {
  const initials = getInitials();
  const i = lang === "es" ? 1 : 0;
  document.getElementById("consentIntro").textContent = t("consentIntro").replace("{i}", initials);
  const list = document.getElementById("consentList");
  list.innerHTML = "";
  consentItems.forEach((pair, idx) => {
    const div = document.createElement("div");
    div.setAttribute("role","checkbox");
    div.tabIndex = 0;
    div.setAttribute("aria-checked",String(Boolean(state.consentDone[idx])));
    div.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();div.click();}});
    div.className = "ic-consent-item" + (state.consentDone[idx] ? " done" : "");
    div.innerHTML = '<div class="ic-initial-box">' + (state.consentDone[idx] ? initials : "") + '</div>' +
      '<div class="ic-txt">' + (idx+1) + '. ' + pair[i] + '</div>';
    div.onclick = () => {
      state.consentDone[idx] = !state.consentDone[idx];
      renderConsent();
      document.querySelectorAll(".ic-consent-item")[idx].focus();
    };
    list.appendChild(div);
  });
  document.getElementById("toStep4Btn").disabled = !state.consentDone.every(Boolean);
}

function toggleCheck(elId) {
  const checkbox = document.getElementById(elId);
  checkbox.classList.toggle("on");
  checkbox.setAttribute("aria-checked",String(checkbox.classList.contains("on")));
}


function syncIntakeAccessibility() {
  const photo=document.getElementById("photoConsentLine");photo.setAttribute("aria-checked",String(photo.classList.contains("on")));
  document.querySelectorAll('.ic-yn-row').forEach((row,index)=>{
    const question=row.querySelector('.ic-q');
    if(question){question.id='intake-question-'+index;row.setAttribute('role','group');row.setAttribute('aria-labelledby',question.id);}
    row.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.classList.contains('sel'))));
  });
  document.querySelectorAll('.ic-chip').forEach(button=>button.setAttribute('aria-pressed',String(button.classList.contains('sel'))));
  ['icLangEn','icLangEs'].forEach(id=>{const b=document.getElementById(id);b.setAttribute('aria-pressed',String(b.classList.contains('sel')));});
  const fields={birth_month:lang==='es'?'Mes de nacimiento':'Birth month',birth_day:lang==='es'?'Día de nacimiento':'Birth day',birth_year:lang==='es'?'Año de nacimiento':'Birth year'};
  Object.entries(fields).forEach(([id,label])=>document.getElementById(id).setAttribute('aria-label',label));
  document.querySelectorAll('.ic-followup input').forEach(input=>{
    const question=input.parentElement.previousElementSibling.querySelector('.ic-q');
    if(question)input.setAttribute('aria-label',question.textContent+' — '+input.placeholder);
  });
  [['freqChips','howOften'],['methodChips','methods']].forEach(([id,key])=>{
    const label=document.querySelector('[data-i18n="'+key+'"]');label.id=id+'-label';
    const group=document.getElementById(id);group.setAttribute('role','group');group.setAttribute('aria-labelledby',label.id);
  });
}

// ---- boot ----
if (SPANISH_ENABLED) {
  document.getElementById("icLangSwitch").classList.add("on");
  let saved = "en";
  try { saved = localStorage.getItem("precise_intake_lang") || "en"; } catch (e) {}
  setLang(saved);
} else {
  setLang("en");
}

async function submitIntake() {
  const btn = document.getElementById("submitBtn");
  btn.disabled = true; btn.textContent = t("submitting");

  const payload = {
    first_name: val("first_name"), last_name: val("last_name"),
    birth_month: val("birth_month"), birth_day: val("birth_day"), birth_year: val("birth_year"),
    address: val("address"),
    city: val("city"), state: val("state"), zip: val("zip"), phone: val("phone"), email: val("email"),
    emergency_contact_name: val("emergency_contact_name"),
    emergency_contact_phone: val("emergency_contact_phone"),
    referral_source: val("referral_source"),
    areas_to_treat: val("areas_to_treat"),
    accutane: state.yn.accutane === true ? "Y" : state.yn.accutane === false ? "N" : "",
    accutane_detail: val("accutane_detail"),
    hormonal: state.yn.hormonal === true ? "Y" : state.yn.hormonal === false ? "N" : "",
    hormonal_detail: val("hormonal_detail"),
    chemical_peel: state.yn.chemical_peel === true ? "Y" : state.yn.chemical_peel === false ? "N" : "",
    chemical_peel_detail: val("chemical_peel_detail"),
    medications: val("medications"),
    light_sensitive: state.yn.light_sensitive === true ? "Y" : state.yn.light_sensitive === false ? "N" : "",
    light_sensitive_detail: val("light_sensitive_detail"),
    allergies: val("allergies"),
    removal_frequency: state.freq || "",
    removal_methods: state.methods.join(", "),
    last_treatment_before_us: val("last_treatment_before_us"),
    q_headaches: yn("q_headaches"), q_testosterone: yn("q_testosterone"),
    q_laser_resurfacing: yn("q_laser_resurfacing"), q_skin_infection: yn("q_skin_infection"),
    q_sensitive_skin: yn("q_sensitive_skin"), q_genital_herpes: yn("q_genital_herpes"),
    q_microdermabrasion: yn("q_microdermabrasion"), q_hirsutism_family: yn("q_hirsutism_family"),
    q_cold_sores: yn("q_cold_sores"),
    skin_type: val("skin_type"),
    consent_initials: getInitials(),
    consent_items: state.consentDone,
    photo_consent: document.getElementById("photoConsentLine").classList.contains("on"),
    sms_reminders_consent: document.getElementById("sms_reminders_consent").checked,
    sms_questions_consent: document.getElementById("sms_questions_consent").checked,
    sms_promotions_consent: document.getElementById("sms_promotions_consent").checked,
    email_promotions_consent: document.getElementById("email_promotions_consent").checked,
    marketing_optin: document.getElementById("sms_promotions_consent").checked || document.getElementById("email_promotions_consent").checked,
    is_adult: state.adult === true,
    guardian_name: val("guardian_name"),
    guardian_signature: val("guardian_signature"),
    client_signature: val("client_signature"),
    form_language: lang,
    signed_at: new Date().toISOString(),
    // Spam signals — see submit-intake.js on the CRM for how these are used.
    // company_url is the honeypot: a real person leaves it empty because they
    // never see it. form_elapsed_ms is how long the form was open; a human
    // filling five pages of medical history cannot do it in three seconds.
    company_url: val("company_url"),
    form_elapsed_ms: Date.now() - FORM_OPENED_AT,
    // New vs. the iPad version: lets the CRM tell a pre-visit web submission
    // apart from an in-office one, in case that distinction matters on intake.
    submission_source: "website",
  };

  try {
    const res = await fetch(INTAKE_SUBMIT_URL, {
      signal: AbortSignal.timeout(20000),
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Submit failed");

    if (res.status === 201) clearDraft();

    document.getElementById("thanksName").textContent = payload.first_name ? ", " + payload.first_name : "";
    document.querySelectorAll(".ic-step").forEach(s => s.classList.remove("active"));
    document.querySelector('.ic-step[data-step="6"]').classList.add("active");
    currentStep = 6;
    updateStepLabel();
    document.getElementById("icProgressBar").style.width = "100%";
    window.scrollTo({top: document.querySelector('.ic-card').offsetTop - 100, behavior: "instant"});
  } catch (err) {
    showToast(err.name === "TimeoutError" ? (lang === "es" ? "No pudimos confirmar el envío. Llame antes de volver a enviarlo; sus respuestas siguen aquí." : "We could not confirm your submission. Please call before submitting again; your answers are still here.") : t("errGeneric") + err.message);
    btn.disabled = false; btn.textContent = t("submit");
  }
}

/* ===========================================================================
   DRAFT RECOVERY — survives an accidental reload or a dropped connection
   mid-form. sessionStorage (not localStorage): scoped to this one tab, gone
   when the tab closes, so nothing sensitive lingers on a shared or public
   computer. Never auto-restores — always requires an explicit "Resume it"
   click — and clears itself the moment a submission is accepted (201).
=========================================================================== */

const DRAFT_KEY = "precise_intake_draft";
const DRAFT_MAX_AGE_MS = 60 * 60 * 1000;

function draftFieldIds() {
  return Array.from(document.querySelectorAll(".ic-card input, .ic-card select, .ic-card textarea"))
    .filter(el => el.id && el.type !== "file" && el.type !== "button" && el.type !== "checkbox")
    .map(el => el.id);
}

const COMMUNICATION_CONSENT_IDS = ["sms_reminders_consent", "sms_questions_consent", "sms_promotions_consent", "email_promotions_consent"];

function saveDraft() {
  if (currentStep > 5) return;
  if (document.getElementById("icDraftBanner").style.display === "flex") return;
  try {
    const fields = {};
    draftFieldIds().forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value !== "") fields[id] = el.value;
    });

    const photoLine = document.getElementById("photoConsentLine");

    const draft = {
      v: 1, savedAt: Date.now(), lang: lang, currentStep: currentStep, fields: fields,
      state: { yn: state.yn, adult: state.adult, freq: state.freq, methods: state.methods, consentDone: state.consentDone },
      photoConsent: photoLine ? photoLine.classList.contains("on") : false,
      communicationConsents: Object.fromEntries(COMMUNICATION_CONSENT_IDS.map(id => [id, document.getElementById(id).checked])),
    };
    const hasAnswers = Object.keys(fields).some(id => id !== "state" && id !== "company_url") || Object.keys(state.yn).length || state.adult !== null || state.freq || state.methods.length || state.consentDone.some(Boolean) || draft.photoConsent;
    if (!hasAnswers) { clearDraft(); return; }
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {}
}

function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) {}
}

function readDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || d.v !== 1 || !d.savedAt) return null;
    if (Date.now() - d.savedAt > DRAFT_MAX_AGE_MS) { clearDraft(); return null; }
    return d;
  } catch (e) { return null; }
}

function applyDraft(d) {
  if (d.lang && d.lang !== lang) setLang(d.lang);

  Object.keys(d.fields || {}).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = d.fields[id];
  });

  for (const id of COMMUNICATION_CONSENT_IDS) document.getElementById(id).checked = d.communicationConsents?.[id] === true;

  if (d.state) {
    state.yn = d.state.yn || {};
    state.adult = d.state.adult === undefined ? null : d.state.adult;
    state.freq = d.state.freq || null;
    state.methods = Array.isArray(d.state.methods) ? d.state.methods : [];
    if (Array.isArray(d.state.consentDone) && d.state.consentDone.length === consentItems.length) {
      state.consentDone = d.state.consentDone;
    }
  }

  const photoLine = document.getElementById("photoConsentLine");
  if (photoLine) photoLine.classList.toggle("on", !!d.photoConsent);

  renderYNGrid();
  renderConsent();
  renderFitz();
  syncConditionalFields();
  syncIntakeAccessibility();

  const step = Math.min(Math.max(parseInt(d.currentStep, 10) || 1, 1), 5);
  document.querySelectorAll(".ic-step").forEach(s => s.classList.remove("active"));
  const target = document.querySelector('.ic-step[data-step="' + step + '"]');
  if (target) target.classList.add("active");
  currentStep = step;
  updateStepLabel();
  const bar = document.getElementById("icProgressBar");
  if (bar) bar.style.width = (step * 20) + "%";
}

function syncConditionalFields() {
  [["accutane","accutane_detail_wrap"],
   ["hormonal","hormonal_detail_wrap"],
   ["chemical_peel","chemical_peel_detail_wrap"],
   ["light_sensitive","light_sensitive_detail_wrap"]].forEach(([key, wrapId]) => {
    const wrap = document.getElementById(wrapId);
    if (wrap) wrap.classList.toggle("show", state.yn[key] === true);
  });

  const markRow = (row, val) => {
    if (!row) return;
    const btns = row.querySelectorAll("button");
    btns.forEach(b => b.classList.remove("sel"));
    if (val === true && btns[0]) btns[0].classList.add("sel");
    if (val === false && btns[1]) btns[1].classList.add("sel");
  };
  const adultBtn = document.querySelector('[onclick*="setAdult"]');
  markRow(adultBtn ? adultBtn.closest(".ic-yn-toggle") : null, state.adult);

  const gw = document.getElementById("guardianWrap");
  if (gw) gw.style.display = state.adult === false ? "block" : "none";

  document.querySelectorAll("#freqChips .ic-chip").forEach(c =>
    c.classList.toggle("sel", !!state.freq && c.dataset.v === state.freq));
  document.querySelectorAll("#methodChips .ic-chip").forEach(c =>
    c.classList.toggle("sel", state.methods.indexOf(c.dataset.v) !== -1));

  if (typeof refreshStep4Gate === "function") refreshStep4Gate();
}

function draftAgeText(savedAt) {
  const mins = Math.floor((Date.now() - savedAt) / 60000);
  return t("draftSavedAgo") + (mins < 1 ? t("draftJustNow") : mins + t("draftMinsAgo"));
}

(function initDraftRecovery() {
  const banner = document.getElementById("icDraftBanner");
  const d = readDraft();

  if (d && banner) {
    document.getElementById("icDraftWhen").textContent = draftAgeText(d.savedAt);
    banner.style.display = "flex";
    document.getElementById("icDraftResume").addEventListener("click", () => {
      applyDraft(d);
      banner.style.display = "none";
    });
    document.getElementById("icDraftDiscard").addEventListener("click", () => {
      clearTimeout(clickTimer);
      draftFieldIds().forEach(id => { document.getElementById(id).value = ""; });
      applyDraft({fields:{},currentStep:1,state:{yn:{},adult:null,freq:null,methods:[],consentDone:Array(consentItems.length).fill(false)},photoConsent:false});
      clearDraft();
      banner.style.display = "none";
      document.getElementById("icStepLabel").focus();
    });
  }

  document.addEventListener("blur", (e) => {
    const el = e.target;
    if (el && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA")) saveDraft();
  }, true);

  let clickTimer;
  document.addEventListener("click", () => {
    clearTimeout(clickTimer);
    clickTimer = setTimeout(saveDraft, 250);
  }, true);

  window.addEventListener("pagehide", saveDraft);
})();

function val(id) { const el = document.getElementById(id); return el ? el.value : ""; }
function yn(field) { return state.yn[field] === true ? "Y" : state.yn[field] === false ? "N" : ""; }
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg; el.style.display = "block";
  setTimeout(() => el.style.display = "none", 4000);
}
