import {readFileSync,writeFileSync} from 'node:fs';
import * as v from '../src/contracts/PortalReviewValidation.ts';
import * as m from '../src/contracts/PortalReviewMapping.ts';
const metadata={review:v.reviewCommandFields,guidance:v.guidanceCommandFields,shapes:{goal:v.goalReportBodyShape,legacy:v.legacyReportBodyShape,conversation:v.conversationBodyShape,body:v.guidanceBodyShape,basis:v.guidanceBasisShape,target:v.guidanceTargetShape,publisher:v.guidancePublisherShape,snapshot:v.guidanceReadSnapshotShape,reportEvent:m.reportEventShape,amendment:m.reportAmendmentShape,approval:m.guidanceApprovalShape,draft:m.guidanceDraftViewShape,guidanceReceipt:m.guidanceReceiptShape,decisionReceipt:m.guidanceDecisionReceiptShape,manifest:m.instructionManifestPageShape,detail:m.instructionDetailShape}};
if(process.argv.includes('--write')){
 const file=new URL('../supabase/migrations/20261031091520_portal_rebuild_reviews_guidance_v1.sql',import.meta.url),marker='-- END GENERATED REVIEW METADATA';
 const prior=readFileSync(file,'utf8');if(prior&&!prior.includes(marker))throw Error('allocated_migration_marker_required');
 const tail=prior?prior.slice(prior.indexOf(marker)+marker.length):'\n';
 let sql='-- Canonical additive reports and exact guidance. No identities/grants or external action.\nbegin;\n';
 for(const [key,name] of [['review','review_command_fields'],['guidance','guidance_command_fields'],['shapes','review_shapes']])sql+=`create or replace function concierge.${name}() returns jsonb language sql immutable set search_path='' as $metadata$ select $shape$${JSON.stringify(metadata[key])}$shape$::jsonb $metadata$;\n`;
 writeFileSync(file,sql+marker+tail);
}else process.stdout.write(JSON.stringify(metadata));
