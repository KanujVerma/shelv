import type {PlanRoute} from '../../plan/types.ts';

export type MayaStageNumber=1|2|3|4|5;
export type MayaGuide='open'|'collapsed'|'exploring'|'exited';
export type MayaPage='plan'|'follow-up'|'next-step';
export const MAYA_STAGES = [
  {number:1,id:'meet-maya',title:'meet Maya',page:'plan',route:{name:'plan',routine:'morning'},
    body:'Maya wants help with lingering marks and layers that pill under sunscreen and makeup. we keep the comfortable basics and explain each proposed change.'},
  {number:2,id:'meaningful-decision',title:'one meaningful decision',page:'plan',route:{name:'recommendation',decisionId:'maya-card-treatments',routine:'morning'},
    body:'review the proposed azelaic acid, its directions and evidence limits. approve, defer or decline in this sample. a choice does not charge, order or record a start.'},
  {number:3,id:'daily-use',title:'daily use',page:'plan',route:{name:'plan',routine:'evening'},
    body:'morning and evening instructions stay in the plan. receipt is separate from actual use. the sample controls let you see a report without sending one.'},
  {number:4,id:'follow-up',title:'personal follow-up',page:'follow-up',route:{name:'plan',routine:'morning'},
    body:'this later exchange and review are authored examples, not observed results. a few uses do not establish whether the treatment helps the marks.'},
  {number:5,id:'next-step',title:'the next step',page:'next-step',route:{name:'plan',routine:'morning'},
    body:'a review can mean keeping the plan unchanged and buying nothing new. explore the sample, replay the guide or reset only this demo.'},
] as const satisfies readonly {number:MayaStageNumber;id:string;title:string;page:MayaPage;route:PlanRoute;body:string}[];

export function mayaStage(number:MayaStageNumber){return MAYA_STAGES[number-1]!;}
export function readMayaStage(value:unknown):MayaStageNumber {
  if(value!==1&&value!==2&&value!==3&&value!==4&&value!==5)throw Error('invalid Maya stage');
  return value;
}
