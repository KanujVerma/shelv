/** Reviewed source identities and narrowly materialized historical compiler inputs. */
import {readFileSync} from 'node:fs';
import {loadPortalCiBaselines} from './portal-ci-baselines.ts';
import {ownAdminSourceSha256} from './portal-own-admin-source-baselines.ts';
const file=new URL('../fixtures/portal-shared-ci-baselines.json',import.meta.url);
export const sharedFixtureSha256='2047337772cc1d6078e64193dd1a67c2c42cf292c8cc24f00a8c91fdb15f4c23';
export const sharedCiBaselines=loadPortalCiBaselines(file,sharedFixtureSha256);
const data=JSON.parse(readFileSync(file,'utf8')) as {approvedSharedCommit:string;reviewedTargets:{path:string;sha256:string}[];normalizedHashes:Record<string,Record<string,string>>;rootCompositionTargets:Record<string,string>;rootNormalizedHashes:Record<string,Record<string,string>>};
export const reviewedSharedCommit=data.approvedSharedCommit;
export function reviewedSourceSha256(path:string):string{const row=data.reviewedTargets.find(row=>row.path===path);if(!row)throw Error('unknown_reviewed_source');return row.sha256;}
export function reviewedMaskedSha256(kind:string,path:string):string{const value=data.normalizedHashes[kind]?.[path];if(typeof value!=='string')throw Error('unknown_reviewed_mask');return value;}
/** Proposed Root refactor identities; independent composition approval is separate. */
export function currentSourceSha256(path:string):string{return ownAdminSourceSha256(path)??data.rootCompositionTargets[path]??reviewedSourceSha256(path);}
export function currentMaskedSha256(kind:string,path:string):string{return data.rootNormalizedHashes[kind]?.[path]??reviewedMaskedSha256(kind,path);}
