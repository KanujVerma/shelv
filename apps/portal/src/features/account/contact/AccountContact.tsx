import {useSyncExternalStore} from 'react';
import {Button,Field,Input,StatusNotice} from '../../../ui/index.ts';
import {contactRequestNotice} from './model.ts';
import type {AccountContactController} from './types.ts';

/** Fragment inside the single Account card or composer's shared edit dialog.
 * No mount effects, second edit entry, overlay, page heading or preference editor. */
export function AccountContact({controller,presentation='summary'}:{controller:AccountContactController;presentation?:'summary'|'edit'}) {
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  const busy=state.busy!==null,notice=contactRequestNotice(state),ended=state.phase==='ended'||state.phase==='denied';
  if(ended)return <StatusNotice tone="denied" title={state.message??'email details unavailable'}/>;
  if(presentation==='edit'){
    const draft=state.draft,review=state.review;
    const ownsDraft=()=>draft!==null && controller.getSnapshot().draft===draft;
    const ownsReview=()=>review!==null && controller.getSnapshot().review===review && ownsDraft();
    const discard=()=>{if(ownsDraft())controller.discardEdit();};
    if(!draft)return <div data-account-contact="edit">
      <StatusNotice tone={busy?'loading':notice?'uncertain':'neutral'} title={notice??(busy?'loading email details':'load your email details before editing.')}/>
      {state.message?<p role="status">{state.message}</p>:null}
    </div>;
    return <div data-account-contact="edit">
      {state.message?<StatusNotice tone={state.requestState==='conflict'?'warning':'neutral'} title={state.message}/>:null}
      {review?<section aria-label="email change to review">
        <p>email change to review</p><p>{review.email}</p>
        <p>a request does not confirm verification or change the current email shown in your account.</p>
        <div>
          <Button busy={state.busy==='request'} disabled={busy} onClick={()=>{if(ownsReview())void controller.requestChange();}}>request email change</Button>
          <Button variant="secondary" disabled={busy} onClick={()=>{if(ownsReview())controller.setEmail(review.email);}}>keep editing</Button>
        </div>
      </section>:<form onSubmit={event=>{event.preventDefault();if(ownsDraft())controller.reviewEmail();}}>
        <Field label="new email" error={state.emailError??undefined}>
          <Input type="email" autoComplete="email" value={draft.email} disabled={busy} onChange={event=>{if(ownsDraft())controller.setEmail(event.target.value);}}/>
        </Field>
        <div>
          {state.current&&draft.expectedContactBasis!==state.current.contactBasis?
            <Button disabled={busy} onClick={()=>{if(ownsDraft())controller.editEmail();}}>use current email details</Button>:
            <Button type="submit" disabled={busy||state.current?.pendingEmail.state==='pending'||(!!state.original&&state.requestState==='uncertain')}>review email change</Button>}
        </div>
      </form>}
      <Button variant="ghost" disabled={busy} onClick={discard}>discard unsent edit</Button>
    </div>;
  }
  return <div data-account-contact="summary">
    {state.current?<dl>
      <dt>email</dt><dd>{state.current.currentEmail.state==='known'?<>{state.current.currentEmail.address}<span> · {state.current.currentEmail.verified?'verified':'verification not confirmed'}</span></>:'current email unavailable'}</dd>
      <dt>pending email change</dt><dd>{state.current.pendingEmail.state==='pending'?state.current.pendingEmail.address:state.current.pendingEmail.state==='none'?'no pending email change':'pending email details unavailable'}</dd>
    </dl>:<StatusNotice tone={busy?'loading':state.phase==='unavailable'?'error':'neutral'} title={busy?'loading email details':state.message??'email details not loaded'}/>}
    <Button variant="ghost" busy={state.busy==='load'} disabled={busy} onClick={()=>void controller.load()}>{state.phase==='unread'?'load email details':'refresh email details'}</Button>
    {state.original?<section aria-label="original email change request">
      <p>original email change request</p><p>{state.original.email}</p>
      {notice?<StatusNotice tone={state.requestState==='uncertain'?'uncertain':'neutral'} title={notice}/>:null}
      <Button variant="secondary" busy={state.busy==='status'} disabled={busy} onClick={()=>void controller.readOriginalStatus()}>check original request status</Button>
    </section>:null}
  </div>;
}
