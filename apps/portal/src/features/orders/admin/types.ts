import type {CommerceCommand,CommerceDraftView,CommerceSnapshot,CommerceIndexEntry,CommerceEntityRef,CommerceReceipt,FrozenManualOption,ProductQuoteDraftBody,ProductQuoteLineDraft,ProductSelection,CommerceIdentity} from '../../../../../../src/contracts/PortalCommerce.ts';
import type {OperationOptions,OperationPort} from '../../../transport/session.ts';
import type {ApplicationSession} from '../../../app/session.ts';
import type {ProductQuoteInputs,ProductQuoteInputErrors} from './quote-inputs.ts';
import type {ProductQuoteShippingView} from './shipping.ts';

/** Local unsent preparation only; never a financial record or authority proof. */
export type ProductQuotePreparation={readonly body:ProductQuoteDraftBody;readonly lines:readonly ProductQuoteLineDraft[]};
export type AdminQuoteDraftSave=Extract<CommerceCommand,{action:'save_product_quote_draft_v1'}>;
export type AdminQuoteLineSave=Extract<CommerceCommand,{action:'save_product_quote_line_v1'}>;
export type AdminQuoteIssue=Extract<CommerceCommand,{action:'issue_product_quote_v1'}>;
export type AdminQuoteWrite=AdminQuoteDraftSave|AdminQuoteLineSave|AdminQuoteIssue;
export type AdminQuoteDraftSaveInput={clientId:string;requestId:string;draft:CommerceDraftView|null;body:ProductQuoteDraftBody};
export type AdminQuoteLineSaveInput={clientId:string;requestId:string;draft:CommerceDraftView;line:ProductQuoteLineDraft};
export type AdminQuoteIssueInput={clientId:string;requestId:string;draft:CommerceDraftView;snapshot:CommerceSnapshot;lines:readonly ProductQuoteLineDraft[]};
export type ProductQuoteAdminRead=Extract<CommerceCommand,{action:'read_advisor_commerce_v1'|'read_advisor_commerce_detail_v1'|'read_advisor_quote_components_v1'|'request_status_v1'}>;
export type ProductQuoteAdminCommand=ProductQuoteAdminRead|AdminQuoteWrite;
/** W0 supplies this actual creation-bound selected-client/live-finance port.
 * Its presence and the local correlation IDs never confer backend authority. */
export type ProductQuoteAdminRequest=OperationPort<ProductQuoteAdminCommand,unknown>;
export type ProductQuoteReadContext={actorId:string;clientId:string};
export type ProductQuoteReadOptions=OperationOptions;
export type ProductQuoteIndex={snapshot:CommerceSnapshot;entries:readonly CommerceIndexEntry[]};
export type ProductQuoteDraftRead={snapshot:CommerceSnapshot;draft:CommerceDraftView;lines:readonly ProductQuoteLineDraft[];options:readonly FrozenManualOption[]};
export type ProductQuoteDraftSelection={entity:CommerceEntityRef;snapshot:CommerceSnapshot};
export type ProductQuoteAdminPhase='initial'|'loading'|'ready'|'empty'|'unavailable'|'offline'|'conflict'|'denied'|'ended'|'error';
export type ProductQuoteAdminPending={command:AdminQuoteWrite|null;requestId:string|null;wire:string|null;hash:string|null;phase:'sending'|'uncertain';status:'unchecked'|'absent'|'failed'|'unsupported'};
export type ProductQuoteAdminState={phase:ProductQuoteAdminPhase;index:ProductQuoteIndex|null;loaded:ProductQuoteDraftRead|null;latest:ProductQuoteDraftRead|null;preparation:ProductQuotePreparation;inputs:ProductQuoteInputs;inputErrors:ProductQuoteInputErrors;dirty:boolean;reviewed:boolean;pending:ProductQuoteAdminPending|null;receipt:CommerceReceipt|null;error:number|null;available:boolean;localEditConflict:boolean;choosingProduct:string|null;choosingAddress:boolean};
export type ProductQuoteAdminControllerOptions={runtime:ApplicationSession;clientId:string;request?:ProductQuoteAdminRequest};
export type ProductQuotePublishedOption={selection:ProductSelection;identity:CommerceIdentity};
/** Actual authorized published option binding is supplied by W0, not a raw ID
 * form or an inferred private-draft publication. The callback grants no write. */
export type ProductQuoteProductPicker=(lineId:string)=>Promise<ProductQuotePublishedOption|null>;
/** A deliberate choice from the actual authorized confirmed-address read.
 * It changes only the unsent working draft's version reference. */
export type ProductQuoteAddressPicker=()=>Promise<ProductQuoteShippingView|null>;
