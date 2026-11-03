import assert from 'node:assert/strict';
import ts from '../../node_modules/typescript/lib/typescript.js';
import {portalCiBaselines} from '../../../../tests/helpers/portal-ci-baselines.ts';

const inventory=/['"](?:read_photo_inventory_v1|concierge_checkin_photo_inventory_v1)['"]/;
const functions=new Set(['mapCheckinPhotoInventory']);
const types=new Set(['CheckinPhotoInventory','CheckinPhotoInventoryPage']);
const imports=new Set([...functions,...types,'exactKeys','readInteger','readObject','requireValue']);
const owned=new Set(['commands','types','projection','handler','index'].map(n=>'supabase/functions/concierge-checkins/'+n+'.ts').concat('supabase/functions/concierge-operations/runtime.ts'));

/** Reverse only the approved Worker/DOM privacy return annotation. Runtime nodes stay exact. */
export function withoutApprovedFetchPrivacyType(text,file){
  if(file!=='supabase/functions/concierge-operations/runtime.ts')return text;
  const current="const options = (token: string, signal?: AbortSignal): RequestInit & {credentials: 'omit'} =>";
  const previous="const options = (token: string, signal?: AbortSignal): RequestInit =>";
  const matches=text.split(current).length-1;
  assert.ok(matches<=1,'at most one exact approved privacy return annotation');
  return matches===1?text.replace(current,previous):text;
}

/** Erase only this separately approved additive producer for older AST witnesses. */
export function withoutPhotoInventory(text,file){
  if(!owned.has(file))return text;
  const source=ts.createSourceFile(file,withoutApprovedFetchPrivacyType(text,file),ts.ScriptTarget.ESNext,true);
  const result=ts.transform(source,[context=>{
    const visit=node=>{
      if(ts.isTypeAliasDeclaration(node)&&types.has(node.name.text)||ts.isFunctionDeclaration(node)&&functions.has(node.name?.text))return undefined;
      if(ts.isIfStatement(node)&&inventory.test(node.expression.getText(source)))return undefined;
      if(ts.isConditionalExpression(node)&&inventory.test(node.condition.getText(source)))return ts.visitNode(node.whenFalse,visit);
      if(ts.isArrayLiteralExpression(node))return ts.factory.updateArrayLiteralExpression(node,node.elements.filter(e=>!ts.isStringLiteral(e)||e.text!=='concierge_checkin_photo_inventory_v1').map(e=>ts.visitNode(e,visit)));
      if(ts.isUnionTypeNode(node))return ts.factory.updateUnionTypeNode(node,node.types.filter(e=>!inventory.test(e.getText(source))).map(e=>ts.visitNode(e,visit)));
      if(ts.isImportDeclaration(node)&&node.importClause?.namedBindings&&ts.isNamedImports(node.importClause.namedBindings)){
        const remove=file.endsWith('/projection.ts')?imports:new Set(['mapCheckinPhotoInventory']);
        const elements=node.importClause.namedBindings.elements.filter(e=>!remove.has(e.name.text));
        if(!elements.length&&!node.importClause.name)return undefined;
        return ts.factory.updateImportDeclaration(node,node.modifiers,ts.factory.updateImportClause(node.importClause,node.importClause.isTypeOnly,node.importClause.name,ts.factory.updateNamedImports(node.importClause.namedBindings,elements)),node.moduleSpecifier,node.attributes);
      }
      return ts.visitEachChild(node,visit,context);
    };return node=>ts.visitNode(node,visit);
  }]);
  const printed=ts.createPrinter({removeComments:true}).printFile(result.transformed[0]);result.dispose();return printed;
}

function inventoryBranch(text){
  const source=ts.createSourceFile('handler.ts',text,ts.ScriptTarget.ESNext,true),found=[];
  function visit(node){if(ts.isIfStatement(node)&&node.expression.getText(source)==="call.name === 'concierge_checkin_photo_inventory_v1'")found.push(node);ts.forEachChild(node,visit);}
  visit(source);assert.equal(found.length,1,'one exact inventory dispatch branch');return {source,node:found[0]};
}
function removeHandlerAddition(text){
  const {node}=inventoryBranch(text);
  const result=text.slice(0,node.getFullStart())+text.slice(node.end);
  assert.equal(result.split(', mapCheckinPhotoInventory').length,2);
  return result.replace(', mapCheckinPhotoInventory','');
}
/** Historical annotation preimage plus the exact new branch, never current fallback. */
export function withApprovedInventoryHandler(previous,current){
  const baseline=portalCiBaselines.readBytes('3bd152a259b7b9b9971caa1546e65f69de12aab9','supabase/functions/concierge-checkins/handler.ts').toString('utf8');
  assert.equal(removeHandlerAddition(current),baseline,'all noninventory handler bytes retain the approved preimage');
  const {source,node}=inventoryBranch(current),marker="    if (call.name === 'concierge_checkin_head_v1') {";
  assert.equal(previous.split(marker).length,2);
  assert.equal(previous.split('mapCheckinPhotoHead }').length,2);
  const augmented=previous.replace('mapCheckinPhotoHead }','mapCheckinPhotoHead, mapCheckinPhotoInventory }').replace(marker,'    '+node.getText(source)+'\n'+marker);
  assert.equal(removeHandlerAddition(augmented),previous,'inventory augmentation is byte-reversible');
  return augmented;
}
