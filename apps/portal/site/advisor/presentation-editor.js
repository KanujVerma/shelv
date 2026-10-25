/** Local-only R2 authoring. The workspace owns validation, saving and publication. */
const clone = value => structuredClone(value);
const pathOf = value => Array.isArray(value) ? value : value.split('.');
const categories = [['moisturizer', 'Moisturizer'], ['cleanser', 'Cleanser'], ['sunscreen', 'Sunscreen'], ['treatments', 'Treatments']];
const ingredients = [
  ['niacinamide', 'Niacinamide'], ['ceramide_np', 'Ceramide NP'], ['ceramide_ap', 'Ceramide AP'], ['ceramide_eop', 'Ceramide EOP'],
  ['glycerin', 'Glycerin'], ['hyaluronic_acid', 'Hyaluronic acid'], ['sodium_hyaluronate', 'Sodium hyaluronate'], ['squalane', 'Squalane'],
  ['dimethicone', 'Dimethicone'], ['ceramide_ng', 'Ceramide NG'], ['ceramide_as', 'Ceramide AS'], ['cetearyl-alcohol', 'Cetearyl alcohol'],
  ['stearyl-alcohol', 'Stearyl alcohol'], ['potassium-phosphate', 'Potassium phosphate'], ['ceramide-np', 'Ceramide NP (formula guide)'],
  ['ceramide-ap', 'Ceramide AP (formula guide)'], ['ceramide-eop', 'Ceramide EOP (formula guide)'], ['carbomer', 'Carbomer'],
  ['glyceryl-stearate', 'Glyceryl stearate'], ['behentrimonium-methosulfate', 'Behentrimonium methosulfate'],
  ['sodium-lauroyl-lactylate', 'Sodium lauroyl lactylate'], ['sodium-hyaluronate', 'Sodium hyaluronate (formula guide)'],
  ['cholesterol', 'Cholesterol'], ['phenoxyethanol', 'Phenoxyethanol'], ['disodium-edta', 'Disodium EDTA'],
  ['dipotassium-phosphate', 'Dipotassium phosphate'], ['tocopherol', 'Tocopherol'], ['phytosphingosine', 'Phytosphingosine'],
  ['xanthan-gum', 'Xanthan gum'], ['cetyl-alcohol', 'Cetyl alcohol'], ['polysorbate-20', 'Polysorbate 20'],
  ['ethylhexylglycerin', 'Ethylhexylglycerin'], ['ceramides', 'Ceramides (group)']
];

/** Strict decimal parsing: invalid or incomplete prices stay invalid for save validation. */
export function parseDollarCents(value) {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents >= 0 && cents <= 100000000 ? cents : null;
}

const freshId = () => globalThis.crypto.randomUUID();
const newPrice = () => ({ cents: 0, currency: 'USD', sourceUrl: null, checkedOn: null, illustrative: true });
const newProduct = () => ({ id: freshId(), name: '', brand: null, variant: null, sizeLabel: '', productUrl: null, imageUrl: null, reference: null, displayPrice: null });
const newUsage = (order = 1) => ({ periods: ['morning', 'evening'], order, short: { morning: null, evening: null }, instructions: [''] });
const newGuide = (productId = null) => ({ id: freshId(), productId, title: 'How to use', intro: '', steps: [], careNote: null, sources: [] });
const newSection = () => ({ title: '', body: '' });
function newPresentation(kind) {
  const common = { schemaVersion: 2, consultationSections: [], baselineRoutine: [] };
  return kind === 'intake' ? common : { ...common, title: 'Your next plan', summary: '', preparedBy: '', preparedOn: null, sources: [], categoryCards: [], routineGuides: [] };
}

