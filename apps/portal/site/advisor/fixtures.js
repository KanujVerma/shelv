import { createApprovedAlexPresentation, intakePresentationOf, previewActiveRoutine } from './presentation-fixtures.js';
import { deriveRecommendations, publicPresentation, validatePresentation } from './presentation-model.js';
import { validateDraft } from './model.js';

const clone = value => structuredClone(value);
const identifier = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(value) && !['constructor', 'prototype', '__proto__'].includes(value);
const bounded = (value, max, empty = false) => typeof value === 'string' && Array.from(value).length <= max && (empty || value.trim().length > 0);
const fail = (message, status = 400, code) => { throw Object.assign(new Error(message), { status, ...(code ? { code } : {}) }); };
const versionRequired = () => fail('This content requires the current presentation version.', 409, 'concierge_content_version_required');
const proposal = items => ({ kind: 'proposal', currency: 'USD', items: clone(items), subtotalCents: items.reduce((sum, item) => sum + item.priceCents, 0), payable: false, shippingAndTaxConfirmed: false });
const productBaseline = presentation => presentation.baselineRoutine.filter(step => step.kind === 'product').map(step => ({ slot: step.slot, productId: step.productId }));
const allPublications = client => [...client.history, ...(client.plan ? [client.plan] : [])];
const containsR2 = view => Boolean(view.intake?.presentation || view.draft?.presentation || allPublications(view.client).some(publication => publication.presentation));

