/** Proposed source-only Commerce v1. No RPC is enabled by these definitions. */
import type {UUID,ContentId,Revision,Hash,Known} from './PortalRebuild.ts';
import type {ClientPublicationRef} from './PortalCare.ts';
import type {PaymentQuote,PaymentClaim,ShippingAddress,PaymentReceipt} from '../../supabase/functions/concierge-payments/types.ts';
import type {mapPaymentViewV2} from '../../supabase/functions/concierge-payments/methods.ts';
import type {ReturnStatus,ServicePurchase,ReturnEvent} from './ConciergeService.ts';
export type {UUID,ContentId,Revision,Hash,Known,ClientPublicationRef,ShippingAddress};
export type CommerceDay=string;
export type CommerceInstant=string;
export type FrozenManualOption=ReturnType<typeof mapPaymentViewV2>['quotes'][number]['paymentOptions'][number];
export type PrivateRepaymentDestination=FrozenManualOption['recipient'];
export type CommerceManualChannel='text'|'call'|'video'|'in_person';
export type CommerceRepaymentConfirmation={kind:'client_submission';receivedAt:CommerceInstant}|{kind:'manual';confirmedAt:Known<CommerceInstant>;channel:Known<CommerceManualChannel>;confirmationReference:string};
export type CommerceCurrency=PaymentQuote['currency'];
export type ManualPaymentBasis=Pick<PaymentClaim,'quoteId'|'quoteVersion'|'shippingAddressVersion'|'serviceCents'|'productCents'|'totalCents'>&{currency:CommerceCurrency;paymentOptionId:UUID};
export type CommerceQuoteTarget={quoteId:UUID;quoteVersion:number;termsHash:Hash};
export type CommerceDraftTarget={draftId:UUID;revision:Revision;contentHash:Hash;selectionHash:Hash};
export type ProductSelection={publication:ClientPublicationRef;decisionId:ContentId;productId:ContentId};
export type CheckedMoney={cents:number;checkedOn:CommerceDay};
export type CommerceStrength=Known<string>|{state:'not_applicable';reason:string};
export type CommerceIdentity={name:string;variant:Known<string>;strength:CommerceStrength;sizeLabel:Known<string>};
export type CommerceReturnTerms={checkedOn:CommerceDay;sourceUrl:string;summary:string;openedAllowed:boolean;deadline:
 |{kind:'final_sale'}|{kind:'absolute';returnBy:CommerceDay;shipBy:CommerceDay|null}
 |{kind:'relative';days:number;anchor:'purchase'|'delivery';shipWithinDays:number|null};
 returnCost:{kind:'known';cents:number}|{kind:'client_pays';description:string}|{kind:'not_applicable';reason:'final_sale'}};
