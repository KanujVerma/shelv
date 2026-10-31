import type {DraftView} from '../../../../src/contracts/PortalRebuild.ts';
import type {PlanPreview} from '../../../../src/contracts/PortalRebuildMapping.ts';
import {readUnpublishedPreview} from '../features/plan/preview.ts';
import type {PlanPreviewSource} from '../features/plan/preview.ts';
export interface PreviewRecord {preview:PlanPreview;source:PlanPreviewSource;sessionKey:string}
/** The null-target wire response has no draft/revision identity. Bind it to the
 * captured command and the actual nested DraftView, never to null alone. */
export function bindPreview(preview:PlanPreview,draft:DraftView,request:Omit<PlanPreviewSource,'target'>,sessionKey:string):PreviewRecord {
  if(draft.draft.id!==request.draftId||draft.draft.contentRevision!==request.contentRevision||draft.draft.assignmentRevision!==request.assignmentRevision)throw Error('stale_preview');
  const source:PlanPreviewSource={draftId:draft.draft.id,contentRevision:draft.draft.contentRevision,assignmentRevision:draft.draft.assignmentRevision,target:draft.target};
  const decoded=readUnpublishedPreview(preview,source);
  return {preview:decoded.preview,source:decoded.source,sessionKey};
}
