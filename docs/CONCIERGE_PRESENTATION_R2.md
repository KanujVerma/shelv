# Concierge R2 implementation contract — frozen v2

Same primary client route and existing operations Edge URL. No Alex fixture fallback in live mode. All keys below are REQUIRED; nullable values are explicit null. Arrays may be empty only where limits permit. All text is plain text, no HTML. Frontend ACKed this port before core implementation. The original candidate SHA256 is 2edeef11c590aa60e091fc1a7c64c4bc9d967b4aa61ca65368fabeb3abb510dd; its accepted fields and five action names are unchanged.

```ts
type Source = {label:string;url:string};
type Section = {title:string;body:string};
type Price = {cents:number;currency:'USD';sourceUrl:string|null;checkedOn:string|null;illustrative:boolean};
type Product = {id:string;name:string;brand:string|null;variant:string|null;sizeLabel:string;productUrl:string|null;imageUrl:string|null;reference:string|null;displayPrice:Price|null};
type Usage = {periods:('morning'|'evening')[];order:number;short:{morning:string|null;evening:string|null};instructions:string[]};
type Guide = {id:string;productId:string|null;title:string;intro:string;steps:{title:string|null;body:string}[];careNote:string|null;sources:Source[]};
type Comparison = {label:string;currentText:string;proposedText:string;significance:string;ingredientGuideKey:string|null;guideNote:string|null;sources:Source[]};
type Fact = {title:string;body:string;ingredientGuideKey:string|null;sources:Source[]};
type Step = {id:string;kind:'product'|'instruction';slot:string|null;productId:string|null;product:Product|null;title:string;usage:Usage};
type Card = {id:string;slot:string;kind:'replace'|'keep'|'finish_then_replace'|'no_addition';recommendationId:string|null;title:string;subtitle:string;rationaleTitle:string;reasons:Section[];actions:string[];currentProduct:Product|null;proposedProduct:Product|null;usage:Usage|null;comparisons:Comparison[];factsTitle:string;facts:Fact[];how:Guide;sources:Source[]};
type IntakePresentation = {schemaVersion:2;consultationSections:Section[];baselineRoutine:Step[]};
type Presentation = {schemaVersion:2;title:string;summary:string;preparedBy:string;preparedOn:string|null;sources:Source[];consultationSections:Section[];categoryCards:Card[];baselineRoutine:Step[];routineGuides:Guide[]};
type ActiveStep = Step & {source:{kind:'baseline'|'activation';publicationVersion:number;recommendationId:string|null};guides:Guide[]};
```

## Limits and relationships

- Identifier fields use existing R1 identifier rule (1–100, alphanumeric start, alphanumeric/underscore/hyphen; reserved prototype keys rejected). UUIDs retain current checks. preparedOn is null or a valid date. New dates must be valid YYYY-MM-DD,1900+; no new business-time rule.
- name/title/label/rationaleTitle/factsTitle/subtitle <=200Unicode codepoints; brand100;variant200;preparedBy200;sizeLabel120;reference1000;summary/body/currentText/proposedText/significance/guideNote/intro/careNote4000; action/instruction/short2000. Text required nonblank unless intro or subtitle (may empty). Nullable text may be null, otherwise nonblank. Summary may empty. All existing R1 limits stay unchanged.
- Source URL, productUrl and price.sourceUrl: HTTPS <=2048, no credentials, controls or private/local IP/hostname literals. No server fetching. imageUrl is null, the same HTTPS form, or strict recovered static `assets/<safe-filename>.(jpg|jpeg|png|webp)` without traversal. Broken/missing images use neutral fallback. UI uses no-referrer for external images and noopener/noreferrer links. No secrets/raw private upload paths in metadata.
- Price cents integer0..100000000; currencyUSD; checkedOn null or valid date. A proposed product's displayPrice, when present and recommendation-bound, must equal existing recommendation.priceCents/USD. It remains an authored display/reference price; final financial quote stays authoritative.
- sections0..12;cards0..50;baselineRoutine1..50;routineGuides0..12;Guide.steps0..12;Card.reasons1..12;actions/comparisons/facts0..12; sources0..12;Usage.instructions1..12;Usage.periods1..2unique;order1..50. Keep100000-byte total request cap; reject, never truncate.
- Unique card IDs and slots; unique step IDs; one product baseline step per authoritative baseline slot, matching exact productId/Product.id. Instruction steps have slot/productId/product all null. All R1 baseline slots/products must be represented exactly once; instruction steps do not create fake products.
- Every authoritative replacement recommendation has exactly one card with matching recommendationId/slot/currentProduct.id/proposedProduct.id and nonnull usage. Only replace/finish_then_replace cards may bind a recommendation. Replace must bind one. A finish_then_replace card may be unbound (recommendationId:null): currentProduct must match its authoritative baseline slot, proposedProduct and usage must be present, and it creates no purchase obligation, approval, receipt or activation. Such a deferred product remains informational until an explicitly authored future purchase recommendation is published. Keep cards have no recommendationId, currentProduct matches an authoritative baseline slot, proposedProduct null. No-addition cards have recommendationId/currentProduct/proposedProduct/usage null. Card IDs need not equal recommendation IDs.
- Guide.productId is null or a product ID present in that presentation. Known ingredientGuideKey is null or one of the32keys in recovered ingredient-guide.json plus group keyceramides; guideNote remains advisor-authored and never generated.

