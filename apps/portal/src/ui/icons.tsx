import {ArrowLeft,PanelsTopLeft,Clock3,Package,UserRound,MessageCircle,Check,X,ChevronDown,ChevronUp,LoaderCircle,TriangleAlert,Info,Menu,Search} from 'lucide-react';
import type {ComponentProps} from 'react';
const icons={'arrow-left':ArrowLeft,plan:PanelsTopLeft,history:Clock3,orders:Package,account:UserRound,contact:MessageCircle,check:Check,close:X,'chevron-down':ChevronDown,'chevron-up':ChevronUp,loading:LoaderCircle,warning:TriangleAlert,info:Info,menu:Menu,search:Search};
export type IconName=keyof typeof icons;
export type IconProps=Omit<ComponentProps<typeof Check>,'size'|'strokeWidth'|'name'> & {name: IconName;size?: 'small'|'standard'|'large'};
/** Decorative by default. Important actions carry their own visible text. */
export function Icon({name,size='standard',...props}: IconProps) {
  const Component=icons[name];
  return <Component aria-hidden="true" focusable="false" {...props} size={size==='small'?18:size==='large'?24:20} strokeWidth={2}/>;
}
