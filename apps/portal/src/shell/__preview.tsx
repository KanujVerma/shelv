/** Internal synthetic component harness only. No domain pages, sessions or network. */
import {useEffect,useMemo,useRef,useState} from 'react';
import {PortalShell,PageHeader,Panel} from './PortalShell.tsx';
import {NavigationProvider,usePortalNavigation,BackButton,RouteLink} from '../navigation/react.tsx';
import {createPortalNavigator} from '../navigation/history.ts';
import {Button,Input,Textarea,Field,Select,Tabs,Badge,Dialog,Sheet,StatusNotice,SaveStatus} from '../ui/index.ts';
import type {NoticeTone} from '../ui/index.ts';
import './preview.css';
function Specimens() {
  const {route}=usePortalNavigation();
  const [tab,setTab]=useState('morning'),[selection,setSelection]=useState(''),[notes,setNotes]=useState(''),[sheet,setSheet]=useState(false),[dialog,setDialog]=useState(false),[contact,setContact]=useState(false);
  const [guard,setGuard]=useState(false),[error,setError]=useState(false),[guardMessage,setGuardMessage]=useState('');
  const firstField=useRef<HTMLInputElement>(null);
  const productRoute={name:'product',productId:'card:synthetic-cerave',routine:'evening'} as const;
  return <PortalShell identity="Maya" mode="public-demo" contact={{availability:'service',onContact:()=>setContact(true)}}>
    <PageHeader title="shared controls" description="internal component preview · synthetic data only" action={<BackButton/>}/>
    <div className="shelv-preview-layout">
      <Panel>
        <h2>controls</h2>
        <div className="shelv-preview-actions"><Button className="shelv-preview-button">primary action</Button><Button className="shelv-preview-button" variant="secondary">secondary action</Button><Button className="shelv-preview-button" variant="ghost">context action</Button><Button className="shelv-preview-button" busy>saving</Button><Button className="shelv-preview-button" disabled>unavailable</Button></div>
        <div className="shelv-preview-badges"><Badge>neutral</Badge><Badge tone="pending">pending</Badge><Badge tone="active">current</Badge></div>
        <Tabs value={tab} onValueChange={setTab} label="routine period" items={[{value:'morning',label:'morning',content:<p>morning specimen</p>},{value:'evening',label:'evening',content:<p>evening specimen</p>}]}/>
        <div className="shelv-preview-fields">
          <Field id="preview-name" label="name" error={error?'enter a name before continuing':undefined}><Input placeholder="name"/></Field>
          <Field id="preview-select" label="reported date"><Select value={selection} onValueChange={setSelection} options={[{value:'today',label:'today'},{value:'earlier',label:'an earlier date'},{value:'unknown',label:'not sure'}]}/></Field>
          <Field id="preview-notes" label="notes" hint="preview text stays in this tab’s memory"><Textarea value={notes} onChange={event=>setNotes(event.target.value)}/></Field>
        </div>
        <div className="shelv-preview-actions"><Button variant="secondary" onClick={()=>setError(!error)}>toggle field error</Button><SaveStatus state={notes?'idle':'saved'}/></div>
      </Panel>
      <Panel>
        <h2>overlays & navigation</h2>
        <Sheet open={sheet} onOpenChange={setSheet} title="product sheet specimen" description="internal preview only" trigger={<Button id="preview-sheet-trigger" variant="secondary">open sheet</Button>} initialFocusRef={firstField} canClose={()=>{if(guard){setGuardMessage('unsent preview text remains. turn off the guard to close.');return false;}return true;}}>
          <Field id="sheet-note" label="preview note"><Input ref={firstField} value={notes} onChange={event=>setNotes(event.target.value)}/></Field>
          <Button variant="secondary" onClick={()=>{setGuard(!guard);setGuardMessage('');}}>{guard?'turn off close guard':'guard unsent work'}</Button>
          {guardMessage?<StatusNotice tone="warning" title={guardMessage}/>:null}
          <Button variant="secondary" onClick={()=>setDialog(true)}>try second overlay</Button>
        </Sheet>
        <Dialog open={dialog} onOpenChange={setDialog} title="dialog specimen" description="internal preview only" trigger={<Button id="preview-dialog-trigger" variant="secondary">open dialog</Button>}><Field label="dialog note"><Input/></Field></Dialog>
        <RouteLink id="product-cerave" route={productRoute}>open identified product route</RouteLink>
        <RouteLink route={{name:'product-evidence',productId:'card:synthetic-cerave',routine:'evening'}}>open its evidence route</RouteLink>
        <p className="shelv-preview-route">current route: {route?.name??'internal preview'}</p>
        <StatusNotice title="internal foundation preview">these controls do not publish, pay, order or send messages.</StatusNotice>
      </Panel>
    </div>
    <Panel><h2>shared feedback</h2><div className="shelv-preview-states">{(['loading','empty','error','warning','uncertain','denied','success'] as NoticeTone[]).map(tone=><StatusNotice key={tone} tone={tone} title={`${tone} specimen`}/>)}</div></Panel>
    <Dialog open={contact} onOpenChange={setContact} title="contact preview" description="no message is sent from this internal preview"><p>the connected portal supplies the authorized contact action.</p></Dialog>
  </PortalShell>;
}
export function FoundationPreview() {
  const navigator=useMemo(()=>createPortalNavigator(window,{scopeKey:'internal-preview'}),[]);
  useEffect(()=>()=>navigator.dispose(),[navigator]);
  return <NavigationProvider navigator={navigator}><Specimens/></NavigationProvider>;
}
