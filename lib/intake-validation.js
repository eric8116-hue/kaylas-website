import { RequestError, textField, calendarDate } from './request-validation.js';

export const TREATMENT_CONSENT_COUNT = 13;
export const COMMUNICATION_CONSENT_FIELDS = [
  'sms_reminders_consent', 'sms_questions_consent', 'sms_promotions_consent', 'email_promotions_consent',
];
const COMMUNICATION_CONSENT_VERSION = '2026-10-08-v1';
const TEXT_LIMITS = {
  first_name: 100, last_name: 100, address: 300, city: 100, state: 80, zip: 20, phone: 40, email: 254,
  emergency_contact: 300, emergency_contact_name: 200, emergency_contact_phone: 40,
  referral_source: 300, areas_to_treat: 2000, accutane_detail: 4000, hormonal_detail: 4000,
  chemical_peel_detail: 4000, medications: 4000, light_sensitive_detail: 4000, allergies: 4000,
  removal_frequency: 120, removal_methods: 300, last_treatment_before_us: 200, skin_type: 80,
  consent_initials: 12, guardian_name: 200, guardian_signature: 200, client_signature: 200,
  provider_name: 200, provider_signature: 200,
};
const ANSWERS = ['accutane', 'hormonal', 'chemical_peel', 'light_sensitive', 'q_headaches', 'q_testosterone',
  'q_laser_resurfacing', 'q_skin_infection', 'q_sensitive_skin', 'q_genital_herpes', 'q_microdermabrasion', 'q_hirsutism_family', 'q_cold_sores'];

// Mirrors the current public/iPad form, not a new consent or clinical policy.
// In particular, photography and communication permissions are optional.
export function normalizeIntake(body, now = new Date()) {
  const result = { ...body };
  for (const [field, max] of Object.entries(TEXT_LIMITS)) {
    result[field] = textField(body[field], field, max, { required: ['first_name', 'last_name', 'client_signature', 'consent_initials'].includes(field) });
  }
  if (result.consent_initials === '--') throw new RequestError('Please confirm your consent initials.', 400, 'consent_initials');
  if (!Array.isArray(body.consent_items) || body.consent_items.length !== TREATMENT_CONSENT_COUNT || body.consent_items.some(answer => answer !== true)) {
    throw new RequestError('Please acknowledge all 13 treatment consent statements.', 400, 'consent_items');
  }
  if (typeof body.is_adult !== 'boolean') throw new RequestError('Please answer whether you are 18 or over.', 400, 'is_adult');
  if (!body.is_adult && (!result.guardian_name || !result.guardian_signature)) {
    throw new RequestError('A parent or guardian name and signature are required for a client under 18.', 400, 'guardian_signature');
  }
  for (const field of ANSWERS) {
    if (body[field] != null && !['', 'Y', 'N'].includes(body[field])) throw new RequestError(`Invalid answer for ${field}.`, 400, field);
  }
  const hasChoices = COMMUNICATION_CONSENT_FIELDS.some(field => Object.hasOwn(body, field));
  for (const field of ['photo_consent', 'marketing_optin', ...COMMUNICATION_CONSENT_FIELDS]) {
    if ((hasChoices && COMMUNICATION_CONSENT_FIELDS.includes(field)) || Object.hasOwn(body, field)) {
      if (typeof body[field] !== 'boolean') throw new RequestError('Invalid communication or photo consent choice.', 400, field);
    }
  }
  // Preserve unknown channel consent on legacy submissions; never invent it
  // from the old combined marketing answer or accept a client-claimed receipt.
  result.communications_consent_version = hasChoices ? COMMUNICATION_CONSENT_VERSION : null;
  result.communications_consent_at = hasChoices ? now.toISOString() : null;
  if (hasChoices) result.marketing_optin = body.sms_promotions_consent || body.email_promotions_consent;
  if (body.form_language != null && !['en', 'es'].includes(body.form_language)) throw new RequestError('Invalid form language.', 400, 'form_language');
  result.form_language = body.form_language || 'en';
  const birth = ['birth_year', 'birth_month', 'birth_day'].map(field => textField(body[field], field, 4));
  if (birth.some(Boolean)) {
    const [year, month, day] = birth;
    if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || !/^\d{1,2}$/.test(day)) throw new RequestError('Please complete a valid birth date.', 400, 'birth_year');
    const date = calendarDate(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`, 'birth date');
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map(part => [part.type, part.value]));
    const today = `${parts.year}-${parts.month}-${parts.day}`;
    if (date > today) throw new RequestError('Birth date cannot be in the future.', 400, 'birth_year');
    const adult = Number(parts.year) - Number(year) - (today.slice(5) < date.slice(5) ? 1 : 0) >= 18;
    if (adult !== body.is_adult) throw new RequestError('The birth date and age answer do not agree. Please check them.', 400, 'is_adult');
    result.birth_year = year; result.birth_month = month.padStart(2, '0'); result.birth_day = day.padStart(2, '0');
  }
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) throw new RequestError('Please enter a valid email address.', 400, 'email');
  // A receipt time from the server is more reliable than the client's clock.
  result.signed_at = now.toISOString();
  return result;
}
