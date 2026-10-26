import {esc,title} from '../advisor/model.js';
import {safeContentUrl} from '../advisor/presentation-model.js';
import {presentationText} from './presentation-renderer.js';
/** Only explicit public presentation traversal enters the portable document. */
export function planDocument(view){
 const plan=view?.plan;if(!plan)throw new Error('A published plan is not available to download.');
 const publicText=plan.presentation?.schemaVersion===2?presentationText(view):[plan.version===null?'Unpublished plan':`Plan version ${plan.version}`,...plan.recommendations.flatMap(item=>[title(item.slot),item.rationale]),'Current routine',...(view.routine||[]).map(item=>title(item.slot)+': '+item.productId)].join('\n');
 const name=plan.presentation?.title||'Your plan';
 const text=view.historical?'Historical published plan. This document does not reconstruct the routine used at that time.\n\n'+publicText:publicText;
 return documentText({name,version:plan.version,text});
}
const sectionTitles=new Set(['Recommendations','Your current routine','Current routine','Plan guidance','Stop or pause','Proposed routine','Current product directions','Initial product reference · follow the current routine above','Full ingredient lists','Earlier active products','Sources','Plan overview','CURRENT DAILY ROUTINE','STOP OR PAUSE']);
function linkedText(text){let position=0,html='';for(const match of String(text).matchAll(/https:\/\/[^\s<>"']+/g)){html+=esc(text.slice(position,match.index));const raw=match[0],safe=safeContentUrl(raw);html+=safe?`<a href="${esc(safe)}" target="_blank" rel="noopener noreferrer">${esc(raw)}</a>`:esc(raw);position=match.index+raw.length;}return html+esc(String(text).slice(position));}
function documentBody(text,name,version){
 const result=[];let paragraph=[],items=[],listKind=null,sectionOpen=false,index=0;
 const flushParagraph=()=>{if(paragraph.length){result.push('<p>'+paragraph.map(linkedText).join('<br>')+'</p>');paragraph=[];}};
 const flushList=()=>{if(items.length){result.push('<'+listKind+'>'+items.map(item=>'<li>'+linkedText(item)+'</li>').join('')+'</'+listKind+'>');items=[];listKind=null;}};
 const lines=String(text).split(/\r?\n/);if(lines[0]===name)lines.shift();if(lines[0]===`Version ${version}`||version===null&&lines[0]==='Unpublished')lines.shift();
 for(const line of lines){
  if(!line.trim()){flushParagraph();flushList();continue;}
  if(sectionTitles.has(line)){flushParagraph();flushList();if(sectionOpen)result.push('</section>');sectionOpen=true;result.push(`<section aria-labelledby="plan-section-${++index}"><h2 id="plan-section-${index}">${esc(line)}</h2>`);continue;}
  const numbered=/^\d+\.\s+(.+)$/.exec(line),bullet=/^[•*-]\s+(.+)$/.exec(line);
  if(numbered||bullet){flushParagraph();const kind=numbered?'ol':'ul';if(listKind&&listKind!==kind)flushList();listKind=kind;items.push((numbered||bullet)[1]);continue;}
  flushList();paragraph.push(line);
 }
 flushParagraph();flushList();if(sectionOpen)result.push('</section>');return result.join('');
}
export function documentText({name,version,text}){
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>${esc(name)} · Shelv</title><style>body{font:16px/1.6 system-ui,sans-serif;color:#171a18;background:#fffefb;max-width:54rem;margin:auto;padding:2rem}h1{font-size:2rem;line-height:1.2}h2{font-size:1.3rem;line-height:1.35;margin:2.5rem 0 1rem}p,li{overflow-wrap:anywhere}section{border-top:1px solid #eae5dc;margin-top:2rem}a{color:#173c2c}button{font:inherit;padding:.7rem 1rem;border:1px solid #b9c6bd;border-radius:.5rem;background:#f6f3ec;color:#173c2c;cursor:pointer}li{margin:.5rem 0}@media print{button{display:none}body{padding:0;max-width:none;background:white}h1,h2{break-after:avoid}li,p{orphans:3;widows:3}section{break-inside:auto}}</style></head><body><header><p>Shelv</p><h1>${esc(name)}</h1><p>${version===null?'Unpublished draft':`Published plan · version ${version}`}</p><button type="button" onclick="window.print()">Print or save as PDF</button></header><main>${documentBody(text,name,version)}</main></body></html>`;
}

export function downloadPlanDocument(view){const html=planDocument(view),version=view.plan.version,url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=version===null?'shelv-plan-unpublished.html':`shelv-plan-v${version}.html`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

export function downloadDocumentText({name,version,text,filename}){const html=documentText({name,version,text}),url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
