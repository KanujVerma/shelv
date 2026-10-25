/** A saved draft is display content, never a fabricated publication or client decision. */
export function createPreviewDisplayPlan(draft) {
  if(!draft)return null;
  return {version:null,presentation:structuredClone(draft.presentation),recommendations:structuredClone(draft.recommendations),itemStates:[]};
}
