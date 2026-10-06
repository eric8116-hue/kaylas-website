/* Precise chatbot core · adapted from H&R's fixed-answer, accent-normalized
   matcher and bilingual answer model. Shared by the website and CRM tester. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PreciseChat=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const BUILD='PLS-CHAT-2026.09.27-02';
const booking='https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services',phone='tel:6319231174';
const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
function score(q,tags){const text=' '+normalize(q)+' ';return (tags||[]).reduce((sum,tag)=>{const t=normalize(tag);if(!t)return sum;const re=new RegExp('(?:^| )'+t.replace(/ /g,'\\s+')+'(?:s|es|ing|ed)?(?= |$)');return sum+(re.test(text)?t.split(' ').length*3:0);},0);}
const pair=(en,es)=>({en,es});
const ui={
 en:{title:'Chat with Precise',subtitle:'A little guidance. Your next step.',hello:'Hi! Explore our services, ask about your visit, or find a time in Square. How can I help?',placeholder:'Ask about services or your visit…',send:'Send',close:'Close chat',reset:'Start over',book:'Book appointment',call:'Call the spa',more:'Service details',topics:'Explore topics',share:'Share question with the team',shared:'Question shared for review. For a personal reply, please call the spa.',shareError:'Could not share this question. Please call the spa.',privacy:'General questions only. Please leave out personal and medical details.',fallback:'I don’t have an approved answer for that yet. The Precise team can help. You can call, book a consultation, or share a general question for review.',medical:'The Precise team needs to review your individual situation before advising on treatment, preparation, or aftercare. Please contact the spa directly; this chat cannot assess symptoms or decide whether a treatment is suitable for you.',missing:'This custom answer is awaiting Spanish review. Please contact the team for help.',label:'Chat',language:'Choose chat language'},
 es:{title:'Chat con Precise',subtitle:'Orientación para tu próximo paso.',hello:'¡Hola! Explora nuestros servicios, pregunta sobre tu visita o busca una cita en Square. ¿Cómo podemos ayudarte?',placeholder:'Pregunta sobre servicios o tu visita…',send:'Enviar',close:'Cerrar chat',reset:'Empezar de nuevo',book:'Reservar cita',call:'Llamar al spa',more:'Ver servicio',topics:'Explorar temas',share:'Compartir pregunta con el equipo',shared:'Pregunta enviada para revisión. Para una respuesta personal, llama al spa.',shareError:'No se pudo compartir la pregunta. Llama al spa.',privacy:'Solo preguntas generales. No incluyas datos personales ni médicos.',fallback:'Todavía no tengo una respuesta aprobada para esa pregunta. El equipo de Precise puede ayudarte. Puedes llamar, reservar una consulta o compartir una pregunta general para revisión.',medical:'El equipo de Precise necesita revisar tu situación antes de orientarte sobre un tratamiento, su preparación o los cuidados posteriores. Contacta directamente al spa; este chat no puede evaluar síntomas ni decidir si un tratamiento es adecuado para ti.',missing:'Esta respuesta personalizada todavía no tiene una versión en español revisada. Contacta al equipo para recibir ayuda.',label:'Chat',language:'Elegir idioma del chat'}
};
const categories=[
{id:'hair',label:pair('Hair removal','Depilación'),tags:['hair removal','depilacion','remove hair'],page:'/services-hair-removal.html',names:pair('Laser hair removal, electrolysis and dermaplaning.','Depilación láser, electrólisis y dermaplaning.')},
{id:'facials',label:pair('Facials & skin','Faciales y piel'),tags:['facial','facials','skin care','faciales','cuidado de la piel'],page:'/services-facials.html',names:pair('HydraFacial, chemical peels, microneedling, dermaplaning, acne facials, anti-aging facials and back facials.','HydraFacial, peelings químicos, microneedling, dermaplaning, faciales para acné, faciales antiedad y faciales de espalda.')},
{id:'beauty',label:pair('Beauty enhancements','Belleza'),tags:['beauty','beautification','belleza'],page:'/services-beautification.html',names:pair('Lash lifts, teeth whitening, lip blushing, tooth gems and hyperpigmentation correction.','Lifting de pestañas, blanqueamiento dental, micropigmentación de labios, joyas dentales y corrección de hiperpigmentación.')},
{id:'wellness',label:pair('Wellness services','Bienestar'),tags:['wellness','detox','detoxification','bienestar','desintoxicacion'],page:'/services-detox.html',names:pair('Infrared sauna, colon hydrotherapy and FIT Bodywrap. Ask the team about each service and whether it is appropriate for you.','Sauna infrarroja, hidroterapia de colon y FIT Bodywrap. Pregunta al equipo sobre cada servicio y si es apropiado para ti.')}
];
const services=[
['laser','Laser hair removal','Depilación láser','hair',['laser','depilacion laser']],
['electrolysis','Electrolysis','Electrólisis','hair',['electrolysis','electrolisis']],
['hydrafacial','HydraFacial','HydraFacial','facials',['hydrafacial','hydra facial']],
['peels','Chemical peels','Peelings químicos','facials',['chemical peel','peeling','peel']],
['microneedling','Microneedling','Microneedling','facials',['microneedling','microagujas']],
['dermaplaning','Dermaplaning','Dermaplaning','facials',['dermaplaning','peach fuzz']],
['acne','Acne facial','Facial para acné','facials',['acne facial','acne']],
['aging','Anti-aging facial','Facial antiedad','facials',['anti aging','antiedad']],
['back','Back facial','Facial de espalda','facials',['back facial','facial de espalda']],
['lashes','Keratin lash lift','Lifting de pestañas','beauty',['lash lift','lashes','pestanas']],
['teeth','Teeth whitening','Blanqueamiento dental','beauty',['teeth whitening','blanqueamiento dental']],
['lips','Lip blushing','Micropigmentación de labios','beauty',['lip blushing','lip tattoo','labios']],
['gems','Tooth gems','Joyas dentales','beauty',['tooth gem','joyas dentales']],
['pigment','Hyperpigmentation correction','Corrección de hiperpigmentación','beauty',['hyperpigmentation','hiperpigmentacion']],
['sauna','Infrared sauna','Sauna infrarroja','wellness',['sauna','infrared']],
['colon','Colon hydrotherapy','Hidroterapia de colon','wellness',['colon hydrotherapy','colonic','colonics','hidroterapia']],
['wrap','FIT Bodywrap','FIT Bodywrap','wellness',['bodywrap','body wrap','envoltura']]
].map(([id,en,es,category,tags])=>({id,label:pair(en,es),category,tags}));
const faqs=[
{id:'hours',label:pair('Hours & availability','Horario y disponibilidad'),tags:['hours','hour','open','close','horario','horas','abierto','same day','mismo dia','24 hours'],answer:pair('Visits are by appointment. The website booking calendar is available anytime; check Square for available appointments or call (631) 923-1174.','Las visitas son con cita previa. Puedes consultar el calendario en línea en cualquier momento; revisa Square para ver citas disponibles o llama al (631) 923-1174.')},
{id:'prices',label:pair('Prices & consultation','Precios y consulta'),tags:['price','pricing','cost','how much','package','precio','cuanto','costo','consulta','consultation'],answer:pair('Precise offers a free consultation. Check Square for current services and pricing, or ask the team for a plan for your needs.','Precise ofrece una consulta gratuita. Revisa Square para ver los servicios y precios actuales, o pide al equipo un plan para tus necesidades.')},
{id:'location',label:pair('Find us','Dónde estamos'),tags:['location','address','directions','where are you','ubicacion','direccion','donde','babylon'],answer:pair('Find us at 626 Deer Park Ave, Babylon, NY 11702.','Estamos en 626 Deer Park Ave, Babylon, NY 11702.'),url:'https://www.google.com/maps/search/?api=1&query=626+Deer+Park+Ave+Babylon+NY+11702'},
{id:'contact',label:pair('Talk to the team','Hablar con el equipo'),tags:['contact','phone','call','human','person','kayla','telefono','llamar','contacto','persona','email'],answer:pair('Call (631) 923-1174 or email Preciselaserspa@gmail.com. The team can help with questions about your appointment.','Llama al (631) 923-1174 o escribe a Preciselaserspa@gmail.com. El equipo puede ayudarte con preguntas sobre tu cita.')},
{id:'booking',label:pair('Book or change a visit','Reservar o cambiar cita'),tags:['book','appointment','schedule','reserve','cancel','reschedule','cita','reservar','cancelar','reprogramar'],answer:pair('Use Square to choose an available appointment. To change an existing visit, use your booking confirmation or contact the team. A chat message does not reserve a time.','Usa Square para elegir una cita disponible. Para cambiar una cita, usa tu confirmación o contacta al equipo. Un mensaje en este chat no reserva una cita.')}
];
function answer(question,lang='en',custom=[]){
 lang=lang==='es'?'es':'en';const q=normalize(question);const t=ui[lang];
 if(!q)return {text:t.hello,kind:'greeting'};
 // Individual treatment questions take priority over staff-written promotions.
 if(score(q,['pregnant','pregnancy','embarazada','embarazo','medication','medicine','medicamento','is it safe','safe for me','seguro para mi','can i get','puedo hacerme','can i have','candidate','candidato','contraindication','contraindicacion','burn','blister','quemadura','ampolla','allergy','allergic','alergia','reaction','reaccion','bleeding','sangrado','infection','infeccion','symptom','sintoma','pain','dolor','diagnose','diagnostico','accutane','isotretinoin','aftercare','after care','cuidados posteriores','prepare','preparation','preparacion','before treatment','antes del tratamiento'])>0)return {text:t.medical,kind:'handoff',book:true};
 const ranked=custom.map((a,i)=>({a,i,n:score(q,a.triggers)})).filter(x=>x.n).sort((a,b)=>b.n-a.n);
 if(ranked.length){const a=ranked[0].a;return {text:lang==='es'?(a.es||t.missing):(a.en||a.reply),kind:'custom',id:String(ranked[0].i),label:a.label||'Custom answer'};}
 if(/^(hi|hey|hello|hola|buenos dias|buenas tardes)$/.test(q))return {text:t.hello,kind:'greeting'};
 if(/^(thanks|thank you|gracias|muchas gracias)$/.test(q))return {text:lang==='es'?'¡Con gusto! ¿En qué más podemos ayudarte?':'You’re welcome! What else can we help with?',kind:'greeting'};
 const f=faqs.map(a=>({a,n:score(q,a.tags)})).filter(x=>x.n).sort((a,b)=>b.n-a.n)[0];
 if(f)return {text:f.a.answer[lang],kind:'faq',id:f.a.id,label:f.a.label[lang],url:f.a.url,book:true};
 const s=services.map(a=>({a,n:score(q,a.tags)})).filter(x=>x.n).sort((a,b)=>b.n-a.n)[0];
 if(s){const c=categories.find(c=>c.id===s.a.category);return {text:lang==='es'?s.a.label.es+' forma parte de nuestros servicios. Explora los detalles o reserva una consulta para hablar de tus objetivos.':s.a.label.en+' is part of our service menu. Explore the details or book a consultation to discuss your goals.',kind:'service',id:s.a.id,label:s.a.label[lang],url:c.page,book:true};}
 const c=categories.map(a=>({a,n:score(q,a.tags)})).filter(x=>x.n).sort((a,b)=>b.n-a.n)[0];
 if(c)return category(c.a.id,lang);
 return {text:t.fallback,kind:'fallback',book:true};
}
function category(id,lang='en'){const c=categories.find(c=>c.id===id);return c?{text:c.names[lang],kind:'category',id,label:c.label[lang],url:c.page,book:true}:answer('',lang);}
return {BUILD,booking,phone,ui,categories,services,faqs,normalize,score,answer,category};
});