export type CommerceReturnTermsDraft={checkedOn:Known<CommerceDay>;sourceUrl:Known<string>;summary:string;openedAllowed:Known<boolean>;deadline:{kind:'unknown'}|{kind:'final_sale'}|{kind:'absolute';returnBy:Known<CommerceDay>;shipBy:Known<CommerceDay|null>}|{kind:'relative';days:Known<number>;anchor:Known<'purchase'|'delivery'>;shipWithinDays:Known<number|null>};returnCost:{kind:'unknown'}|{kind:'known';cents:Known<number>}|{kind:'client_pays';description:string}|{kind:'not_applicable';reason:'final_sale'}};
export type ProductQuoteLineDraft={lineId:ContentId;selection:Known<ProductSelection>;identity:CommerceIdentity;quantity:Known<number>;retailer:Known<string>;seller:Known<string>;fulfiller:Known<string>;sourceUrl:Known<string>;checkedOn:Known<CommerceDay>;unitPrice:Known<CheckedMoney>;returnTerms:CommerceReturnTermsDraft};
export type FrozenProductLine={lineId:ContentId;selection:ProductSelection;identity:CommerceIdentity;quantity:number;retailer:string;seller:string;fulfiller:Known<string>;sourceUrl:string;checkedOn:CommerceDay;unitPrice:CheckedMoney;lineTotalCents:number;returnTerms:CommerceReturnTerms};
export type ProductQuoteDraftBody={publication:Known<ClientPublicationRef>;lineIds:ContentId[];tax:Known<CheckedMoney>;shipping:Known<CheckedMoney>;shippingAddressVersion:Known<number>;serviceCents:Known<0|10000>;servicePeriod:{startOn:CommerceDay;endOn:CommerceDay}|null;note:string|null};
export type CommerceSnapshot={revision:Revision;paymentRevision:Revision;serviceRevision:Revision;asOfDay:CommerceDay;hash:Hash};
export type CommerceEntityKind='quote_draft'|'quote'|'purchase'|'return_case'|'refund_request'|'obligation'|'referral'|'reconciliation'|'event'|'repayment_details'|'quote_acceptance';
export type CommerceEntityRef={kind:CommerceEntityKind;id:UUID;revision:Revision};
export type CommercePageRequest={snapshot:CommerceSnapshot|null;cursor:string|null;limit:number};
export type CommerceQuoteSource={kind:'draft';target:CommerceDraftTarget}|{kind:'issued';target:CommerceQuoteTarget};
export type CommerceOccurrence={occurredOn:Known<CommerceDay>;channel:'portal'|'text'|'call'|'video'|'in_person'};
export type CommerceFulfillment={kind:'ordered';occurredOn:Known<CommerceDay>}|{kind:'shipped';occurredOn:Known<CommerceDay>;trackingReference:string}|{kind:'delivery_confirmed';occurredOn:Known<CommerceDay>;basis:'founder_observed'|'confirmed_client_report'};
export type CommerceReturnEventBody=Omit<ReturnEvent,'id'|'recordedAt'|'actorId'>;
export type CommerceObligationEvent={kind:'repayment_initiated';amountCents:number;occurredAt:CommerceInstant;detailsId:UUID;privateReference:string}|{kind:'receipt_confirmed';amountCents:number;occurredAt:CommerceInstant;initiationEventId:UUID;privateReference:string}|{kind:'failed';occurredAt:CommerceInstant;initiationEventId:UUID;reasonCode:'rejected'|'returned'}|{kind:'uncertain';occurredAt:CommerceInstant;initiationEventId:UUID;reasonCode:'unknown_outcome'};
export type CommerceReferralEvidence={id:UUID;clientId:UUID;referralId:UUID;verificationReference:string;verifiedBy:UUID;verifiedAt:CommerceInstant};
export type CommercePayloads={
 read_commerce_v1:CommercePageRequest;
 read_advisor_commerce_v1:CommercePageRequest&{clientId:UUID};
 read_commerce_detail_v1:{snapshot:CommerceSnapshot;entity:CommerceEntityRef};
 read_advisor_commerce_detail_v1:{clientId:UUID;snapshot:CommerceSnapshot;entity:CommerceEntityRef};
 read_quote_components_v1:CommercePageRequest&{quote:CommerceQuoteSource;component:'lines'|'payment_options'};
 read_advisor_quote_components_v1:CommercePageRequest&{clientId:UUID;quote:CommerceQuoteSource;component:'lines'|'payment_options'};
 read_commerce_history_v1:CommercePageRequest&{entity:CommerceEntityRef};
 read_advisor_commerce_history_v1:CommercePageRequest&{clientId:UUID;entity:CommerceEntityRef};
 read_private_commerce_v1:CommercePageRequest&{clientId:UUID;entity:CommerceEntityRef};
 request_status_v1:{requestId:UUID};
 save_product_quote_draft_v1:{clientId:UUID;draftId:UUID|null;expectedQuoteDraftRevision:Revision;body:ProductQuoteDraftBody};
 save_product_quote_line_v1:{clientId:UUID;target:CommerceDraftTarget;body:ProductQuoteLineDraft};
 issue_product_quote_v1:{clientId:UUID;target:CommerceDraftTarget;expectedPaymentRevision:Revision};
 accept_product_quote_v1:{quote:CommerceQuoteTarget};
 submit_payment_claim_v1:{expectedPaymentRevision:Revision;quote:CommerceQuoteTarget;payment:ManualPaymentBasis;evidenceId:UUID|null};
 confirm_payment_v1:{clientId:UUID;expectedPaymentRevision:Revision;quote:CommerceQuoteTarget;payment:ManualPaymentBasis;claimId:UUID;receiptVerified:true;receipt:{grossCents:number;feeCents:Known<number>;netCents:Known<number>;receivedAt:Known<CommerceInstant>;privateReference:string}};
 reject_payment_claim_v1:{clientId:UUID;expectedPaymentRevision:Revision;quote:CommerceQuoteTarget;payment:ManualPaymentBasis;claimId:UUID;reasonCode:'not_received'|'amount_mismatch'|'duplicate_claim'|'wrong_recipient'};
 record_purchase_v2:{clientId:UUID;expectedServiceRevision:Revision;quote:CommerceQuoteTarget;lineId:ContentId;quantity:number;taxCents:number;shippingCents:number;purchasedOn:CommerceDay;orderReference:string;receiptReference:string};
 record_fulfillment_v1:{clientId:UUID;purchaseId:UUID;expectedFulfillmentRevision:Revision;channel:CommerceOccurrence['channel'];event:CommerceFulfillment};
 confirm_product_received_v1:{purchaseId:UUID;expectedFulfillmentRevision:Revision;occurredOn:Known<CommerceDay>};
 record_quote_reconciliation_v1:{clientId:UUID;oldQuote:CommerceQuoteTarget;expectedReconciliationRevision:Revision;replacementQuote:CommerceQuoteTarget|null;acceptanceId:UUID|null;reason:string;disposition:'awaiting_client'|'replacement_accepted'|'manual_repayment_required'};
 request_product_return_v1:{purchaseId:UUID;expectedReturnRevision:Revision;quantity:number;reason:string;condition:'unopened'|'opened'|'used'|'damaged'};
 record_product_return_event_v1:{clientId:UUID;returnId:UUID;expectedReturnRevision:Revision;event:CommerceReturnEventBody;occurredAt:Known<CommerceInstant>;privateReference:string};
 record_founder_fault_resolution_v1:{clientId:UUID;returnId:UUID;expectedReturnRevision:Revision;resolution:'replacement_quote_required'|'manual_repayment_required';reason:string;confirmationReference:string};
 request_service_refund_v1:{reason:string|null};
 record_service_refund_request_v1:{clientId:UUID;occurredAt:CommerceInstant;channel:'text'|'call'|'video'|'in_person';confirmedClientRequest:true;reason:string|null};
 submit_repayment_details_v1:{obligationId:UUID;expectedObligationRevision:Revision;destination:PrivateRepaymentDestination};
 record_repayment_details_v1:{clientId:UUID;obligationId:UUID;expectedObligationRevision:Revision;destination:PrivateRepaymentDestination;confirmedWithPayee:true;confirmedAt:Known<CommerceInstant>;channel:Known<CommerceManualChannel>;confirmationReference:string};
 record_obligation_event_v1:{clientId:UUID;obligationId:UUID;expectedObligationRevision:Revision;event:CommerceObligationEvent};
 record_referral_v1:{clientId:UUID;expectedReferralRevision:Revision;partnerId:UUID;payeeId:UUID;designationReference:string;newReferralEvidence:{verificationReference:string}|null};
};
export type CommerceReadAction='read_commerce_v1'|'read_advisor_commerce_v1'|'read_commerce_detail_v1'|'read_advisor_commerce_detail_v1'|'read_quote_components_v1'|'read_advisor_quote_components_v1'|'read_commerce_history_v1'|'read_advisor_commerce_history_v1'|'read_private_commerce_v1'|'request_status_v1';
export type CommerceAction=keyof CommercePayloads;
export type CommerceWriteAction=Exclude<CommerceAction,CommerceReadAction>;
export type CommerceCommand={[A in CommerceAction]:{schemaVersion:1;action:A}&CommercePayloads[A]&(A extends CommerceReadAction?unknown:{requestId:UUID})}[CommerceAction];
export type CommerceRpcCall={name:'concierge_commerce_command_v1';args:{p_command:CommerceCommand}};
export type CommerceAcceptance={id:UUID;target:CommerceQuoteTarget;acceptedBy:UUID;acceptedAt:CommerceInstant};
export type CommerceQuoteHeader={kind:'quote';currency:CommerceCurrency;target:CommerceQuoteTarget;clientId:UUID;publication:ClientPublicationRef;selectionHash:Hash;lineCount:number;optionCount:number;availableOptionCount:number;productSubtotalCents:number;tax:CheckedMoney;shipping:CheckedMoney;serviceCents:0|10000;servicePeriod:{startOn:CommerceDay;endOn:CommerceDay}|null;totalCents:number;address:{version:number;address:ShippingAddress};acceptance:CommerceAcceptance|null;status:PaymentQuote['status'];canPay:boolean;issuedAt:CommerceInstant};
export type ServiceRefundBasis={policy:'first_three_monthly_periods';termsVersion:number;firstPublicationOn:Known<CommerceDay>;periods:{ordinal:1|2|3;claimId:UUID;quoteId:UUID;serviceCents:10000;verifiedAt:CommerceInstant;period:{startOn:CommerceDay;endOn:CommerceDay}|null}[];periodThreeEndsOn:Known<CommerceDay>;requestDeadline:Known<CommerceDay>;broaderPromiseRef:UUID|null};
export type ServiceRefundCalendar=Pick<ServiceRefundBasis,'periodThreeEndsOn'|'requestDeadline'>;
export type ServiceRefundAssessment={state:'supported';basis:ServiceRefundBasis;refundableCents:number;eligibility:'eligible'|'outside_recorded_terms'}|{state:'unavailable';code:'legacy_payment_provenance_required'|'service_terms_unavailable'|'period_basis_unavailable'}|{state:'unavailable';code:'broader_terms_unavailable';termsRef:UUID}|{state:'unavailable';code:'calendar_policy_unavailable';terms:{id:UUID;version:number}};
export type CommerceObligationClock={kind:'awaiting_basis'}|{kind:'service_request_and_details';requestId:UUID;requestedAt:CommerceInstant;detailsId:UUID;detailsConfirmedAt:Known<CommerceInstant>;detailsRecordedAt:CommerceInstant}|{kind:'retailer_funds';returnId:UUID;eventId:UUID;receivedAt:Known<CommerceInstant>};
export type CommerceObligation={kind:'obligation';id:UUID;clientId:UUID;revision:Revision;stream:'service_refund'|'product_return'|'quote_reconciliation';sourceId:UUID;clock:CommerceObligationClock;amount:Known<number>;triggerAt:Known<CommerceInstant>;initiateBy:Known<CommerceInstant>;initiatedCents:number;confirmedCents:number;state:'awaiting_basis'|'awaiting_details'|'due'|'initiated'|'confirmed'|'uncertain';detailsId:UUID|null};
export type CommerceDraftView={kind:'quote_draft';clientId:UUID;target:CommerceDraftTarget;body:ProductQuoteDraftBody;savedAt:CommerceInstant;readyToIssue:boolean;issues:('missing_line'|'incomplete_terms'|'selection_unproven'|'address_unverified'|'method_unavailable')[]};
export type CommerceReturnWindow={kind:'final_sale'}|{kind:'unresolved';reason:'awaiting_actual_delivery'|'date_out_of_range'}|{kind:'resolved';returnBy:CommerceDay;shipBy:CommerceDay|null;anchor:{kind:'absolute'}|{kind:'purchase';purchasedOn:CommerceDay}|{kind:'delivery';eventId:UUID;occurredOn:CommerceDay}};
export type CommerceDelivery={eventId:UUID;occurredOn:Known<CommerceDay>;reportedBy:Known<UUID>;recordedBy:UUID;recordedAt:CommerceInstant};
export type CommerceDetail={kind:'quote_preparation';clientId:UUID;id:UUID;revision:Revision;publication:Known<ClientPublicationRef>;lineCount:number;missing:('missing_line'|'incomplete_terms'|'selection_unproven'|'address_unverified'|'method_unavailable')[]}|CommerceDraftView|CommerceQuoteHeader|{kind:'legacy_quote';clientId:UUID;quote:PaymentQuote;canPay:false;terms:'unrepresented'}|{kind:'purchase';clientId:UUID;id:UUID;revision:Revision;quote:CommerceQuoteTarget;line:FrozenProductLine;quantity:number;taxCents:number;shippingCents:number;purchasedOn:CommerceDay;fulfillmentRevision:Revision;fulfillmentState:'purchased'|'ordered'|'shipped'|'delivery_confirmed';delivery:CommerceDelivery|null;returnWindow:CommerceReturnWindow;recordedBy:UUID;recordedAt:CommerceInstant}|{kind:'legacy_purchase';clientId:UUID;purchase:ServicePurchase}|{kind:'return_case';clientId:UUID;id:UUID;revision:Revision;purchaseId:UUID;quantity:number;condition:'unopened'|'opened'|'used'|'damaged';reason:string;status:ReturnStatus;requestedAt:CommerceInstant}|{kind:'refund_request';clientId:UUID;id:UUID;revision:Revision;requestedAt:CommerceInstant;recordedBy:UUID;assessment:ServiceRefundAssessment;obligationId:UUID|null}|CommerceObligation|{kind:'reconciliation';clientId:UUID;id:UUID;revision:Revision;oldQuote:CommerceQuoteTarget;replacementQuote:CommerceQuoteTarget|null;acceptanceId:UUID|null;disposition:'awaiting_client'|'replacement_accepted'|'manual_repayment_required';reason:string;recordedBy:UUID;recordedAt:CommerceInstant};
export type CommerceHistoryBody={kind:'fulfillment';event:CommerceFulfillment}|{kind:'receipt_report'}|{kind:'return_event';event:CommerceReturnEventBody}|{kind:'repayment_event';event:{kind:'repayment_initiated'|'receipt_confirmed'|'failed'|'uncertain';amountCents:number|null}}|{kind:'founder_fault';resolution:'replacement_quote_required'|'manual_repayment_required';reason:string}
 |{kind:'quote_issued';quote:CommerceQuoteTarget;totalCents:number}|{kind:'quote_accepted';acceptance:CommerceAcceptance}
 |{kind:'payment_claim';claim:PaymentClaim&{paymentOptionId:UUID|null}}
 |{kind:'payment_confirmed';claimId:UUID;quoteId:UUID;serviceCents:0|10000;productCents:number;totalCents:number;verifiedAt:CommerceInstant;receivedAt:Known<CommerceInstant>}
 |{kind:'payment_rejected';claimId:UUID;reasonCode:'not_received'|'amount_mismatch'|'duplicate_claim'|'wrong_recipient'}
 |{kind:'service_refund_request';requestId:UUID;reason:string|null};
