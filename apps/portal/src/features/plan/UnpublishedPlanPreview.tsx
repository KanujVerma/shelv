import {useSyncExternalStore} from 'react';
import {StatusNotice} from '../../ui/index.ts';
import {PlanRenderer} from './ClientPlan.tsx';
import {readUnpublishedPreview} from './preview.ts';
import type {UnpublishedPlanPreviewProps} from './preview.ts';

/** No transport or business callbacks cross this adapter, even at runtime. The
 * enclosing advisor navigator retains /advisor/plans/:draftId/preview. */
export function UnpublishedPlanPreview({preview,source,session,navigation}:UnpublishedPlanPreviewProps) {
    const valid=useSyncExternalStore(session.subscribeInvalidation,session.isCurrent,session.isCurrent);
    if(!valid)return <StatusNotice tone="denied" title="session changed">sign in again to view this preview.</StatusNotice>;
    let decoded:ReturnType<typeof readUnpublishedPreview>;
    try {decoded=readUnpublishedPreview(preview,source);}catch{return <StatusNotice tone="error" title="preview unavailable">return to the draft and request a current preview.</StatusNotice>;}
    return <PlanRenderer key={session.key} props={{kind:'unpublished',view:decoded.view,preview:decoded.preview,navigation}}/>;
}
