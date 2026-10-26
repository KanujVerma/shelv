let nextDialogId = 0;
const scrollLocks = new WeakMap();

/** Native modal lifecycle. Content is trusted application markup or an owned Node.
 * Escape and every utility dismissal honor canClose; the owner guards unmounts.
 */
export function createPortalDialog({document = globalThis.document, className = 'advisor-dialog', onClose = null, canClose = null} = {}) {
  const element = document.createElement('dialog');
  element.className = `${className} portal-dialog`.trim();
  document.body.append(element);
  let active = false, disposed = false, opener = null, openerId = '', focusFallback = null;

  function lockScroll() {
    const root = document.documentElement;
    const current = scrollLocks.get(document);
    if (current) current.count++;
    else {scrollLocks.set(document, {count: 1, overflow: root.style.overflow}); root.style.overflow = 'hidden';}
  }
  function unlockScroll() {
    const current = scrollLocks.get(document);
    if (!current || --current.count > 0) return;
    document.documentElement.style.overflow = current.overflow;
    scrollLocks.delete(document);
  }
  function focus(target) {
    if (!target?.isConnected || target === document.body || target === document.documentElement || target.disabled || target.closest('[hidden],[inert]')) return false;
    if (!target.matches('a[href],button,input,select,textarea,[tabindex]')) target.setAttribute('tabindex', '-1');
    target.focus({preventScroll: true});
    return document.activeElement === target;
  }
  function finishClose() {
    if (!active || element.open) return;
    active = false;
    unlockScroll();
    const replacement = openerId ? document.getElementById(openerId) : null;
    if (!focus(opener) && !focus(replacement) && !focus(focusFallback)) {
      focus(document.querySelector('[data-dialog-focus-fallback]') || document.querySelector('main h1,[role="main"] h1,.workspace h1') || document.querySelector('main,[role="main"]'));
    }
    opener = null; openerId = ''; focusFallback = null;
    onClose?.();
  }
  function close(reason = 'close') {
    if (!element.open) return false;
    if (canClose && canClose(reason) === false) return false;
    element.close();
    finishClose();
    return true;
  }
  function cancel(event) {
    if (canClose && canClose('escape') === false) event.preventDefault();
  }
  function dismiss(event) {
    const trigger = event.target.closest?.('[data-dialog-close],[data-close],[data-dismiss]');
    if (trigger && element.contains(trigger)) close('dismiss');
  }
  function containFocus(event) {
    if (event.key !== 'Tab' || !element.open) return;
    const controls = [...element.querySelectorAll('a[href],button,input:not([type="hidden"]),select,textarea,[tabindex]:not([tabindex="-1"])')].filter(control => !control.disabled && control.getClientRects().length && !control.closest('[hidden],[inert]'));
    const first = controls[0], last = controls.at(-1);
    if (!first) {event.preventDefault(); focus(element.querySelector('h1,h2'));}
    else if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) {event.preventDefault(); focus(last);}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); focus(first);}
  }
  element.addEventListener('cancel', cancel);
  element.addEventListener('close', finishClose);
  element.addEventListener('click', dismiss);
  element.addEventListener('keydown', containFocus);

  function open({title, content, trigger = null, initialFocus = null}) {
    if (disposed) throw new Error('A disposed dialog cannot be opened.');
    if (typeof title !== 'string' || !title.trim()) throw new TypeError('A dialog needs a descriptive title.');
    if (typeof content !== 'string' && !(content && typeof content.nodeType === 'number')) throw new TypeError('Dialog content must be trusted markup or a Node.');
    if (!active) {
      opener = trigger || document.activeElement;
      openerId = opener?.id || '';
      focusFallback = opener?.closest('main,[role="main"],.workspace')?.querySelector('h1');
    }
    element.replaceChildren();
    if (typeof content === 'string') element.innerHTML = content;
    else element.append(content);
    let heading = element.querySelector('h1,h2');
    if (!heading) {heading = document.createElement('h2'); heading.textContent = title; element.prepend(heading);}
    heading.setAttribute('tabindex', '-1');
    element.removeAttribute('aria-label');
    element.removeAttribute('aria-labelledby');
    if (heading.textContent.trim() === title.trim()) {
      if (!heading.id) heading.id = `portal-dialog-title-${++nextDialogId}`;
      element.setAttribute('aria-labelledby', heading.id);
    } else element.setAttribute('aria-label', title);
    if (!element.querySelector('[data-dialog-close],[data-close],[data-dismiss]')) {
      const header = document.createElement('div'); header.className = 'portal-dialog-header';
      const button = document.createElement('button'); button.type = 'button'; button.className = 'close';
      button.setAttribute('aria-label', 'Close dialog'); button.dataset.dialogClose = ''; button.textContent = '×';
      header.append(button); element.prepend(header);
    }
    element.scrollTop = 0;
    if (!element.open) {element.showModal(); if (!active) {active = true; lockScroll();}}
    const requested = typeof initialFocus === 'function' ? initialFocus(element) : typeof initialFocus === 'string' ? element.querySelector(initialFocus) : initialFocus;
    if (!requested || !element.contains(requested) || !focus(requested)) focus(heading);
    return element;
  }
  function dispose() {
    if (disposed) return;
    if (element.open) element.close();
    finishClose();
    disposed = true;
    element.removeEventListener('cancel', cancel);
    element.removeEventListener('close', finishClose);
    element.removeEventListener('click', dismiss);
    element.removeEventListener('keydown', containFocus);
    element.remove();
  }
  return {element, open, close, dispose};
}
