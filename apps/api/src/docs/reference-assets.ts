/** Presentation adapter for pinned Scalar 1.78.1; operation widgets stay native. */
export const referenceStyles = String.raw`
/* A dedicated operation page has no document overview or category summary. Remove their whole frames. */
#operation-reference .section-container:has(> .introduction-section),
#operation-reference .tag-section-container > .section { display: none; }
#operation-reference .tag-section-container { border: 0; }
.docs-layout .scalar .scalar-client--open > .scalar-client {
  width: 100%; max-width: none; height: 100dvh; max-height: 100dvh;
  margin: 0; border: 0; border-radius: 0;
}
.docs-layout .scalar-client--open .app-exit-button {
  position: static; inset: auto; min-width: 40px; min-height: 40px;
  border-radius: var(--scalar-radius); color: var(--scalar-color-2); background: transparent;
}
.docs-layout .scalar-client--open .app-exit-button:hover { color: var(--scalar-color-1); background: var(--scalar-background-2); }
`;

export const referenceClient = String.raw`
const skeleton = document.querySelector('.docs-skeleton');
const error = document.querySelector('.docs-error');
const host = document.getElementById('operation-reference');
// Scalar can replace the operation node while loading or changing theme.
// Promote its native title to the page heading without rebuilding that component.
const titleObserver = new MutationObserver(() => {
  host.querySelector('.operation-title h3')?.setAttribute('aria-level', '1');
});
titleObserver.observe(host, {childList: true, subtree: true});
let reference, options;
window.addEventListener('docs:theme', event => {
  reference?.updateConfiguration({...options, forceDarkModeState: event.detail});
});
async function mount() {
  try {
    options = JSON.parse(document.getElementById('reference-config').textContent);
    const response = await fetch(options.url);
    if (!response.ok) throw new Error('OpenAPI ' + response.status);
    options.content = await response.json(); delete options.url;
    options.forceDarkModeState = document.body.classList.contains('light-mode') ? 'light' : 'dark';
    let positioned = false;
    options.onLoaded = slug => {
      skeleton.hidden = true;
      requestAnimationFrame(() => {
        if (positioned) return;
        positioned = true;
        // Honor explicit field/response deep links. A normal page opens at its natural top.
        let fragment;
        try { fragment = decodeURIComponent(location.hash.slice(1)); } catch { return; }
        if (!fragment) return;
        const target = document.getElementById(slug + '/' + fragment);
        if (target && target.getClientRects().length && !target.matches('.section')) target.scrollIntoView({block: 'start'});
      });
    };
    reference = window.Scalar.createApiReference('#operation-reference', options);
  } catch { skeleton.hidden = true; error.hidden = false; }
}
mount();
`;
