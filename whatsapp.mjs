export const destinations = ['Пока выбираю','Шенген','США','Япония','Другая страна'];
export function validateLead(input) {
 if (!input || typeof input !== 'object' || Array.isArray(input)) return {ok:false,error:'Проверьте данные заявки.'};
 const name = typeof input.name === 'string' ? input.name.trim() : '';
 const rawPhone = typeof input.phone === 'string' ? input.phone.trim() : '';
 const phone = '+' + rawPhone.replace(/\D/g,'');
 const destination = input.destination || 'Пока выбираю';
 if (name.length < 2 || name.length > 80 || /[<>\r\n\x00-\x1f]/.test(name)) return {ok:false,error:'Укажите имя от 2 до 80 символов.'};
 if (!/^[+\d\s()\-]+$/.test(rawPhone) || !/^\+[1-9]\d{9,14}$/.test(phone)) return {ok:false,error:'Проверьте телефон и укажите код страны.'};
 if (!destinations.includes(destination)) return {ok:false,error:'Выберите направление из списка.'};
 if (input.consent !== true) return {ok:false,error:'Нужно согласие на обработку данных для ответа на заявку.'};
 return {ok:true,data:{name,phone,destination}};
}
export function templatePayload(lead, env) {
 return {messaging_product:'whatsapp',recipient_type:'individual',to:env.WA_NOTIFY_TO,type:'template',template:{name:env.WA_TEMPLATE_NAME,language:{code:env.WA_TEMPLATE_LANGUAGE || 'ru'},components:[{type:'body',parameters:[lead.name,lead.phone,lead.destination].map(text=>({type:'text',text}))}]}};
}
export function whatsappConfigured(env) {
 return Boolean(env.WA_ACCESS_TOKEN && /^\d+$/.test(env.WA_PHONE_NUMBER_ID || '') && /^\d{10,15}$/.test(env.WA_NOTIFY_TO || '') && /^[a-z0-9_]+$/.test(env.WA_TEMPLATE_NAME || '') && /^v\d+\.\d+$/.test(env.WA_API_VERSION || 'v26.0'));
}
export async function sendLead(lead, env, fetcher = fetch) {
 if (!whatsappConfigured(env)) return {ok:false,status:503,error:'Сейчас заявку удобнее отправить напрямую в WhatsApp. Нажмите кнопку ниже.'};
 try {
  const response = await fetcher('https://graph.facebook.com/' + (env.WA_API_VERSION || 'v26.0') + '/' + env.WA_PHONE_NUMBER_ID + '/messages',{method:'POST',headers:{Authorization:'Bearer ' + env.WA_ACCESS_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(templatePayload(lead,env)),signal:AbortSignal.timeout(12000)});
  const result = await response.json();
  if (!response.ok || !result.messages?.[0]?.id) return {ok:false,status:502,error:'Не удалось подтвердить отправку. Свяжитесь с нами напрямую в WhatsApp.'};
  return {ok:true,status:200,message:'Заявка передана в WhatsApp визового центра. Мы свяжемся с вами.'};
 } catch { return {ok:false,status:502,error:'Не удалось подтвердить отправку. Свяжитесь с нами напрямую в WhatsApp.'}; }
}
