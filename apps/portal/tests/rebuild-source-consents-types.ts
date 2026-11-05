import {createSourceConsentsModel,SourceConsentSection,SourceConsentReviewForm} from '../src/features/account/source-consents/index.ts';
import type {SourceConsentsInput,SourceConsentWithdrawalIntent,SourceConsentRecoveryInput,SourceConsentReview} from '../src/features/account/source-consents/index.ts';
import type {SourceAccountPage,SourceAccountWithdrawCommand} from '../../../src/contracts/PortalSourceAccount.ts';

declare const page:SourceAccountPage;
declare const original:SourceAccountWithdrawCommand;
declare const review:SourceConsentReview;
const input:SourceConsentsInput={read:{state:'loaded',page},presentation:'review',onWithdrawalIntent(intent){
  const exact:SourceConsentWithdrawalIntent=intent;
  // @ts-expect-error local intent cannot be treated as an idempotent withdrawal command
  const wire:SourceAccountWithdrawCommand=intent;
  // @ts-expect-error the captured exact disclosure cannot be edited through the intent
  exact.consent.disclosure.version=2;
  void wire;
}};
const model=createSourceConsentsModel(input);
void SourceConsentSection;void SourceConsentReviewForm;
model.confirmWithdrawal(review);
// @ts-expect-error client selection is not a presentation input
createSourceConsentsModel({clientId:page.clientId});
// @ts-expect-error a caller cannot set Source authority
createSourceConsentsModel({sourceDataCurrent:true});
// @ts-expect-error a current-authority callback is not a UI dependency
createSourceConsentsModel({isCurrent:()=>true});
// @ts-expect-error a live operation port is not a UI dependency
createSourceConsentsModel({execute:async()=>({outcome:'withdrawn'})});
// @ts-expect-error arbitrary UUIDs are not row selectors
model.reviewWithdrawal(page.clientId);
// @ts-expect-error loaded Root data remains immutable in the presentation
model.getSnapshot().rows[0]!.record.disclosureText='changed';
const pending:SourceConsentRecoveryInput={original,requestHash:'a'.repeat(64),observation:{state:'unknown'}};
void pending;
// @ts-expect-error no committed receipt/success is accepted in this unactivated slice
const success:SourceConsentRecoveryInput['observation']={state:'observed',status:{schemaVersion:1,visibility:'client_account',clientId:page.clientId,requestId:original.requestId,status:'committed',receipt:{}}};
void success;
model.dispose();
