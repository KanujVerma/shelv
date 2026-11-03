import test from 'node:test';
import assert from 'node:assert/strict';
import {localMayaImage} from '../src/features/walkthrough/maya/images.ts';
import {createMayaFixture,mayaCareView} from '../src/features/walkthrough/maya/fixture.ts';
import {mapCareResult} from '../../../src/contracts/PortalCareMapping.ts';

test('image-bearing Maya remains an exact canonical Care read projection',()=>{
  const {base,use}=createMayaFixture(),view=mayaCareView(base,use,false);
  assert.deepEqual(mapCareResult(view,{schemaVersion:1,action:'read_client_plan_v2',version:null}),view);
});

for(const file of ['moisturizer.jpg','sunscreen.webp','makeup.jpg','remover.jpg','cleanser.jpg','azelaic.png','hydro.jpg','aveeno.jpg','balm.jpg','ha.png','niacinamide.png','glycolic.png']){
  const path='/maya/assets/'+file;
  test(`only the packaged source reference for ${file} becomes a local image`,()=>{
    assert.equal(localMayaImage(path),'assets/maya-'+file);
    assert.equal(localMayaImage('https://portal.goshelv.com'+path),'assets/maya-'+file);
    assert.equal(localMayaImage('assets/maya-'+file),'assets/maya-'+file);
  });
}
for(const value of [null,'','/maya/assets/unknown.jpg','/maya/images/moisturizer.jpg','//portal.goshelv.com/maya/assets/moisturizer.jpg','https://other.example/maya/assets/moisturizer.jpg','http://portal.goshelv.com/maya/assets/moisturizer.jpg','https://portal.goshelv.com:443/maya/assets/moisturizer.jpg','https://user@portal.goshelv.com/maya/assets/moisturizer.jpg','https://portal.goshelv.com/maya/assets/moisturizer.jpg?token=example','/maya/assets/moisturizer.jpg#other','/maya/assets/../assets/moisturizer.jpg','/maya/assets/%6doisturizer.jpg']){
  test(`unrecognized reference ${JSON.stringify(value)} retains the neutral fallback`,()=>assert.equal(localMayaImage(value),null));
}