/** Explicit synthetic preview only. This module is never a failed-network fallback. */
export function createPreviewRequests({ viewer = false, scenario = 'ready' } = {}) {
  const capabilities = { view: true, edit: !viewer, publish: !viewer, confirmPayments: !viewer };
  const first = '00000000-0000-4000-8000-000000000001';
  const clients = [
    { clientId: first, displayName: 'Alex Morgan', enrollmentStatus: 'active', revision: 4, publishedVersion: 1, hasDraft: true },
    { clientId: '00000000-0000-4000-8000-000000000002', displayName: 'Jordan Lee', enrollmentStatus: 'active', revision: 0, publishedVersion: 0, hasDraft: false },
    { clientId: '00000000-0000-4000-8000-000000000003', displayName: 'Taylor Park', enrollmentStatus: 'cancelled', revision: 6, publishedVersion: 2, hasDraft: false }
  ];
  const approved = createApprovedAlexPresentation(), recommendation = deriveRecommendations(approved)[0], baseline = productBaseline(approved);
  const states = new Map(clients.map((client, index) => {
    const hasPlan = index !== 1, r2 = index === 0 && scenario !== 'legacy';
    const plan = hasPlan ? { version: client.publishedVersion, recommendations: [clone(recommendation)], itemStates: [{ recommendationId: recommendation.id, choice: 'approved', reason: null, received: false, startedOn: null }], ...(r2 ? { presentation: clone(approved) } : {}) } : null;
    return [client.clientId, {
      client: { revision: client.revision, plan, history: [], orderProposal: proposal(hasPlan ? [recommendation] : []), routine: hasPlan ? clone(baseline) : [], routineHistory: [] },
      intake: hasPlan ? { version: 1, goal: 'A comfortable, simple routine that wears well under makeup.', note: 'Synthetic private call notes. Prefers one moisturizer for morning and evening, under $25. No additional daily steps.', baseline: clone(baseline), ...(r2 ? { presentation: intakePresentationOf(approved) } : {}) } : null,
      draft: index === 0 ? { intakeVersion: 1, recommendations: [clone(recommendation)], advisorNote: 'Synthetic private draft note: discuss comfort at the two-week check-in.', ...(r2 ? { presentation: clone(approved) } : {}) } : null,
      meetingNotes: []
    }];
  }));
  if(scenario==='unapproved'){const state=states.get(first);state.client.plan.itemStates[0].choice=null;state.client.orderProposal=proposal([]);}
  const seen = new Map(); let failNext = scenario === 'uncertain';
  const serviceConfirmed = new Map(clients.map(client => [client.clientId, scenario !== 'awaiting-service' || client.clientId !== first]));
  const entitledVersions = new Map(clients.map(client => [client.clientId, new Set(serviceConfirmed.get(client.clientId) && client.publishedVersion ? [client.publishedVersion] : [])]));

  function publication(value, versioned) {
    if (!value) return null;
    return { ...clone(value), ...(versioned ? { presentation: value.presentation ? publicPresentation(value.presentation) : null } : {}) };
  }
  function clientView(id, { versioned = false, advisor = false } = {}) {
    const current = states.get(id).client, entitled = entitledVersions.get(id);
    const available = allPublications(current).filter(item => entitled.has(item.version)).sort((a, b) => a.version - b.version);
    const visible = { ...clone(current), plan: available.at(-1) || null, history: available.slice(0, -1) };
    const actualRoutine = previewActiveRoutine(advisor ? current : visible);
    const selected = advisor ? current : visible;
    const result = { ...clone(selected), plan: publication(selected.plan, versioned), history: selected.history.map(item => publication(item, versioned)) };
    if (!result.plan) result.orderProposal = proposal([]);
    if (versioned) { result.schemaVersion = 2; result.activeRoutine = actualRoutine; }
    return result;
  }
  function advisorView(id, versioned) {
    const view = states.get(id), result = { ...clone(view), client: clientView(id, { versioned, advisor: true }) };
    if (versioned) {
      result.schemaVersion = 2;
      if (result.intake) result.intake.presentation = view.intake.presentation ? publicPresentation(view.intake.presentation, { kind: 'intake' }) : null;
      if (result.draft) result.draft.presentation = view.draft.presentation ? publicPresentation(view.draft.presentation) : null;
    }
    return result;
  }
  function validateBaseline(value, allowEmpty = false) {
    if (!Array.isArray(value) || (!allowEmpty && value.length < 1) || value.length > 50 || value.some(item => !item || Object.keys(item).length !== 2 || !identifier(item.slot) || !identifier(item.productId)) || new Set(value.map(item => item.slot)).size !== value.length) fail('Choose one current product for each consultation category.');
  }
  function validateV2Command(command) {
    const fields = {
      save_intake_v2: ['goal', 'note', 'baseline', 'presentation'],
      save_draft_v2: ['intakeVersion', 'recommendations', 'advisorNote', 'presentation'],
      publish_v2: []
    }[command.action];
    if (!fields) return;
    const allowed = ['action', 'clientId', 'requestId', 'expectedRevision', ...fields];
    if (Object.keys(command).some(key => !allowed.includes(key)) || allowed.some(key => !Object.hasOwn(command, key))) fail('Complete only the supported presentation write fields.');
    if (new TextEncoder().encode(JSON.stringify(command)).length > 100000) fail('The complete request exceeds 100,000 bytes.');
  }
  function authoringBaseline(id, presentation) {
    const view = states.get(id);
    if (presentation?.routineBasis) {
      const active = clientView(id, { versioned: true, advisor: true }).activeRoutine;
      const basis = { products: active.filter(step => step.kind === 'product').map(step => ({ slot: step.slot, productId: step.productId, source: clone(step.source) })).sort((a,b) => a.slot<b.slot?-1:a.slot>b.slot?1:0) };
      if (JSON.stringify(presentation.routineBasis) !== JSON.stringify(basis)) fail('The current routine changed. Reload it before publishing.', 409, 'concierge_routine_basis_conflict');
      return basis.products;
    }
    if (view.client.routineHistory.length) fail('Use the actual current routine for the next plan.', 409, 'concierge_routine_basis_conflict');
    return view.intake.baseline;
  }
  const core = async command => {
    await new Promise(resolve => setTimeout(resolve, 160));
    if (scenario === 'error') fail('Service unavailable. Try again.', 503);
    if (!command || typeof command !== 'object') fail('Preview action unavailable.');
    if (command.action === 'advisor_list') return clone({ capabilities, clients: scenario === 'empty' ? [] : clients });
    const id = command.clientId || first, view = states.get(id);
    if (!view) fail('Client unavailable.', 404);
    if (['advisor_read', 'advisor_read_v2'].includes(command.action)) {
      if (command.action === 'advisor_read' && containsR2(view)) versionRequired();
      return advisorView(id, command.action.endsWith('_v2'));
    }
    if (['client_read', 'client_read_v2'].includes(command.action)) {
      const result = clientView(id, { versioned: command.action.endsWith('_v2') });
      if (command.action === 'client_read' && allPublications(result).some(item => item.presentation)) versionRequired();
      return result;
    }
    if (viewer) fail('View-only access.', 403);
    const actions = ['save_intake', 'save_intake_v2', 'save_meeting_note', 'save_draft', 'save_draft_v2', 'publish', 'publish_v2', 'decide', 'receive', 'start'];
    if (!actions.includes(command.action)) fail('Preview action unavailable.');
    if (typeof command.requestId !== 'string' || !command.requestId) fail('A request identity is required.');
    const receiptKey = `${id}:${command.requestId}`;
    if (seen.has(receiptKey)) {
      const previous = seen.get(receiptKey); if (JSON.stringify(command) !== previous.command) fail('Request conflict.', 409);
      return clone(previous.result);
    }
    if (['save_intake', 'save_draft', 'publish'].includes(command.action) && containsR2(view)) versionRequired();
    if (scenario === 'conflict' || command.expectedRevision !== view.client.revision) fail('This plan changed. Your edits are preserved.', 409);
    validateV2Command(command);
    if (['save_intake', 'save_intake_v2'].includes(command.action)) {
      if (!bounded(command.goal, 300) || !bounded(command.note, 4000, true)) fail('Complete the consultation goal and private note.');
      validateBaseline(command.baseline, command.action === 'save_intake_v2');
      const sorted = value => value.map(item => `${item.slot}:${item.productId}`).sort();
      if (view.intake && JSON.stringify(sorted(command.baseline)) !== JSON.stringify(sorted(view.intake.baseline))) fail('The original consultation products cannot be cleared or replaced.', 409, 'concierge_baseline_conflict');
      if (command.action === 'save_intake_v2') {
        const errors = validatePresentation(command.presentation, { kind: 'intake', baseline: command.baseline }); if (errors.length) fail(errors.join(' '));
      }
      view.intake = { version: (view.intake?.version || 0) + 1, goal: command.goal, note: command.note, baseline: clone(command.baseline), ...(command.action === 'save_intake_v2' ? { presentation: clone(command.presentation) } : {}) };
      if (!view.client.routine.length) view.client.routine = clone(command.baseline);
    } else if (command.action === 'save_meeting_note') {
      if (!bounded(command.text, 20000) || !['notes', 'transcript'].includes(command.kind)) fail('Complete the private meeting note.');
      view.meetingNotes.push({ id: command.requestId, kind: command.kind, text: command.text, createdAt: '2026-10-18T12:00:00Z' });
    } else if (['save_draft', 'save_draft_v2'].includes(command.action)) {
      const draft = { intakeVersion: command.intakeVersion, recommendations: clone(command.recommendations), advisorNote: command.advisorNote, ...(command.action === 'save_draft_v2' ? { presentation: clone(command.presentation) } : {}) };
      if (!view.intake || command.intakeVersion !== view.intake.version) fail('Review the latest consultation before saving this draft.', 409);
      const errors = validateDraft(draft);
      if (command.action === 'save_draft_v2') errors.push(...validatePresentation(command.presentation, { baseline: authoringBaseline(id, command.presentation), recommendations: command.recommendations }));
      if (errors.length) fail(errors.join(' '));
      view.draft = draft;
    } else if (['publish', 'publish_v2'].includes(command.action)) {
      if (!view.draft || view.draft.intakeVersion !== view.intake?.version) fail('Save a draft against the latest consultation first.', 409);
      if (command.action === 'publish_v2' && !view.draft.presentation) fail('Save complete presentation content before publishing.');
      const errors = validateDraft(view.draft); if (command.action === 'publish_v2') errors.push(...validatePresentation(view.draft.presentation, { baseline: authoringBaseline(id, view.draft.presentation), recommendations: view.draft.recommendations })); if (errors.length) fail(errors.join(' '));
      if (command.action === 'publish' && !view.draft.recommendations.length) fail('Add and save a recommendation before publishing.');
      const previousStates = new Map(allPublications(view.client).flatMap(value => value.itemStates.map(state => [state.recommendationId, state])));
      if (view.client.plan) view.client.history.push(clone(view.client.plan));
      view.client.plan = { version: (view.client.plan?.version || 0) + 1, recommendations: clone(view.draft.recommendations), itemStates: view.draft.recommendations.map(item => previousStates.has(item.id) ? clone(previousStates.get(item.id)) : { recommendationId: item.id, choice: null, reason: null, received: false, startedOn: null }), ...(view.draft.presentation ? { presentation: clone(view.draft.presentation) } : {}) };
      if (serviceConfirmed.get(id)) entitledVersions.get(id).add(view.client.plan.version);
      view.draft = null;
    } else {
      const selectedPublication = allPublications(view.client).find(item => item.version === command.version);
      const state = selectedPublication?.itemStates.find(item => item.recommendationId === command.recommendationId);
      if (!state || !entitledVersions.get(id).has(selectedPublication.version)) fail('Recommendation unavailable.', 404);
      if (command.action === 'decide') { if (!['approved', 'declined'].includes(command.choice)) fail('Choose an approval decision.'); state.choice = command.choice; state.reason = command.reason ?? null; }
      if (command.action === 'receive') { if (state.choice !== 'approved') fail('Approve first.', 409); state.received = true; }
      if (command.action === 'start') {
        if (!state.received) fail('Record receipt first.', 409);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(command.startedOn || '') || command.startedOn < '1900-01-01' || !Number.isFinite(Date.parse(command.startedOn)) || new Date(command.startedOn).toISOString().slice(0, 10) !== command.startedOn) fail('Choose a valid actual start date.');
        const item = selectedPublication.recommendations.find(item => item.id === state.recommendationId);
        state.startedOn = command.startedOn; view.client.routine = view.client.routine.filter(current => current.slot !== item.slot);
        view.client.routine.push({ slot: item.slot, productId: item.proposedProductId });
        view.client.routineHistory.push({ version: selectedPublication.version, recommendationId: item.id, slot: item.slot, productId: item.proposedProductId, startedOn: command.startedOn });
      }
      for (const other of allPublications(view.client)) { const matching = other.itemStates.find(item => item.recommendationId === state.recommendationId); if (matching && matching !== state) Object.assign(matching, clone(state)); }
    }
    const cart = (view.client.plan?.recommendations || []).filter(item => view.client.plan.itemStates.some(state => state.recommendationId === item.id && state.choice === 'approved' && !state.received));
    view.client.orderProposal = proposal(cart); view.client.revision++;
    const summary = clients.find(client => client.clientId === id); Object.assign(summary, { revision: view.client.revision, publishedVersion: view.client.plan?.version || 0, hasDraft: Boolean(view.draft) });
    const result = { revision: view.client.revision, publishedVersion: view.client.plan?.version || 0, operation: command.action };
    seen.set(receiptKey, { command: JSON.stringify(command), result });
    if (failNext) { failNext = false; fail('The reply was interrupted. Retry to confirm the same write.', 503); }
    return clone(result);
  };
  return {
    core, clientId: first, capabilities, productLabels: { 'moisturizer-1': 'Vanicream Daily Facial Moisturizer' },
    readClientView(clientId=first){if(!states.has(clientId))fail('Client unavailable.',404);return clientView(clientId,{versioned:true});},
    confirmService(clientId) { if (serviceConfirmed.has(clientId)) { serviceConfirmed.set(clientId, true); const version = states.get(clientId).client.plan?.version; if (version) entitledVersions.get(clientId).add(version); } }
  };
}
