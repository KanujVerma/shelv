import type {UnpublishedDecisionCardProps,PlanPreviewSource,PlanSessionBoundary} from '../../src/features/plan/index.ts';
import type {PlanPreview} from '../../../../src/contracts/PortalRebuildMapping.ts';
import type {DraftView} from '../../../../src/contracts/PortalRebuild.ts';
declare const props:UnpublishedDecisionCardProps;
declare const preview:PlanPreview;
declare const source:PlanPreviewSource;
declare const session:PlanSessionBoundary;
const selected:UnpublishedDecisionCardProps={preview,source,session,decisionId:'decision'};
const unselected:UnpublishedDecisionCardProps={preview,source,session,decisionId:null};
void selected;void unselected;
// @ts-expect-error compact preview accepts no live operation ports
props.ports;
// @ts-expect-error compact preview accepts no business callback
props.onSelfPurchase;
// @ts-expect-error runtime click callbacks are not part of the read-only card
props.onClick;
// @ts-expect-error compact preview accepts no publication callback
props.onPublish;
// @ts-expect-error compact preview accepts no navigation capability
props.navigation;
// @ts-expect-error a preview card never accepts a published view
props.view;
// @ts-expect-error presentation mode cannot confer client authority
props.mode;
declare const privateDraft:DraftView;
// @ts-expect-error private draft records cannot replace the safe canonical preview
const invalid:UnpublishedDecisionCardProps={preview:privateDraft,source,session,decisionId:null};
void invalid;
