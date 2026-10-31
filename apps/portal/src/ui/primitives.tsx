// Adapted from shadcn/ui's Radix source. See THIRD_PARTY_NOTICES.md.
import {cloneElement, useId} from 'react';
import type {ComponentProps, ReactElement, ReactNode} from 'react';
import {Slot, Select as SelectPrimitive, Tabs as TabsPrimitive} from 'radix-ui';
import {cva} from 'class-variance-authority';
import type {VariantProps} from 'class-variance-authority';
import {clsx} from 'clsx';
import {Icon} from './icons.tsx';

export const buttonVariants=cva('shelv-button',{
  variants:{variant:{primary:'shelv-button-primary',secondary:'shelv-button-secondary',ghost:'shelv-button-ghost',destructive:'shelv-button-destructive'}},
  defaultVariants:{variant:'primary'},
});
export type ButtonProps=ComponentProps<'button'> & VariantProps<typeof buttonVariants> & {asChild?: boolean; busy?: boolean};
export function Button({className,variant='primary',asChild=false,busy=false,disabled,children,type='button',onClickCapture,...props}: ButtonProps) {
  const Comp=asChild?Slot.Root:'button';
  return <Comp {...props} {...(!asChild?{type,disabled:disabled||busy}:{'aria-disabled':disabled||busy||undefined})}
    data-slot="button" aria-busy={busy||undefined} className={clsx(buttonVariants({variant}),className)}
    onClickCapture={event=>{if(disabled||busy){event.preventDefault();event.stopPropagation();return;}onClickCapture?.(event);}}>
    {!asChild && busy?<><Icon name="loading" size="small" className="shelv-spinner" />{children}</>:children}
  </Comp>;
}
export function Input({className,type='text',...props}: ComponentProps<'input'>) {
  return <input {...props} type={type} data-slot="input" className={clsx('shelv-input',className)} />;
}
export function Textarea({className,...props}: ComponentProps<'textarea'>) {
  return <textarea {...props} data-slot="textarea" className={clsx('shelv-input','shelv-textarea',className)} />;
}
interface FieldControlProps {id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean|'true'|'false'}
export function Field({id:givenId,label,hint,error,children,className}: {id?: string;label: string;hint?: ReactNode;error?: string;children: ReactElement<FieldControlProps>;className?: string}) {
  const generated=useId(),id=givenId??generated;
  const descriptions=[children.props['aria-describedby'],hint?`${id}-hint`:null,error?`${id}-error`:null].filter(Boolean).join(' ')||undefined;
  return <div className={clsx('shelv-field',className)}>
    <label htmlFor={id}>{label}</label>
    {cloneElement(children,{id,'aria-describedby':descriptions,'aria-invalid':error?true:children.props['aria-invalid']})}
    {hint?<div id={`${id}-hint`} className="shelv-field-hint">{hint}</div>:null}
    {error?<p id={`${id}-error`} className="shelv-field-error" role="alert">{error}</p>:null}
  </div>;
}
export interface SelectOption {value: string;label: string;disabled?: boolean}
export interface SelectProps extends Pick<ComponentProps<typeof SelectPrimitive.Trigger>,'id'|'className'|'aria-describedby'|'aria-invalid'|'aria-label'|'ref'> {
  value: string;onValueChange: (value: string)=>void;options: readonly SelectOption[];placeholder?: string;disabled?: boolean;name?: string;required?: boolean;
}
export function Select({value,onValueChange,options,placeholder='select an option',disabled,name,required,className,...props}: SelectProps) {
  return <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled} name={name} required={required}>
    <SelectPrimitive.Trigger {...props} data-slot="select-trigger" className={clsx('shelv-input','shelv-select',className)}>
      <SelectPrimitive.Value placeholder={placeholder}/><SelectPrimitive.Icon asChild><Icon name="chevron-down" size="small"/></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal><SelectPrimitive.Content data-slot="select-content" position="popper" sideOffset={4} className="shelv-select-content">
      <SelectPrimitive.ScrollUpButton className="shelv-select-scroll"><Icon name="chevron-up" size="small"/></SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="shelv-select-viewport">
        {options.map(option=><SelectPrimitive.Item key={option.value} value={option.value} disabled={option.disabled} className="shelv-select-option">
          <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
          <SelectPrimitive.ItemIndicator><Icon name="check" size="small"/></SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>)}
      </SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="shelv-select-scroll"><Icon name="chevron-down" size="small"/></SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content></SelectPrimitive.Portal>
  </SelectPrimitive.Root>;
}
export interface TabItem {value: string;label: string;content: ReactNode;disabled?: boolean}
export function Tabs({value,onValueChange,items,label,className}: {value: string;onValueChange: (value: string)=>void;items: readonly TabItem[];label: string;className?: string}) {
  return <TabsPrimitive.Root value={value} onValueChange={onValueChange} className={className}>
    <TabsPrimitive.List aria-label={label} className="shelv-tabs-list">
      {items.map(item=><TabsPrimitive.Trigger key={item.value} value={item.value} disabled={item.disabled} className="shelv-tabs-trigger">{item.label}</TabsPrimitive.Trigger>)}
    </TabsPrimitive.List>
    {items.map(item=><TabsPrimitive.Content key={item.value} value={item.value} className="shelv-tabs-content">{item.content}</TabsPrimitive.Content>)}
  </TabsPrimitive.Root>;
}
const badgeVariants=cva('shelv-badge',{variants:{tone:{neutral:'shelv-badge-neutral',pending:'shelv-badge-pending',active:'shelv-badge-active'}},defaultVariants:{tone:'neutral'}});
export function Badge({tone='neutral',className,...props}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span {...props} data-slot="badge" className={clsx(badgeVariants({tone}),className)}/>;
}
export type NoticeTone='neutral'|'success'|'warning'|'error'|'loading'|'empty'|'uncertain'|'denied';
export function StatusNotice({tone='neutral',title,children,action}: {tone?: NoticeTone;title: string;children?: ReactNode;action?: ReactNode}) {
  return <div className="shelv-notice" data-tone={tone} role={tone==='error'?'alert':'status'} aria-live={tone==='error'?'assertive':'polite'}>
    <Icon name={tone==='loading'?'loading':tone==='success'?'check':tone==='warning'||tone==='error'||tone==='uncertain'?'warning':'info'} className={tone==='loading'?'shelv-spinner':undefined}/>
    <div><p className="shelv-notice-title">{title}</p>{children?<div className="shelv-notice-body">{children}</div>:null}{action?<div className="shelv-notice-action">{action}</div>:null}</div>
  </div>;
}
export type SaveState='idle'|'saving'|'saved'|'error'|'uncertain';
const saveLabels: Record<SaveState,string>={idle:'unsaved changes',saving:'saving',saved:'saved',error:'could not save',uncertain:'save result uncertain'};
/** Caller selects saved only after authoritative acknowledgement. No optimistic timer. */
export function SaveStatus({state}: {state: SaveState}) {return <span className="shelv-save-status" role="status" aria-live="polite">{state==='saving'?<Icon name="loading" size="small" className="shelv-spinner"/>:null}{saveLabels[state]}</span>;}
export function ToastRegion({children}: {children: ReactNode}) {return <div className="shelv-toast-region" aria-label="notifications">{children}</div>;}
