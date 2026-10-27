/** Review applies to the publication the client actually saw, never future advice. */
export class ClientReviewState {
 constructor(){this.version=undefined;this.reviewed=new Set();this.expanded=new Set();}
 accept(plan){const version=plan?.version??null;if(version===this.version)return;this.version=version;this.reviewed.clear();this.expanded.clear();for(const card of plan?.presentation?.categoryCards||[])this.expanded.add(card.slot);}
}
