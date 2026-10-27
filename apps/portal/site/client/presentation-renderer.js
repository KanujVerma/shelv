import {formulaComparison} from './formula-comparison.js';
import {productIngredientsMarkup,productIngredientText} from './product-ingredients.js';
import {ingredientButton,comparisonTableMarkup} from './ingredient-components.js';
import {esc, money, title} from '../advisor/model.js';
import {safeContentUrl} from '../advisor/presentation-model.js';
import {rationaleTextMarkup} from './rationale-text.js';
import {legacyRoutineMarkup,legacyRoutineText} from './legacy-routine.js';
import {originalProductCard} from './recommendation-feed.js';
import {routineDisplayState} from './routine-state.js';

const list = value => Array.isArray(value) ? value : [];
const plain = value => esc(value).replace(/\r\n?|\n/g, '<br>');
const lineIcon = name => `<svg class="line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${name === 'check' ? '<path d="m5 12 5 5L19 7"/>' : '<path d="M7 17 17 7M7 7h10v10"/>'}</svg>`;
const bound = card => ['replace', 'finish_then_replace', 'addition', 'optional_alternative'].includes(card?.kind) && typeof card.recommendationId === 'string' && card.recommendationId.length > 0;
const validPrice = price => price?.currency === 'USD' && Number.isSafeInteger(price.cents) && price.cents >= 0 && price.cents <= 100000000;

function link(url, label, className = '') {
  const safe = safeContentUrl(url);
  return safe ? `<a${className ? ` class="${className}"` : ''} href="${esc(safe)}" target="_blank" rel="noopener noreferrer">${label}</a>` : '';
}

function sourceLinks(sources, className = 'product-sources', tag = 'div', excluded = new Set()) {
  const seen = new Set(excluded);
  const links = list(sources).filter(source => {const key=safeContentUrl(source?.url);if(!key||seen.has(key))return false;seen.add(key);return true;}).map(source => link(source?.url, `${plain(source?.label)} ${lineIcon('arrow')}`)).filter(Boolean);
  return links.length ? `<${tag} class="${className}">${links.join('')}</${tag}>` : '';
}


function productImage(product, className = '') {
  const image = safeContentUrl(product?.imageUrl, {image: true});
  return image ? `<img${className ? ` class="${className}"` : ''} src="${esc(image)}" alt="${esc(product?.name)}" referrerpolicy="no-referrer">` : `<span class="product-image-placeholder" role="img" aria-label="Product image unavailable">Image unavailable</span>`;
}