export type CommerceHistoryEntry={id:UUID;subject:CommerceEntityRef;kind:CommerceHistoryBody['kind'];occurredOn:Known<CommerceDay>;occurredAt:Known<CommerceInstant>;recordedAt:CommerceInstant;reportedBy:Known<UUID>;recordedBy:UUID;channel:Known<CommerceOccurrence['channel']>;body:CommerceHistoryBody};
export type CommerceIndexEntry={entity:CommerceEntityRef;label:string;state:typeof import('./PortalCommerceValues.ts').commerceStates[number];recordedAt:CommerceInstant};
export type CommercePrivateEntry={kind:'reconciliation_funds';obligationId:UUID;reconciliationId:UUID;oldQuoteTarget:CommerceQuoteTarget;confirmationClaimId:UUID;originalProductCents:number;owedCents:number;cause:'material_quote_change'}|{kind:'purchase_references';purchaseId:UUID;orderReference:string;receiptReference:string}|{kind:'return_reference';eventId:UUID;returnId:UUID;reference:string}|{kind:'repayment_details';id:UUID;obligationId:UUID;payeeId:UUID;destination:PrivateRepaymentDestination;confirmation:CommerceRepaymentConfirmation;recordedBy:UUID;recordedAt:CommerceInstant}|{kind:'obligation_event';id:UUID;obligationId:UUID;event:CommerceObligationEvent;recordedBy:UUID;recordedAt:CommerceInstant}|{kind:'referral_obligation';id:UUID;referralId:UUID;clientId:UUID;payeeId:UUID;amountCents:10000;initiatedCents:number;confirmedCents:number;verifiedFirstServiceAt:CommerceInstant;initiateBy:CommerceInstant}|{kind:'referral';id:UUID;clientId:UUID;partnerId:UUID;payeeId:UUID;newReferralEvidence:CommerceReferralEvidence|null;award:{state:'unproven';code:'first_payment_unverified'|'new_referral_provenance_required'|'payee_unconfirmed'}|{state:'earned';claimId:UUID;obligationId:UUID;newReferralEvidenceId:UUID;verifiedFirstServiceAt:CommerceInstant;amountCents:10000;initiateBy:CommerceInstant;initiatedAt:Known<CommerceInstant>};noClawback:true};
export type CommercePage<T>={schemaVersion:1;clientId:UUID;snapshot:CommerceSnapshot;entries:T[];nextCursor:string|null};
export type CommerceComponentsPage={schemaVersion:1;clientId:UUID;snapshot:CommerceSnapshot;quote:CommerceQuoteSource;component:'lines';total:number;entries:(ProductQuoteLineDraft|FrozenProductLine)[];nextCursor:string|null}|{schemaVersion:1;clientId:UUID;snapshot:CommerceSnapshot;quote:CommerceQuoteSource;component:'payment_options';total:number;entries:FrozenManualOption[];nextCursor:string|null};
/** Service-backed actions acknowledge service_heads and quote issuance acknowledges payment_heads in revision, independently of entity.revision; other action-specific receipt fields retain their meanings. */
export type CommerceReceipt={schemaVersion:1;requestId:UUID;commandHash:Hash;action:CommerceWriteAction;clientId:UUID;entity:CommerceEntityRef;subject:{kind:'quote_draft'|'quote'|'purchase'|'return_case'|'obligation';id:UUID}|null;quote:CommerceQuoteTarget|null;lineId:ContentId|null;revision:Revision;recordedBy:UUID;recordedAt:CommerceInstant;paymentBasis:ManualPaymentBasis|null;payment:PaymentReceipt&{schemaVersion:2;paymentOptionId:UUID}|null};
export type CommerceDetailResult={schemaVersion:1;clientId:UUID;snapshot:CommerceSnapshot;detail:CommerceDetail};
export type CommerceResult=CommerceDetailResult|CommercePage<CommerceIndexEntry|CommerceHistoryEntry|CommercePrivateEntry>|CommerceComponentsPage|CommerceReceipt|{status:'absent'}|{status:'committed';receipt:CommerceReceipt};
