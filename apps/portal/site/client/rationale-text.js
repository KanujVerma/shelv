import {esc} from '../advisor/model.js';
/** Original approved emphasis as text segments; authored HTML is always plain text. */
const approvedPhrases=['it keeps stinging and you’ve started skipping it','try Vanicream Daily Facial in its place'];
export function rationaleSegments(value){let segments=[{text:String(value??''),strong:false}];for(const phrase of approvedPhrases){let applied=false;segments=segments.flatMap(segment=>{const index=!applied&&!segment.strong?segment.text.indexOf(phrase):-1;if(index<0)return [segment];applied=true;return [{text:segment.text.slice(0,index),strong:false},{text:phrase,strong:true},{text:segment.text.slice(index+phrase.length),strong:false}].filter(part=>part.text);});}return segments;}
export function rationaleTextMarkup(value){return rationaleSegments(value).map(segment=>{const text=esc(segment.text).replace(/\r\n?|\n/g,'<br>');return segment.strong?`<strong>${text}</strong>`:text;}).join('');}