/** Adapt authored public metadata into the approved product component. */
function productCard(product, decision) {
  if (!product) return '';
  const image = safeContentUrl(product.imageUrl, {image: true}), productUrl = safeContentUrl(product.productUrl);
  const price = validPrice(product.displayPrice) ? product.displayPrice : null;
  const item = {decision, name: product.name, brand: product.brand && product.variant ? product.brand : product.name, variant: product.variant || '', size: product.sizeLabel, url: productUrl, image, ...(price ? {price: price.cents / 100, priceSource: safeContentUrl(price.sourceUrl),priceCheckedOn:price.checkedOn} : {})};
  const displayDecision=decision;
  if(['STOP','PAUSE','LEAVE OUT'].includes(decision))item.decision='REPLACE';
  let html = originalProductCard(item,{product});
  if(item.decision!==displayDecision)html=html.replace(' REPLACE</span>',` ${esc(displayDecision)}</span>`);
  html = html.replace(`<h3>${esc(item.brand)}</h3>`, () => `<h3>${plain(item.brand)}</h3>`)
    .replace(`<p class="product-variant">${esc(item.variant)}</p>`, () => `<p class="product-variant">${plain(item.variant)}</p>`)
    .replace(`<span>${esc(item.size)}</span>`, () => `<span>${plain(item.size)}</span>`)
    .replace(/(<section class="product-card [^"]+")/, (_match, opening) => `${opening} aria-label="${esc(product.name)}"`);
  // The recovered card predates public remote images and nullable image metadata.
  html = html.replace(/<img\b/g, '<img referrerpolicy="no-referrer"');
  if (!image) html = html.replace('<div class="product-card-photo"></div>', `<div class="product-card-photo">${productImage(product)}</div>`);
  return html;
}

function productDetailMarkup(product) {
  if (!product) return '';
  const price = validPrice(product.displayPrice) ? product.displayPrice : null;
  return `<div class="client-routine-detail-product"><div class="detail-product-image">${productImage(product)}</div><div>${product.brand ? `<p>${plain(product.brand)}</p>` : ''}${product.variant ? `<p class="product-variant">${plain(product.variant)}</p>` : ''}<p>${plain(product.sizeLabel)}</p>${price ? `<p class="card-price">${link(price.sourceUrl, money(price.cents)) || esc(money(price.cents))}${price.illustrative ? '<small>Reference price</small>' : ''}</p>` : ''}${link(product.productUrl, `Product page ${lineIcon('arrow')}`, 'text-button')}${product.reference ? `<p class="product-reference">${plain(product.reference)}</p>` : ''}</div></div>${productIngredientsMarkup(product,{collapsible:true})}`;
}

function comparisonsMarkup(card) {
 const {rows,context}=formulaComparison(card);
 return comparisonTableMarkup({currentLabel:card.currentProduct?.brand||card.currentProduct?.name||'',proposedLabel:card.proposedProduct?.brand||card.proposedProduct?.name||'',rows})+(context.length?`<section class="formula-context">${context.map(item=>`<h3>${plain(item.title)}</h3><p>${plain(item.body)}</p>`).join('')}</section>`:'');
}

function factsMarkup(card) {
  if (!list(card.facts).length) return '';
  return `<section class="product-facts"><h3>${plain(card.factsTitle)}</h3>${list(card.facts).map(fact => `<div class="product-fact">${fact.ingredientGuideKey ? ingredientButton(fact.ingredientGuideKey, fact.title) : `<h4>${plain(fact.title)}</h4>`}<p>${plain(fact.body)}</p>${sourceLinks(fact.sources)}</div>`).join('')}</section>`;
}

function rationaleMarkup(card) {
  return `<div class="rationale"><h3>${plain(card.rationaleTitle)}</h3><div class="personal-note">${list(card.reasons).map(reason => `<p>${reason.title && reason.title !== card.rationaleTitle ? `<strong>${plain(reason.title)}</strong><br>` : ''}${rationaleTextMarkup(reason.body)}</p>`).join('')}${list(card.actions).length ? `<h4 class="actions-heading">What to do next</h4><ul class="consultation-actions">${card.actions.map(action => `<li>${plain(action)}</li>`).join('')}</ul>` : ''}</div>${comparisonsMarkup(card)}${factsMarkup(card)}</div>`;
}

function guideMarkup(guide, heading = 2, {excludedSources = new Set(), omitTitle = false} = {}) {
  if (!guide) return '';
  return `<section class="application-guide" data-guide="${esc(guide.id)}">${omitTitle ? '' : `<h${heading}>${plain(guide.title)}</h${heading}>`}${guide.intro ? `<p>${plain(guide.intro)}</p>` : ''}${list(guide.steps).length ? `<div class="application-steps">${guide.steps.map((step, i) => `<article><span class="step-art">${String(i + 1).padStart(2, '0')}</span>${step.title ? `<h${Math.min(heading + 1, 6)}>${plain(step.title)}</h${Math.min(heading + 1, 6)}>` : ''}<p>${plain(step.body)}</p></article>`).join('')}</div>` : ''}${guide.careNote ? `<p class="care-note">${plain(guide.careNote)}</p>` : ''}${sourceLinks(guide.sources,'product-sources','div',excludedSources)}</section>`;
}

function usageMarkup(usage, heading = 'When to use it', guides = []) {
  if (!usage) return '';
  const represented = new Set(list(guides).flatMap(guide => list(guide?.steps).map(step => step.body)));
  const instructions = list(usage.instructions).filter(instruction => !represented.has(instruction));
  const shorts = list(usage.periods).filter(period => usage.short?.[period]);
  if (!instructions.length && !shorts.length) return '';
  return `<section class="product-how"><h3>${esc(heading)}</h3>${shorts.map(period => `<p><strong>${esc(title(period))}</strong> · ${plain(usage.short[period])}</p>`).join('')}${instructions.length ? `<ol>${instructions.map(instruction => `<li>${plain(instruction)}</li>`).join('')}</ol>` : ''}</section>`;
}

function directionsMarkup(usage, guides, {heading = 'How to use it', product = null} = {}) {
  const excludedSources=new Set([safeContentUrl(product?.productUrl)].filter(Boolean));
  return `<section class="client-product-guidance"><h3>${esc(heading)}</h3>${usageMarkup(usage, 'When to use it', guides)}${list(guides).map(guide=>{const html=guideMarkup({...guide,title:/^how to use it$/i.test(guide.title)?'Application steps':guide.title},4,{excludedSources,omitTitle:guide.title===heading});for(const source of list(guide.sources))excludedSources.add(safeContentUrl(source.url));return html;}).join('')}</section>`;
}

function heroMarkup(card) {
  if(card.kind==='optional_alternative'||card.kind==='pause')return `<div class="comparison product-pair">${productCard(card.currentProduct,card.decisionLabels?.current||(card.kind==='pause'?'PAUSE':'KEEP'))}${productCard(card.proposedProduct,card.decisionLabels?.proposed||(card.kind==='pause'?'PAUSE':'OPTIONAL ALTERNATIVE'))}</div>`;
  if(card.kind==='addition')return `<div class="keep-product-wrap">${productCard(card.proposedProduct,'PROPOSED ADDITION')}</div>`;
  if(card.kind==='leave_out')return `<div class="keep-product-wrap">${productCard(card.currentProduct,'LEAVE OUT')}</div>`;
  if (card.kind === 'replace') return `<div class="comparison product-pair">${productCard(card.currentProduct, card.decisionLabels?.current || 'REPLACE')}${productCard(card.proposedProduct, card.decisionLabels?.proposed || 'WITH')}</div>`;
  if (card.kind === 'finish_then_replace') return `<div class="${card.decisionLabels?'comparison ':''}product-pair">${productCard(card.currentProduct, card.decisionLabels?.current||'FINISH THIS BOTTLE')}${productCard(card.proposedProduct, card.decisionLabels?.proposed||'NEXT BOTTLE')}</div>`;
  if (card.kind === 'keep') return `<div class="keep-product-wrap">${productCard(card.currentProduct, 'KEEP')}</div>`;
  return `<div class="treatment-hero"><span class="keep-label">NO ADDITION</span><h3>${plain(card.title)}</h3></div>`;
}

function cardMarkup(card, done, readOnly = false) {
  const controls = readOnly ? '' : bound(card) ? `<div class="client-decision-footer" data-controls="${esc(card.recommendationId)}"></div>` : `<button data-review="${esc(card.slot)}" class="${done ? 'quiet' : 'solid'}">${done ? 'Undo review' : 'Mark reviewed'}</button>`;
  return `<article class="recommendation" data-presentation-card="${esc(card.id)}"${bound(card) ? ` data-plan-recommendation="${esc(card.recommendationId)}"` : ''}><div class="card-heading"><div class="category"><span class="category-mark" aria-hidden="true">◒</span><h2>${plain(card.kind === 'no_addition' ? title(card.slot) : card.title)}</h2></div>${card.subtitle ? `<p class="card-subtitle">${plain(card.subtitle)}</p>` : ''}</div>${heroMarkup(card)}${rationaleMarkup(card)}<div class="category-footer">${sourceLinks(card.sources)}<button class="text-button" data-plan-card="${esc(card.id)}">${card.kind === 'no_addition' ? 'What to do for now' : 'Product details'} ${lineIcon('arrow')}</button>${bound(card) ? '' : controls}</div>${bound(card) ? controls : ''}</article>`;
}

/** Public R2 snapshot only. All cards start open, including arbitrary categories. */
export function presentationFeedMarkup(presentation, {reviewed = new Set(), expanded = new Set(list(presentation?.categoryCards).map(card => card.slot)), readOnly = false} = {}) {
  const cards = list(presentation?.categoryCards);
  if (!cards.length) return '';
  if(cards.some(card=>card.group)){
    const groups=[...new Set(cards.map(card=>card.group||card.slot))];
    const content=card=>{const done=!readOnly&&!bound(card)&&reviewed.has(card.slot),open=expanded.has(card.slot);return `${done?`<div class="reviewed-summary"><div class="reviewed-copy"><span class="review-check">${lineIcon('check')}</span><div><strong>${plain(card.currentProduct?.name||card.title)}</strong><small>Reviewed</small></div></div><div class="reviewed-actions"><button data-expand="${esc(card.slot)}" class="text-button">${open?'Hide':'View'}</button><button data-undo-review="${esc(card.slot)}" class="text-button">Undo</button></div></div>`:''}<div${done&&!open?' hidden':''}>${cardMarkup(card,done,readOnly)}</div>`;};
    return `<div class="category-tabs" role="group" aria-label="Recommendation category">${groups.map((group,i)=>`<button data-category="${esc(group)}" aria-pressed="${i===0}">${plain(title(group))}</button>`).join('')}</div><div class="feed-tools"><span id="feed-status" role="status">${cards.length} recommendations</span></div>${groups.map(group=>`<div id="${esc(group)}-panel" class="feed-item" tabindex="-1">${cards.filter(card=>(card.group||card.slot)===group).map(card=>`<div class="feed-item">${content(card)}</div>`).join('')}</div>`).join('')}`;
  }

  return `<div class="category-tabs" role="group" aria-label="Recommendation category">${cards.map((card, i) => `<button data-category="${esc(card.slot)}" aria-pressed="${i === 0}"${!bound(card) && reviewed.has(card.slot) ? ' class="reviewed"' : ''}>${plain(title(card.slot))}</button>`).join('')}</div><div class="feed-tools"><span id="feed-status" role="status">${cards.length} ${cards.length === 1 ? 'recommendation' : 'recommendations'}</span></div>${cards.map(card => {
    const done = !readOnly && !bound(card) && reviewed.has(card.slot), open = expanded.has(card.slot);
    return `<div id="${esc(card.slot)}-panel" class="feed-item" tabindex="-1">${done ? `<div class="reviewed-summary"><div class="reviewed-copy"><span class="review-check">${lineIcon('check')}</span><div><strong>${plain(card.currentProduct?.name || card.title)}</strong><small>Reviewed</small></div></div><div class="reviewed-actions"><button data-expand="${esc(card.slot)}" class="text-button">${open ? 'Hide' : 'View'}</button><button data-undo-review="${esc(card.slot)}" class="text-button">Undo</button></div></div>` : ''}<div${done && !open ? ' hidden' : ''}>${cardMarkup(card, done, readOnly)}</div></div>`;
  }).join('')}`;
}

export function presentationCardDetail(card, {product = null} = {}) {
  if (!card) return '<h2 tabindex="-1">Product details unavailable</h2>';
  const cardProduct = card.proposedProduct || card.currentProduct, chosen = product || cardProduct;
  const ownDirections = !product || product.id === cardProduct?.id;
  // The recommendation already contains the comparison and reasoning. Details
  // concentrate on identifying the product and following its own directions.
  // Unbound future-bottle usage can describe the current product, not the future one.
  const usage = card.kind === 'finish_then_replace' && !bound(card) ? null : card.usage;
  return `<h2 tabindex="-1">${plain(chosen?.name || card.title)}</h2>${productDetailMarkup(chosen)}${ownDirections ? directionsMarkup(usage,[card.how],{product:chosen,heading:card.kind==='no_addition'?'What to focus on instead':['pause','leave_out'].includes(card.kind)?'What to do for now':'How to use it'}) : ''}${sourceLinks(card.sources,'product-sources','div',new Set([chosen?.productUrl,...(ownDirections?list(card.how?.sources).map(source=>source.url):[])]))}`;
}

/** The server's activeRoutine is the sole authority for what the client uses now. */
export function presentationRoutineMarkup(view) {
  const {current: steps, stops} = routineDisplayState(view), periods = ['morning', 'evening'];
  const stopGroups = [...new Set(stops.map(row=>row.card.id))].map(id=>({ ...stops.find(row=>row.card.id===id), products:stops.filter(row=>row.card.id===id).map(row=>row.product) }));
  const stopMarkup = stops.length ? `<section class="advisor-panel routine-stop-advice"><h2>Stop or pause</h2><ul>${stopGroups.map(row=>`<li><strong>${esc(row.label)} · ${row.products.map(product=>plain(product.name)).join(' &amp; ')}</strong>${row.note ? `<p>${plain(row.note)}</p>` : ''}<button class="text-button" data-review-proposal="${esc(row.card.id)}">View recommendation ${lineIcon('arrow')}</button></li>`).join('')}</ul></section>` : '';
  if (!list(view?.activeRoutine).length && !list(view?.routine).length && view?.plan?.presentation?.currentProductsStatus === 'none') return '<section class="advisor-panel routine-empty"><h2>No products started yet</h2><p>You confirmed that you were not using skincare products at your consultation. Your proposed products will appear in your routine after they arrive and you choose Start.</p></section>';
  return `<div class="routine-intro"><h2>Current routine</h2></div><div class="daily-grid client-daily-grid">${periods.map(period => {
    const group = steps.filter(step => list(step.usage?.periods).includes(period)).slice().sort((a, b) => a.usage.order - b.usage.order);
    return `<section aria-labelledby="routine-${period}"><h3 id="routine-${period}">${title(period)}</h3>${group.length ? `<ol>${group.map(step => `<li>${step.kind === 'product' && step.product ? `<button class="routine-product client-routine-product" data-routine-step="${esc(step.id)}" aria-label="Open ${esc(step.product.name)} details">${productImage(step.product)}<span><strong>${plain(step.product.name)}</strong>${step.product.sizeLabel ? `<small>${plain(step.product.sizeLabel)}</small>` : ''}</span><span class="client-routine-arrow" aria-hidden="true">${lineIcon('arrow')}</span></button>` : `<strong>${plain(step.title)}</strong>`}${step.usage.short?.[period] && !(step.kind === 'instruction' && list(step.usage.instructions).some(instruction=>instruction.startsWith(step.usage.short[period]) && instruction!==step.usage.short[period])) ? `<p>${plain(step.usage.short[period])}</p>` : ''}${step.kind === 'instruction' && list(step.usage.instructions).some(instruction=>instruction!==step.usage.short?.[period]) ? `<div class="routine-instructions">${step.usage.instructions.filter(instruction=>instruction!==step.usage.short?.[period]).map(instruction => `<p>${plain(instruction)}</p>`).join('')}</div>` : ''}</li>`).join('')}</ol>` : '<p class="advisor-subtitle">No steps listed for this part of the day.</p>'}</section>`;
  }).join('')}</div>${stopMarkup}${legacyRoutineMarkup({...view,routine:list(view?.routine).filter(item=>!stops.some(row=>item.slot===row.card.slot&&item.productId===row.product.id))})}`;
}

export function presentationProposalsMarkup(view, {readOnly = false} = {}) {
  const {proposed} = routineDisplayState(view);
  if (!proposed.length) return '';
  return `<section class="advisor-panel routine-proposals"><h2>Proposed routine</h2><p>Review these changes before buying. Add a product to your daily steps only after it arrives and you record its actual start date.</p><ul>${proposed.map(row=>`<li><h3>${plain(row.card.proposedProduct.name)}</h3><span class="routine-proposal-status">${esc(row.label)}</span>${row.note?`<p>${esc(row.note)}</p>`:''}<p><button class="text-button" ${row.action==='review'&&!readOnly ? `data-review-proposal="${esc(row.card.id)}"` : `data-plan-card="${esc(row.card.id)}"`}>${row.action==='review'&&!readOnly ? 'Review choice' : 'Product details'} ${lineIcon('arrow')}</button></p></li>`).join('')}</ul></section>`;
}

function publishedPresentation(view, version) {
  if (!Number.isSafeInteger(version) || version < 1) return null;
  const publication = view?.plan?.version === version ? view.plan : list(view?.history).find(item => item?.version === version);
  return publication?.presentation?.schemaVersion === 2 ? publication.presentation : null;
}

function sourceCard(view, step) {
  const presentation = publishedPresentation(view, step.source?.publicationVersion);
  if (!presentation) return null;
  if (step.source?.recommendationId) return list(presentation.categoryCards).find(card => bound(card) && card.recommendationId === step.source.recommendationId && card.slot === step.slot && card.proposedProduct?.id === step.productId) || null;
  if (step.source?.kind !== 'baseline') return null;
  return list(presentation.categoryCards).find(card => card.slot === step.slot && card.currentProduct?.id === step.productId) || null;
}

export function presentationRoutineDetail(view, stepId) {
  const step = list(view?.activeRoutine).find(item => item.id === stepId);
  if (!step) return '<h2 tabindex="-1">Product unavailable</h2><p>Reload your current routine to view this step.</p>';
  const card = sourceCard(view, step);
  // Display and directions always come from this active step. Only reasoning is
  // drawn from its immutable source publication; a later draft cannot replace it.
  return `<h2 tabindex="-1">${plain(step.product?.name || step.title)}</h2>${productDetailMarkup(step.product)}${card ? `<section class="client-routine-reason"><h3>${plain(card.rationaleTitle)}</h3>${list(card.reasons).map(reason=>`<p>${rationaleTextMarkup(reason.body)}</p>`).join('')}</section>` : ''}${directionsMarkup(step.usage,step.guides,{product:step.product})}${card ? sourceLinks(card.sources,'product-sources','div',new Set([step.product?.productUrl,...list(step.guides).flatMap(guide=>list(guide.sources).map(source=>source.url))])) : ''}`;
}

export function presentationConsultationMarkup(presentation, {includeProfile = true} = {}) {
  return `<h2 tabindex="-1">Plan overview</h2>${presentation?.summary ? `<p>${plain(presentation.summary)}</p>` : ''}${includeProfile ? list(presentation?.consultationSections).map(section => `<h3>${plain(section.title)}</h3><p>${plain(section.body)}</p>`).join('') : ''}`;
}

export function presentationGuidesMarkup(guides) { return list(guides).map(guide => guideMarkup(guide)).join(''); }

export function presentationSourcesMarkup(sources) {
  const links = list(sources).map(source => link(source?.url, `${plain(source?.label)} ${lineIcon('arrow')}`)).filter(Boolean);
  return links.length ? `<section class="source-links"><span>Sources</span>${links.join('')}</section>` : '';
}

export function productDescriptor(view, publicationVersion, recommendationId) {
  if (typeof recommendationId !== 'string' || !recommendationId) return null;
  const presentation = publishedPresentation(view, publicationVersion);
  const product = list(presentation?.categoryCards).find(card => bound(card) && card.recommendationId === recommendationId)?.proposedProduct;
  return product ? {name: product.name, sizeLabel: product.sizeLabel, productUrl: safeContentUrl(product.productUrl)} : null;
}

function sourcesText(sources) {
  return list(sources).flatMap(source => { const url = safeContentUrl(source?.url); return url ? [`${source.label}: ${url}`] : []; });
}

function productText(product) {
  if (!product) return [];
  const price = validPrice(product.displayPrice) ? product.displayPrice : null;
  return [product.name, product.brand, product.variant, product.sizeLabel, safeContentUrl(product.productUrl), product.reference, ...(price ? [`${money(price.cents)}${price.illustrative ? ' · Reference price' : ''}`, safeContentUrl(price.sourceUrl)] : [])].filter(value => value != null && value !== '');
}

function usageText(usage, guides = []) {
  if (!usage) return [];
  const represented = new Set(list(guides).flatMap(guide=>list(guide?.steps).map(step=>step.body)));
  return [...list(usage.periods).flatMap(period => [title(period), usage.short?.[period]].filter(Boolean)), ...list(usage.instructions).filter(instruction=>!represented.has(instruction))];
}

function guideText(guide) {
  if (!guide) return [];
  return [guide.title, guide.intro, ...list(guide.steps).flatMap((step, i) => [`${i + 1}. ${step.title || ''}`.trim(), step.body]), guide.careNote, ...sourcesText(guide.sources)].filter(value => value != null && value !== '');
}

function rationaleText(card) {
  if (!card) return [];
  return [card.rationaleTitle, ...list(card.reasons).flatMap(reason => [reason.title!==card.rationaleTitle?reason.title:null, reason.body]), ...list(card.actions), ...formulaComparison(card).rows.flatMap(comparison => [comparison.label, comparison.currentText, comparison.proposedText, comparison.significance, comparison.guideNote, ...sourcesText(comparison.sources)]), ...formulaComparison(card).context.flatMap(item=>[item.title,item.body]), list(card.facts).length?card.factsTitle:null, ...list(card.facts).flatMap(fact => [fact.title, fact.body, ...sourcesText(fact.sources)]), ...sourcesText(card.sources)];
}

/** Explicit field traversal keeps private/unknown properties out of downloads.
 * Full guides appear once; daily steps retain their short reminders. A guide's
 * content, rather than just its id, distinguishes immutable older publications.
 */
export function presentationText(view) {
  const presentation = view?.plan?.presentation;
  if (presentation?.schemaVersion !== 2) return '';
  const {current, stops, proposed} = routineDisplayState(view);
  const writtenGuides=new Set(),writtenUsage=new Set(),writtenRationales=new Set();
  const fullGuides=[...list(presentation.categoryCards).map(card=>card.how),...list(presentation.routineGuides),...current.filter(step=>step.kind==='product').flatMap(step=>list(step.guides))];
  const guideOnce=guide=>{
    if(!guide)return [];
    const signature=JSON.stringify([guide.productId,guide.title,guide.intro,guide.steps,guide.careNote,guide.sources]);
    if(writtenGuides.has(signature))return [`Full directions: ${guide.title} (above).`];
    writtenGuides.add(signature);return guideText(guide);
  };
  const usageOnce=(usage,guides,product)=>{
    if(!usage)return [];
    const key=JSON.stringify([product?.id,product?.productUrl,usage]);
    if(writtenUsage.has(key))return [`Routine directions for ${product?.name||'this step'} appear above.`];
    writtenUsage.add(key);
    const applicable=fullGuides.filter(guide=>product?.id&&guide?.productId===product.id);
    return usageText(usage,[...list(guides),...applicable]);
  };
  const rationaleOnce=card=>{
    if(!card)return [];
    const key=JSON.stringify([card.id,card.slot,card.currentProduct?.id,card.currentProduct?.productUrl,card.proposedProduct?.id,card.proposedProduct?.productUrl,card.rationaleTitle,card.reasons,card.actions,formulaComparison(card),card.factsTitle,card.facts,card.sources]);
    if(writtenRationales.has(key))return [];
    writtenRationales.add(key);return rationaleText(card);
  };
  const lines = [presentation.title, view.plan.version===null?'Unpublished':`Version ${view.plan.version}`, presentation.summary, presentation.preparedBy ? `Prepared by ${presentation.preparedBy}${presentation.preparedOn ? ` · ${presentation.preparedOn}` : ''}` : presentation.preparedOn, '', ...(list(presentation.consultationSections).length?['Plan overview',...presentation.consultationSections.flatMap(section=>[section.title,section.body,''])]:[]), 'Recommendations'];
  const labels = {replace: 'Replace', keep: 'Keep', finish_then_replace: 'Finish, then replace', no_addition: 'No addition',addition:'Proposed addition',optional_alternative:'Optional alternative',pause:'Pause',leave_out:'Leave out'};
  for (const card of list(presentation.categoryCards)) lines.push(card.title, labels[card.kind], card.subtitle, ...(card.currentProduct ? [card.kind==='pause'?'Pause':card.kind==='leave_out'?'Leave out':card.decisionLabels?.current==='STOP'?'Stop':'Current product', ...productText(card.currentProduct)] : []), ...(card.proposedProduct ? [card.kind==='pause'?'Pause':card.kind==='optional_alternative'?'Optional alternative':card.kind==='finish_then_replace'?'Next bottle':'Proposed product', ...productText(card.proposedProduct)] : []), ...rationaleOnce(card), ...usageOnce(card.usage,[card.how],card.proposedProduct||card.currentProduct), ...guideOnce(card.how), '');
  // Initial products are a reference, including products the plan says to stop.
  // They must never be presented as today's actionable routine.
  lines.push('Plan guidance', ...list(presentation.routineGuides).flatMap(guide => [...guideOnce(guide), '']), 'Your current routine');
  for (const period of ['morning', 'evening']) lines.push(title(period), ...current.filter(step => list(step.usage?.periods).includes(period)).slice().sort((a,b)=>a.usage.order-b.usage.order).flatMap(step => [step.product?.name||step.title,step.usage.short?.[period]||null,...(step.kind==='instruction'?list(step.usage.instructions).filter(instruction=>instruction!==step.usage.short?.[period]):[]),'']));
  if(stops.length){
    lines.push('Stop or pause');
    for(const id of new Set(stops.map(row=>row.card.id))){const rows=stops.filter(row=>row.card.id===id),row=rows[0];lines.push(`${row.label}: ${rows.map(item=>item.product.name).join(' & ')}`,...(row.note&&!fullGuides.some(guide=>list(guide?.steps).some(step=>step.body===row.note))?[row.note]:[]));}
  }
  if(proposed.length)lines.push('Proposed routine','These products are not daily steps until you receive them and record when you actually start.',...proposed.flatMap(row=>[row.card.proposedProduct.name,row.label,row.note]));
  const activeDetails=current.filter(step=>step.kind==='product');
  if(activeDetails.length)lines.push('Current product directions');
  for(const step of activeDetails)lines.push(step.product?.name||step.title,...usageOnce(step.usage,step.guides,step.product),...list(step.guides).flatMap(guideOnce),...rationaleOnce(sourceCard(view,step)),'');
  lines.push('Initial product reference · follow the current routine above', ...list(presentation.baselineRoutine).flatMap(step => [step.title,...productText(step.product),...usageOnce(step.usage,step.guides,step.product),'']));
  const products=[...list(presentation.categoryCards).flatMap(card=>[card.currentProduct,card.proposedProduct]),...list(presentation.baselineRoutine).map(step=>step.product),...list(view.activeRoutine).map(step=>step.product)].filter(Boolean),seenFormulas=new Set();
  lines.push('Full ingredient lists');
  for(const product of products){const key=safeContentUrl(product.productUrl)||product.id+':'+product.name;if(seenFormulas.has(key))continue;seenFormulas.add(key);lines.push(...productIngredientText(product),'');}
  lines.push('Earlier active products',...legacyRoutineText({...view,routine:list(view?.routine).filter(item=>!stops.some(row=>item.slot===row.card.slot&&item.productId===row.product.id))}),'Sources', ...sourcesText(presentation.sources));
  return lines.filter(value => value != null).join('\n');
}
