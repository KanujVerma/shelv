import {addressCommand,formatMoney,issueQuoteCommand,publicError,quoteRows} from './model.js';
import {paymentViewWithMethods,methodLabels,methodAsset,recipientIdentifier,methodClaimCommand,methodConfirmationCommand,methodRejectionCommand,validateMethodReceipt} from './methods.js';
import {SERVICE_COPY} from '../service/model.js';

/** Buildless, isolated UI. Auth, capabilities, routes and authoritative state belong to the host/backend. */
export function mountPaymentsPanel(element,options){
 const {clientId,mode,request,productLabels={},productDescriptor,readOnly=false}=options;
 const canWrite=!readOnly&&options.canWrite===true,canConfirm=!readOnly&&options.canConfirm===true;
 if(!element||!['client','advisor'].includes(mode)||typeof request!=='function'||(productDescriptor!==undefined&&typeof productDescriptor!=='function'))throw Error('Invalid payments integration');
 const memory=options.taskState||{pending:null,quoteDraft:null,closed:false};
 const doc=element.ownerDocument,controller=new AbortController(),timers=new Set();let disposed=false,busy=false,view=null,generation=0;
 const uploads=new Map(),selectedOptions=new Map();
 if(!doc.querySelector('link[data-shelv-payments]')){const link=doc.createElement('link');link.rel='stylesheet';link.href=new URL('./payments.css',import.meta.url).href;link.dataset.shelvPayments='';doc.head.append(link);}
 const root=doc.createElement('section');root.className='shelv-payments';root.setAttribute('aria-label','Payments');element.replaceChildren(root);
 const node=(tag,text,className)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
 const append=(parent,...children)=>{for(const child of children)parent.append(child);return parent;};
 const button=(label,fn,primary=false)=>{const b=node('button',label,primary?'payment-button primary':'payment-button');b.type='button';b.disabled=busy;b.addEventListener('click',fn);return b;};
 const message=node('p','','payment-message');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
 const content=node('div'),actions=node('div','','payment-actions');
 append(root,append(node('header'),node('h2',mode==='advisor'?'Payment review':'Payments'),button('Reload latest',()=>load())),message,content,actions);
 if(request.syntheticPreview===true&&options.showSampleDisclosure!==false)root.insertBefore(node('p','Synthetic preview · sample payment details.','payment-muted'),message);
 const feedback=text=>{message.textContent=text;};
 const uid=()=>globalThis.crypto.randomUUID();
 function setBusy(value){busy=value;root.setAttribute('aria-busy',String(value));root.querySelectorAll('button,input,select,textarea').forEach(control=>{control.disabled=value||control.dataset.locked==='true'||Boolean(memory.pending&&content.contains(control));});}
 function clearRetry(){actions.replaceChildren();}
 function retryControl(){clearRetry();if(!memory.pending)return;append(actions,button('Retry same request',()=>perform(memory.pending),true),button('Reload latest',()=>load()));}
 async function perform(intent){
  const permitted=intent.command?.action==='confirm_payment'?mode==='advisor'&&canConfirm:canWrite;
  if(disposed||memory.closed||busy||!permitted)return;if(memory.pending&&memory.pending!==intent){feedback('Retry the same request or reload the latest details before another action.');return;}memory.pending=intent;setBusy(true);clearRetry();feedback('Saving…');
  try{
   const result=await request(intent.command,{signal:controller.signal});if(disposed||memory.closed)return;
   if(intent.kind==='upload'){
    if(result?.status!=='uploaded_unverified'||result.quoteId!==intent.quoteId||typeof result.evidenceId!=='string'||intent.paymentOptionId&&(result.schemaVersion!==2||result.paymentOptionId!==intent.paymentOptionId))throw Error('invalid_response');
    uploads.set(intent.uploadKey||intent.quoteId,result.evidenceId);feedback('Screenshot attached privately. Payment receipt is still unverified.');memory.pending=null;render();
   }else{
    validateMethodReceipt(intent.command,result);
    memory.pending=null;if(intent.command.action==='issue_quote')memory.quoteDraft=null;await load(intent.command.action==='confirm_payment'?'Payment receipt confirmed.':intent.command.action==='submit_claim'?'Marked as sent. Your advisor still needs to confirm receipt in the selected receiving account.':intent.command.action==='issue_quote'?'Final quote issued.':intent.command.action==='confirm_shipping_address'?(mode==='client'?'Shipping address confirmed. New product quotes can use this address.':'Shipping address confirmed. Product quotes require this address version.'):'Claim rejected.');
   }
  }catch(error){if(disposed||memory.closed)return;feedback(publicError(error));if([400,401,403,409,413,415].includes(error?.status)){memory.pending=null;clearRetry();}else retryControl();}
  finally{if(!disposed)setBusy(false);}
 }
 async function load(success,preservePending=false){
  if(disposed||memory.closed)return;const current=++generation;clearRetry();setBusy(true);if(!success)feedback('Loading payment details…');
  try{const raw=await request(mode==='advisor'?{action:'advisor_read',clientId,schemaVersion:2}:{action:'client_read',schemaVersion:2},{signal:controller.signal});if(disposed||memory.closed||current!==generation)return;view=paymentViewWithMethods(raw,{recipientRequired:!readOnly});if(!preservePending)memory.pending=null;render();if(memory.pending)retryControl();feedback(success||'');}
  catch(error){if(disposed||memory.closed||current!==generation)return;view=null;content.replaceChildren(node('p','Payment details could not load. Try Reload latest.','payment-muted'));feedback(success?success+' Reload latest to see the updated payment details.':publicError(error));if(memory.pending)retryControl();}
  finally{if(!disposed&&current===generation)setBusy(false);}
 }
 const field=(label,type='text',value='')=>{const wrap=node('label',undefined,'payment-field'),input=node('input');input.type=type;input.value=value;append(wrap,node('span',label),input);return {wrap,input};};
 function lock(control){control.disabled=true;control.dataset.locked='true';return control;}
 function financialTable(quote){const table=node('dl','','payment-amounts');for(const row of quoteRows(quote,productLabels,productDescriptor)){const line=node('div','','payment-amount-row'),label=node(row.productUrl?'a':'span',row.label,row.productUrl?'payment-product-link':undefined);if(row.productUrl){label.href=row.productUrl;label.target='_blank';label.rel='noopener noreferrer';label.referrerPolicy='no-referrer';}append(line,append(node('dt'),label,node('small',row.detail)),node('dd',formatMoney(row.amountCents)));table.append(line);}const total=node('div','','payment-amount-row payment-total');append(total,node('dt','Total payment'),node('dd',formatMoney(quote.totalCents)));table.append(total);return table;}
 function selectedOption(quote){if(quote.contractVersion!==2){const recipient=view.legacyRecipient||view.recipient;return recipient?{id:null,recipient,available:true}:null;}const available=quote.paymentOptions.filter(o=>o.available),chosen=selectedOptions.get(quote.id);return chosen!==undefined?(available.find(o=>o.id===chosen)||null):(available.length===1?available[0]:null);}
 function recipientBlock(option,legacy=false){const r=option.recipient,box=node('section',undefined,'payment-selected-recipient');append(box,node('h4',methodLabels[r.method]+' recipient'),node('strong',r.name));for(const value of r.method==='cash_app'?[r.cashtag]:r.method==='apple_cash'?[r.phone]:[r.email,r.phone])box.append(node('p',value));box.append(node('small',legacy?'Current Zelle instructions; historical recipient details were not recorded.':'Recipient saved with this quote. Verify the same account before sending.','payment-muted'));box.append(button('Copy '+methodLabels[r.method]+' recipient',async()=>{try{await navigator.clipboard.writeText(recipientIdentifier(r));feedback('Recipient copied.');}catch{feedback('Copy is unavailable. Use the exact recipient shown.');}}));return box;}
 function methodChoices(quote){const group=node('fieldset',undefined,'payment-method-choices');group.append(node('legend','Choose how to pay'));const selected=selectedOption(quote);for(const option of quote.paymentOptions){const label=node('label',undefined,'payment-method-tile'),radio=node('input'),img=node('img');radio.type='radio';radio.name='payment-method-'+quote.id;radio.value=option.id;radio.setAttribute('aria-label',methodLabels[option.recipient.method]);radio.checked=selected?.id===option.id;if(!option.available)lock(radio);img.src=methodAsset(option.recipient.method);img.alt='';img.width=52;img.height=32;append(label,radio,img,node('span',methodLabels[option.recipient.method]));radio.addEventListener('change',()=>{selectedOptions.set(quote.id,option.id);render();});group.append(label);}if(!quote.paymentOptions.some(o=>o.available))group.append(node('p','Payment methods are unavailable. Contact your advisor before sending.','payment-muted'));return group;}
 function quoteCard(quote){
  const card=node('article','','payment-card');const related=view.claims.filter(claim=>claim.quoteId===quote.id);const confirmed=related.some(claim=>claim.status==='confirmed');
  append(card,append(node('div','','payment-card-head'),node('h3',`Quote ${quote.version}`),node('span',confirmed?'Payment receipt confirmed':quote.status==='superseded'?'Superseded':quote.status==='settled'?'Settled':'Final quote','payment-badge')),financialTable(quote));
  const boundAddress=view.shippingAddresses.find(entry=>entry.version===quote.shippingAddressVersion);
  const addressMatches=quote.productTotalCents===0||Boolean(boundAddress&&view.shippingAddress?.version===quote.shippingAddressVersion);
  if(quote.productTotalCents>0){card.append(node('p',mode==='client'?'Shipping address for this quote':`Shipping address for this quote · version ${quote.shippingAddressVersion}.`,'payment-muted'));if(boundAddress)card.append(addressLines(boundAddress.address));if(!addressMatches)card.append(node('p',mode==='client'?'The shipping address has changed since this quote. Confirm the address with your advisor before an order is placed. This quote uses the saved address shown above.':'Address changed—confirm with the client before ordering. This quote is bound to the address version shown.','payment-notice'));}
  if(mode==='client'&&quote.items.length===0&&quote.serviceCents>0)card.append(node('p','This quote is for service only; no products are included.','payment-muted'));
  if(confirmed)card.append(node('p',quote.productTotalCents&&!addressMatches?'Payment is confirmed. The changed shipping address needs advisor review before ordering.':quote.productTotalCents?(mode==='client'?'Your product payment is confirmed. Ordering, delivery and the date you start using the product are separate steps.':'Product funds are verified and ready to purchase. Purchase, delivery and actual start are separate steps.'):'Service payment is confirmed. Plan access follows the confirmed service period.','payment-muted'));
  if(mode==='client'&&quote.status==='payable'&&!confirmed){
   const waiting=related.some(claim=>claim.status==='submitted_unverified');
   if(waiting)card.append(node('p','Marked as sent · awaiting your advisor’s receipt check. A screenshot does not confirm that the payment was received.','payment-notice'));
   else if(canWrite&&addressMatches){
    const option=selectedOption(quote),uploadKey=quote.id+':'+(option?.id||'legacy');if(quote.contractVersion===2)card.append(methodChoices(quote));if(option)card.append(recipientBlock(option,quote.contractVersion!==2));
    if(!option)card.append(node('p','Choose an available payment method before sending.','payment-muted'));else{
    const file=field('Optional private screenshot','file');file.input.accept='image/png,image/jpeg';
    file.input.addEventListener('change',()=>{const selected=file.input.files?.[0];if(!selected)return;if(!['image/png','image/jpeg'].includes(selected.type)||selected.size>5*1024*1024){feedback('Choose a PNG or JPEG screenshot no larger than 5 MiB.');return;}
     const form=new FormData();form.set('metadata',JSON.stringify({action:'upload_evidence',requestId:uid(),completionRequestId:uid(),expectedRevision:view.revision,quoteId:quote.id,quoteVersion:quote.version,...(quote.contractVersion===2?{schemaVersion:2,paymentOptionId:option.id}:{})}));form.set('file',selected);perform({kind:'upload',quoteId:quote.id,uploadKey,paymentOptionId:option.id,command:form});});
    let addressAck=null;if(quote.productTotalCents>0){addressAck=field('Use this confirmed shipping address for this quote','checkbox');addressAck.input.checked=false;card.append(addressAck.wrap);}
    const sent=button('I’ve sent the payment',()=>{if(!addressAck||addressAck.input.checked)perform({command:methodClaimCommand(quote,option.id,view.revision,uploads.get(uploadKey)||null,uid())});},true);
    if(addressAck){lock(sent);addressAck.input.addEventListener('change',()=>{sent.dataset.locked=String(!addressAck.input.checked);sent.disabled=busy||!addressAck.input.checked;});}
    append(card,node('p','Use '+methodLabels[option.recipient.method]+' to send the exact total shown. One payment covers the quoted amounts.','payment-muted'),file.wrap,node('small',uploads.has(uploadKey)?'Screenshot attached privately for this payment method. Receipt is still unverified.':'PNG or JPEG, up to 5 MiB. A screenshot supports review; it does not confirm receipt.','payment-muted'),sent);}
   }else card.append(node('p','Payment actions are unavailable for this account.','payment-muted'));
  }
  for(const claim of related){
   const row=node('section','','payment-claim');append(row,node('h4',claim.status==='submitted_unverified'?(mode==='client'?'Reported payment · awaiting bank check':'Unverified payment claim'):claim.status==='confirmed'?(mode==='client'?'Payment receipt confirmed':'Confirmed claim'):(mode==='client'?'Payment report rejected':'Rejected claim')));
   const savedOption=quote.paymentOptions?.find(o=>o.id===claim.paymentOptionId);if(savedOption)row.append(recipientBlock(savedOption));else row.append(node('p','Zelle · legacy record. Recipient details were not recorded.','payment-muted'));
   if(!readOnly&&claim.evidenceId)row.append(button('View private screenshot',()=>showEvidence(claim.evidenceId,row)));
   if(mode==='advisor'&&claim.status==='submitted_unverified'&&quote.status==='payable'){
    if(canConfirm){
     const receiving=savedOption?methodLabels[savedOption.recipient.method]+' account':'bank account',check=field(`I verified the client’s ${formatMoney(quote.totalCents)} payment in the ${receiving}`,'checkbox');check.input.checked=false;
     const confirm=button('Confirm payment receipt',()=>{if(check.input.checked)perform({command:methodConfirmationCommand(quote,claim,clientId,view.revision,true,uid())});},true);lock(confirm);
     check.input.addEventListener('change',()=>{confirm.dataset.locked=String(!check.input.checked);confirm.disabled=busy||!check.input.checked;});
     append(row,node('p','Check the client’s gross payment and exact receiving account shown. Provider fees may reduce the net payout. A screenshot or “sent” claim is not verification.','payment-notice'),check.wrap,confirm);
    }
    if(canWrite){
     const reason=node('select');reason.setAttribute('aria-label','Reason for rejecting claim');for(const [value,label] of [['not_received','Not received'],['amount_mismatch','Amount does not match'],['duplicate_claim','Duplicate claim'],['wrong_recipient','Wrong recipient']]){const option=node('option',label);option.value=value;reason.append(option);}
     append(row,append(node('div','','payment-reject'),reason,button('Reject claim',()=>perform({command:methodRejectionCommand(quote,claim,clientId,view.revision,reason.value,uid())}))));
    }
   }card.append(row);
  }return card;
 }
 async function showEvidence(evidenceId,parent){
  if(readOnly||disposed||memory.closed||busy)return;setBusy(true);feedback('Opening private screenshot…');
  try{const result=await request({action:'evidence_url',evidenceId,schemaVersion:2},{signal:controller.signal});if(disposed||memory.closed)return;const url=new URL(result.signedUrl);if(result.evidenceId!==evidenceId||url.protocol!=='https:'||result.expiresInSeconds>60||result.expiresInSeconds<1)throw Error('invalid_response');
   parent.querySelector('.payment-evidence')?.remove();const holder=node('div','','payment-evidence'),image=node('img');image.alt='Private payment screenshot';image.referrerPolicy='no-referrer';image.src=url.href;
   append(holder,image,node('small','Private payment screenshot.'),button('Hide screenshot',()=>holder.remove()));parent.append(holder);const timer=setTimeout(()=>{holder.remove();timers.delete(timer);},result.expiresInSeconds*1000);timers.add(timer);feedback('');
  }catch(error){if(!disposed)feedback(publicError(error));}finally{if(!disposed)setBusy(false);}
 }
 function addressLines(address){const block=node('div','','payment-private-address');for(const field of ['recipientName','line1','line2'])if(address[field])block.append(node('div',address[field]));block.append(node('div',`${address.city}, ${address.region} ${address.postalCode}`),node('div',address.countryCode));return block;}
 function shippingCard(beforeQuote=false){
  const card=node('section','','payment-card');append(card,node('h3','Private shipping address'),node('p',beforeQuote?'Add an address if you want products included in a quote.':'Products are ordered manually and sent directly to the confirmed address. A confirmed payment does not mean an order has been placed or shipped.','payment-muted'));
  if(view.shippingAddress)append(card,node('p',mode==='client'?'Confirmed shipping address':`Confirmed address · version ${view.shippingAddress.version}`,'payment-muted'),addressLines(view.shippingAddress.address));else if(!beforeQuote)card.append(node('p','Confirm a shipping address before your advisor issues a product quote.','payment-muted'));
  if(mode==='client'&&canWrite){
   const details=node('details'),summary=node('summary',view.shippingAddress?'Update shipping address':'Confirm shipping address'),form=node('form'),fields={};details.append(summary);
   const labels={recipientName:'Recipient name',line1:'Street address',line2:'Apartment or unit (optional)',city:'City',region:'State or region',postalCode:'Postal code',countryCode:'Country code (2 letters)'};
   for(const [key,label] of Object.entries(labels)){const fieldRow=field(label,'text',view.shippingAddress?.address[key]??'');fieldRow.input.required=key!=='line2';fieldRow.input.maxLength={recipientName:200,line1:200,line2:200,city:100,region:100,postalCode:20,countryCode:2}[key];fields[key]=fieldRow.input;form.append(fieldRow.wrap);}
   const acknowledgement=field('I confirm this address is correct for direct shipping','checkbox');acknowledgement.input.required=true;form.append(acknowledgement.wrap);if(!beforeQuote)form.append(node('p','Changing the address requires a new unpaid product quote, including tax and shipping.','payment-muted'));
   const submit=node('button','Confirm private shipping address','payment-button primary');submit.type='submit';form.append(submit);form.addEventListener('submit',event=>{event.preventDefault();if(!acknowledgement.input.checked||busy)return;try{perform({command:addressCommand(Object.fromEntries(Object.entries(fields).map(([key,input])=>[key,input.value])),view.revision,uid())});}catch(error){feedback(publicError(error));}});append(details,form);card.append(details);
  }return card;
 }
 function issueForm(){
  const context=options.quoteContext,canonical=Number.isSafeInteger(context?.publicationVersion)&&context.publicationVersion>=0&&Array.isArray(context.recommendations);
  const basis=JSON.stringify({publicationVersion:canonical?context.publicationVersion:null,addressVersion:view.shippingAddress?.version??null});
  const saved=memory.quoteDraft,changed=Boolean(saved&&saved.basis!==basis);
  const form=node('form','','payment-card payment-quote-form');append(form,node('h3','Issue final quote'));
  if(changed){append(form,node('p','The published plan or shipping address changed. Your unfinished amounts are preserved. Start a new quote against the current details before issuing.','payment-notice'),button('Start a new quote',()=>{memory.quoteDraft=null;render();}));}
  const publication=field(canonical?'Published plan version':'Published plan version (0 before first publication)','number',String(canonical?context.publicationVersion:saved?.publicationVersion??''));publication.input.min='0';publication.input.step='1';publication.input.required=true;publication.input.readOnly=canonical;
  const startsWithPublication=()=>view.nextServicePeriod===null;
  const service=field('Include monthly service · $100.00','checkbox');service.input.checked=saved?.service??view.service.status==='unpaid';if(view.service.status==='pending_publication')lock(service.input);const start=field('Service coverage starts','date',view.nextServicePeriod?.startOn??'');start.input.readOnly=true;
  const updatePeriod=()=>{start.input.required=service.input.checked&&!startsWithPublication();start.wrap.hidden=!start.input.required;};updatePeriod();service.input.addEventListener('change',updatePeriod);publication.input.addEventListener('change',updatePeriod);
  form.append(node('p','The first service period starts with publication. Later service periods use the coverage date shown. Products, tax and shipping must be final.','payment-muted'));
  const lines=node('div','','payment-product-lines'),items=[];
  let capture=()=>{};
  const eligible=canonical?context.recommendations.filter(item=>item.approved===true):[];
  const addLine=(value={})=>{
   const line=node('div','','payment-product-line'),recommendation=canonical?{wrap:node('label',undefined,'payment-field'),input:node('select')}:field('Recommendation ID');
   if(canonical){append(recommendation.wrap,node('span','Product'),recommendation.input);const placeholder=node('option','Choose an approved product');placeholder.value='';recommendation.input.append(placeholder);for(const item of eligible){const option=node('option',item.label);option.value=item.id;recommendation.input.append(option);}if(value.recommendationId&&!eligible.some(item=>item.id===value.recommendationId)){const option=node('option','Previously selected product is no longer approved');option.value=value.recommendationId;option.disabled=true;recommendation.input.append(option);}}
   if(canonical)recommendation.input.setAttribute('aria-label','Product');recommendation.input.value=value.recommendationId||'';
   const quantity=field('Quantity','number',value.quantity||'1'),unit=field('Unit price in USD','text',value.unitPrice||'');quantity.input.min='1';quantity.input.max='100';quantity.input.step='1';for(const f of [recommendation,quantity,unit]){f.input.required=true;line.append(f.wrap);}unit.input.inputMode='decimal';const item={line,recommendation,quantity,unit};items.push(item);line.append(button('Remove',()=>{line.remove();items.splice(items.indexOf(item),1);capture();}));lines.append(line);
  };
  const tax=field('Final product tax in USD','text',saved?.tax??'0.00'),shipping=field('Final product shipping in USD','text',saved?.shipping??'0.00');tax.input.inputMode=shipping.input.inputMode='decimal';
  const final=field('Tax and shipping are final, including any zero amounts','checkbox');final.input.required=true;
  const addProduct=button('Add product line',()=>{addLine();capture();});if(canonical&&!eligible.length)lock(addProduct);
  append(form,publication.wrap,service.wrap,start.wrap,lines,addProduct,append(node('div','','payment-two-fields'),tax.wrap,shipping.wrap),final.wrap);
  if(canonical&&!eligible.length)form.append(node('p','No approved products are available for this quote. Service can be quoted separately.','payment-muted'));
  for(const item of saved?.items||[])addLine(item);
  capture=()=>{memory.quoteDraft={basis:saved?.basis||basis,publicationVersion:publication.input.value,service:service.input.checked,items:items.map(item=>({recommendationId:item.recommendation.input.value,quantity:item.quantity.input.value,unitPrice:item.unit.input.value})),tax:tax.input.value,shipping:shipping.input.value};};
  form.addEventListener('input',capture);form.addEventListener('change',capture);
  const submit=node('button','Issue final quote','payment-button primary');submit.type='submit';if(changed)lock(submit);form.append(submit);
  form.addEventListener('submit',event=>{event.preventDefault();if(busy||!canWrite||changed)return;try{const selected=items.map(item=>({recommendationId:item.recommendation.input.value.trim(),quantity:item.quantity.input.value,unitPrice:item.unit.input.value}));if(canonical&&selected.some(item=>!eligible.some(product=>product.id===item.recommendationId)))throw Error('invalid_input');perform({command:{...issueQuoteCommand({publicationVersion:publication.input.value,service:service.input.checked,startOn:view.nextServicePeriod?.startOn??'',startsOnFirstPublication:startsWithPublication(),shippingAddressVersion:view.shippingAddress?.version??null,items:selected,tax:tax.input.value,shipping:shipping.input.value,finalCosts:final.input.checked},clientId,view.revision,uid()),schemaVersion:2}});}catch(error){feedback(publicError(error));}});return form;
 }

 function render(){
  content.replaceChildren();if(!view)return;
  const beforeQuote=mode==='client'&&!view.quotes.length;
  if(beforeQuote)content.append(append(node('section','','payment-card'),node('h3','No quote yet'),node('p','Your advisor hasn’t issued a final quote yet. Wait for the final amount before paying.','payment-muted')));
  content.append(append(node('section',undefined,'payment-refund-policy'),node('h3','Service-fee refunds'),node('p',SERVICE_COPY.guarantee,'payment-muted'),node('p',SERVICE_COPY.guaranteeScope,'payment-muted'),node('p',SERVICE_COPY.productRefund,'payment-muted')));
  const serviceCopy={unpaid:'Service payment has not been confirmed.',pending_publication:'Service payment is confirmed. Your first month starts with the first plan publication.',active:'Your service is active for the confirmed coverage period.',expired:'The confirmed service period has ended.',cancelled:'Service is cancelled. Contact your advisor about access to your previous plan.'};if(!beforeQuote||view.service.status!=='unpaid')content.append(node('p',serviceCopy[view.service.status],'payment-notice'));
  content.append(shippingCard(beforeQuote));
  if(!view.quotes.length&&!beforeQuote)content.append(node('p',mode==='advisor'?'No final quotes issued yet.':'Your advisor has not issued a final quote yet.','payment-muted'));
  for(const quote of [...view.quotes].sort((a,b)=>b.version-a.version))content.append(quoteCard(quote));
  if(mode==='advisor'&&canWrite)content.append(issueForm());
  if(mode==='advisor'&&!canWrite&&!canConfirm)content.append(node('p','Read-only payment access. Payment confirmation and quote changes require separate permission.','payment-muted'));
 }
 load(undefined,true);const cleanup=()=>{disposed=true;generation++;controller.abort();for(const timer of timers)clearTimeout(timer);uploads.clear();if(!options.taskState){memory.pending=null;memory.quoteDraft=null;memory.closed=true;}if(root.parentNode===element)root.remove();};cleanup.hasPending=()=>Boolean(memory.pending);return cleanup;
}
