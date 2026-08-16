# Client Intake Form — Field Spec

Derived from `https://precise-laser-crm.pages.dev/intake` (the live iPad-facing
intake form used in-office). This documents every field, exactly as it exists
today, so it can be rebuilt as a fillable form on the marketing website that
submits to the same place.

The live form is a single-page flow labeled "Step 1 of 5." Below it's grouped
into **4 pages**, matching what Eric asked for — the two medical-history
screens (yes/no questions + Fitzpatrick skin type) are combined into one page
since they're both pre-treatment medical screening.

---

## Page 1 — Contact Info

- First Name (text)
- Last Name (text)
- Birthday — Month (dropdown) / Day (dropdown) / Year (text)
- Address — Street address (text)
- City (text)
- State (dropdown: NY, NJ, CT, PA, FL, Other)
- Zip (text)
- Phone (tel)
- Email (email)
- Emergency Contact Name (text)
- Emergency Contact Number (tel)
- How did you hear about us? (dropdown: Referral, Social Media, Google /
  Search, Walk-in, Other)

## Page 2 — Treatment & Medical History

**Treatment**
- What areas are to be treated? (free text, e.g. "underarms, bikini, legs")
- How often do you remove your hair? (Daily / Twice Daily / Weekly / Other)
- Current hair removal methods — tap all that apply (Waxing, Shaving,
  Sugaring, Creams, Tweezing, Electrolysis)
- When was your last treatment? (date picker)

**Quick yes/no screening** (each with a conditional follow-up text field
that only appears if "Yes"):
- Have you ever been on Accutane? → if yes: how long?
- Hormonal problem you've been treated for? → if yes: what treatment?
- Chemical peel or scars in treatment area? → if yes: explain
- Medications that make you sensitive to light? → if yes: explain

- Medications / herbal supplements / topical creams you use (free text)
- Any allergies? (free text)

**Medical history — more yes/no** (no follow-up text, just Yes/No):
- Do you ever get light-triggered headaches?
- Have you had your testosterone levels checked?
- Have you ever had laser resurfacing?
- Do you have any current skin infections?
- Do you have sensitive skin?
- Have you ever had genital herpes?
- Have you ever had Microdermabrasion?
- Do you have a family history of Hirsutism?
- Do you get cold sores?

