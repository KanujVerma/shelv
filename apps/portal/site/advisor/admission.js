/** Founder-only authoring tool. It never sends mail or creates a client session. */
export function createAdmissionDialog({request,onOpenClient,onAdded=null,document:doc=globalThis.document}){
 const dialog=doc.createElement('dialog');dialog.className='advisor-dialog advisor-admission';doc.body.append(dialog);
 let intent=null,busy=false,disposed=false,receipt=null;
 const element=(tag,text,className)=>{const item=doc.createElement(tag);if(text!==undefined)item.textContent=text;if(className)item.className=className;return item;};
 const close=()=>{if(busy)return;if(intent&&!globalThis.confirm('Close this pending add? You can safely add the same email again to recover its record.'))return;dialog.close();};
 dialog.addEventListener('cancel',event=>{if(busy||intent){event.preventDefault();close();}});
 const button=(text,run,kind='quiet')=>{const control=element('button',text,kind);control.type='button';control.addEventListener('click',run);return control;};
 function render(){
  dialog.replaceChildren();const heading=element('h2',receipt?'Client ready':'Add client');heading.tabIndex=-1;
  dialog.append(button('×',close,'close'),heading);
  dialog.querySelector('.close').setAttribute('aria-label','Close dialog');
  if(receipt){
   dialog.append(element('p',receipt.status==='already_admitted'?'This client already has access. Their existing record is ready.':'The client record is ready for your consultation.'),element('strong',receipt.displayName),element('p',receipt.email,'advisor-subtitle'),element('p','No email has been sent.','advisor-admission-confirmation'),element('p','Share this portal link. Ask your client to enter this email and open their sign-in link in the same browser.'));
   const label=element('label','Portal link'),link=element('input');link.readOnly=true;link.value=receipt.portalUrl;label.append(link);dialog.append(label);
   const feedback=element('p','','advisor-subtitle');feedback.setAttribute('role','status');
   const controls=element('div',undefined,'advisor-dialog-actions');controls.append(button('Copy portal link',async()=>{try{await globalThis.navigator.clipboard.writeText(receipt.portalUrl);feedback.textContent='Portal link copied.';}catch{link.focus();link.select();feedback.textContent='Copy the selected portal link.';}}),button('Open client',async()=>{if(busy)return;busy=true;try{await onOpenClient(receipt.clientId);if(!disposed)dialog.close();}finally{busy=false;}},'solid'));dialog.append(feedback,controls);return;
  }
  dialog.append(element('p','Add the person you consulted with. Their plan and service payment are prepared separately.','advisor-subtitle'));
  const form=element('form'),fields={};
  for(const [key,text,type,max] of [['displayName','Client name','text',200],['email','Client email','email',254]]){
   const label=element('label',text),input=element('input');input.type=type;input.required=true;input.maxLength=max;input.autocomplete=key==='email'?'email':'name';input.value=intent?.[key]??'';input.readOnly=Boolean(intent);label.append(input);form.append(label);fields[key]=input;
  }
  form.append(element('p','Adding a client sends no email. You can share the portal link once their record is ready.','advisor-admission-note'));
  const feedback=element('p','','advisor-admission-feedback');feedback.setAttribute('role','status');form.append(feedback);
  const controls=element('div',undefined,'advisor-dialog-actions'),submit=element('button',intent?'Retry same add':'Add client','solid');submit.type='submit';controls.append(button('Cancel',close),submit);form.append(controls);dialog.append(form);
  const setBusy=value=>{busy=value;form.querySelectorAll('button').forEach(item=>item.disabled=value);for(const input of Object.values(fields))input.readOnly=value||Boolean(intent);};
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(busy||disposed)return;
   if(!intent){const email=fields.email.value.trim().toLowerCase(),displayName=fields.displayName.value.trim();if(!displayName||!email||/[\u0000-\u001f\u007f]/.test(displayName)){feedback.textContent='Enter the client name and email.';return;}intent=Object.freeze({action:'add_client',requestId:crypto.randomUUID(),email,displayName});}
   setBusy(true);feedback.textContent='Preparing the client record…';
   try{
    const result=await request({...intent});if(disposed)return;
    if(!result||result.requestId!==intent.requestId||!['admitted','already_admitted'].includes(result.status)||typeof result.clientId!=='string'||typeof result.displayName!=='string'||result.email!==intent.email||result.emailSent!==false||result.portalUrl!=='https://portal.goshelv.com/')throw Object.assign(Error('unverified receipt'),{status:503});
    receipt=result;intent=null;busy=false;render();try{await onAdded?.(result.clientId);}catch{/* The confirmed admission remains valid if directory refresh fails. */}
   }catch(error){if(disposed)return;const uncertain=!error.status||error.status>=500||[408,429].includes(error.status);if(!uncertain)intent=null;setBusy(false);submit.textContent=uncertain?'Retry same add':'Add client';feedback.textContent=uncertain?'The reply was interrupted. Retry the same add to recover the client record.':error.status===403?'Your account cannot add clients. Contact the founders.':error.status===409?'This account needs review before it can be added. Existing access has not been changed.':'Check the client name and email, then try again.';}
  });
 }
 return{open(){if(disposed)return;if(!dialog.open&&receipt)receipt=null;render();if(!dialog.open)dialog.showModal();dialog.querySelector('h2').focus();},hasPending:()=>Boolean(intent)||busy,dispose(){disposed=true;intent=null;receipt=null;dialog.close();dialog.remove();}};
}
