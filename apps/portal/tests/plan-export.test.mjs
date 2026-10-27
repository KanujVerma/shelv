import test from 'node:test';import assert from 'node:assert/strict';
import {documentText,planDocument} from '../site/client/plan-export.js';
import {createPreviewRequests} from '../site/advisor/fixtures.js';
test('portable document has semantic sections/lists and safe clickable sources with escaped text',()=>{
 const html=documentText({name:'<img src=x onerror=alert(1)>',version:2,text:'Recommendations\nKeep the current product.\n\nCurrent product directions\n1. Apply the authored amount.\n2. Stop if it irritates.\n\nSources\nBrand: https://example.com/product\nUnsafe: javascript:alert(1)\nPrivate: https://example.com/?token=secret\n<script>private markup</script>'});
 assert.doesNotMatch(html,/<pre\b|<img\b|<script\b/);assert.match(html,/<section[^>]*><h2[^>]*>Recommendations<\/h2>/);assert.match(html,/<ol><li>Apply the authored amount\.<\/li><li>Stop if it irritates\.<\/li><\/ol>/);assert.match(html,/href="https:\/\/example.com\/product"/);assert.doesNotMatch(html,/href="(?:javascript:|[^\"]*token=)/);assert.match(html,/&lt;img/);assert.match(html,/&lt;script&gt;/);assert.match(html,/Print or save as PDF/);
});
test('current plan document retains actual authored/public content and excludes unknown private fields',async()=>{
 const fixture=createPreviewRequests({scenario:'unapproved'}),view=await fixture.core({action:'client_read_v2'});view.privateNote='PRIVATE_CANARY';view.plan.advisorNote='PRIVATE_CANARY';const html=planDocument(view);
 assert.match(html,/<h2[^>]*>Your current routine<\/h2>/);assert.match(html,/Vanicream/);assert.match(html,/Current product directions/);assert.doesNotMatch(html,/PRIVATE_CANARY/);
});
