import type {ClientCareHistoryPage,ClientPlanViewV3} from '../../../../../src/contracts/PortalReview.ts';
/** Presentation preferences only. Never a clinical acknowledgement or a read lease. */
export type HistoryFilter='all'|'checkins'|'changes';
export type HistoryRestorationAnchor={kind:'update'}|{kind:'entry'|'correction'|'version';entryKey:string};
export interface HistoryRestorationBasis {
    version:number|null;
    heads:ClientCareHistoryPage['heads'];
    access:ClientPlanViewV3['access'];
    snapshot:NonNullable<ClientPlanViewV3['currentGuidance']>['snapshot']|null;
}
/** Only IDs/validated basis; no report body, labels, photos or saved response. */
export interface HistoryTimelineMetadata {
    schemaVersion:1;
    sessionKey:string;
    filter:HistoryFilter;
    basis:HistoryRestorationBasis;
    entryKeys:readonly string[];
    complete:boolean;
    anchor:HistoryRestorationAnchor|null;
}
type Available={basis:HistoryRestorationBasis;loadedEntries:number};
export type HistoryRestorationResult=
    |(Available&{state:'fresh';reason:'no_saved_timeline';anchorId:null})
    |(Available&{state:'restored';reason:null;anchorId:string|null})
    |(Available&{state:'fallback';reason:'basis_changed'|'version_changed'|'timeline_changed'|'anchor_unavailable'|'page_read_failed';anchorId:null})
    |{state:'unavailable';reason:'denied'|'session_ended'|'unavailable'|'superseded'|'restricted_mode';basis:null;loadedEntries:0;anchorId:null};
export interface HistoryRestorationAttempt {
    /** Data completion; ClientHistory.onReady is the after-commit UI signal. */
    ready:Promise<HistoryRestorationResult>;
    /** Cancels only this attempt, including its ready callback lease. */
    cancel():void;
}
export interface HistoryRestorationController {
    setFilter(filter:HistoryFilter):void;
    /** Captures only the current validated timeline into the actual boundary memory. */
    capture(anchor?:HistoryRestorationAnchor|null):HistoryTimelineMetadata|null;
    /** Uses fresh fixed READs and fresh returned cursors, never cached response bodies. */
    restore(version?:number|null):HistoryRestorationAttempt;
    /** Recheck inside a parent's deferred scroll/focus callback too. */
    isCurrent(result:HistoryRestorationResult):boolean;
}
export interface HistoryTimelineState {
    filter:HistoryFilter;
    restoring:boolean;
    result:HistoryRestorationResult|null;
}
export interface HistoryRestorationProps {
    version?:number|null;
    /** Runs after the matching History render commits. Parent alone owns scroll/focus. */
    onReady(result:HistoryRestorationResult):void;
}
const uuid='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const eventKey=new RegExp('^(?:report|report_amendment|attention|public_review|public_reply|public_instruction|use_amendment|use|identity|reported_product):'+uuid+'$','i');
export function isHistoryEntryKey(value:unknown):value is string {
    if(typeof value!=='string')return false;
    if(eventKey.test(value))return true;
    if(!/^publication:[1-9][0-9]*$/.test(value))return false;
    return Number.isSafeInteger(Number(value.slice('publication:'.length)));
}
export function historyElementId(anchor:HistoryRestorationAnchor):string {
    if(!anchor||typeof anchor!=='object'||!['update','entry','correction','version'].includes(anchor.kind))throw new TypeError('invalid history anchor');
    if(anchor.kind==='update')return 'history-update-opener';
    if(!isHistoryEntryKey(anchor.entryKey))throw new TypeError('invalid history entry key');
    const prefix={entry:'history-entry:',correction:'history-correction-opener:',version:'history-version-opener:'} as const;
    if(!(anchor.kind in prefix))throw new TypeError('invalid history anchor');
    return prefix[anchor.kind]+anchor.entryKey;
}
