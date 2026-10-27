// src/mount-case.js
import { mountClientPortal } from "../client/view.js";
import { createSyntheticClientRequests as sharedSyntheticClientRequests } from "../preview/synthetic-requests.js";
import { createCheckinPreviewStore as sharedCheckinPreviewStore, createCheckinPreviewRequest as sharedCheckinPreviewRequest } from "../features/checkins/fixtures.js";
import { createPaymentPreviewStore as sharedPaymentPreviewStore, createPaymentPreviewRequest as sharedPaymentPreviewRequest, syncPaymentPreviewProposal as sharedPaymentProposalSync } from "../features/payments/fixtures.js";

// src/advisor/presentation-model.js
var ingredientGuideKeys = /* @__PURE__ */ new Set(["ceramides", "behentrimonium-methosulfate", "carbomer", "ceramide-ap", "ceramide-eop", "ceramide-np", "ceramide_ap", "ceramide_as", "ceramide_eop", "ceramide_ng", "ceramide_np", "cetearyl-alcohol", "cetyl-alcohol", "cholesterol", "dimethicone", "dipotassium-phosphate", "disodium-edta", "ethylhexylglycerin", "glycerin", "glyceryl-stearate", "hyaluronic_acid", "niacinamide", "phenoxyethanol", "phytosphingosine", "polysorbate-20", "potassium-phosphate", "sodium-hyaluronate", "sodium-lauroyl-lactylate", "sodium_hyaluronate", "squalane", "stearyl-alcohol", "tocopherol", "xanthan-gum"]);
var identifier = (value) => typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(value) && !["constructor", "prototype", "__proto__"].includes(value);
var plain = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var validDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= "1900-01-01" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
function safeContentUrl(value, { image = false } = {}) {
  if (typeof value !== "string" || !value.trim() || Array.from(value).length > 2048) return null;
  if (image && /^assets\/[a-zA-Z0-9][a-zA-Z0-9_-]*\.(?:jpg|jpeg|png|webp)$/.test(value)) return value;
  if (/[\s\\\u0000-\u001f\u007f]/u.test(value) || !/^https:\/\//.test(value)) return null;
  const host = /^https:\/\/([^/?#]+)(?:[/?#]|$)/.exec(value)?.[1];
  if (!host || host.includes("@") || !/^(?=.{1,259}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}(?::[0-9]{1,5})?$/.test(host)) return null;
  const name = host.split(":")[0].toLowerCase();
  if (name.length > 253 || /(?:^|\.)(?:localhost|local|internal|lan|home|test|invalid)$/.test(name) || /(?:^|\.)xn--/i.test(name)) return null;
  try {
    const url2 = new URL(value);
    if (url2.username || url2.password || url2.protocol !== "https:") return null;
  } catch {
    return null;
  }
  if (value.replace(/%[0-9a-f]{2}/gi, "").includes("%")) return null;
  const decoded = value.replace(/%([0-9a-f]{2})/gi, (_, hex) => {
    const n = Number.parseInt(hex, 16);
    return n < 128 ? String.fromCharCode(n) : "%" + hex;
  }).toLowerCase();
  if (/\/\.{1,2}(?:\/|[?#]|$)/.test(decoded) || decoded.includes("\0") || /\/storage\/v1\/(?:object|render\/image)\/(?:sign|authenticated)(?:\/|[?#])|concierge-(?:checkin-photos|payment-evidence)|customer-skin-photos|[?&#](?:token|access_token|authorization|apikey|signature|sig|x-amz-[a-z-]+|x-goog-[a-z-]+)=/.test(decoded)) return null;
  return value;
}
var text = (max, empty = false) => ({ type: "text", max, empty });
var integer = (min, max) => ({ type: "integer", min, max });
var oneOf = (...values) => ({ type: "enum", values });
var object = (fields) => ({ type: "object", fields });
var array = (item, min = 0, max = 12) => ({ type: "array", item, min, max });
var nullable = (rule) => ({ ...rule, nullable: true });
var id = { type: "id" };
var url = { type: "url" };
var date = { type: "date" };
var ingredient = { type: "ingredient" };
var source = object({ label: text(200), url });
var section = object({ title: text(200), body: text(4e3) });
var price = object({ cents: integer(0, 1e8), currency: oneOf("USD"), sourceUrl: nullable(url), checkedOn: nullable(date), illustrative: { type: "boolean" } });
var product = object({ id, name: text(200), brand: nullable(text(100)), variant: nullable(text(200)), sizeLabel: text(120, true), productUrl: nullable(url), imageUrl: nullable({ type: "image" }), reference: nullable(text(1e3)), displayPrice: nullable(price), sourceLabel: { ...text(200), optional: true } });
var usage = object({ periods: array(oneOf("morning", "evening"), 1, 2), order: integer(1, 50), short: object({ morning: nullable(text(2e3)), evening: nullable(text(2e3)) }), instructions: array(text(2e3), 1, 12) });
var guide = object({ id, productId: nullable(id), title: text(200), intro: text(4e3, true), steps: array(object({ title: nullable(text(200)), body: text(4e3) })), careNote: nullable(text(4e3)), sources: array(source) });
var comparison = object({ label: text(200), currentText: text(4e3), proposedText: text(4e3), significance: text(4e3), ingredientGuideKey: nullable(ingredient), guideNote: nullable(text(4e3)), sources: array(source) });
var fact = object({ title: text(200), body: text(4e3), ingredientGuideKey: nullable(ingredient), sources: array(source) });
var step = object({ id, kind: oneOf("product", "instruction"), slot: nullable(id), productId: nullable(id), product: nullable(product), title: text(200), usage });
var card = object({ id, slot: id, kind: oneOf("replace", "keep", "finish_then_replace", "no_addition", "addition", "optional_alternative", "pause", "leave_out"), recommendationId: nullable(id), title: text(200), subtitle: text(200, true), rationaleTitle: text(200), reasons: array(section, 1, 12), actions: array(text(2e3)), currentProduct: nullable(product), proposedProduct: nullable(product), usage: nullable(usage), comparisons: array(comparison), factsTitle: text(200), facts: array(fact), how: guide, sources: array(source), group: { ...id, optional: true }, decisionLabels: { ...object({ current: text(120), proposed: text(120) }), optional: true } });
var intakeSchema = object({ schemaVersion: oneOf(2), consultationSections: array(section), baselineRoutine: array(step, 1, 50) });
var schema = object({ schemaVersion: oneOf(2), title: text(200), summary: text(4e3, true), preparedBy: text(200), preparedOn: nullable(date), sources: array(source), consultationSections: array(section), categoryCards: array(card, 0, 50), baselineRoutine: array(step, 1, 50), routineGuides: array(guide) });
function check(rule, value, path, errors) {
  if (rule.optional && value === void 0) return;
  if (rule.nullable && value === null) return;
  const fail2 = (message) => errors.push(`${path}: ${message}`);
  switch (rule.type) {
    case "object":
      if (!plain(value)) {
        fail2("complete these fields");
        return;
      }
      if (Object.keys(value).some((key) => !Object.hasOwn(rule.fields, key))) fail2("unsupported field");
      for (const [key, child] of Object.entries(rule.fields)) check(child, value[key], `${path}.${key}`, errors);
      return;
    case "array":
      if (!Array.isArray(value) || value.length < rule.min || value.length > rule.max) {
        fail2(`use ${rule.min}\u2013${rule.max} entries`);
        return;
      }
      value.forEach((item, index) => check(rule.item, item, `${path}[${index + 1}]`, errors));
      return;
    case "text":
      if (typeof value !== "string" || Array.from(value).length > rule.max || !rule.empty && !value.trim()) fail2(`enter ${rule.empty ? "at most" : "1\u2013"}${rule.max} characters`);
      return;
    case "integer":
      if (!Number.isSafeInteger(value) || value < rule.min || value > rule.max) fail2(`enter a whole number ${rule.min}\u2013${rule.max}`);
      return;
    case "enum":
      if (!rule.values.includes(value)) fail2("choose a supported value");
      return;
    case "id":
      if (!identifier(value)) fail2("use a valid stable identifier");
      return;
    case "boolean":
      if (typeof value !== "boolean") fail2("choose true or false");
      return;
    case "date":
      if (!validDate(value)) fail2("enter a valid YYYY-MM-DD date");
      return;
    case "url":
    case "image":
      if (!safeContentUrl(value, { image: rule.type === "image" })) fail2(rule.type === "image" ? "use a safe HTTPS image or recovered asset path" : "use a public HTTPS URL without credentials");
      return;
    case "ingredient":
      if (!ingredientGuideKeys.has(value)) fail2("choose an existing ingredient guide");
      return;
  }
}
function unique(items, key, path, errors) {
  const values = items.map((item) => item?.[key]);
  if (new Set(values).size !== values.length) errors.push(`${path}: ${key} must be unique`);
}
function validatePresentation(value, { kind = "plan", baseline = null, recommendations = null } = {}) {
  const errors = [];
  check(kind === "intake" ? intakeSchema : schema, value, kind === "intake" ? "consultation content" : "plan content", errors);
  if (!plain(value)) return errors;
  const steps = Array.isArray(value.baselineRoutine) ? value.baselineRoutine : [], cards = Array.isArray(value.categoryCards) ? value.categoryCards : [];
  if (steps.length + cards.filter((c) => c?.kind === "addition").length > 50) errors.push("active routine: baseline and additions must fit within 50 steps");
  unique(steps, "id", "baseline routine", errors);
  unique(steps.filter((s) => s?.kind === "product"), "slot", "baseline routine", errors);
  unique(cards, "id", "category cards", errors);
  unique(cards, "slot", "category cards", errors);
  const baselineProducts = /* @__PURE__ */ new Map(), productIds = /* @__PURE__ */ new Set();
  for (const s of steps) {
    if (!plain(s)) continue;
    if (s.usage?.periods && new Set(s.usage.periods).size !== s.usage.periods.length) errors.push("baseline routine: periods must be unique");
    if (s.kind === "instruction") {
      if (s.slot !== null || s.productId !== null || s.product !== null) errors.push("baseline routine: nonproduct instructions cannot create product identities");
    } else if (s.kind === "product") {
      if (s.slot === null || !s.product || s.product.id !== s.productId) errors.push("baseline routine: product and category must agree");
      else {
        baselineProducts.set(s.slot, s.productId);
        productIds.add(s.productId);
      }
    }
  }
  if (baseline) {
    const expected = baseline.map((s) => `${s.slot}:${s.productId}`).sort(), actual = [...baselineProducts].map(([slot, pid]) => `${slot}:${pid}`).sort();
    if (JSON.stringify(expected) !== JSON.stringify(actual)) errors.push("baseline routine: match each authoritative current product exactly once");
  }
  const bound = [];
  for (const c of cards) {
    if (!plain(c)) continue;
    for (const p of [c.currentProduct, c.proposedProduct]) if (p?.id) productIds.add(p.id);
    if (c.usage?.periods && new Set(c.usage.periods).size !== c.usage.periods.length) errors.push("category usage: periods must be unique");
    if (c.kind === "addition") {
      if (c.currentProduct !== null || baselineProducts.has(c.slot) || steps.some((step2) => step2.id === c.id) || !c.proposedProduct || !c.usage || !c.recommendationId || !c.proposedProduct.displayPrice) errors.push("addition card: new product, usage and purchase identity are required without a current product");
      else bound.push(c);
    } else if (c.kind === "optional_alternative") {
      if (!c.currentProduct || !c.proposedProduct || !c.usage || baselineProducts.get(c.slot) !== c.currentProduct.id) errors.push("optional alternative: retain the authoritative current product and complete the proposed usage");
      if (c.recommendationId) {
        bound.push(c);
        if (!c.proposedProduct?.displayPrice) errors.push("optional alternative: enter the proposed product price");
      }
    } else if (c.kind === "pause" || c.kind === "leave_out") {
      if (!c.currentProduct || c.recommendationId !== null || c.usage !== null || c.kind === "leave_out" && c.proposedProduct !== null) errors.push("paused/reference card: no purchase identity or active usage");
    } else if (c.kind === "no_addition") {
      if (c.recommendationId !== null || c.currentProduct !== null || c.proposedProduct !== null || c.usage !== null) errors.push("no-addition card: product, usage and purchase identity must be empty");
    } else if (c.kind === "keep") {
      if (c.recommendationId !== null || !c.currentProduct || c.proposedProduct !== null || baselineProducts.get(c.slot) !== c.currentProduct?.id) errors.push("keep card: retain the authoritative current product without a purchase identity");
    } else if (c.kind === "replace" || c.kind === "finish_then_replace") {
      if (!c.currentProduct || !c.proposedProduct || !c.usage) errors.push("replacement card: complete both products and usage");
      if (baselineProducts.get(c.slot) !== c.currentProduct?.id) errors.push("replacement card: match the authoritative current product and category");
      if (c.kind === "replace" && !c.recommendationId) errors.push("replacement card: purchase identity is required");
      if (c.recommendationId) {
        bound.push(c);
        if (!c.proposedProduct?.displayPrice) errors.push("replacement card: enter the proposed product price");
      }
    }
  }
  unique(bound, "recommendationId", "purchase recommendations", errors);
  if (recommendations) {
    if (bound.length !== recommendations.length) errors.push("category cards: match every purchase recommendation exactly once");
    for (const r of recommendations) {
      const c = bound.find((c2) => c2.recommendationId === r.id);
      if (!c || c.slot !== r.slot || (c.currentProduct?.id ?? null) !== r.currentProductId || c.proposedProduct?.id !== r.proposedProductId || c.proposedProduct?.displayPrice && c.proposedProduct.displayPrice.cents !== r.priceCents) errors.push("category cards: product IDs and displayed price must match the purchase recommendation");
    }
  }
  for (const g of [...Array.isArray(value.routineGuides) ? value.routineGuides : [], ...cards.map((c) => c?.how).filter(Boolean)]) if (g.productId !== null && !productIds.has(g.productId)) errors.push("usage guide: select a product present in this plan");
  try {
    if (new TextEncoder().encode(JSON.stringify(value)).length > 1e5) errors.push("plan content: exceeds the 100,000 byte request limit; shorten the content");
  } catch {
    errors.push("plan content: use serializable plain content");
  }
  return errors;
}
function deriveRecommendations(value) {
  return (value?.categoryCards || []).filter((c) => ["replace", "finish_then_replace", "addition", "optional_alternative"].includes(c.kind) && c.recommendationId).map((c) => ({ id: c.recommendationId, slot: c.slot, currentProductId: c.currentProduct?.id ?? null, proposedProductId: c.proposedProduct?.id || "", priceCents: c.proposedProduct?.displayPrice?.cents ?? (c.kind === "optional_alternative" ? null : NaN), currency: "USD", rationale: c.reasons?.[0]?.body || "" }));
}
function project(rule, value) {
  if (rule.optional && value === void 0) return void 0;
  if (rule.nullable && (value === null || value === void 0)) return null;
  if (rule.type === "object") return Object.fromEntries(Object.entries(rule.fields).map(([key, child]) => [key, project(child, plain(value) ? value[key] : void 0)]));
  if (rule.type === "array") return (Array.isArray(value) ? value : []).map((item) => project(rule.item, item));
  if (rule.type === "url" || rule.type === "image") return safeContentUrl(value, { image: rule.type === "image" });
  if (value === void 0) return rule.type === "boolean" ? false : rule.type === "integer" ? 0 : "";
  return structuredClone(value);
}
function publicPresentation(value, { kind = "plan" } = {}) {
  return project(kind === "intake" ? intakeSchema : schema, value);
}

// src/synthetic-active-routine.js
var clone = (value) => structuredClone(value);
function previewActiveRoutine(view) {
  const publications = [...view.history || [], ...view.plan ? [view.plan] : []].filter((p) => p.presentation).sort((a, b) => a.version - b.version);
  if (!view.plan || !publications.length) return [];
  const baseline = publications[0], result = baseline.presentation.baselineRoutine.filter((s) => s.kind === "instruction").map((s) => ({ ...clone(s), source: { kind: "baseline", publicationVersion: baseline.version, recommendationId: null }, guides: baseline.presentation.routineGuides.filter((g) => g.productId === null).map(clone) }));
  for (const item of view.routine || []) {
    const activation = (view.routineHistory || []).filter((a) => a.slot === item.slot && a.productId === item.productId).sort((a, b) => b.startedOn.localeCompare(a.startedOn) || b.version - a.version)[0];
    if (activation) {
      const pub = publications.find((p) => p.version === activation.version), card3 = pub?.presentation.categoryCards.find((c) => c.recommendationId === activation.recommendationId && c.proposedProduct?.id === item.productId);
      if (card3) result.push({ id: "active-" + item.slot, kind: "product", slot: item.slot, productId: item.productId, product: clone(card3.proposedProduct), title: card3.proposedProduct.name, usage: clone(card3.usage), source: { kind: "activation", publicationVersion: pub.version, recommendationId: card3.recommendationId }, guides: [clone(card3.how), ...pub.presentation.routineGuides.filter((g) => g.productId === item.productId).map(clone)] });
    } else {
      const step2 = baseline.presentation.baselineRoutine.find((s) => s.kind === "product" && s.slot === item.slot && s.productId === item.productId);
      if (step2) result.push({ ...clone(step2), source: { kind: "baseline", publicationVersion: baseline.version, recommendationId: null }, guides: baseline.presentation.routineGuides.filter((g) => g.productId === item.productId).map(clone) });
    }
  }
  return result;
}

// src/synthetic-requests.js
var clone2 = (value) => structuredClone(value);
var fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
function createSyntheticClientRequests({ identity, presentation, onChange = () => {
} }) {
  const errors = validatePresentation(presentation);
  if (errors.length) throw Error(errors.join("\n"));
  const publicContent = publicPresentation(presentation), recommendations = deriveRecommendations(publicContent), receipts = /* @__PURE__ */ new Map();
  const view = { schemaVersion: 2, revision: 0, plan: { version: 1, presentation: publicContent, recommendations, itemStates: recommendations.map((item) => ({ recommendationId: item.id, choice: null, reason: null, received: false, startedOn: null })) }, history: [], orderProposal: { kind: "proposal", currency: "USD", items: [], subtotalCents: 0, payable: false, shippingAndTaxConfirmed: false }, routine: publicContent.baselineRoutine.filter((step2) => step2.kind === "product").map((step2) => ({ slot: step2.slot, productId: step2.productId })), routineHistory: [] };
  const read = () => ({ ...clone2(view), activeRoutine: previewActiveRoutine(view) });
  function refreshCart() {
    const items = recommendations.filter((item) => view.plan.itemStates.some((state) => state.recommendationId === item.id && state.choice === "approved" && !state.received));
    view.orderProposal = { ...view.orderProposal, items: clone2(items), subtotalCents: items.every((item) => Number.isSafeInteger(item.priceCents)) ? items.reduce((sum, item) => sum + item.priceCents, 0) : null };
  }
  const core = async (command, { signal } = {}) => {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (!command || typeof command !== "object") fail(400, "Preview action unavailable.");
    if (command.clientId && command.clientId !== identity.clientId) fail(403, "This synthetic case cannot access another case.");
    if (command.action === "client_read_v2") return read();
    if (!["decide", "receive", "start"].includes(command.action)) fail(400, "Preview action unavailable.");
    if (typeof command.requestId !== "string" || !command.requestId) fail(400, "A request identity is required.");
    const fingerprint = JSON.stringify(command), prior = receipts.get(command.requestId);
    if (prior) {
      if (prior.fingerprint !== fingerprint) fail(409, "Request conflict.");
      return clone2(prior.result);
    }
    if (command.expectedRevision !== view.revision || command.version !== view.plan.version) fail(409, "This plan changed.");
    const state = view.plan.itemStates.find((state2) => state2.recommendationId === command.recommendationId), item = recommendations.find((item2) => item2.id === command.recommendationId);
    if (!state || !item) fail(404, "Recommendation unavailable.");
    if (command.action === "decide") {
      if (!["approved", "declined"].includes(command.choice)) fail(400, "Choose an approval decision.");
      state.choice = command.choice;
      state.reason = command.reason ?? null;
    } else if (command.action === "receive") {
      if (state.choice !== "approved") fail(409, "Approve first.");
      state.received = true;
    } else {
      if (!state.received) fail(409, "Record receipt first.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(command.startedOn || "") || !Number.isFinite(Date.parse(command.startedOn)) || new Date(command.startedOn).toISOString().slice(0, 10) !== command.startedOn || command.startedOn > (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) fail(400, "Choose a valid actual start date.");
      state.startedOn = command.startedOn;
      view.routine = view.routine.filter((row) => row.slot !== item.slot);
      view.routine.push({ slot: item.slot, productId: item.proposedProductId });
      view.routineHistory.push({ version: 1, recommendationId: item.id, slot: item.slot, productId: item.proposedProductId, startedOn: command.startedOn });
    }
    refreshCart();
    const result = { revision: ++view.revision, publishedVersion: 1, operation: command.action };
    receipts.set(command.requestId, { fingerprint, result: clone2(result) });
    onChange(read());
    return clone2(result);
  };
  return { core, clientId: identity.clientId, read, productLabels: Object.fromEntries(recommendations.map((item) => [item.id, publicContent.categoryCards.find((card3) => card3.recommendationId === item.id)?.proposedProduct.name])) };
}

// src/features/payments/model.js
var ensure = (value) => {
  if (!value) throw Error("invalid_input");
};
function nextMonth(startOn) {
  ensure(typeof startOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(startOn));
  const start = /* @__PURE__ */ new Date(`${startOn}T00:00:00Z`);
  ensure(Number.isFinite(start.getTime()) && start.toISOString().slice(0, 10) === startOn);
  const day = start.getUTCDate();
  start.setUTCDate(1);
  start.setUTCMonth(start.getUTCMonth() + 1);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0);
  start.setUTCDate(Math.min(day, end.getUTCDate()));
  return start.toISOString().slice(0, 10);
}

// src/features/payments/fixtures.js
var syntheticAddress = { recipientName: "Synthetic Client", line1: "123 Example Lane", line2: "", city: "Example City", region: "CA", postalCode: "94500", countryCode: "US" };
function createPaymentPreviewStore({ publicationVersion = 1, recommendationId = "moisturizer-1", unitPriceCents = 1600, onConfirmed } = {}) {
  const period = publicationVersion > 0 ? { startOn: "2026-10-01", endOn: "2026-11-01" } : null;
  const shippingAddress = { version: 1, address: { ...syntheticAddress } }, products2 = publicationVersion > 0 ? unitPriceCents : 0;
  return { revision: 0, shippingAddresses: [shippingAddress], quotes: [{ id: "00000000-0000-4000-8000-000000000003", version: 1, publicationVersion, status: "payable", currency: "USD", serviceCents: 1e4, servicePeriod: period, shippingAddressVersion: products2 ? 1 : null, items: products2 ? [{ recommendationId, quantity: 1, unitPriceCents, lineTotalCents: unitPriceCents }] : [], productSubtotalCents: products2, taxCents: 0, shippingCents: 0, productTotalCents: products2, totalCents: 1e4 + products2 }], claims: [], shippingAddress, service: { status: "unpaid", period }, nextServicePeriod: period, receipts: /* @__PURE__ */ new Map(), onConfirmed };
}
function legacyStore(mode) {
  const store = createPaymentPreviewStore({ publicationVersion: 3, recommendationId: "cleanser", unitPriceCents: 1800 });
  store.revision = 4;
  Object.assign(store.quotes[0], { version: 2, items: [{ recommendationId: "cleanser", quantity: 2, unitPriceCents: 1800, lineTotalCents: 3600 }], productSubtotalCents: 3600, taxCents: 300, shippingCents: 300, productTotalCents: 4200, totalCents: 14200 });
  if (mode === "advisor") store.claims = [{ id: "00000000-0000-4000-8000-000000000004", quoteId: store.quotes[0].id, quoteVersion: 2, status: "submitted_unverified", serviceCents: 1e4, productCents: 4200, totalCents: 14200, evidenceId: null, shippingAddressVersion: 1 }];
  return store;
}
function createPaymentPreviewRequest({ mode = "client", scenario = "default", store } = {}) {
  const state = store ?? legacyStore(mode);
  let uncertain = scenario === "uncertain";
  const copy2 = (value) => structuredClone(value), fail2 = (status, code) => {
    throw { status, code };
  };
  return async function request(command, { signal } = {}) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (command instanceof FormData) {
      let metadata;
      try {
        metadata = JSON.parse(command.get("metadata"));
      } catch {
        return fail2(400, "invalid_input");
      }
      if (metadata.action !== "upload_evidence" || metadata.requestId === metadata.completionRequestId) return fail2(400, "invalid_input");
      return { evidenceId: "00000000-0000-4000-8000-000000000006", quoteId: metadata.quoteId, quoteVersion: metadata.quoteVersion, status: "uploaded_unverified" };
    }
    if (["client_read", "advisor_read"].includes(command.action)) return copy2({ revision: state.revision, quotes: state.quotes, claims: state.claims, shippingAddress: state.shippingAddress, shippingAddresses: state.shippingAddresses, service: state.service, nextServicePeriod: state.nextServicePeriod, recipient: { method: "zelle", name: "Synthetic advisor", email: "advisor@example.invalid", phone: "(925) 555-0101" } });
    if (command.action === "evidence_url") return fail2(503, "preview_private_storage_unavailable");
    const fingerprint = JSON.stringify(command), prior = state.receipts.get(command.requestId);
    if (prior) {
      if (prior.fingerprint !== fingerprint) return fail2(409, "concierge_request_conflict");
      return copy2(prior.result);
    }
    if (command.expectedRevision !== state.revision) return fail2(409, "concierge_revision_conflict");
    if (command.action === "confirm_shipping_address") {
      state.shippingAddress = { version: (state.shippingAddress?.version ?? 0) + 1, address: copy2(command.address) };
      state.shippingAddresses.push(state.shippingAddress);
      state.quotes = state.quotes.map((item) => item.status === "payable" && item.productTotalCents > 0 ? { ...item, status: "superseded" } : item);
      const result2 = { revision: ++state.revision, operation: "confirm_shipping_address", addressVersion: state.shippingAddress.version };
      state.receipts.set(command.requestId, { fingerprint, result: result2 });
      return copy2(result2);
    }
    let selected = state.quotes.find((item) => item.id === command.quoteId), claim = state.claims.find((item) => item.id === command.claimId), status, claimId = null;
    if (command.action === "issue_quote") {
      state.quotes = state.quotes.map((item) => item.status === "payable" ? { ...item, status: "superseded" } : item);
      const { action, clientId, requestId, expectedRevision, ...amounts } = command;
      selected = { ...copy2(amounts), id: crypto.randomUUID(), version: Math.max(...state.quotes.map((item) => item.version), 0) + 1, status: "payable", currency: "USD" };
      state.quotes.push(selected);
      status = "payable";
    } else {
      if (!selected || selected.status !== "payable" || selected.version !== command.quoteVersion || selected.serviceCents !== command.serviceCents || selected.productTotalCents !== command.productCents || selected.totalCents !== command.totalCents) return fail2(409, "concierge_quote_stale");
      if (command.action === "submit_claim") {
        claimId = crypto.randomUUID();
        state.claims.push({ id: claimId, quoteId: selected.id, quoteVersion: selected.version, status: "submitted_unverified", serviceCents: command.serviceCents, productCents: command.productCents, totalCents: command.totalCents, evidenceId: command.evidenceId, shippingAddressVersion: selected.shippingAddressVersion });
        status = "submitted_unverified";
      } else if (["confirm_payment", "reject_claim"].includes(command.action)) {
        if (!claim || claim.status !== "submitted_unverified" || claim.quoteId !== selected.id) return fail2(409, "concierge_claim_conflict");
        if (command.action === "confirm_payment" && command.bankReceiptVerified !== true) return fail2(400, "invalid_input");
        claimId = claim.id;
        status = command.action === "confirm_payment" ? "confirmed" : "rejected";
        state.claims = state.claims.map((item) => item.id === claimId ? { ...item, status } : item);
        if (status === "confirmed") {
          state.quotes = state.quotes.map((item) => item.id === selected.id ? { ...item, status: "settled" } : item);
          if (selected.serviceCents > 0) state.service = { status: selected.publicationVersion === 0 ? "pending_publication" : "active", period: selected.servicePeriod ?? state.service.period };
          if (selected.servicePeriod) state.nextServicePeriod = { startOn: selected.servicePeriod.endOn, endOn: nextMonth(selected.servicePeriod.endOn) };
        }
      } else return fail2(400, "invalid_input");
    }
    const serviceAccessStatus = status === "confirmed" && selected.serviceCents > 0 ? state.service.status === "active" ? "active" : "pending_publication" : null;
    const result = { revision: ++state.revision, operation: command.action, quoteId: selected.id, claimId, status, serviceUnlocked: serviceAccessStatus === "active", serviceAccessStatus, productOrderStatus: status === "confirmed" && selected.productTotalCents > 0 ? "ready_to_purchase" : null };
    state.receipts.set(command.requestId, { fingerprint, result });
    if (status === "confirmed") state.onConfirmed?.(copy2(result));
    if (uncertain) {
      uncertain = false;
      return fail2(503, "unavailable");
    }
    return copy2(result);
  };
}

// src/mount-case.js
import { mountPaymentsPanel } from "../features/payments/index.js";

// src/features/checkins/model.js
var uuid = (value) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
var requireValue = (value) => {
  if (!value) throw Error("invalid_input");
};
var text2 = (value, max, empty = false) => {
  requireValue(typeof value === "string" && !value.includes("\0") && Array.from(value).length <= max && (empty || value.trim()));
  return value;
};
var revision = (value) => {
  requireValue(Number.isSafeInteger(value) && value >= 0 && value < Number.MAX_SAFE_INTEGER);
  return value;
};
var id2 = (value) => {
  requireValue(uuid(value));
  return value.toLowerCase();
};
var angle = (value) => {
  requireValue(["front", "left", "right"].includes(value));
  return value;
};
function validDate2(value) {
  if (value === null) return null;
  requireValue(typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= "1900-01-01");
  const date2 = /* @__PURE__ */ new Date(value + "T00:00:00Z");
  requireValue(Number.isFinite(date2.getTime()) && date2.toISOString().slice(0, 10) === value);
  return value;
}
function reportCommand(fields, photos, expectedRevision, requestId) {
  requireValue(Array.isArray(photos) && photos.length <= 3);
  const refs = photos.map((p) => ({ id: id2(p.id), angle: angle(p.angle) }));
  requireValue(new Set(refs.map((p) => p.id)).size === refs.length && new Set(refs.map((p) => p.angle)).size === refs.length);
  return Object.freeze({
    action: "submit_report",
    requestId: id2(requestId),
    expectedRevision: revision(expectedRevision),
    comfort: text2(fields.comfort, 1e3),
    consistency: text2(fields.consistency, 1e3),
    changes: text2(fields.changes, 1e3, true),
    photoIds: Object.freeze(refs.map((p) => p.id).sort())
  });
}
function nextDateCommand(clientId, nextCheckinOn, expectedRevision, requestId) {
  return Object.freeze({
    action: "set_next_checkin",
    clientId: id2(clientId),
    nextCheckinOn: validDate2(nextCheckinOn),
    expectedRevision: revision(expectedRevision),
    requestId: id2(requestId)
  });
}
function noteCommand(clientId, checkinId, note, expectedRevision, requestId) {
  return Object.freeze({
    action: "add_meeting_note",
    clientId: id2(clientId),
    checkinId: id2(checkinId),
    note: text2(note, 4e3),
    expectedRevision: revision(expectedRevision),
    requestId: id2(requestId)
  });
}

// src/features/checkins/fixtures.js
var png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
var reportId = "ae000000-0000-4000-8000-000000000002";
var photoId = "ae000000-0000-4000-8000-000000000003";
function createCheckinPreviewStore() {
  return {
    kind: "synthetic-checkin-preview",
    revision: 3,
    nextCheckinOn: "2026-11-01",
    reports: [{
      id: reportId,
      submittedAt: "2026-10-18T12:00:00Z",
      comfort: "Comfortable most days",
      consistency: "Most mornings and evenings",
      changes: "A little dryness after travel; I would like to discuss it.",
      photos: [{ id: photoId, angle: "front" }]
    }],
    notes: [{ id: "ae000000-0000-4000-8000-000000000004", checkinId: reportId, note: "Sample meeting note: discuss the client\u2019s comfort report during the call.", createdAt: "2026-10-18T14:00:00Z" }],
    uploads: /* @__PURE__ */ new Map(),
    receipts: /* @__PURE__ */ new Map()
  };
}
function createCheckinPreviewRequest({ mode, store = createCheckinPreviewStore() }) {
  if (!["client", "advisor"].includes(mode) || store?.kind !== "synthetic-checkin-preview") throw Error("Invalid synthetic mode/store");
  const { reports, notes, uploads, receipts } = store;
  const fail2 = (status, code) => {
    throw { status, code };
  };
  const clone3 = (value) => structuredClone(value), client = () => clone3({ revision: store.revision, nextCheckinOn: store.nextCheckinOn, reports });
  const request = async (body, { signal } = {}) => {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    let command = body, file;
    if (body instanceof FormData) {
      try {
        command = JSON.parse(body.get("metadata"));
        file = body.get("file");
      } catch {
        fail2(400, "invalid_input");
      }
    }
    if (command?.action === "client_read") return client();
    if (command?.action === "advisor_read") {
      if (mode !== "advisor") fail2(403, "forbidden");
      return { client: client(), meetingNotes: clone3(notes) };
    }
    if (["photo_view", "advisor_photo_view"].includes(command?.action)) {
      if (command.action === "advisor_photo_view" && mode !== "advisor") fail2(403, "forbidden");
      if (!reports.some((report) => report.photos.some((photo) => photo.id === command.photoId))) fail2(404, "photo_unavailable");
      return { photoId: command.photoId, signedUrl: png, expiresIn: 60, synthetic: true };
    }
    const requestId = command?.requestId;
    if (typeof requestId !== "string") fail2(400, "invalid_input");
    const receiptKey = mode + ":" + requestId;
    const fingerprint = JSON.stringify(command) + (file ? `:${file.size}:${file.type}` : "");
    if (receipts.has(receiptKey)) {
      const previous = receipts.get(receiptKey);
      if (previous.fingerprint !== fingerprint) fail2(409, "request_conflict");
      return clone3(previous.result);
    }
    if (command.expectedRevision !== store.revision) fail2(409, "revision_conflict");
    let result;
    if (command.action === "upload_photo") {
      if (mode !== "client") fail2(403, "forbidden");
      if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size < 1 || file.size > 5 * 1024 * 1024 || !["front", "left", "right"].includes(command.angle) || command.completionRequestId === requestId) fail2(400, "invalid_input");
      const photo = { id: crypto.randomUUID(), angle: command.angle };
      uploads.set(photo.id, photo);
      store.revision += 2;
      result = { revision: store.revision, photo };
    } else if (command.action === "submit_report") {
      if (mode !== "client") fail2(403, "forbidden");
      let parsed;
      try {
        parsed = reportCommand(command, command.photoIds.map((id3) => uploads.get(id3)), store.revision, requestId);
      } catch {
        fail2(400, "invalid_input");
      }
      const report = {
        id: crypto.randomUUID(),
        submittedAt: (/* @__PURE__ */ new Date()).toISOString(),
        comfort: parsed.comfort,
        consistency: parsed.consistency,
        changes: parsed.changes,
        photos: parsed.photoIds.map((id3) => uploads.get(id3))
      };
      for (const id3 of parsed.photoIds) uploads.delete(id3);
      reports.push(report);
      store.revision++;
      result = { revision: store.revision, operation: command.action, reportId: report.id };
    } else if (command.action === "set_next_checkin") {
      if (mode !== "advisor") fail2(403, "forbidden");
      try {
        store.nextCheckinOn = nextDateCommand(command.clientId, command.nextCheckinOn, store.revision, requestId).nextCheckinOn;
      } catch {
        fail2(400, "invalid_input");
      }
      store.revision++;
      result = { revision: store.revision, operation: command.action, reportId: null };
    } else if (command.action === "add_meeting_note") {
      if (mode !== "advisor") fail2(403, "forbidden");
      let parsed;
      try {
        parsed = noteCommand(command.clientId, command.checkinId, command.note, store.revision, requestId);
      } catch {
        fail2(400, "invalid_input");
      }
      if (!reports.some((report) => report.id === parsed.checkinId)) fail2(404, "not_found");
      notes.push({ id: crypto.randomUUID(), checkinId: parsed.checkinId, note: parsed.note, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
      store.revision++;
      result = { revision: store.revision, operation: command.action, reportId: parsed.checkinId };
    } else fail2(400, "invalid_input");
    receipts.set(receiptKey, { fingerprint, result: clone3(result) });
    return result;
  };
  request.syntheticPreview = true;
  return request;
}

// src/mount-case.js
import { mountCheckinsPanel } from "../features/checkins/index.js";
function mountSyntheticCase(root, { identity, presentation }) {
  const paymentStore = sharedPaymentPreviewStore({ publicationVersion: 1, recommendationId: "none", unitPriceCents: 0 });
  const checkinStore = sharedCheckinPreviewStore();
  Object.assign(checkinStore, { revision: 0, nextCheckinOn: null, reports: [], notes: [] });
  const fixture = sharedSyntheticClientRequests({ identity, presentation, onChange: view => sharedPaymentProposalSync(paymentStore,view) });
  sharedPaymentProposalSync(paymentStore,fixture.read());
  const paymentRequest = sharedPaymentPreviewRequest({ mode: "client", store: paymentStore }), checkinRequest = sharedCheckinPreviewRequest({ mode: "client", store: checkinStore });
  const mountFeature = (kind, host, options) => {
    if (kind === "payments" && fixture.read().orderProposal.subtotalCents === null) {
      host.innerHTML = '<div class="advisor-empty"><h2>Price confirmation needed</h2><p>Your optional selection is in your cart. Its price must be confirmed before a quote is prepared.</p></div>';
      return () => {
      };
    }
    return kind === "payments" ? mountPaymentsPanel(host, { ...options, request: paymentRequest }) : mountCheckinsPanel(host, { ...options, request: checkinRequest });
  };
  return mountClientPortal(root, { request: fixture.core, mountFeature, onSignOut: () => {
    location.href = "../";
  }, clientId: fixture.clientId, preview: true, avatar: identity.avatar, capabilities: identity.capabilities, productLabels: fixture.productLabels });
}

// src/approved-maya-data.js
var intro = "We\u2019ll keep the basics that already feel comfortable, pause the extra morning serums and introduce azelaic acid on its own.";
var products = {
  "moisturizer": {
    "brand": "CeraVe PM",
    "variant": "Facial Moisturizing Lotion",
    "name": "CeraVe PM Facial Moisturizing Lotion",
    "label": "KEEP",
    "image": "../assets/cerave-pm-product-official.jpg",
    "url": "https://www.cerave.com/skincare/moisturizers/pm-facial-moisturizing-lotion",
    "detail": "Your CeraVe has felt comfortable for months, and your basic routine sits well under makeup. I\u2019d keep that dependable part of your routine while we introduce the treatment. The pilling shows up on some serum mornings, so removing those extra layers is a better first test than assuming your moisturizer needs replacing.",
    "fact": "The brand lists ceramides, niacinamide and hyaluronic acid in this facial lotion.",
    "price": 14.99,
    "size": "3 fl oz",
    "priceSource": "https://www.target.com/p/-/A-13977966",
    "priceCheckedOn": "2026-10-20"
  },
  "cleanser": {
    "brand": "CeraVe",
    "variant": "Hydrating Facial Cleanser",
    "name": "CeraVe Hydrating Facial Cleanser",
    "label": "FINISH THIS BOTTLE",
    "image": "../assets/cerave-hydrating-facial-cleanser.jpg",
    "url": "https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser",
    "detail": "Your CeraVe cleanser is comfortable, so I\u2019d finish the bottle first. For your next bottle, I\u2019d try Aveeno Daily Moisturizing Facial Cleanser: $11.60 at Walmart for 12 fl oz, compared with $13.79 at Target for the same size. Both are fragrance-free. Aveeno uses a foaming oat-based formula instead of CeraVe\u2019s creamier wash, but the saving only matters if it leaves your skin just as comfortable.",
    "fact": "A non-foaming facial cleanser with ceramides and hyaluronic acid.",
    "price": 13.79,
    "size": "12 fl oz / 355 mL",
    "priceSource": "https://www.target.com/p/-/A-13977968",
    "priceCheckedOn": "2026-10-20"
  },
  "remover": {
    "brand": "Bioderma",
    "variant": "Sensibio H2O",
    "name": "Bioderma Sensibio H2O",
    "label": "KEEP",
    "image": "images/bioderma.jpg",
    "url": "https://www.bioderma.us/en/p/sensibio-h2o-micellar-water.html",
    "detail": "Bioderma is already taking your makeup off comfortably. I\u2019d keep it and use a well-soaked soft pad with a light touch before your cleanser.",
    "fact": "The brand describes Sensibio H2O as a micellar cleansing and makeup-removing water.",
    "price": 20.99,
    "size": "16.9 fl oz / 500 mL",
    "priceSource": "https://www.target.com/p/-/A-82287056",
    "priceCheckedOn": "2026-10-20"
  },
  "sunscreen": {
    "brand": "La Roche-Posay",
    "variant": "Anthelios UV Control Sunscreen SPF 50",
    "name": "La Roche-Posay Anthelios UV Control Sunscreen SPF 50",
    "label": "KEEP",
    "image": "images/lrp-anthelios-uv-control-official.webp",
    "url": "https://www.laroche-posay.us/our-products/sun/face-sunscreen/anthelios-uv-control-sunscreen-spf-50-3606000622111.html",
    "price": 39.99,
    "priceSource": "https://www.laroche-posay.us/our-products/sun/face-sunscreen/anthelios-uv-control-sunscreen-spf-50-3606000622111.html",
    "size": "1.7 fl oz / 50 mL",
    "detail": "Your sunscreen works well with your basic routine. I\u2019d keep it and focus on the serum layering that sometimes makes you use less of it. With the brown marks as our priority, I want sun protection to be the step you can apply properly, rather than the one you cut back to make makeup sit better.",
    "fact": "US formula reference: daily facial sunscreen, SPF 50. This bottle isn\u2019t labeled water-resistant.",
    "imageNote": "Official product image and reference price \xB7 checked Oct 20, 2026"
  },
  "ha": {
    "brand": "The Ordinary",
    "variant": "Hyaluronic Acid 2% + B5 (with Ceramides)",
    "name": "The Ordinary Hyaluronic Acid 2% + B5 (with Ceramides)",
    "label": "PAUSE",
    "image": "images/ha.png",
    "url": "https://theordinary.com/en-us/hyaluronic-acid-2-b5-serum-with-ceramides-100637.html",
    "detail": "You\u2019ve been layering these on some mornings without a clear sense of what each adds. I\u2019d pause both while we simplify the routine. Hyaluronic acid and niacinamide can be used together; this is about seeing whether those extra product layers are making sunscreen and makeup harder to wear.",
    "fact": "A hydration-focused serum. Hyaluronic acid is a different ingredient category from the glycolic exfoliant.",
    "price": 9.9,
    "size": "30 mL",
    "priceSource": "https://theordinary.com/en-us/hyaluronic-acid-2-b5-serum-with-ceramides-100637.html",
    "priceCheckedOn": "2026-10-20"
  },
  "niacinamide": {
    "brand": "The Ordinary",
    "variant": "Niacinamide 10% + Zinc 1%",
    "name": "The Ordinary Niacinamide 10% + Zinc 1%",
    "label": "PAUSE",
    "image": "images/niacinamide.png",
    "url": "https://theordinary.com/en-us/niacinamide-10-zinc-1-serum-100436.html",
    "detail": "You\u2019ve been layering these on some mornings without a clear sense of what each adds. I\u2019d pause both while we simplify the routine. Hyaluronic acid and niacinamide can be used together; this is about seeing whether those extra product layers are making sunscreen and makeup harder to wear.",
    "fact": "The brand lists niacinamide and zinc PCA in this water-based serum.",
    "price": 6,
    "size": "30 mL",
    "priceSource": "https://theordinary.com/en-us/niacinamide-10-zinc-1-serum-100436.html",
    "priceCheckedOn": "2026-10-20"
  },
  "glycolic": {
    "brand": "The Ordinary",
    "variant": "Glycolic Acid 7% Exfoliating Toner",
    "name": "The Ordinary Glycolic Acid 7% Exfoliating Toner",
    "label": "LEAVE OUT",
    "image": "images/glycolic.png",
    "url": "https://theordinary.com/en-us/glycolic-acid-7-exfoliating-toner-100418.html",
    "detail": "You stopped this after your cheeks felt hot and tight, and your basics have felt comfortable again since. I\u2019d leave it out while we introduce azelaic acid. That experience doesn\u2019t mean every ingredient called an acid will behave the same way, but it does tell me we should avoid several new treatments at once.",
    "fact": "A toner with 7% glycolic acid, an alpha hydroxy acid used for exfoliation.",
    "price": 9,
    "size": "100 mL",
    "priceSource": "https://theordinary.com/en-us/glycolic-acid-7-exfoliating-toner-100418.html",
    "priceCheckedOn": "2026-10-20"
  },
  "makeup": {
    "brand": "Maybelline",
    "variant": "Fit Me Matte + Poreless",
    "name": "Maybelline Fit Me Matte + Poreless",
    "label": "YOUR USUAL MAKEUP",
    "image": "images/foundation.jpg",
    "url": "https://www.maybelline.com/face-makeup/foundation-makeup/fit-me-matte-poreless-foundation",
    "detail": "Your usual makeup appears after sunscreen in the morning routine. The reference image is not a match to your shade; that shade has not been recorded.",
    "fact": "A liquid foundation with a matte finish.",
    "imageNote": "Brand reference image \xB7 your shade is not recorded"
  },
  "hydro": {
    "brand": "Neutrogena",
    "variant": "Hydro Boost Hyaluronic Acid Water Cream Fragrance Free",
    "name": "Neutrogena Hydro Boost Hyaluronic Acid Water Cream Fragrance Free",
    "label": "OPTIONAL ALTERNATIVE",
    "size": "1.7 fl oz / 50 mL",
    "image": "assets/hydro.jpg",
    "url": "https://www.neutrogena.com/products/skincare/neutrogena-hydro-boost-water-cream-fragrance-free/6806486",
    "detail": "You can consider this Water Cream when your CeraVe runs out if you\u2019d like a different texture. I\u2019d make that a later choice, after the treatment trial, rather than buy another moisturizer now.",
    "fact": "Fragrance-free Water Cream. Choose this formulation rather than the fragranced Water Gel.",
    "price": 19.99,
    "priceSource": "https://www.target.com/p/-/A-88452179",
    "priceCheckedOn": "2026-10-20"
  },
  "aveeno": {
    "brand": "Aveeno",
    "variant": "Daily Moisturizing Facial Cleanser, Soothing Oat",
    "name": "Aveeno Daily Moisturizing Facial Cleanser, Soothing Oat",
    "label": "WHEN YOUR BOTTLE RUNS OUT",
    "size": "12 fl oz / 354 mL",
    "image": "../assets/aveeno-daily-moisturizing-facial-cleanser-12oz.jpg",
    "url": "https://www.aveeno.com/products/daily-moisturizing-facial-cleanser-soothing-oat",
    "detail": "Your CeraVe cleanser feels comfortable, so I wouldn\u2019t waste the bottle you have. Once it runs out, Aveeno Daily Moisturizing Facial Cleanser is the next option I\u2019d try. It\u2019s a fragrance-free foaming gel, giving you a different cleansing texture without adding another step. We\u2019ll judge it by whether it removes the day\u2019s remaining products and leaves your skin just as comfortable.",
    "fact": "Fragrance-free facial cleanser with soothing oat. Finish CeraVe first; this is a later cleanser option.",
    "price": 11.6,
    "priceSource": "https://www.walmart.com/ip/843259195",
    "priceCheckedOn": "2026-10-20"
  },
  "balm": {
    "brand": "CeraVe",
    "variant": "Makeup Removing Cleanser Balm",
    "name": "CeraVe Makeup Removing Cleanser Balm",
    "label": "OPTIONAL ALTERNATIVE",
    "image": "images/cerave-makeup-removing-cleanser-balm-official.jpg",
    "url": "https://www.cerave.com/skincare/cleansers/makeup-removing-cleanser-balm/",
    "detail": "If you\u2019d rather use your fingertips and rinse than use cotton pads, this is an optional alternative. There\u2019s no extra product to add to your evening routine.",
    "fact": "A rinse-off makeup-removing balm. Use in place of micellar water, then follow with your cleanser; avoid direct contact with eyes.",
    "price": 11.69,
    "size": "1.3 oz",
    "priceSource": "https://www.target.com/p/-/A-85920760",
    "priceCheckedOn": "2026-10-20"
  },
  "azelaic": {
    "brand": "The Ordinary",
    "variant": "Azelaic Acid Suspension 10%",
    "name": "The Ordinary Azelaic Acid Suspension 10%",
    "label": "START WITH THIS",
    "size": "30 mL",
    "price": 12.2,
    "priceSource": "https://theordinary.com/en-us/azelaic-acid-suspension-10-exfoliator-100407.html",
    "image": "images/the-ordinary-azelaic-acid-10-30ml-official.png",
    "url": "https://theordinary.com/en-us/azelaic-acid-suspension-10-exfoliator-100407.html",
    "detail": "The marks that linger after spots are your priority, so azelaic acid is the one new treatment I\u2019d try. We\u2019ll keep your comfortable basics and leave the glycolic toner out while you introduce it. The stronger clinical evidence is for 15\u201320% formulas, so I can\u2019t assume this 10% bottle will give the same results. We\u2019ll watch how your skin feels and whether the marks gradually change before deciding what comes next.",
    "fact": "Azelaic Acid Suspension 10% \xB7 30 mL. Follow the manufacturer\u2019s directions.",
    "evidenceURL": "https://link.springer.com/article/10.1007/s13555-024-01176-2",
    "how": [
      "Patch test first, following the manufacturer\u2019s directions. Don\u2019t use the product if the patch test causes redness, burning, itching, blistering or irritation.",
      "After cleansing, let your skin dry. Apply a small amount in a thin layer to intact skin, avoiding eyes, lips and broken skin. Follow with your moisturizer.",
      "Start with two nonconsecutive evenings in the first week. If your skin stays comfortable, try alternate evenings the next week. Build toward nightly use only while it stays comfortable; there\u2019s no need to rush. We\u2019re starting slowly to check comfort; this schedule isn\u2019t proven to work best.",
      "Keep glycolic toner out and don\u2019t introduce a retinoid or another exfoliant at the same time.",
      "If irritation develops, rinse off and stop. Seek advice if it persists. Get urgent help for swelling or breathing trouble."
    ],
    "imageNote": "Official US reference price \xB7 checked Oct 20, 2026",
    "priceCheckedOn": "2026-10-20"
  }
};
var sections = {
  "moisturizer": {
    "title": "Moisturizer",
    "blocks": [
      {
        "products": [
          "moisturizer"
        ],
        "heading": "Why I\u2019m keeping this for you",
        "reason": "Your CeraVe has felt comfortable for months, and your basic routine sits well under makeup. I\u2019d keep that dependable part of your routine while we introduce the treatment. The pilling shows up on some serum mornings, so removing those extra layers is a better first test than assuming your moisturizer needs replacing.",
        "details": [
          "moisturizer"
        ]
      },
      {
        "products": [
          "hydro"
        ],
        "heading": "An option for your next bottle",
        "region": "Optional moisturizer alternative",
        "reason": "You can consider this Water Cream when your CeraVe runs out if you\u2019d like a different texture. I\u2019d make that a later choice, after the treatment trial, rather than buy another moisturizer now.",
        "details": [
          "hydro"
        ]
      }
    ]
  },
  "cleanser": {
    "title": "Cleanser",
    "blocks": [
      {
        "products": [
          "cleanser",
          "aveeno"
        ],
        "heading": "Why I chose this for you",
        "reason": "Your CeraVe cleanser is comfortable, so I\u2019d finish the bottle first. For your next bottle, I\u2019d try Aveeno Daily Moisturizing Facial Cleanser: $11.60 at Walmart for 12 fl oz, compared with $13.79 at Target for the same size. Both are fragrance-free. Aveeno uses a foaming oat-based formula instead of CeraVe\u2019s creamier wash, but the saving only matters if it leaves your skin just as comfortable.",
        "actions": [
          "Finish your current cleanser, and make this switch separately from starting the treatment.",
          "If Aveeno leaves your skin tight or irritated, the lower price isn\u2019t a reason to keep using it."
        ],
        "details": [
          "cleanser",
          "aveeno"
        ]
      },
      {
        "products": [
          "remover"
        ],
        "heading": "Why I\u2019m keeping Bioderma for you",
        "reason": "Bioderma is already taking your makeup off comfortably. I\u2019d keep it and use a well-soaked soft pad with a light touch before your cleanser.",
        "details": [
          "remover"
        ]
      },
      {
        "products": [
          "balm"
        ],
        "heading": "Optional alternative to Bioderma",
        "region": "Optional alternative to Bioderma",
        "reason": "If you\u2019d rather use your fingertips and rinse than use cotton pads, this is an optional alternative. There\u2019s no extra product to add to your evening routine.",
        "details": [
          "balm"
        ],
        "actions": [
          "Use it instead of Bioderma, then follow with your regular cleanser. You don\u2019t need both makeup removers.",
          "Look for easy removal without troublesome residue or irritation."
        ]
      }
    ]
  },
  "sunscreen": {
    "title": "Sunscreen",
    "blocks": [
      {
        "products": [
          "sunscreen"
        ],
        "heading": "Why I\u2019m keeping this for you",
        "reason": "Your sunscreen works well with your basic routine. I\u2019d keep it and focus on the serum layering that sometimes makes you use less of it. With the brown marks as our priority, I want sun protection to be the step you can apply properly, rather than the one you cut back to make makeup sit better.",
        "actions": [
          "Try the simpler morning routine without the two serums and notice how your usual makeup wears.",
          "Apply generously as directed before going outdoors and reapply at least every 2 hours outdoors. For swimming or sweating, choose a water-resistant sunscreen; this bottle isn\u2019t labeled for that use."
        ],
        "details": [
          "sunscreen"
        ]
      }
    ]
  },
  "treatments": {
    "title": "Treatments",
    "blocks": [
      {
        "products": [
          "azelaic"
        ],
        "heading": "Why I chose this for you",
        "reason": "The marks that linger after spots are your priority, so azelaic acid is the one new treatment I\u2019d try. We\u2019ll keep your comfortable basics and leave the glycolic toner out while you introduce it. The stronger clinical evidence is for 15\u201320% formulas, so I can\u2019t assume this 10% bottle will give the same results. We\u2019ll watch how your skin feels and whether the marks gradually change before deciding what comes next.",
        "actions": [
          "Introduce it gradually using the routine guide. Keep the glycolic toner and other new actives out during this trial.",
          "At our check-in, we\u2019ll review application, irritation and the marks together. If progress stalls, we\u2019ll reassess the plan rather than automatically increase the strength."
        ],
        "details": [
          "azelaic"
        ]
      },
      {
        "products": [
          "ha",
          "niacinamide"
        ],
        "heading": "Why I\u2019d pause these for now",
        "reason": "You\u2019ve been layering these on some mornings without a clear sense of what each adds. I\u2019d pause both while we simplify the routine. Hyaluronic acid and niacinamide can be used together; this is about seeing whether those extra product layers are making sunscreen and makeup harder to wear.",
        "actions": [
          "Your moisturizer already provides hydration, so pausing a separate hydrating serum doesn\u2019t mean leaving that need unmet.",
          "If the simpler routine wears better, we can decide whether either serum earns a place back, one at a time."
        ],
        "details": [
          "ha",
          "niacinamide"
        ]
      },
      {
        "products": [
          "glycolic"
        ],
        "heading": "Why I\u2019d leave this out",
        "reason": "You stopped this after your cheeks felt hot and tight, and your basics have felt comfortable again since. I\u2019d leave it out while we introduce azelaic acid. That experience doesn\u2019t mean every ingredient called an acid will behave the same way, but it does tell me we should avoid several new treatments at once.",
        "actions": [
          "Keep the glycolic toner out. If you develop burning, peeling or other irritation while trying azelaic acid, stop the azelaic acid and seek advice if it persists."
        ],
        "details": [
          "glycolic"
        ]
      }
    ]
  }
};

// src/maya-case.js
var copy = (key) => products[key].detail;
var source2 = (label, url2) => ({ label, url: url2 });
var usage2 = (periods, order, instructions, short = { morning: null, evening: null }) => ({ periods, order, short, instructions });
var guide2 = (id3, productId, title, instructions = [], sources = [], intro2 = "", careNote = null) => ({ id: id3, productId, title, intro: intro2, steps: instructions.map((body) => ({ title: null, body })), careNote, sources });
var extension = { moisturizer: "jpg", hydro: "jpg", cleanser: "jpg", aveeno: "jpg", remover: "jpg", balm: "jpg", sunscreen: "webp", azelaic: "png", ha: "png", niacinamide: "png", glycolic: "png", makeup: "jpg" };
var ids = { moisturizer: "cerave-pm", hydro: "neutrogena-hydro-boost-water-cream-6806486", cleanser: "cerave-hydrating-cleanser", aveeno: "aveeno-soothing-oat-cleanser", remover: "bioderma-sensibio-h2o", balm: "cerave-makeup-removing-balm", sunscreen: "lrp-anthelios-uv-control-spf50", azelaic: "ordinary-azelaic-10", ha: "ordinary-ha-b5", niacinamide: "ordinary-niacinamide-zinc", glycolic: "ordinary-glycolic-7", makeup: "maybelline-fit-me" };
var product2 = (key) => {
  const p = products[key];
  return { id: ids[key], name: p.name, brand: p.brand, variant: p.variant, sizeLabel: p.size || "", productUrl: p.url, imageUrl: "assets/" + key + "." + extension[key], reference: key === "makeup" ? p.fact + " " + p.detail : p.fact, displayPrice: typeof p.price === "number" ? { cents: Math.round(p.price * 100), currency: "USD", sourceUrl: p.priceSource || p.url, checkedOn: "2026-10-20", illustrative: true } : null, sourceLabel: (p.brand.startsWith("CeraVe") ? "CeraVe" : p.brand) + ": product & ingredients" };
};
var P = Object.fromEntries(Object.keys(ids).map((key) => [key, product2(key)]));
var reason = (title, body) => ({ title, body });
var formulaComparisons = { "moisturizer": [{ "label": "Niacinamide", "currentText": "Contains it", "proposedText": "Not in listed formula", "significance": "Your CeraVe contains niacinamide and has felt comfortable for months, so leaving it out isn\u2019t a goal here. I\u2019d test fewer serum layers first for the pilling you\u2019ve noticed.", "ingredientGuideKey": "niacinamide", "guideNote": null, "sources": [] }, { "label": "Ceramides", "currentText": "3 types\nNP \xB7 AP \xB7 EOP", "proposedText": "1 type\nNP", "significance": "Your CeraVe already keeps your skin comfortable. Fewer ceramide types in Hydro Boost aren\u2019t a reason to leave a moisturizer that works for you; comfort matters more than the count.", "ingredientGuideKey": "ceramides", "guideNote": null, "sources": [] }, { "label": "Urea", "currentText": "Not in listed formula", "proposedText": "Contains it", "significance": "Urea adds to the moisture-binding blend in this option. If you choose to try it later, I\u2019d look for comfortable cheeks through the day and good sunscreen and makeup wear.", "ingredientGuideKey": null, "guideNote": null, "sources": [] }], "cleanser": [{ "label": "Ceramides", "currentText": "3 types\nNP \xB7 AP \xB7 EOP", "proposedText": "Not in listed formula", "significance": "Your current cleanser is comfortable, so Aveeno having no ceramides listed isn\u2019t a reason to rush a switch. I\u2019d finish CeraVe and save Aveeno\u2019s different blend for the next bottle.", "ingredientGuideKey": "ceramides", "guideNote": null, "sources": [] }, { "label": "Coco-Glucoside", "currentText": "Not in listed formula", "proposedText": "Contains it", "significance": "I\u2019d keep this foaming cleanser change separate from starting azelaic acid. That gives you a clearer chance to notice how your skin feels with the new wash while the rest of your routine stays familiar.", "ingredientGuideKey": null, "guideNote": null, "sources": [] }, { "label": "Sodium Cocoyl Glutamate", "currentText": "Not in listed formula", "proposedText": "Contains it", "significance": "When you reach the next bottle, I\u2019d check how this different cleansing blend rinses away the day\u2019s remaining products. Easy rinsing without tightness or residue matters more than the lower price.", "ingredientGuideKey": null, "guideNote": null, "sources": [] }], "remover": [{ "label": "PEG-6 Caprylic/Capric Glycerides", "currentText": "Contains it", "proposedText": "Not in listed formula", "significance": "This is part of the micellar formula that already takes your makeup off comfortably with a pad. I\u2019d keep that familiar method unless you\u2019d prefer to remove it with your fingertips and rinse.", "ingredientGuideKey": null, "guideNote": null, "sources": [] }, { "label": "Ethylhexyl Palmitate", "currentText": "Not in listed formula", "proposedText": "Contains it", "significance": "The balm\u2019s oily blend gives you the fingertip-and-rinse option. If you choose it, I\u2019d check for easy removal and a clean rinse without troublesome residue, rather than assume it will remove your makeup better.", "ingredientGuideKey": null, "guideNote": null, "sources": [] }, { "label": "Ceramides", "currentText": "Not in listed formula", "proposedText": "3 types\nNP \xB7 AP \xB7 EOP", "significance": "I wouldn\u2019t buy the balm for ceramides when Bioderma already works comfortably for you. If you prefer the balm, it replaces Bioderma; your regular cleanser still follows.", "ingredientGuideKey": "ceramides", "guideNote": null, "sources": [] }] };
var card2 = (slot, kind, currentProduct, proposedProduct, heading, reasons, actions = [], more = {}) => ({ id: "maya-card-" + slot, slot, kind, recommendationId: null, title: slot === "makeup-removal" ? "Makeup removal" : slot === "serums" ? "Your two serums" : slot === "exfoliant" ? "Glycolic toner" : slot[0].toUpperCase() + slot.slice(1), subtitle: "", rationaleTitle: heading, reasons: reasons.map((r) => typeof r === "string" ? reason(heading, r) : r), actions, currentProduct, proposedProduct, usage: null, comparisons: [], factsTitle: "Product reference", facts: [], how: guide2("maya-guide-" + slot, (proposedProduct || currentProduct)?.id || null, "How to use it", []), sources: [], ...more });
var azelaicHow = products.azelaic.how;
var sunscreenUsage = usage2(["morning"], 5, ["Apply generously as directed, 15 minutes before sun exposure. Reapply at least every 2 hours outdoors. For swimming or sweating, choose a water-resistant sunscreen."], { morning: "Apply generously as directed before going outdoors. Reapply at least every 2 hours outdoors; use a water-resistant sunscreen for swimming or sweating.", evening: null });
var moisturizerUsage = usage2(["morning", "evening"], 4, ["Keep the moisturizer that feels comfortable, morning and evening."], { morning: "Keep your comfortable moisturizer beneath sunscreen.", evening: "Follow cleansing with your comfortable moisturizer." });
var cleanserUsage = usage2(["evening"], 2, ["Use your comfortable CeraVe cleanser in the evening. Finish this bottle before trying Aveeno."], { morning: null, evening: "Use CeraVe in the evening until this bottle is finished." });
var removerUsage = usage2(["evening"], 1, ["On makeup days, use one makeup remover before your cleanser. Use Bioderma with a well-soaked soft pad and a light touch. The balm is an optional alternative, not another step."], { morning: null, evening: "If wearing makeup: use Bioderma before your cleanser. Use one makeup remover." });
var azelaicUsage = usage2(["evening"], 3, azelaicHow, { morning: null, evening: "On azelaic nights: apply to dry skin after cleansing, then use your moisturizer. Follow the gradual introduction in your guide." });
var hydroHow = ["Apply evenly to face and neck after cleansing, following the product label. Use it in place of your current moisturizer.", "In the morning, follow with sunscreen. Make this later change separately, after the treatment is settled. You don\u2019t need to buy it now."];
var hydroUsage = usage2(["morning", "evening"], 4, hydroHow, { morning: "Hydro Boost in place of CeraVe; follow with sunscreen.", evening: "After cleansing, apply Hydro Boost in place of CeraVe." });
var balmHow = ["On makeup days, use the balm in place of Bioderma, not alongside it.", "Follow the product label and avoid direct contact with eyes. Rinse off, then follow with your cleanser."];
function createMayaPresentation() {
  const baselineRoutine = [
    { id: "maya-water-rinse", kind: "instruction", slot: null, productId: null, product: null, title: "Your usual water rinse", usage: usage2(["morning"], 1, ["Keep your morning water rinse. More cleansing isn\u2019t the goal."], { morning: "Keep your morning water rinse.", evening: null }) },
    ...[["moisturizer", moisturizerUsage], ["cleanser", cleanserUsage], ["remover", removerUsage], ["sunscreen", sunscreenUsage], ["makeup", usage2(["morning"], 6, ["Makeup is optional."], { morning: "Your usual makeup, if you want to wear it. Brand reference image; your shade is not recorded.", evening: null })]].map(([key, u]) => ({ id: "maya-baseline-" + key, kind: "product", slot: key === "remover" ? "makeup-removal" : key, productId: P[key].id, product: P[key], title: P[key].name, usage: u }))
  ];
  const cards = [
    card2("moisturizer", "optional_alternative", P.moisturizer, P.hydro, "Why I\u2019m keeping this for you", [copy("moisturizer"), reason("Optional alternative", copy("hydro"))], [], { recommendationId: "maya-hydro-1", comparisons: structuredClone(formulaComparisons.moisturizer), usage: hydroUsage, decisionLabels: { current: "KEEP", proposed: "OPTIONAL ALTERNATIVE" }, how: guide2("maya-guide-moisturizer", P.hydro.id, "How to use Hydro Boost", hydroHow) }),
    card2("cleanser", "finish_then_replace", P.cleanser, P.aveeno, "Why I chose this for you", [copy("cleanser")], sections.cleanser.blocks[0].actions, { comparisons: structuredClone(formulaComparisons.cleanser), usage: cleanserUsage, decisionLabels: { current: "FINISH THIS BOTTLE", proposed: "NEXT BOTTLE" }, how: guide2("maya-guide-cleanser", P.aveeno.id, "How to make the later change", ["Finish CeraVe first, and keep the cleanser change separate from introducing azelaic acid.", "Once you try Aveeno, follow its label, rinse thoroughly and judge it by comfort and removal of the day\u2019s remaining products."]) }),
    card2("makeup-removal", "optional_alternative", P.remover, P.balm, "Why I\u2019m keeping Bioderma for you", [copy("remover"), reason("Optional alternative", copy("balm"))], sections.cleanser.blocks.find((block) => block.products.includes("balm")).actions, { recommendationId: "maya-balm-1", comparisons: structuredClone(formulaComparisons.remover), group: "cleanser", usage: usage2(["evening"], 1, balmHow, { morning: null, evening: "On makeup days, before your cleanser." }), decisionLabels: { current: "KEEP", proposed: "OPTIONAL ALTERNATIVE" }, how: guide2("maya-guide-remover", P.balm.id, "How to use the balm", balmHow) }),
    card2("sunscreen", "keep", P.sunscreen, null, "Why I\u2019m keeping this for you", [copy("sunscreen")], sections.sunscreen.blocks[0].actions, { usage: sunscreenUsage, how: guide2("maya-guide-sunscreen", P.sunscreen.id, "How to use it", sunscreenUsage.instructions) }),
    card2("treatments", "addition", null, P.azelaic, "Why I chose this for you", [copy("azelaic")], sections.treatments.blocks[0].actions, { recommendationId: "maya-azelaic-1", usage: azelaicUsage, factsTitle: "Evidence & limits", facts: [], sources: [source2("15% azelaic acid study", "https://link.springer.com/article/10.1007/s13555-024-01176-2"), source2("20% azelaic acid study", "https://pmc.ncbi.nlm.nih.gov/articles/PMC10199364/")], how: guide2("maya-guide-azelaic", P.azelaic.id, "How to introduce it", azelaicHow, [source2("The Ordinary directions", P.azelaic.productUrl)]) }),
    card2("serums", "pause", P.ha, P.niacinamide, "Why I\u2019d pause these for now", [copy("ha")], sections.treatments.blocks[1].actions, { group: "treatments", decisionLabels: { current: "PAUSE", proposed: "PAUSE" }, how: guide2("maya-guide-serums", P.ha.id, "What to do for now", ["Pause the separate hyaluronic acid and niacinamide serums while simplifying the morning layers.", "If the simpler routine wears better, decide whether either serum earns a place back, one at a time."]) }),
    card2("exfoliant", "leave_out", P.glycolic, null, "Why I\u2019d leave this out", [copy("glycolic")], sections.treatments.blocks[2].actions, { group: "treatments", how: guide2("maya-guide-glycolic", P.glycolic.id, "What to do for now", ["Keep the glycolic toner out while introducing azelaic acid. Don\u2019t introduce a retinoid or another exfoliant at the same time."]) })
  ];
  return { schemaVersion: 2, title: "Maya\u2019s plan", summary: intro, preparedBy: "Kanuj", preparedOn: "2026-10-20", sources: [], consultationSections: [{ "title": "What we\u2019re working on", "body": "The brown marks that linger after spots are the priority in this plan. We\u2019ll watch for gradual change in the marks while checking how your skin feels." }, { "title": "What is already working", "body": "Your CeraVe lotion has felt comfortable for months, your cleanser feels comfortable, and Bioderma takes your makeup off comfortably. I\u2019d keep those basics while introducing one treatment." }, { "title": "What we\u2019re simplifying", "body": "Pilling on some serum mornings has been getting in the way of sunscreen and makeup. I\u2019d pause the separate hyaluronic acid and niacinamide serums so we can see how the simpler routine wears." }, { "title": "The first proposed change", "body": "Azelaic acid 10% is the one new treatment I\u2019m proposing. When you begin, follow the gradual introduction in your guide and keep cleanser or moisturizer changes separate." }, { "title": "What we\u2019re leaving out", "body": "You stopped the glycolic toner after your cheeks felt hot and tight, and your basics have felt comfortable again since. I\u2019d leave the toner out while you introduce azelaic acid." }, { "title": "What we\u2019ll review together", "body": "If you\u2019ve started azelaic acid, we\u2019ll review how you\u2019ve used it, any irritation and whether the marks are changing. If you haven\u2019t, tell me what you\u2019ve noticed with your current routine. Either way, we\u2019ll check how sunscreen and makeup wear without the two extra serums before deciding what earns a place back." }], categoryCards: cards, baselineRoutine, routineGuides: [] };
}
var mayaIdentity = { clientId: "00000000-0000-4000-8000-00000000a002", displayName: "Maya", avatar: "M", capabilities: { profile: true } };

// src/main.js
mountSyntheticCase(document.querySelector("#portal-root"), { identity: mayaIdentity, presentation: createMayaPresentation() });
