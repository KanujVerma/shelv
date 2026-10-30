import {useEffect,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {CLIENT_NAVIGATION} from '../navigation/routes.ts';
import type {PresentationMode,PortalRoute} from '../navigation/routes.ts';
import {RouteLink,usePortalNavigation} from '../navigation/react.tsx';
import {Badge,Button,Icon} from '../ui/index.ts';

export interface ContactPort {onContact: ()=>void;availability: 'service'|'administration'}
export interface PortalShellProps {children: ReactNode;identity: string;contact: ContactPort;mode: PresentationMode;context?: ReactNode;status?: ReactNode}
function activeSection(route: PortalRoute|null): string {
  const name=route?.name??'plan';
  return name.startsWith('history')?'history':name==='order'||name==='orders'?'orders':name.startsWith('account')?'account':'plan';
}
function ContactCard({contact}: {contact: ContactPort}) {
  return <div className="shelv-contact-card" data-foundation="contact">
    <p>{contact.availability==='service'?'a person, a text away':'orders or refunds?'}</p>
    <Button variant="secondary" onClick={contact.onContact}>text shelv</Button>
    {contact.availability==='service'?<span>replies within 24 hours</span>:null}
  </div>;
}
/** The client shell is shared by client, preview, public demo and historical modes.
 * Mode changes presentation only. Server projections decide capabilities/access.
 */
export function PortalShell({children,identity,contact,mode,context,status}: PortalShellProps) {
  const {route}=usePortalNavigation(),section=activeSection(route),[menuOpen,setMenuOpen]=useState(false);
  const toggle=useRef<HTMLButtonElement>(null);
  const navigation=useRef<HTMLElement>(null);
  useEffect(()=>{
    if(!menuOpen) return;
    const key=(event: KeyboardEvent)=>{if(event.key==='Escape'){setMenuOpen(false);toggle.current?.focus();}};
    const outside=(event: PointerEvent)=>{if(event.target instanceof Node && !navigation.current?.contains(event.target) && !toggle.current?.contains(event.target))setMenuOpen(false);};
    document.addEventListener('keydown',key);document.addEventListener('pointerdown',outside);
    return()=>{document.removeEventListener('keydown',key);document.removeEventListener('pointerdown',outside);};
  },[menuOpen]);
  return <div className="shelv-shell" data-mode={mode}>
    <a className="shelv-skip-link" href="#portal-content">skip to content</a>
    <aside className="shelv-sidebar" data-foundation="sidebar">
      <div className="shelv-sidebar-top"><span className="shelv-wordmark">shelv</span>
        <div className="shelv-mobile-controls"><Button variant="ghost" onClick={contact.onContact}>text shelv</Button><Button ref={toggle} variant="ghost" aria-expanded={menuOpen} aria-controls="client-navigation" onClick={()=>setMenuOpen(!menuOpen)}><Icon name={menuOpen?'close':'menu'}/>menu</Button></div>
      </div>
      <nav ref={navigation} id="client-navigation" aria-label="main navigation" className="shelv-client-nav" data-open={menuOpen}>
        {CLIENT_NAVIGATION.map(item=><RouteLink key={item.label} route={item.route} className="shelv-nav-link" aria-current={item.icon===section?'page':undefined} onClick={()=>setMenuOpen(false)}><Icon name={item.icon}/><span>{item.label}</span></RouteLink>)}
      </nav>
      <ContactCard contact={contact}/>
      <div className="shelv-identity" data-foundation="identity"><Icon name="account"/><span>{identity}</span></div>
    </aside>
    <div className="shelv-main">
      <header className="shelv-topbar" data-foundation="topbar"><div className="shelv-topbar-context">{context}</div>
        {status??(mode==='public-demo'?<Badge className="shelv-mode-badge">fictional demo</Badge>:mode==='advisor-preview'?<Badge className="shelv-mode-badge">advisor preview</Badge>:null)}
      </header>
      <main id="portal-content" className="shelv-content" tabIndex={-1} data-foundation="content">{children}</main>
    </div>
  </div>;
}
export function PageHeader({title,description,action}: {title: string;description?: ReactNode;action?: ReactNode}) {
  return <div className="shelv-page-header"><div><h1 data-page-heading tabIndex={-1}>{title}</h1>{description?<div className="shelv-page-description">{description}</div>:null}</div>{action?<div className="shelv-page-action">{action}</div>:null}</div>;
}
export function Panel({children,className=''}: {children: ReactNode;className?: string}) {return <section className={`shelv-panel ${className}`}>{children}</section>;}
