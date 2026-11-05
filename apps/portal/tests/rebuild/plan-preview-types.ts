import type {UnpublishedPlanPreviewProps,PlanPreviewSource} from '../../src/features/plan/index.ts';
import type {ClientPlanView,DraftView} from '../../../../src/contracts/PortalRebuild.ts';
import type {UnpublishedPlanView} from '../../src/features/plan/preview.ts';
declare const props:UnpublishedPlanPreviewProps;
declare const draft:DraftView;
const source:PlanPreviewSource={draftId:draft.draft.id,contentRevision:draft.draft.contentRevision,assignmentRevision:draft.draft.assignmentRevision,target:draft.target};
void source;
// @ts-expect-error unpublished preview has no live ports
props.ports;
// @ts-expect-error unpublished preview has no business write callbacks
props.onRecordUse;
// @ts-expect-error unpublished preview has no export or notification callbacks
props.onExport;
// @ts-expect-error source metadata never accepts private draft content
source.content;
declare const view:UnpublishedPlanView;
// @ts-expect-error a draft is not a published view or an entitlement
const published:ClientPlanView=view;
void published;
// @ts-expect-error unavailable use cannot become a confirmed empty use list
view.actualUse;
// @ts-expect-error draft has no publication version
view.plan.version;
