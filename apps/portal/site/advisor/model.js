import { validatePresentation, publicPresentation } from './presentation-model.js';

const clone = value => structuredClone(value);
const hasPresentation = draft => draft?.presentation != null;
const draftPayload = draft => ({ intakeVersion: draft.intakeVersion, recommendations: clone(draft.recommendations), advisorNote: draft.advisorNote, ...(hasPresentation(draft) ? { presentation: clone(draft.presentation) } : {}) });
const fields = ['id', 'slot', 'currentProductId', 'proposedProductId', 'priceCents', 'currency', 'rationale'];
const identifier = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(value) && !['constructor','prototype','__proto__'].includes(value);
const boundedText = (value, length, empty = false) => typeof value === 'string' && Array.from(value).length <= length && (empty || value.trim().length > 0);

export function validateDraft(draft) {
  const errors = [];
  if (!Number.isSafeInteger(draft?.intakeVersion) || draft.intakeVersion < 1) errors.push('Save the consultation before drafting a plan.');
  if (!boundedText(draft?.advisorNote, 4000, true)) errors.push('Private note must be at most 4,000 characters.');
  if (!Array.isArray(draft?.recommendations) || draft.recommendations.length > 50) return [...errors, 'Use at most 50 recommendations.'];
  const ids = new Set(), categories = new Set();
  for (const [i, item] of draft.recommendations.entries()) {
    const label = `Recommendation ${i + 1}`;
    if (!item || typeof item !== 'object') { errors.push(`${label}: complete the product details.`); continue; }
    if (!identifier(item.id) || ids.has(item.id)) errors.push(`${label}: use a unique recommendation ID.`);
    if (!identifier(item.slot) || categories.has(item.slot)) errors.push(`${label}: choose one replacement per category.`);
    const addition=hasPresentation(draft)&&draft.presentation.categoryCards?.some(card=>card.recommendationId===item.id&&card.kind==='addition');
    if (!(addition&&item.currentProductId===null)&&!identifier(item.currentProductId) || !identifier(item.proposedProductId)) errors.push(`${label}: choose both products.`);
    if (!Number.isSafeInteger(item.priceCents) || item.priceCents < 0 || item.priceCents > 100000000 || item.currency !== 'USD') errors.push(`${label}: enter a valid USD price.`);
    if (!boundedText(item.rationale, 4000)) errors.push(`${label}: add a personal reason of at most 4,000 characters.`);
    ids.add(item.id); categories.add(item.slot);
  }
  if (hasPresentation(draft)) errors.push(...validatePresentation(draft.presentation, { kind: 'plan', recommendations: draft.recommendations }));
  return errors;
}

export function clientPreview(draft) {
  return { recommendations: (draft?.recommendations || []).map(item => Object.fromEntries(fields.map(key => [key, clone(item[key])]))), ...(hasPresentation(draft) ? { presentation: publicPresentation(draft.presentation) } : {}) };
}
export function cartItems(view) { return clone(view?.orderProposal?.items || []); }

export function parseDraftPaste(text) {
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('Paste valid draft JSON.'); }
  const baseFields = ['intakeVersion','recommendations','advisorNote'];
  const allowed = value && Object.hasOwn(value, 'presentation') ? [...baseFields, 'presentation'] : baseFields;
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== allowed.length || !allowed.every(key => Object.hasOwn(value,key))) throw new Error('Draft fields must be intakeVersion, recommendations and advisorNote, plus presentation for R2 content.');
  if (allowed.length === 4 && !hasPresentation(value)) throw new Error('R2 presentation must contain complete plan fields.');
  if (!Array.isArray(value.recommendations) || value.recommendations.some(item => !item || Object.keys(item).length !== fields.length || !fields.every(key => Object.hasOwn(item,key)))) throw new Error('Each recommendation must contain only the supported product fields.');
  const errors = validateDraft(value);
  if (errors.length) throw new Error(errors.join(' '));
  return clone(value);
}

