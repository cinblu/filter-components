// Site-only fix for editors shown inline on a page (the detail cards), not in popovers.
//
// cmdk calls `scrollIntoView` on its highlighted row when it mounts and as you arrow through
// it. In a popover that's harmless; on a page, `scrollIntoView` also scrolls the window, so a
// card below the fold would yank the page down on load. Inside `[data-contained-scroll]`,
// rows only scroll their own list, never the page.

const ATTRIBUTE = "data-contained-scroll";

let installed = false;

export function installContainedScroll() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const original = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function scrollIntoView(this: Element, options?: boolean | ScrollIntoViewOptions) {
    if (!this.closest(`[${ATTRIBUTE}]`)) return original.call(this, options);
    const list = this.closest<HTMLElement>("[cmdk-list]");
    if (!list || !(this instanceof HTMLElement)) return;
    // "nearest": move the list just enough to show the row.
    const top = this.offsetTop - list.offsetTop;
    const bottom = top + this.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  };
}

export const containedScroll = { [ATTRIBUTE]: "" };
