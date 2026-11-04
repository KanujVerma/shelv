import {useSyncExternalStore} from 'react';
import type {ContentId} from '../../../../../src/contracts/PortalRebuild.ts';
import type {PlanPreview} from '../../../../../src/contracts/PortalRebuildMapping.ts';
import {Badge,StatusNotice} from '../../ui/index.ts';
import {Panel} from '../../shell/PortalShell.tsx';
import {readUnpublishedPreview} from './preview.ts';
import type {PlanPreviewSource} from './preview.ts';
import type {PlanSessionBoundary} from './types.ts';
import {ProductIdentity} from './ProductIdentity.tsx';
import {DecisionReasons} from './content.tsx';
import {DecisionChoiceButton} from './DecisionChoiceButton.tsx';
import {decisionNames,isPurchaseDecision} from './model.ts';
import './plan.css';

export interface UnpublishedDecisionCardProps {
    preview:PlanPreview;
    source:PlanPreviewSource;
    decisionId:ContentId|null;
    session:PlanSessionBoundary;
}
const sessionChanged=()=> <StatusNotice tone="denied" title="session changed">sign in again to view this preview.</StatusNotice>;

/** A canonical unpublished read, with no navigation, published-view adapter,
 * operation ports or business callbacks accepted or forwarded at runtime. */
export function UnpublishedDecisionCard({preview,source,decisionId,session}:UnpublishedDecisionCardProps){
    const valid=useSyncExternalStore(session.subscribeInvalidation,session.isCurrent,session.isCurrent);
    if(!valid)return sessionChanged();
    let decoded:ReturnType<typeof readUnpublishedPreview>;
    try{decoded=readUnpublishedPreview(preview,source);}
    catch{return session.isCurrent()?<StatusNotice tone="error" title="preview unavailable">request a current preview from the draft.</StatusNotice>:sessionChanged();}
    if(!session.isCurrent())return sessionChanged();
    const content=decoded.view.content;
    const decision=decisionId===null?null:content.decisions.find(item=>item.id===decisionId);
    const product=decision?content.products.find(item=>item.id===decision.primaryProductId):null;
    return <Panel key={session.key} className="plan-unpublished-card">
        <p className="plan-small">client preview · unpublished</p>
        {decisionId===null?<StatusNotice title={content.decisions.length?'select a decision to preview':'no decision in this draft'}/>:!decision?<StatusNotice title="this decision is unavailable">select a decision from this draft.</StatusNotice>:<>
            <Badge tone="pending">{decisionNames[decision.kind]}</Badge>
            {product?<ProductIdentity product={product} compact/>:<h2>{decision.guidance.title||decisionNames[decision.kind]}</h2>}
            <DecisionReasons decision={decision}/>
            <DecisionChoiceButton choice="approved" purchase={isPurchaseDecision(decision)} disabled/>
            <p className="plan-meta">preview only. no client actions run here.</p>
        </>}
    </Panel>;
}
