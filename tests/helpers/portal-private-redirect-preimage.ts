/** Exact inverse of W0's two private-provider redirect corrections at706b323d.
 * Historical preservation only: runtime correctness is tested in workerd.
 * Unknown source bytes refuse before any transformation. No fixture is rebound.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=(value:string)=>createHash('sha256').update(value).digest('hex');
const root='apps/portal/session-integration/runtime/server/';
const corrections:Record<string,{before:string;after:string;original:string;corrected:string}>={
 // SHA pairs bind the entire files, including every unrelated authority check.
 [root+"upstream.ts"]:{
  "before": "16d4e818a52d79351e02162a506dbee7770ee3388b3beece12cfe38949eee1dd",
  "after": "4fdadd299c719a29ac52520dacf6b7fb225d3cdc1786abd49d0086f272c51282",
  "original": "            const response=await this.fetcher(`${SUPABASE_ORIGIN}/functions/v1/concierge-notifications`,{method:'POST',headers:this.headers(credentials.access_token),body:JSON.stringify(command),signal:controller.signal,redirect:'error',cache:'no-store'});\n",
  "corrected": "            const response=await this.fetcher(`${SUPABASE_ORIGIN}/functions/v1/concierge-notifications`,{method:'POST',headers:this.headers(credentials.access_token),body:JSON.stringify(command),signal:controller.signal,redirect:'manual',cache:'no-store'});\n            if(response.status>=300&&response.status<400){\n                try{void response.body?.cancel().catch(()=>{});}catch{}\n                throw new SessionError(503,writing?'uncertain':'unavailable');\n            }\n"
},
 [root+"client-upstream.ts"]:{
  "before": "18120c8450b0744fdc67f1ac342975f92fa6f9949f12352e0bde5fa5c1e4fc78",
  "after": "8db855829807c5f3a0ded68cbd14fa5b80975e26ff9d21eb5b28991bbb11569e",
  "original": "            const response=await this.inventoryFetcher(`${SUPABASE_ORIGIN}/functions/v1/concierge-checkins`,{method:'POST',headers:this.headers(credentials.access_token),body:JSON.stringify(command),signal:controller.signal,redirect:'error',cache:'no-store'});\n",
  "corrected": "            const response=await this.inventoryFetcher(`${SUPABASE_ORIGIN}/functions/v1/concierge-checkins`,{method:'POST',headers:this.headers(credentials.access_token),body:JSON.stringify(command),signal:controller.signal,redirect:'manual',cache:'no-store'});\n            if(response.status>=300&&response.status<400){\n                try{void response.body?.cancel().catch(()=>{});}catch{}\n                throw new SessionError(503,'unavailable');\n            }\n"
},
};
export function privateRedirectHistoricalPreimage(text:string,path:string):string{
 const correction=corrections[path];
 if(!correction)return text;
 if(sha(text)===correction.before)return text;
 assert.equal(sha(text),correction.after,path+' exact private redirect postimage');
 assert.equal(text.split(correction.corrected).length,2,path+' one exact correction');
 const original=text.replace(correction.corrected,correction.original);
 assert.equal(sha(original),correction.before,path+' complete historical preimage');
 return original;
}
