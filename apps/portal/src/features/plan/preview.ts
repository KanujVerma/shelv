import type {ClientPlanContent,DraftView,ExactTarget} from '../../../../../src/contracts/PortalRebuild.ts';
import type {PlanPreview} from '../../../../../src/contracts/PortalRebuildMapping.ts';
import {mapPlanResult} from '../../../../../src/contracts/PortalRebuildMapping.ts';
import {readPlanCommand} from '../../../../../src/contracts/PortalRebuildValidation.ts';
import {exactKeys,readObject,requireValue} from '../../../../../src/contracts/ConciergePortalValidation.ts';
import type {PlanNavigationPort,PlanSessionBoundary} from './types.ts';

export interface PlanPreviewSource {
    draftId:DraftView['draft']['id'];
    contentRevision:DraftView['draft']['contentRevision'];
    assignmentRevision:DraftView['draft']['assignmentRevision'];
    target:DraftView['target'];
}
export interface UnpublishedPlanPreviewProps {
    preview:PlanPreview;
    source:PlanPreviewSource;
    session:PlanSessionBoundary;
    navigation:PlanNavigationPort;
}
export interface UnpublishedPlanView {kind:'unpublished';content:ClientPlanContent}
const sameTarget=(a:ExactTarget|null,b:ExactTarget|null)=>a===null?b===null:b!==null&&a.draftId===b.draftId&&a.clientId===b.clientId&&a.contentRevision===b.contentRevision&&a.assignmentRevision===b.assignmentRevision&&a.contentHash===b.contentHash;
/** Runtime callers remain untrusted. Validate only finite metadata and the actual
 * root client-safe response shape, then bind its target separately to the source. */
export function readUnpublishedPreview(preview:PlanPreview,source:PlanPreviewSource):{view:UnpublishedPlanView;preview:PlanPreview;source:PlanPreviewSource} {
    const s=readObject(source);exactKeys(s,['draftId','contentRevision','assignmentRevision','target']);
    const command=readPlanCommand({schemaVersion:1,action:'preview_draft_v1',draftId:s.draftId,contentRevision:s.contentRevision,assignmentRevision:s.assignmentRevision});
    requireValue(command.action==='preview_draft_v1');
    if(command.action!=='preview_draft_v1')throw Error('invalid_input');
    const result=mapPlanResult(preview,command) as PlanPreview;
    const validation=mapPlanResult({target:s.target,issues:[]},{...command,action:'validate_draft_v1'}) as {target:ExactTarget|null};
    const target=validation.target;
    requireValue(sameTarget(target,result.target));
    if(target)requireValue(target.draftId===command.draftId&&target.contentRevision===command.contentRevision&&target.assignmentRevision===command.assignmentRevision);
    // The root response parser enforces finite fields and safe text/URLs. Check
    // client-safe identities without reconstructing private fact provenance.
    const c=result.content;
    for(const values of [c.products,c.goals,c.context.facts,c.decisions,c.routine])requireValue(new Set(values.map(v=>v.id)).size===values.length);
    const products=new Set(c.products.map(p=>p.id)),facts=new Set(c.context.facts.map(f=>f.id)),goals=new Set(c.goals.map(g=>g.id));
    const refs=(ids:string[],known:Set<string>)=>requireValue(ids.every(id=>known.has(id)));
    for(const p of c.products)refs(p.factIds,facts);
    for(const g of c.goals)refs(g.factIds,facts);
    if(c.context.products.state==='recorded')refs(c.context.products.productIds,products);
    if(c.context.products.state==='none')refs([c.context.products.factId],facts);
    for(const d of c.decisions){refs(d.goalIds,goals);refs(d.factIds,facts);refs([...d.currentProductIds,...d.alternativeProductIds,...(d.primaryProductId?[d.primaryProductId]:[])],products);}
    for(const step of c.routine)requireValue(step.kind==='instruction'?step.productId===null:step.productId!==null&&products.has(step.productId));
    for(const guide of [...c.routineGuides,...c.products.flatMap(p=>p.guides),...c.decisions.flatMap(d=>d.guidance.how?[d.guidance.how]:[])])if(guide.productId!==null)refs([guide.productId],products);
    return {view:{kind:'unpublished',content:c},preview:result,source:{draftId:command.draftId,contentRevision:command.contentRevision,assignmentRevision:command.assignmentRevision,target}};
}
