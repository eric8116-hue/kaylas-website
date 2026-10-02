/* Bilingual answer validation and opt-in question review. */
export function sanitizeAnswers(list){
 if(!Array.isArray(list)||list.length>300)return null;
 const out=[];
 for(const item of list){
  if(!item||typeof item!=='object')return null;
  const reply=String(item.en||item.reply||'').trim(),es=String(item.es||'').trim();
  const triggers=Array.isArray(item.triggers)?item.triggers.filter(t=>typeof t==='string').map(t=>t.trim().toLowerCase()).filter(Boolean):[];
  if(!reply||reply.length>2000||es.length>2000||!triggers.length||triggers.length>25||triggers.some(t=>t.length>100))return null;
  out.push({label:String(item.label||'').trim().slice(0,200),triggers,reply,en:reply,es});
 }
 return out;
}
export function questionForReview(body){
 if(body?.consent!==true||typeof body.q!=='string')return null;
 const q=body.q.replace(/<[^>]*>/g,'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,240);
 // Keep contact details out of a question-review inbox; it is not a lead form.
 if(!q||/\S+@\S+|\d[\d\s()+.-]{6,}\d|https?:\/\/|www\./i.test(q))return null;
 return {q,lang:body.lang==='es'?'es':'en'};
}