**Skin type**
- Skin Type — Fitzpatrick Scale I–VI (dropdown, with the full reference
  chart shown alongside: Type I "Light, pale white, always burns, never
  tans" through Type VI "Black, very dark brown to black, never burns,
  deeply pigmented"). Marked "(provider will confirm)" — client picks their
  best guess, staff confirms in person.

## Page 3 — Consent

**Laser Hair Removal Consent** — 13 individually-tappable statements, each
gets initialed (initials auto-derived from the name entered on Page 1).

Verbatim wording, confirmed against the official paper-backup PDFs
(`Precise-Laser-Intake-EN.pdf` / `Precise-Laser-Intake-ES.pdf`) — these are
the office's own printed fallback forms for the same CRM intake flow, so
this is the word-for-word legal text, not a paraphrase:

1. I confirm I am at least 18 years of age, or have parental permission.
2. I have elected, by my own decision, to have laser hair removal performed.
3. The procedure, including the process and objective, has been explained
   to me before undergoing laser hair removal.
4. I have been given the opportunity to ask questions regarding any
   benefits, risks, or possible complications of the procedure.
5. I understand my provider has taken measures to minimize any risks or
   negative reactions, and I acknowledge any reaction or complications
   associated with the procedure as they have been explained to me.
6. I have followed all pre-procedure care instructions as they have been
   explained to me.
7. I understand it is important to provide feedback during my treatment,
   and will inform my provider of any pain or discomfort during the
   session.
8. I understand that a range of skin discolorations can occur, including
   permanent lightening or darkening, pigmented lesions, pinpoint bleeding
   and scarring.
9. I understand protective eyewear will be provided and must be kept on
   at all times during treatment to protect my eyes from accidental laser
   exposure.
10. I understand that more than 6-12 treatments may be needed and results
    are not guaranteed; hormonal changes, pregnancy, medications,
    menopause, or steroids can trigger new hair growth.
11. I understand tanning (sun, tanning beds, self-tanners) during
    treatment is not recommended, and I must inform the provider if my
    skin is darker than at my last treatment.
12. I understand I should avoid sun/tanning beds 4-6 weeks before and
    2 weeks after treatment, and use SPF 30+ on the treated area.
13. I confirm I have given an accurate account of my medical history,
    including allergies and medications I take or intend to take.

**Spanish version** (`Precise-Laser-Intake-ES.pdf`) — same 13 statements,
official translation, for the Spanish-language version of the site form:

1. Confirmo que tengo al menos 18 años de edad, o que cuento con el
   permiso de mi padre, madre o tutor.
2. He decidido, por mi propia voluntad, someterme a la depilación láser.
3. Se me ha explicado el procedimiento, incluyendo el proceso y su
   objetivo, antes de someterme a la depilación láser.
4. He tenido la oportunidad de hacer preguntas sobre los beneficios,
   riesgos y posibles complicaciones del procedimiento.
5. Entiendo que mi proveedora ha tomado medidas para minimizar cualquier
   riesgo o reacción negativa, y reconozco las reacciones o complicaciones
   asociadas con el procedimiento tal como me han sido explicadas.
6. He seguido todas las instrucciones de cuidado previas al procedimiento
   tal como me fueron explicadas.
7. Entiendo que es importante comunicarme durante mi tratamiento, e
   informaré a mi proveedora de cualquier dolor o molestia durante la
   sesión.
8. Entiendo que pueden ocurrir diversas alteraciones en el color de la
   piel, incluyendo aclaramiento u oscurecimiento permanente, lesiones
   pigmentadas, sangrado puntiforme y cicatrices.
9. Entiendo que se me proporcionarán gafas protectoras y que debo
   mantenerlas puestas en todo momento durante el tratamiento para
   proteger mis ojos de la exposición accidental al láser.
10. Entiendo que pueden necesitarse más de 6 a 12 tratamientos y que los
    resultados no están garantizados; los cambios hormonales, el
    embarazo, los medicamentos, la menopausia o los esteroides pueden
    provocar nuevo crecimiento de vello.
11. Entiendo que broncearme (sol, camas de bronceado, autobronceadores)
    durante el tratamiento no es recomendable, y que debo informar a mi
    proveedora si mi piel está más oscura que en mi último tratamiento.
12. Entiendo que debo evitar el sol y las camas de bronceado de 4 a 6
    semanas antes y 2 semanas después del tratamiento, y usar protector
    solar SPF 30 o superior en el área tratada.
13. Confirmo que he dado un relato veraz de mi historial médico,
    incluyendo alergias y medicamentos que tomo o que pienso tomar.

**Photo Consent**
- "I consent to clinical before/after photos being taken and stored in my
  file for treatment tracking." (checkbox/toggle)

**Specials, Promotions & Gift Certificates**
- Short blurb about birthday offers, promotions, gift certificates, discounts
- "May we send you birthday specials, promotions, gift certificates, and
  discounts by text and/or email?" — Yes/No (Required)

**Age**
- "Are you 18 or over?" — Yes/No (Required)
- If No: "Because the client is under 18, a parent or guardian must
  provide their name and signature." → Parent/Guardian Name (text)

## Page 4 — Sign & Submit

- Client Signature (type full name — typed text serves as signature)
- Parent/Guardian Signature (type full name — only relevant if under 18)
- Submit button
- Confirmation screen: "Thank you! You're all set. Please hand the iPad
  back to your provider." + "Start a new form" button

---

## Open questions before building this into the marketing site

1. ~~Does one form cover every service?~~ **RESOLVED — yes.** Eric
   confirmed `/intake` is used for every Precise service, not just laser
   hair removal. No separate per-service versions to account for.
2. ~~Exact consent wording~~ **RESOLVED.** Verbatim English and Spanish
   text for all 13 statements pulled directly from the office's own PDFs
   (`Precise-Laser-Intake-EN.pdf` / `Precise-Laser-Intake-ES.pdf`) and
   captured above — no paraphrasing, safe to use as-is.
3. **Submission destination — mostly resolved.** The CRM's own staged
   `public/intake.html` (in `CRM-UPDATES/`) already POSTs to `/submit-intake`
   on the CRM. The new website form (`client-intake.html`, built and saved
   to the site folder) points at the absolute URL
   `https://precise-laser-crm.pages.dev/submit-intake` so it lands in the
   exact same client/intake records as the in-office iPad. **Still open:**
   this is now a cross-origin request (marketing domain → CRM domain), and
   it will fail with a CORS error until the CRM's `/submit-intake` function
   sends an `Access-Control-Allow-Origin` header permitting the marketing
   site's domain. One-line fix, but it's on the CRM side — flag it to
   Caleb/whoever owns that Worker before this goes live. Also worth asking
   him: does a web-submitted form need to look any different in the CRM
   than an in-office one? The website payload already tags itself with
   `submission_source: "website"` so the backend *can* distinguish them,
   but nothing currently reads that field.
4. ~~"iPad" framing~~ **RESOLVED.** Confirmed by the PDFs' own "PAPER
   BACKUP" labeling — the in-office flow's copy ("hand the iPad back to
   your provider") only makes sense there. `client-intake.html` replaces
   it with "You're all set. We'll have this on file for your appointment."
   (EN) / "Todo listo. Tendremos esto en su expediente para su cita." (ES).

## Website form — status

`client-intake.html` is built and saved to the site folder, not yet linked
from nav/CTAs anywhere and not yet deployed. Same 5-step flow as the CRM's
iPad version (contact → medical history → consent → photo/marketing/age →
sign), same verbatim EN/ES copy, Spanish toggle enabled (the ES text was
checked word-for-word against the official PDF, unlike the CRM version
where it's still sitting behind `SPANISH_ENABLED = false` pending review).
Before deploying: resolve the CORS item above, decide whether to flip
Spanish on for the CRM's own iPad form too now that it's verified, and
wire this page into the site's nav/footer/CTAs once Eric's reviewed it.
