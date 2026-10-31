/** One shared modal layer for dialogs and sheets; selects retain their own popover. */
export function createOverlayCoordinator() {
  let active: string|null=null;
  const listeners=new Set<()=>void>();
  const emit=()=>listeners.forEach(fn=>fn());
  return {
    getSnapshot:()=>active,
    claim(id: string) {if (active && active!==id) return false;if (active!==id) {active=id;emit();}return true;},
    release(id: string) {if (active===id) {active=null;emit();}},
    subscribe(fn: ()=>void) {listeners.add(fn);return()=>listeners.delete(fn);},
  };
}
