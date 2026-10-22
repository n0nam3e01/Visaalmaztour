import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, templatePayload } from '../whatsapp.mjs';
test('lead requires explicit consent and a valid phone', () => {
 assert.equal(validateLead({name:'Алия',phone:'123',consent:true}).ok,false);
 assert.equal(validateLead({name:'Алия',phone:'+7 706 123 45 67',consent:false}).ok,false);
 assert.equal(validateLead({name:' ',phone:'+7 706 123 45 67',consent:true}).ok,false);
});
test('lead normalizes phone and rejects arbitrary destinations', () => {
 const lead = validateLead({name:' Алия ',phone:'+7 (706) 123-45-67',destination:'США',consent:true});
 assert.equal(lead.ok,true); assert.equal(lead.data.name,'Алия'); assert.equal(lead.data.phone,'+77061234567');
 assert.equal(validateLead({name:'Алия',phone:'+77061234567',destination:'<script>',consent:true}).ok,false);
});
test('template sends to configured manager, never to applicant supplied destination', () => {
 const payload = templatePayload({name:'Алия',phone:'+77061234567',destination:'США'}, {WA_NOTIFY_TO:'77018887932',WA_TEMPLATE_NAME:'visa_lead',WA_TEMPLATE_LANGUAGE:'ru'});
 assert.equal(payload.to,'77018887932'); assert.equal(payload.type,'template');
 assert.equal(payload.template.name,'visa_lead');
 assert.deepEqual(payload.template.components[0].parameters.map(x=>x.text),['Алия','+77061234567','США']);
});