export function mountPresentationEditor(element, { value, kind = 'plan', onChange = () => {}, disabled = false, baselineLocked = false } = {}) {
  if (!element?.ownerDocument || !['plan', 'intake'].includes(kind)) throw new TypeError('A host element and plan or intake kind are required.');
  let snapshot = value == null ? newPresentation(kind) : clone(value);
  const lockBaseline = kind === 'intake' && Boolean(baselineLocked);
  let isDisabled = Boolean(disabled), destroyed = false, listeners = [], controls = [];
  const doc = element.ownerDocument, openGroups = new Map();
  const root = node('div', null, 'presentation-editor');
  element.replaceChildren(root);

  function node(tag, text, className) {
    const result = doc.createElement(tag);
    if (text != null) result.textContent = String(text);
    if (className) result.className = className;
    return result;
  }
  function read(path) { return pathOf(path).reduce((current, key) => current?.[key], snapshot); }
  function write(path, next) {
    const parts = pathOf(path); let target = snapshot;
    parts.slice(0, -1).forEach((key, index) => { target = target[key] ??= /^\d+$/.test(parts[index + 1]) ? [] : {}; });
    target[parts.at(-1)] = next;
  }
  function listen(target, type, handler) {
    const guarded = event => { if (!destroyed && !isDisabled) handler(event); };
    target.addEventListener(type, guarded); listeners.push(() => target.removeEventListener(type, guarded));
  }
  function applyControlState({ control, locked }) {
    const tag = String(control.tagName).toLowerCase();
    const textInput = tag === 'input' && ['text', 'number', 'date', 'url', 'email', 'search', 'tel', 'password', 'time', 'datetime-local', 'month', 'week'].includes(control.type || 'text');
    const copyable = tag === 'textarea' || textInput;
    control.disabled = locked || isDisabled && !copyable;
    if (tag === 'input' || tag === 'textarea') control.readOnly = copyable && isDisabled;
  }
  function register(control, locked = false) { const entry = { control, locked }; controls.push(entry); applyControlState(entry); return control; }
  function emit() { onChange(clone(snapshot)); }
  function mutate(operation) { if (destroyed || isDisabled) return; operation(); render(); emit(); }
  function hint(parent, text) { parent.append(node('p', text, 'presentation-hint')); }
  function button(parent, label, action, handler, locked = false) {
    const result = register(node('button', label, 'presentation-button'), locked);
    result.type = 'button'; result.dataset.action = action;
    listen(result, 'click', () => { if (!locked) mutate(handler); }); parent.append(result); return result;
  }
  function group(parent, key, title, description, open = false) {
    const details = node('details', null, 'presentation-group');
    details.open = openGroups.has(key) ? openGroups.get(key) : open;
    details.append(node('summary', title));
    // Disclosure state belongs to the UI, so it may still change in a read-only editor.
    const toggle = () => openGroups.set(key, details.open);
    details.addEventListener('toggle', toggle); listeners.push(() => details.removeEventListener('toggle', toggle));
    const body = node('div', null, 'presentation-group-body'); details.append(body); parent.append(details);
    if (description) hint(body, description); return body;
  }
  function input(parent, path, label, { multiline = false, nullable = false, type = 'text', options, lines = false, money = false, integer = false, hint: help, rows = 3, update, rerender = false, locked = false } = {}) {
    const wrapper = node('label', null, `presentation-field${type === 'checkbox' ? ' presentation-check' : ''}`);
    const caption = node('span', label, 'presentation-label');
    const control = register(node(options ? 'select' : multiline || lines ? 'textarea' : 'input'), locked);
    control.dataset.field = path; control.name = path;
    const current = read(path);
    if (options) {
      const choices = [...options];
      if (current != null && current !== '' && !choices.some(([key]) => key === String(current))) choices.push([String(current), 'Existing selection · review before saving']);
      for (const [key, text] of choices) { const option = node('option', text); option.value = key; control.append(option); }
    } else if (multiline || lines) control.rows = rows;
    else { control.type = type; if (money || integer) control.inputMode = money ? 'decimal' : 'numeric'; }
    if (type === 'date') { control.min = '1900-01-01'; }
    if (type === 'checkbox') control.checked = Boolean(current);
    else if (money) control.value = Number.isInteger(current) ? (current / 100).toFixed(2) : '';
    else if (lines) control.value = Array.isArray(current) ? current.join('\n') : '';
    else control.value = current ?? '';
    function changed() {
      if (locked) return;
      let next = type === 'checkbox' ? control.checked : control.value;
      if (money) {
        next = parseDollarCents(next);
        control.setAttribute('aria-invalid', next === null ? 'true' : 'false');
      } else if (integer) next = /^\d+$/.test(next) && Number.isSafeInteger(Number(next)) ? Number(next) : null;
      else if (lines) next = next === '' ? [] : next.replace(/\r\n?/g, '\n').split('\n');
      else if (nullable && next === '') next = null;
      if (update) update(next);
      else write(path, next);
      if (rerender) render();
      emit();
    }
    listen(control, 'input', changed); listen(control, 'change', changed);
    wrapper.append(caption, control); if (help) wrapper.append(node('small', help, 'presentation-hint'));
    parent.append(wrapper); return control;
  }
  function list(parent, path, title, singular, create, renderItem, { max = 12, open = false, description, canRemove = () => true } = {}) {
    const items = read(path) || [], body = group(parent, path, `${title} (${items.length})`, description, open);
    items.forEach((item, index) => {
      const itemPath = `${path}.${index}`;
      const titleText = item.title || item.label || (item.kind === 'instruction' ? 'Instruction step' : item.product?.name) || `${singular} ${index + 1}`;
      const row = group(body, itemPath, titleText, null, index === 0);
      renderItem(row, itemPath, item, index);
      button(row, `Remove ${singular.toLowerCase()}`, `${itemPath}.remove`, () => { const next = read(path).slice(); next.splice(index, 1); write(path, next); }, !canRemove(item));
    });
    if (!items.length) hint(body, `No ${title.toLowerCase()} added yet.`);
    if (create) button(body, `Add ${singular.toLowerCase()}`, `${path}.add`, () => write(path, [...(read(path) || []), create()]), items.length >= max);
    return body;
  }
  function sections(parent, path, title, open = false) {
    list(parent, path, title, 'Section', newSection, (row, at) => { input(row, `${at}.title`, 'Section title'); input(row, `${at}.body`, 'Section text', { multiline: true, rows: 4 }); }, { open });
  }
  function sources(parent, path) {
    list(parent, path, 'Sources', 'Source', () => ({ label: '', url: '' }), (row, at) => { input(row, `${at}.label`, 'Source label'); input(row, `${at}.url`, 'Source URL', { hint: 'Public HTTPS link.' }); });
  }
  function ingredient(parent, path) { input(parent, path, 'Ingredient guide', { nullable: true, options: [['', 'No ingredient guide'], ...ingredients] }); }
  function slot(parent, path, { update, locked = false } = {}) {
    const current = read(path) || '';
    const custom = Boolean(current && !categories.some(([key]) => key === current));
    input(parent, path, 'Category', {
      options: [['', 'Choose category'], ...categories, ['__custom', 'Other category…']],
      update: next => { const nextSlot = next === '__custom' ? (custom ? current : 'custom') : next; if (update) update(nextSlot); else write(path, nextSlot); }, rerender: true, locked
    });
    if (custom) input(parent, path, 'Custom category', { hint: 'Use a short label starting with a letter or number; letters, numbers, hyphens and underscores are allowed.', update, locked });
  }
  function usage(parent, path) {
    const value = read(path);
    const body = group(parent, path, 'Routine timing and instructions', null, false);
    if (value == null) { hint(body, 'No routine instructions set.'); button(body, 'Add routine instructions', `${path}.add`, () => write(path, newUsage())); return; }
    const periods = node('div', null, 'presentation-periods');
    periods.append(node('span', 'Use in', 'presentation-label'));
    for (const [period, label] of [['morning', 'Morning'], ['evening', 'Evening']]) {
      const wrapper = node('label', null, 'presentation-check'), control = register(node('input'));
      control.type = 'checkbox'; control.checked = value.periods?.includes(period) || false; control.dataset.field = `${path}.periods.${period}`;
      const change = () => { const selected = new Set(read(`${path}.periods`) || []); control.checked ? selected.add(period) : selected.delete(period); write(`${path}.periods`, ['morning', 'evening'].filter(item => selected.has(item))); emit(); };
      listen(control, 'change', change); wrapper.append(control, node('span', label)); periods.append(wrapper);
    }
    body.append(periods);
    input(body, `${path}.order`, 'Routine order', { integer: true, hint: '1–50, from first step to last.' });
    input(body, `${path}.short.morning`, 'Short morning instruction', { nullable: true });
    input(body, `${path}.short.evening`, 'Short evening instruction', { nullable: true });
    input(body, `${path}.instructions`, 'Full instructions', { lines: true, rows: 4, hint: 'One instruction per line. Up to 12 instructions.' });
    button(body, 'Remove routine instructions', `${path}.remove`, () => write(path, null));
  }
  function productsInPresentation() {
    const records = new Map();
    for (const step of snapshot.baselineRoutine || []) if (step.product?.id) records.set(step.product.id, step.product);
    for (const card of snapshot.categoryCards || []) for (const product of [card.currentProduct, card.proposedProduct]) if (product?.id) records.set(product.id, product);
    return [...records.values()];
  }
  function guide(parent, path, { productChoice = true } = {}) {
    input(parent, `${path}.title`, 'Guide title'); input(parent, `${path}.intro`, 'Guide introduction', { multiline: true });
    if (productChoice) input(parent, `${path}.productId`, 'Guide applies to', { nullable: true, options: [['', 'General routine guidance'], ...productsInPresentation().map(product => [product.id, product.name || 'Untitled product'])] });
    list(parent, `${path}.steps`, 'Guide steps', 'Step', () => ({ title: null, body: '' }), (row, at) => { input(row, `${at}.title`, 'Step title (optional)', { nullable: true }); input(row, `${at}.body`, 'Step instructions', { multiline: true }); });
    input(parent, `${path}.careNote`, 'Care note (optional)', { nullable: true, multiline: true }); sources(parent, `${path}.sources`);
  }
  function updateProductGuides(previousId, nextId) {
    for (const card of snapshot.categoryCards || []) if (card.how?.productId === previousId) card.how.productId = nextId;
    for (const item of snapshot.routineGuides || []) if (item.productId === previousId) item.productId = nextId;
  }
  function product(parent, path, { replace, allowReplace = true } = {}) {
    const value = read(path);
    if (!value) {
      hint(parent, 'No product details entered.');
      button(parent, 'Add product details', `${path}.add`, () => { const next = newProduct(); write(path, next); replace?.(next); }); return;
    }
    hint(parent, allowReplace ? 'Correct the details below. For a different physical product, variant or size, first choose “Use a different product or size”.' : 'Correct display details for the same physical product. Recommend a different product, variant or size in the plan.');
    if (allowReplace) button(parent, 'Use a different product or size', `${path}.replace`, () => {
      const previous = read(path), next = { ...clone(previous), id: freshId() }; write(path, next); updateProductGuides(previous.id, next.id); replace?.(next);
    });
    input(parent, `${path}.name`, 'Product name'); input(parent, `${path}.brand`, 'Brand (optional)', { nullable: true });
    input(parent, `${path}.variant`, 'Variant (optional)', { nullable: true }); input(parent, `${path}.sizeLabel`, 'Size or unit');
    input(parent, `${path}.productUrl`, 'Product page URL (optional)', { nullable: true });
    input(parent, `${path}.imageUrl`, 'Image URL (optional)', { nullable: true, hint: 'Public HTTPS URL or an approved assets/ image filename.' });
    input(parent, `${path}.reference`, 'Product reference (optional)', { nullable: true, multiline: true });
    const pricePath = `${path}.displayPrice`, price = group(parent, pricePath, 'Display price', 'Reference price in US dollars. The final payment quote is reviewed separately.');
    if (value.displayPrice == null) { button(price, 'Add display price', `${pricePath}.add`, () => write(pricePath, newPrice())); }
    else {
      input(price, `${pricePath}.cents`, 'Display price (USD)', { money: true, hint: 'For example, 16.99. Up to $1,000,000.00; no fractional cents.' });
      input(price, `${pricePath}.sourceUrl`, 'Price source URL (optional)', { nullable: true });
      input(price, `${pricePath}.checkedOn`, 'Price checked on (optional)', { nullable: true, type: 'date' });
      input(price, `${pricePath}.illustrative`, 'Illustrative reference price', { type: 'checkbox' });
      button(price, 'Remove display price', `${pricePath}.remove`, () => write(pricePath, null));
    }
  }
  function currentProduct(parent, path, card) {
    const options = (snapshot.baselineRoutine || []).filter(step => step.kind === 'product' && step.slot === card.slot && step.product?.id);
    const wrapper = node('label', null, 'presentation-field'); wrapper.append(node('span', 'Current consultation product', 'presentation-label'));
    const select = register(node('select')); select.dataset.field = `${path}.currentProductChoice`; select.name = select.dataset.field;
    for (const [id, label] of [['', 'Choose the current product'], ...options.map(step => [step.product.id, `${step.product.name || 'Untitled product'} · ${step.product.sizeLabel || 'Size needed'}`])]) { const option = node('option', label); option.value = id; select.append(option); }
    if (card.currentProduct && !options.some(step => step.product.id === card.currentProduct.id)) { const missing = node('option', `${card.currentProduct.name || 'Current product'} · review consultation category`); missing.value = card.currentProduct.id; select.append(missing); }
    select.value = card.currentProduct?.id || '';
    listen(select, 'change', () => {
      if (select.value === '') { card.currentProduct = null; emit(); return; }
      const match = options.find(step => step.product.id === select.value); if (!match) return;
      if (card.currentProduct?.id !== match.product.id && card.recommendationId) card.recommendationId = freshId();
      card.currentProduct = clone(match.product); emit();
    });
    wrapper.append(select); parent.append(wrapper); hint(parent, 'Current products come from the saved consultation. Recommend a different product through a plan replacement or addition.');
  }
  function setCardKind(card, next) {
    if (!['replace', 'keep', 'finish_then_replace', 'no_addition', 'addition', 'optional_alternative', 'pause', 'leave_out'].includes(next)) return;
    const previousProposedId = card.proposedProduct?.id;
    card.kind = next;
    if (next === 'no_addition') { card.recommendationId = null; card.currentProduct = null; card.proposedProduct = null; card.usage = null; }
    else if (next === 'keep') { card.recommendationId = null; card.proposedProduct = null; card.usage ??= newUsage(); }
    else if (next === 'pause' || next === 'leave_out') { card.recommendationId = null; card.usage = null; if (next === 'leave_out') card.proposedProduct = null; }
    else { card.proposedProduct ??= newProduct(); card.usage ??= newUsage(); if (['replace','addition','optional_alternative'].includes(next)) card.recommendationId ??= freshId(); }
    if (next === 'addition') card.currentProduct = null;
    if (!card.currentProduct && !['no_addition','addition'].includes(next)) {
      const baseline = (snapshot.baselineRoutine || []).find(step => step.kind === 'product' && step.slot === card.slot && step.product);
      card.currentProduct = baseline ? clone(baseline.product) : null;
    }
    if (previousProposedId && !productsInPresentation().some(product => product.id === previousProposedId)) updateProductGuides(previousProposedId, null);
  }
  function card(parent, path, value) {
    slot(parent, `${path}.slot`, { update: next => {
      if (value.slot !== next && value.recommendationId) value.recommendationId = freshId(); value.slot = next;
      const baseline = (snapshot.baselineRoutine || []).find(step => step.kind === 'product' && step.slot === next && step.product);
      value.currentProduct = ['no_addition','addition'].includes(value.kind) ? null : baseline ? clone(baseline.product) : null;
    } });
    input(parent, `${path}.kind`, 'Plan decision', { options: [['replace', 'Replace'], ['keep', 'Keep'], ['finish_then_replace', 'Finish, then replace'], ['no_addition', 'No addition'], ['addition', 'Add a new product'], ['optional_alternative', 'Optional replacement'], ['pause', 'Pause a reference product'], ['leave_out', 'Leave out a reference product']], update: next => setCardKind(value, next), rerender: true });
    if (value.kind === 'finish_then_replace') input(parent, `${path}.purchaseNow`, 'Include this replacement in the current purchase proposal', {
      type: 'checkbox', update: checked => { value.recommendationId = checked ? value.recommendationId || freshId() : null; }, rerender: true,
      hint: 'Leave unchecked for a future option with no purchase obligation.'
    }).checked = value.recommendationId != null;
    input(parent, `${path}.title`, 'Card title'); input(parent, `${path}.subtitle`, 'Card subtitle (optional)');
    if (['pause','leave_out'].includes(value.kind)) { const reference = group(parent, `${path}.currentProduct`, 'Reference product', null, true); product(reference, `${path}.currentProduct`); }
    else if (!['no_addition','addition'].includes(value.kind)) currentProduct(parent, path, value);
    if (['replace', 'finish_then_replace', 'addition', 'optional_alternative'].includes(value.kind)) {
      const proposed = group(parent, `${path}.proposedProduct`, 'Proposed product', null, true);
      product(proposed, `${path}.proposedProduct`, { replace: next => { if (value.recommendationId) value.recommendationId = freshId(); if (value.how) value.how.productId = next.id; } });
    }
    input(parent, `${path}.rationaleTitle`, 'Reasoning heading'); sections(parent, `${path}.reasons`, 'Reasons', true);
    input(parent, `${path}.actions`, 'Actions', { lines: true, hint: 'One action per line. Up to 12 actions.' });
    if (!['no_addition','pause','leave_out'].includes(value.kind)) usage(parent, `${path}.usage`);
    if (value.currentProduct) list(parent, `${path}.comparisons`, 'Comparisons', 'Comparison', () => ({ label: '', currentText: '', proposedText: '', significance: '', ingredientGuideKey: null, guideNote: null, sources: [] }), (row, at) => {
      input(row, `${at}.label`, 'Comparison label'); input(row, `${at}.currentText`, 'Current product text', { multiline: true }); input(row, `${at}.proposedText`, 'Proposed product text', { multiline: true });
      input(row, `${at}.significance`, 'What this means', { multiline: true }); ingredient(row, `${at}.ingredientGuideKey`);
      input(row, `${at}.guideNote`, 'Advisor ingredient note (optional)', { nullable: true, multiline: true }); sources(row, `${at}.sources`);
    });
    input(parent, `${path}.factsTitle`, 'Facts heading');
    list(parent, `${path}.facts`, 'Facts', 'Fact', () => ({ title: '', body: '', ingredientGuideKey: null, sources: [] }), (row, at) => {
      input(row, `${at}.title`, 'Fact title'); input(row, `${at}.body`, 'Fact text', { multiline: true }); ingredient(row, `${at}.ingredientGuideKey`); sources(row, `${at}.sources`);
    });
    const how = group(parent, `${path}.how`, 'How-to guide');
    if (value.how) guide(how, `${path}.how`); else button(how, 'Add how-to guide', `${path}.how.add`, () => write(`${path}.how`, newGuide(value.proposedProduct?.id || value.currentProduct?.id || null)));
    sources(parent, `${path}.sources`);
  }
  function baseline(parent) {
    const products = (snapshot.baselineRoutine || []).filter(step => step.kind === 'product');
    if (kind === 'intake' && !products.length) input(parent, 'currentProductsStatus', 'Current products at consultation', { options: [['', 'Not reviewed'], ['none', 'Confirmed: no current products'], ['recorded', 'Current products to record']], update: next => { if (next === '') delete snapshot.currentProductsStatus; else write('currentProductsStatus', next); }, rerender: true, locked: lockBaseline, hint: 'Select no products only after confirming this with the client during your consultation.' });
    else if (kind === 'intake') hint(parent, 'Current products recorded at consultation.');
    const body = list(parent, 'baselineRoutine', 'Baseline routine', 'Routine step', null, (row, at, step) => {
      input(row, `${at}.title`, 'Routine step title');
      if (kind === 'intake') input(row, `${at}.kind`, 'Step type', { options: [['product', 'Product'], ['instruction', 'Instruction without a product']], update: next => {
        step.kind = next;
        if (next === 'instruction') { step.slot = null; step.productId = null; step.product = null; }
        else { step.product ??= newProduct(); step.productId = step.product.id; step.slot ??= ''; }
      }, rerender: true, locked: lockBaseline });
      if (step.kind === 'product') {
        if (kind === 'intake') slot(row, `${at}.slot`, { locked: lockBaseline });
        else hint(row, `Consultation category: ${categories.find(([key]) => key === step.slot)?.[1] || step.slot || 'Category needed'}`);
        const body = group(row, `${at}.product`, 'Current product details', null, true);
        product(body, `${at}.product`, { allowReplace: kind === 'intake' && !lockBaseline, replace: next => { step.productId = next.id; } });
      }
      usage(row, `${at}.usage`);
    }, { max: 50, open: true, canRemove: step => !lockBaseline || step.kind !== 'product', description: lockBaseline ? 'Current products and categories are fixed after the first consultation save. You can correct display details, instructions and consultation text, and add or remove instructions without products. Recommend different products in the plan.' : kind === 'plan' ? 'Current products are captured from the consultation. Keep their identity and category consistent with that baseline.' : 'Enter the client’s current products and any steps without products. Product details can be entered manually.' });
    const count = (snapshot.baselineRoutine || []).length;
    if (kind === 'intake') button(body, 'Add current product step', 'baselineRoutine.addProduct', () => {
      const product = newProduct(); write('baselineRoutine', [...(snapshot.baselineRoutine || []), { id: freshId(), kind: 'product', slot: '', productId: product.id, product, title: 'Current product', usage: newUsage(count + 1) }]);
    }, lockBaseline || snapshot.currentProductsStatus === 'none' || count >= 50);
    button(body, 'Add instruction without a product', 'baselineRoutine.addInstruction', () => write('baselineRoutine', [...(snapshot.baselineRoutine || []), { id: freshId(), kind: 'instruction', slot: null, productId: null, product: null, title: 'Routine instruction', usage: newUsage(count + 1) }]), count >= 50);
  }
  function render() {
    listeners.forEach(remove => remove()); listeners = []; controls = []; root.replaceChildren();
    if (kind === 'plan') {
      const page = group(root, 'page', 'Plan introduction', 'This copy is visible to the client with this plan version.', true);
      input(page, 'title', 'Page title'); input(page, 'summary', 'Page summary', { multiline: true });
      input(page, 'preparedBy', 'Prepared by'); input(page, 'preparedOn', 'Prepared on (optional)', { type: 'date', nullable: true }); sources(page, 'sources');
    }
    sections(root, 'consultationSections', 'Public consultation sections', true);
    if (kind === 'plan') {
      list(root, 'categoryCards', 'Plan decisions', 'Category card', () => {
        const used = new Set((snapshot.categoryCards || []).map(card => card.slot));
        const slot = (snapshot.baselineRoutine || []).find(step => step.kind === 'product' && !used.has(step.slot))?.slot || categories.find(([key]) => !used.has(key))?.[0] || '';
        const baseline = (snapshot.baselineRoutine || []).find(step => step.kind === 'product' && step.slot === slot);
        const proposed = newProduct();
        return { id: freshId(), slot, kind: baseline ? 'replace' : 'addition', recommendationId: freshId(), title: categories.find(([key]) => key === slot)?.[1] || 'Plan decision', subtitle: '', rationaleTitle: 'Why this choice', reasons: [{ title: 'Reason for this choice', body: '' }], actions: [], currentProduct: baseline?.product ? clone(baseline.product) : null, proposedProduct: proposed, usage: newUsage(), comparisons: [], factsTitle: 'Product details', facts: [], how: newGuide(proposed.id), sources: [] };
      }, card, { max: 50, open: true, description: 'One decision per category. A replacement can be purchased now, kept as a future option, or omitted.' });
    }
    baseline(root);
    if (kind === 'plan') list(root, 'routineGuides', 'Routine guides', 'Routine guide', () => newGuide(), (row, at) => guide(row, at));
    // Control types are assigned after registration; apply the final native copy/edit state.
    controls.forEach(applyControlState);
  }
  render();
  return {
    getValue: () => clone(snapshot),
    setDisabled(next) { isDisabled = Boolean(next); controls.forEach(applyControlState); },
    destroy() { if (destroyed) return; destroyed = true; listeners.forEach(remove => remove()); listeners = []; controls = []; root.remove(); }
  };
}
