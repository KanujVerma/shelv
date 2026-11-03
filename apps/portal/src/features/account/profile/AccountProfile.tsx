import {useSyncExternalStore} from 'react';
import {Button, Field, Input, StatusNotice} from '../../../ui/index.ts';
import type {AccountProfileController} from './types.ts';

/** C08 section only. Parent owns the Account wrapper and controller lifetime. */
export function AccountProfile({controller,presentation='summary'}:{controller:AccountProfileController;presentation?:'summary'|'edit'}) {
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  const draft=state.draft, current=state.current;
  const ownsDraft=()=>draft!==null && controller.getSnapshot().draft===draft;
  const discard=()=>{if(ownsDraft())controller.discardEdit();};
  return <>
    {presentation==='summary'?<>
    {current?<dl>
      <div><dt>name</dt><dd>{current.displayName}</dd></div>
    </dl>:null}
    {state.phase==='unread'?<StatusNotice title="your details have not been loaded"/>:null}
    {state.phase==='loading'?<StatusNotice tone="loading" title="reading your current details"/>:null}
    {state.phase==='error'?<StatusNotice tone="error" title="your current details are unavailable"/>:null}
    {state.phase==='denied' || state.phase==='ended'?<StatusNotice tone="denied" title={state.message??'your details are unavailable'}/>:null}
    {state.pending?<StatusNotice tone="uncertain" title={state.writeState==='saving'?'saving your name':'the original save result is uncertain'}>
      <p>original name change: {state.pending.displayName}</p>
      <Button variant="secondary" disabled={!state.canRetry} onClick={()=>void controller.save()}>retry original change</Button>
    </StatusNotice>:null}
    {state.acknowledgement && state.writeState!=='saved'?<StatusNotice title="original name change acknowledged">
      <p>{state.acknowledgement.displayName}</p><p>this acknowledgement is a record of the earlier change. current details are shown separately.</p>
    </StatusNotice>:null}
    {state.message && !['ended','denied'].includes(state.phase)?<StatusNotice tone={state.writeState==='saved'?'success':state.writeState==='conflict'?'warning':'neutral'} title={state.message}/>:null}
    <div>
      <Button variant="ghost" disabled={state.busy || ['ended','inactive'].includes(state.phase)} onClick={()=>void controller.readCurrent()}>read current details</Button>
    </div>
    </>:null}
    {presentation==='edit'?<>
      {draft?<form aria-label="edit your name" onSubmit={event=>{event.preventDefault();if(ownsDraft())void controller.save();}}>
        <Field label="name" error={state.fieldError??undefined} hint="use 1 to 200 characters, excluding surrounding spaces.">
          <Input name="displayName" autoComplete="name" value={draft.displayName} onChange={event=>{if(ownsDraft())controller.setDisplayName(event.target.value);}}/>
        </Field>
        {state.writeState==='conflict'?<StatusNotice tone="warning" title="compare your name change">
          <p>name when editing began: {draft.base.displayName}</p>
          <p>current name: {current?current.displayName:'read the current details to compare'}</p>
          <p>your unsaved name: {draft.displayName}</p>
          <p>discard this edit, then edit the current details to make a new change.</p>
        </StatusNotice>:null}
        <Button type="submit" disabled={!state.canSave} busy={state.writeState==='saving'}>save name</Button>
        <Button variant="secondary" disabled={state.busy} onClick={discard}>discard unsent edit</Button>
      </form>:null}
    </>:null}
  </>;
}