## Exact HTTP actions and RPCs

All writes retain {clientId,requestId,expectedRevision}; owner actions never accept clientId. All RPCs retain bearer-authenticated transport and fresh guards. Existing advisor_list/meeting note/decide/receive/start/payment/check-in contracts remain.

- `{action:'client_read_v2'}` → public.concierge_client_view_v2().
- `{action:'advisor_read_v2',clientId}` → public.concierge_advisor_view_v2(p_client_id uuid).
- `{action:'save_intake_v2',clientId,requestId,expectedRevision,goal,note,baseline:[{slot,productId}],presentation:IntakePresentation}` → public.concierge_presentation_write(p_client_id,p_action,p_expected_revision,p_request_id,p_payload), payload excludes routing/common fields.
- `{action:'save_draft_v2',clientId,requestId,expectedRevision,intakeVersion,recommendations:R1Recommendation[],advisorNote,presentation:Presentation}` → same RPC.
- `{action:'publish_v2',clientId,requestId,expectedRevision}` → same RPC, empty payload.
- RPC action literals are full save_intake_v2/save_draft_v2/publish_v2. Edit/edit/publish capability respectively. Existing plan revision stream and standard write receipt {revision,publishedVersion,operation}.

No new Edge URL, key, role claim or permission grant. Full payload, including presentation, participates in exact-retry fingerprint. Ordinary metadata edits preserve IDs. Replacing physical product/size/unit or explicitly creating another purchase obligation must follow existing ID/approval/funding semantics.

## Read replies

client_read_v2 returns all current R1ClientView fields unchanged, plus schemaVersion:2, plan.presentation:null|Presentation, every history[i].presentation:null|Presentation and activeRoutine:ActiveStep[]. Null presentation denotes a genuine R1 snapshot; no Alex substitution. Plan stays null and history/activeRoutine empty before service entitlement. Public projection always allowlists fields.

advisor_read_v2 returns R1AdvisorView with its client projected through the version-aware advisor-visible snapshot, intake.presentation:null|IntakePresentation and draft.presentation:null|Presentation. Advisor-only intake.note,advisorNote,meetingNotes remain private exactly as before. Advisor can preview published/draft data without client service entitlement; client cannot.

ActiveStep product IDs must match authoritative R1 routine rows. Metadata/usage/guides come from exact actual-start publication, or the first ENTITLED R2 baseline presentation for an unchanged baseline product. Captured nonproduct steps come from that baseline snapshot. Never take active instructions from the latest draft, payment/receipt or a future/unentitled publication. Guides follow the same source snapshot and productId. UI can use activeRoutine directly; current plan/history still contains complete decision/reference content.

## Persistence and compatibility

Three private RLS tables: intake_presentations PK(client_id,intake_version)→intakes, draft_presentations PK(client_id)→drafts plus intake reference, publication_presentations PK(client_id,version)→publications. Intake/publication snapshots immutable; draft writes revision guarded. All FK deletes cascade, raw access denied. No change to existing R1 table columns or historical migration bytes.

Publish copies base publication and complete presentation atomically. Existing monthly entitlement activation, product approval/funding guard, quote staleness, receipt and actual start semantics remain. Legacy R1 reads/writes continue for R1 data. An R1 read of a visible R2 snapshot, or legacy metadata-discarding intake/draft/publish write, fails409 concierge_content_version_required. This guard must not reveal a private R2 draft to an owner whose visible entitled snapshot is still R1. New R2 readers support R1 history.

Financial labels resolve quote.publicationVersion+recommendationId. UI descriptor uses immutable product name/size/link only; personalized reasons/usage/comparisons never enter financial records. Keep/no-addition/nonproduct content never creates fake quotes, approvals, receipts or activations.

## Ownership

Core: src/contracts/Concierge* + new ConciergePresentation*.ts, operations commands/handler/runtime/README, one forward CLI-generated migration, tests/concierge-presentation*. Frontend: primary original renderer/restoration, authoring/model/preview, routine/history/download/composition and QA. Payment feature owner only if descriptor rendering port changes. Check-ins untouched. Core will send fixture/contract path and test acceptance results; no other writer changes shared files.

Candidate v2 amendments requested by frontend: preparedBy/preparedOn/global sources, separate nullable product variant, and unbound informational finish_then_replace. Comparison currentText/proposedText preserve line breaks; first-line/detail rendering must not rewrite copy. Hero labels derive from the explicit card kind and can remain the exact approved renderer labels. All other v1 fields, five action names, bounds and ownership stay unchanged.
