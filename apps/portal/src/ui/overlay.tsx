// shadcn/ui Radix Dialog/Sheet adaptation, sharing one guarded lifecycle.
import {createContext,useContext,useId,useLayoutEffect,useRef,useState,useSyncExternalStore} from 'react';
import type {ReactElement,ReactNode,RefObject} from 'react';
import {Dialog as DialogPrimitive} from 'radix-ui';
import {createOverlayCoordinator} from './overlay-state.ts';
import {Button} from './primitives.tsx';
import {Icon} from './icons.tsx';

const OverlayContext=createContext<ReturnType<typeof createOverlayCoordinator>|null>(null);
const InsideOverlay=createContext(false);
function restoreFocus(candidates: (HTMLElement|null|undefined)[]) {
  for (const target of candidates) {
    if (!target?.isConnected || target===document.body || target===document.documentElement ||
        target.matches(':disabled') || target.closest('[hidden],[inert],[aria-hidden="true"]') || !target.getClientRects().length ||
        ['hidden','collapse'].includes(getComputedStyle(target).visibility)) continue;
    target.focus({preventScroll:true});
    if (document.activeElement===target) return;
  }
}
export function OverlayProvider({children}: {children: ReactNode}) {
  const [coordinator]=useState(createOverlayCoordinator);
  return <OverlayContext.Provider value={coordinator}>{children}</OverlayContext.Provider>;
}
export type CloseReason='escape'|'outside'|'close';
export interface OverlayProps {
  open: boolean;onOpenChange: (open: boolean)=>void;title: string;description?: string;children: ReactNode;trigger?: ReactElement;
  canClose?: (reason: CloseReason)=>boolean;initialFocusRef?: RefObject<HTMLElement|null>;restoreFocusRef?: RefObject<HTMLElement|null>;
  backLabel?: string;
}
function Overlay({kind,open,onOpenChange,title,description,children,trigger,canClose,initialFocusRef,restoreFocusRef,backLabel='back to plan'}: OverlayProps & {kind:'dialog'|'sheet'}) {
  const coordinator=useContext(OverlayContext),nested=useContext(InsideOverlay),id=useId();
  if (!coordinator) throw new Error('shared overlays require OverlayProvider');
  const active=useSyncExternalStore(coordinator.subscribe,coordinator.getSnapshot,()=>null);
  const opener=useRef<HTMLElement|null>(null);
  useLayoutEffect(()=>{
    if (!open || nested) return;
    if (!coordinator.claim(id)) {onOpenChange(false);return;}
    opener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
    return()=>coordinator.release(id);
  },[open,nested,coordinator,id]);
  const requestClose=(reason: CloseReason)=>{if (canClose?.(reason)!==false) onOpenChange(false);};
  if (nested) return null;
  return <DialogPrimitive.Root open={open && active===id} onOpenChange={next=>{if(next)onOpenChange(true);else requestClose('close');}}>
    {trigger?<DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>:null}
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={`shelv-overlay shelv-overlay-${kind}`} />
      <DialogPrimitive.Content data-slot={kind} className={`shelv-modal shelv-${kind}`} {...(description?{}:{'aria-describedby':undefined})}
        onEscapeKeyDown={event=>{event.preventDefault();requestClose('escape');}}
        onPointerDownOutside={event=>{event.preventDefault();requestClose('outside');}}
        onOpenAutoFocus={event=>{if(initialFocusRef?.current){event.preventDefault();initialFocusRef.current.focus();}}}
        onCloseAutoFocus={event=>{
          event.preventDefault();
          const original=opener.current;
          restoreFocus([restoreFocusRef?.current,original,original?.id?document.getElementById(original.id):null,document.querySelector<HTMLElement>('[data-page-heading]')]);
        }}>
        {kind==='sheet'?<><DialogPrimitive.Title className="shelv-visually-hidden">{title}</DialogPrimitive.Title><div className="shelv-sheet-back"><Icon name="arrow-left"/><Button variant="ghost" onClick={()=>requestClose('close')}>{backLabel}</Button></div></>:<div className="shelv-modal-heading"><DialogPrimitive.Title>{title}</DialogPrimitive.Title><Button variant="ghost" className="shelv-close" onClick={()=>requestClose('close')}><Icon name="close" size="small"/>close</Button></div>}
        {description?<DialogPrimitive.Description className="shelv-modal-description">{description}</DialogPrimitive.Description>:null}
        <InsideOverlay.Provider value={true}>{children}</InsideOverlay.Provider>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
export function Dialog(props: OverlayProps) {return <Overlay {...props} kind="dialog"/>;}
export function Sheet(props: OverlayProps) {return <Overlay {...props} kind="sheet"/>;}