/** Keeps an uncertain write immutable. It never substitutes a newer revision on retry. */
export class DraftSession {
  constructor(clientId, view, makeId = () => crypto.randomUUID()) { this.clientId = clientId; this.makeId = makeId; this.reload(view); }
  reload(view) {
    this.view = clone(view); this.revision = view.client.revision;
    this.draft = clone(view.draft || {intakeVersion:view.intake?.version || 0,recommendations:[],advisorNote:''});
    this.saved = JSON.stringify(draftPayload(this.draft));
    if (view.intake && view.draft && view.draft.intakeVersion !== view.intake.version) this.draft.intakeVersion = view.intake.version;
    this.dirty = JSON.stringify(draftPayload(this.draft)) !== this.saved; this.pending = null; this.status = 'ready';
    this.publishedVersion = view.client.plan?.version || 0;
  }
  get hasLocalDraftEdits() {
    const expected=JSON.parse(this.saved);
    if(this.view.intake&&this.view.draft&&expected.intakeVersion!==this.view.intake.version)expected.intakeVersion=this.view.intake.version;
    return JSON.stringify(draftPayload(this.draft))!==JSON.stringify(expected);
  }
  edit(draft) {
    if (this.status === 'uncertain' || this.status === 'saving') throw new Error('Retry or reload the pending write before editing.');
    this.draft = clone(draft); this.dirty = JSON.stringify(draftPayload(this.draft)) !== this.saved;
    if (this.status !== 'conflict') this.status = 'ready';
  }
  async save(request) {
    if (this.status === 'conflict') throw new Error('Resolve the conflict by reloading the latest plan.');
    if (this.pending) throw new Error('Retry the pending write first.');
    const errors = validateDraft(this.draft); if (errors.length) throw new Error(errors.join(' '));
    return this.perform({action:hasPresentation(this.draft)?'save_draft_v2':'save_draft', clientId:this.clientId, requestId:this.makeId(), expectedRevision:this.revision, ...draftPayload(this.draft)}, request);
  }
  async publish(request) {
    if (this.status === 'conflict') throw new Error('Resolve the conflict by reloading the latest plan.');
    if (this.pending) throw new Error('Retry the pending write first.');
    if (this.dirty || !this.view.draft) throw new Error('Save your draft before publishing.');
    const errors = validateDraft(this.draft);
    if (errors.length) throw new Error(errors.join(' '));
    if (!hasPresentation(this.draft) && !this.draft.recommendations.length) throw new Error('Add and save a recommendation before publishing.');
    return this.perform({action:hasPresentation(this.draft)?'publish_v2':'publish',clientId:this.clientId,requestId:this.makeId(),expectedRevision:this.revision},request);
  }
  async retry(request) {
    if (this.status !== 'uncertain' || !this.pending) throw new Error('There is no pending write to retry.');
    return this.perform(this.pending, request);
  }
  async perform(command, request) {
    this.pending = clone(command); this.status = 'saving';
    try {
      const result = await request(clone(this.pending));
      if (!Number.isSafeInteger(result?.revision) || result.revision <= this.revision || !Number.isSafeInteger(result?.publishedVersion) || result.publishedVersion < 0 || result.operation !== command.action) throw Object.assign(new Error('Could not verify the saved result.'), {status:503});
      this.revision = result.revision; this.publishedVersion = result.publishedVersion;
      if (['save_draft','save_draft_v2'].includes(command.action)) { const savedDraft = draftPayload(command); this.saved = JSON.stringify(savedDraft); this.view.draft = clone(savedDraft); this.dirty = JSON.stringify(draftPayload(this.draft)) !== this.saved; }
      this.pending = null; this.status = ['publish','publish_v2'].includes(command.action) ? 'published' : 'saved'; return result;
    } catch (error) {
      if (error.status === 409) { this.pending = null; this.status = 'conflict'; }
      else if (error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) { this.pending = null; this.status = 'error'; }
      else this.status = 'uncertain';
      throw error;
    }
  }
}

export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money = cents => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
export const title = value => String(value || '').replace(/[_-]/g,' ').replace(/^./,c=>c.toUpperCase());
export function safeUrl(value) { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; } }
