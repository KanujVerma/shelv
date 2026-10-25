import type {InstructionRevision} from './ConciergeService.ts';
import type { ConciergeAdvisorView, ConciergeClientView, ConciergePayloads } from './ConciergePortal.ts';
/** R2 is authored plain content. These snapshots never grant a purchase or activation. */
export type Source = {label:string;url:string};
export type Section = {title:string;body:string};
export type Price = {cents:number;currency:'USD';sourceUrl:string|null;checkedOn:string|null;illustrative:boolean};
export type Product = {id:string;name:string;brand:string|null;variant:string|null;sizeLabel:string;productUrl:string|null;imageUrl:string|null;reference:string|null;displayPrice:Price|null;sourceLabel?:string};
export type Usage = {periods:('morning'|'evening')[];order:number;short:{morning:string|null;evening:string|null};instructions:string[]};
export type Guide = {id:string;productId:string|null;title:string;intro:string;steps:{title:string|null;body:string}[];careNote:string|null;sources:Source[]};
export type Comparison = {label:string;currentText:string;proposedText:string;significance:string;ingredientGuideKey:string|null;guideNote:string|null;sources:Source[]};
export type Fact = {title:string;body:string;ingredientGuideKey:string|null;sources:Source[]};
export type Step = {id:string;kind:'product'|'instruction';slot:string|null;productId:string|null;product:Product|null;title:string;usage:Usage};
export type Card = {id:string;slot:string;kind:'replace'|'keep'|'finish_then_replace'|'no_addition'|'addition'|'optional_alternative'|'pause'|'leave_out';recommendationId:string|null;title:string;subtitle:string;rationaleTitle:string;reasons:Section[];actions:string[];currentProduct:Product|null;proposedProduct:Product|null;usage:Usage|null;comparisons:Comparison[];factsTitle:string;facts:Fact[];how:Guide;sources:Source[];group?:string;decisionLabels?:{current:string;proposed:string}};
export type IntakePresentation = {schemaVersion:2;consultationSections:Section[];baselineRoutine:Step[];currentProductsStatus?:'none'|'recorded'};
export type RoutineBasis = {products:{slot:string;productId:string;source:{kind:'baseline'|'activation';publicationVersion:number;recommendationId:string|null}}[]};
export type Presentation = {schemaVersion:2;title:string;summary:string;preparedBy:string;preparedOn:string|null;sources:Source[];consultationSections:Section[];categoryCards:Card[];baselineRoutine:Step[];routineGuides:Guide[];routineBasis?:RoutineBasis;currentProductsStatus?:'none'|'recorded'};
export type ActiveStep = Step & {instructionRevision?:InstructionRevision;source:{kind:'baseline'|'activation';publicationVersion:number;recommendationId:string|null};guides:Guide[]};
export type ClientViewV2 = Omit<ConciergeClientView,'plan'|'history'> & {schemaVersion:2;plan:(NonNullable<ConciergeClientView['plan']>&{presentation:Presentation|null})|null;history:(ConciergeClientView['history'][number]&{presentation:Presentation|null})[];activeRoutine:ActiveStep[]};
export type AdvisorViewV2 = Omit<ConciergeAdvisorView,'client'|'intake'|'draft'> & {client:ClientViewV2;intake:(NonNullable<ConciergeAdvisorView['intake']>&{presentation:IntakePresentation|null})|null;draft:(NonNullable<ConciergeAdvisorView['draft']>&{presentation:Presentation|null})|null};
export type PresentationPayloads = {
 save_intake_v2:ConciergePayloads['save_intake'] & {presentation:IntakePresentation};
 save_draft_v2:ConciergePayloads['save_draft'] & {presentation:Presentation};
 publish_v2:Record<string,never>;
};
