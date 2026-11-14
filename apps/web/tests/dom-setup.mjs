import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
for (const key of [
  "window",
  "self",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLFormElement",
  "HTMLSelectElement",
  "DocumentFragment",
  "NodeFilter",
  "Element",
  "Node",
  "MutationObserver",
  "Event",
  "CustomEvent",
  "KeyboardEvent",
  "MouseEvent",
  "PointerEvent",
  "getComputedStyle",
]) {
  if (key in dom.window)
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value:
        typeof dom.window[key] === "function" && key === "getComputedStyle"
          ? dom.window[key].bind(dom.window)
          : dom.window[key],
    });
}
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(
  dom.window,
);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(
  dom.window,
);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
HTMLElement.prototype.scrollIntoView = function () {};
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = function () {};
HTMLElement.prototype.releasePointerCapture = function () {};
