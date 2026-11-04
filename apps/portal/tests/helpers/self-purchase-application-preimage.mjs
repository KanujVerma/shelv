import {createHash} from 'node:crypto';
const sha=s=>createHash('sha256').update(s).digest('hex');
const beforeHash="c242959d3f600cf28ce24f1af8ba6221c44ea24c54b9bfb7552f93c09536504f",afterHash="cca8c3f3f5c7e5fef8ba48ef4fafc8cea113e05ca68ae974530ecd044f68d4f9";
const changes=[
  [
    "import {createSelfPurchaseNavigation} from './self-purchase-navigation.ts';\n",
    ""
  ],
  [
    "    <ClientContent\n      runtime={runtime}\n",
    "    <ClientContent\n"
  ],
  [
    "export function ClientContent({\n  runtime,\n",
    "export function ClientContent({\n"
  ],
  [
    "  runtime?: ApplicationSession;\n",
    ""
  ],
  [
    "          onSelfPurchase={runtime&&ports.care?createSelfPurchaseNavigation(runtime,controller,boundary,navigator):undefined}\n",
    ""
  ]
];
/** Preserve the original Account integration witness only after exact whole-file
 * identity and exact five-clause reversal. This does not accept the new action. */
export function selfPurchaseApplicationPreimage(source){
 const hash=sha(source);if(hash===beforeHash)return source;
 if(hash!==afterHash)throw Error('unknown application postimage');
 let before=source;
 for(const [after,original] of changes){
  const index=before.indexOf(after);
  if(index<0||before.indexOf(after,index+1)>=0)throw Error('ambiguous application seam');
  before=before.slice(0,index)+original+before.slice(index+after.length);
 }
 if(sha(before)!==beforeHash)throw Error('application inverse mismatch');return before;
}
