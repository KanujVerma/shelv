import type {Known,Revision,Hash,UUID} from './PortalRebuild.ts';
/** Own recorded administration only. A snapshot/hash conveys no permission. */
export type ServiceFinancialsSnapshot={paymentRevision:Revision;serviceRevision:Revision;asOfDay:string;hash:Hash};
export type ServiceFinancialsCommand={schemaVersion:1;action:'read_client_service_financials_v1';snapshot:ServiceFinancialsSnapshot|null;cursor:string|null;limit:number};
export type ServiceFinancialsRpcCall={name:'concierge_client_service_financials_read_v1';args:{p_command:ServiceFinancialsCommand}};
/** These IDs/periods must be actual canonical rows. Legacy receipts need a new explicit variant/version. */
export type ServiceFinancialsCanonicalPayment={kind:'canonical_payment';claimId:UUID;quoteId:UUID;verifiedAt:string;serviceCents:number;period:{state:'pending_publication'}|{state:'scheduled';startOn:string;endOn:string}};
export type ServiceFinancialsUnavailableCode='payment_lineage_unavailable'|'legacy_payment_provenance_required'|'service_terms_unavailable'|'period_basis_unavailable'|'calendar_policy_unavailable'|'broader_terms_unavailable';
/** V1 has no supported-policy success: its actual trusted producer is not admitted. */
export type ServiceFinancialsView={schemaVersion:1;snapshot:ServiceFinancialsSnapshot;payments:ServiceFinancialsCanonicalPayment[];nextCursor:string|null;firstPublicationOn:Known<string>;pendingServiceQuotes:{id:UUID;version:number}[];guarantee:{state:'unavailable';code:ServiceFinancialsUnavailableCode}};
