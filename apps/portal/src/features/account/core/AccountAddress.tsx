import {useState,useSyncExternalStore} from 'react';
import {Button,Dialog,Field,Input,Select,StatusNotice} from '../../../ui/index.ts';
import type {AccountAddressController} from './controller.ts';
import {addressFields} from './model.ts';
import type {ShippingAddress} from './model.ts';

function Address({address}:{address:ShippingAddress}) {
  return <address>{address.recipientName}<br/>{address.line1}<br/>
    {address.line2?<>{address.line2}<br/></>:null}
    {address.city}, {address.region} {address.postalCode}<br/>{address.countryCode}</address>;
}

/** Address fragment only. W0 owns the Account heading and controller lifetime;
 * accepted Profile, service dates, consent and export retain their own modules. */
export function AccountAddress({controller}:{controller:AccountAddressController}) {
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  const [historyVersion,setHistoryVersion]=useState('');
  const data=state.data,newAddressAllowed=!!data&&data.service.status!=='cancelled';
  const editable=state.phase==='editing'&&newAddressAllowed,busy=state.phase==='saving';
  const rendered=()=>controller.getSnapshot()===state;
  if(state.phase==='ended')return <StatusNotice tone="denied" title="sign in again to view your address"/>;
  if(state.phase==='denied')return <StatusNotice tone="denied" title="address details are unavailable"/>;
  const selected=data?.shippingAddresses.find(address=>String(address.version)===historyVersion);
  return <section aria-label="shipping address" className="app-stack">
    <h2>shipping address</h2>
    {state.phase==='idle'||state.phase==='loading'?<StatusNotice tone="loading" title="loading your address"/>:null}
    {state.message?<StatusNotice tone={state.phase==='saved'?'success':state.phase==='uncertain'?'uncertain':state.phase==='conflict'?'warning':'error'} title={state.message}/>:null}
    {state.phase==='error'?<Button onClick={()=>{if(rendered())void controller.load();}}>try loading again</Button>:null}
    {data?.shippingAddress?<><p>address version {data.shippingAddress.version}</p><Address address={data.shippingAddress.address}/></>:data?<p>no confirmed shipping address</p>:null}
    {data?.service.status==='cancelled'?<p>shipping address changes are unavailable for cancelled service. existing orders require separate administration.</p>:null}
    {data&&newAddressAllowed&&['ready','saved'].includes(state.phase)?<div><Button variant="secondary" onClick={()=>{if(rendered())controller.editAddress();}}>{data.shippingAddress?'edit shipping address':'add shipping address'}</Button></div>:null}
    {editable&&state.draft?<form className="app-stack" onSubmit={event=>{event.preventDefault();if(rendered())controller.reviewAddress();}} noValidate>
      {addressFields.map(({key,label,autoComplete})=><Field key={key} label={label} error={state.errors[key]}>
        <Input autoComplete={autoComplete} value={state.draft![key]} onChange={event=>{if(rendered())controller.setField(key,event.target.value);}} required={key!=='line2'}/>
      </Field>)}
      <p>paid quotes and orders keep their original address. contact shelv separately about a change to an existing order.</p>
      <div className="app-actions"><Button type="submit">review address</Button><Button variant="secondary" onClick={()=>{if(rendered())controller.discardEdit();}}>discard edits</Button></div>
    </form>:null}
    <Dialog open={state.phase==='confirming'&&newAddressAllowed} onOpenChange={open=>{if(!open&&rendered())controller.backToEdit();}} title="confirm shipping address">
      {state.phase==='confirming'&&state.pending&&newAddressAllowed?<div className="app-stack">
        <Address address={state.pending.command.address}/>
        <p>paid quotes and orders keep their original address. unpaid product quotes may need a new quote. contact shelv separately about a change to an existing order.</p>
        <div className="app-actions"><Button onClick={()=>{if(rendered())void controller.confirmAddress();}}>confirm address</Button><Button variant="secondary" onClick={()=>{if(rendered())controller.backToEdit();}}>keep editing</Button></div>
      </div>:null}
    </Dialog>
    {busy?<StatusNotice tone="loading" title="confirming shipping address"/>:null}
    {state.phase==='uncertain'?<div><Button onClick={()=>{if(rendered())void controller.retryOriginal();}}>retry original confirmation</Button></div>:null}
    {state.phase==='conflict'&&state.pending?<>
      <div><h3>address when you started</h3>{state.pending.base?<Address address={state.pending.base.address}/>:<p>no confirmed address</p>}
        <h3>your changes</h3><Address address={state.pending.command.address}/>
        <h3>latest loaded address</h3>{data?.shippingAddress?<Address address={data.shippingAddress.address}/>:<p>no confirmed address</p>}
      </div>
      <div className="app-actions"><Button variant="secondary" onClick={()=>{if(rendered())void controller.load();}}>load latest address</Button>
        <Button disabled={!state.canReapply||!newAddressAllowed} onClick={()=>{if(rendered())controller.reapplyAddress();}}>reapply my changes</Button>
        <Button variant="ghost" onClick={()=>{if(rendered())controller.discardEdit();}}>discard my changes</Button></div>
    </>:null}
    {data&&data.shippingAddresses.length>1?<>
      <Field label="address history"><Select value={historyVersion} onValueChange={value=>{if(rendered())setHistoryVersion(value);}}
        options={data.shippingAddresses.map(address=>({value:String(address.version),label:`address version ${address.version}`}))} placeholder="choose an address version"/></Field>
      {selected?<Address address={selected.address}/>:null}
    </>:null}
  </section>;
}
