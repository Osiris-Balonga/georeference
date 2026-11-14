export const shellStyles = String.raw`
:root { --scalar-custom-header-height: 64px; color-scheme: dark; }
body { margin: 0; background: #0f0f0f; --docs-fg: #e7e7e7; --docs-muted: #b4b4b4; --docs-surface: #1d1d1d; --docs-hover: #242424; --docs-line: #383838; --docs-focus: #43c4e9; }
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="light"] body { color-scheme: light; background: #fff; --docs-fg: #1b1b1b; --docs-muted: #555; --docs-surface: #f7f7f7; --docs-hover: #f1f1f1; --docs-line: #dedede; --docs-focus: #067494; }
.docs-header, .docs-sidebar, .guide-layout, .docs-error, .docs-skip { font: 14px/1.6 var(--scalar-font, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); -webkit-font-smoothing: antialiased; color: var(--docs-fg); }
.docs-header { box-sizing: border-box; height: 64px; padding: 0 24px; display: flex; align-items: center; gap: 28px; background: #0f0f0f; position: sticky; top: 0; z-index: 10; }
:root[data-theme="light"] .docs-header { background: #fff; }
.docs-header a { color: inherit; text-decoration: none; }
.docs-brand { font-size: 18px; font-weight: 650; letter-spacing: -.02em; }
.docs-header-label { color: var(--docs-muted); font-size: 13px; }
.docs-header nav { margin-left: auto; display: flex; align-items: center; gap: 4px; }
.docs-header nav a, .docs-header button { display: inline-flex; align-items: center; justify-content: center; min-width: 40px; min-height: 40px; padding: 0; border: 0; border-radius: 3px; background: transparent; color: var(--docs-muted); font: inherit; cursor: pointer; }
.docs-header nav a[aria-current] { color: var(--docs-fg); font-weight: 650; }
.docs-header nav a:hover, .docs-header button:hover { background: var(--docs-hover); }
.docs-header svg, .guide-code svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.docs-header .docs-menu { display: none; }
.docs-layout { display: grid; grid-template-columns: 224px minmax(0, 1fr); }
.docs-sidebar { position: sticky; top: 64px; height: calc(100dvh - 64px); align-self: start; display: flex; flex-direction: column; min-width: 0; }
.docs-filter { padding: 20px 16px 8px; }
.docs-filter input { box-sizing: border-box; width: 100%; min-height: 40px; border: 0; border-radius: 3px; padding: 8px 12px; background: var(--docs-surface); color: var(--docs-fg); font: inherit; font-size: 12px; }
.docs-filter input::placeholder { color: var(--docs-muted); }
.docs-navigation { padding: 16px; overflow: auto; scrollbar-width: thin; scrollbar-color: var(--docs-line) transparent; min-height: 0; }
.docs-navigation h2 { font: inherit; font-size: 11px; letter-spacing: .07em; font-weight: 700; margin: 0 12px 10px; text-transform: uppercase; }
.docs-nav-group + .docs-nav-group { margin-top: 28px; }
.docs-navigation a { display: flex; align-items: center; gap: 8px; padding: 10px 12px; min-height: 20px; font-size: 13px; color: var(--docs-muted); text-decoration: none; border-radius: 3px; }
.docs-navigation a:hover { background: var(--docs-surface); color: var(--docs-fg); }
.docs-navigation .docs-active { background: var(--docs-hover); color: var(--docs-fg); font-weight: 550; }
.docs-method { font: 10px/1.5 ui-monospace, monospace; font-weight: 650; color: var(--docs-focus); flex-shrink: 0; }
.docs-navigation .docs-contract { margin-top: 32px; font-size: 12px; }
.docs-no-results { padding: 0 28px; color: var(--docs-muted); font-size: 13px; }
#docs-main { min-width: 0; min-height: calc(100dvh - 64px); }
.docs-skip { position: fixed; top: -100px; left: 16px; z-index: 20; padding: 10px; background: var(--docs-hover); }
.docs-skip:focus { top: 10px; }
.docs-header a:focus-visible, .docs-header button:focus-visible, .docs-sidebar a:focus-visible, .docs-filter input:focus-visible, .guide-layout :is(a,button,summary):focus-visible { outline: 2px solid var(--docs-focus); outline-offset: 2px; }
.docs-error { margin: 48px; padding: 20px; background: var(--docs-hover); }
.docs-error a { color: inherit; text-underline-offset: 4px; }
.docs-skeleton { padding: 96px 60px; display: grid; gap: 20px; }
.docs-skeleton div { height: 16px; max-width: 520px; background: var(--docs-hover); border-radius: 3px; animation: docs-pulse 1.2s ease-in-out infinite alternate; }
.docs-skeleton div:first-child { width: 200px; height: 30px; }
.docs-skeleton div:last-child { height: 220px; margin-top: 32px; }
@keyframes docs-pulse { to { opacity: .45; } }
[hidden] { display: none !important; }
.guide-layout { box-sizing: border-box; padding: 96px 60px 48px; display: grid; grid-template-columns: minmax(0,720px) 160px; gap: 64px; }
.guide-article { min-width: 0; }
.guide-article h1 { font-size: 26px; line-height: 1.25; font-weight: 650; letter-spacing: -.02em; margin: 0 0 14px; text-wrap: balance; }
.guide-article h2 { font-size: 20px; line-height: 1.4; font-weight: 600; letter-spacing: -.01em; margin: 0 0 16px; text-wrap: balance; }
.guide-article p { margin: 0 0 18px; text-wrap: pretty; }
.guide-article header { margin-bottom: 48px; }
.guide-lead { color: var(--docs-muted); font-size: 15px; }
.guide-article > section { margin-bottom: 48px; scroll-margin-top: 88px; }
.guide-article a { color: inherit; text-underline-offset: 4px; }
.guide-article a:hover { color: var(--docs-muted); }
.guide-article .ways { margin: 24px 0; display: grid; gap: 20px; }
.guide-article .ways div { display: grid; grid-template-columns: 140px minmax(0,1fr); gap: 20px; }
.guide-article dt { font-weight: 550; }
.guide-article dd { margin: 0; color: var(--docs-muted); }
.guide-article code { font: 12px/1.6 ui-monospace, SFMono-Regular, Consolas, monospace; padding: 2px 4px; border-radius: 3px; background: var(--docs-surface); }
.guide-code { margin: 24px 0; border: 1px solid var(--docs-line); border-radius: 6px; background: var(--docs-surface); overflow: hidden; }
.guide-code pre { overflow: auto; margin: 0; padding: 12px 20px 20px; tab-size: 2; }
.guide-code pre code { background: transparent; padding: 0; white-space: pre; }
.guide-code button { display: flex; align-items: center; gap: 7px; min-height: 40px; min-width: 84px; margin: 4px 4px 0 auto; padding: 0 10px; background: transparent; color: var(--docs-muted); border: 0; border-radius: 3px; font: inherit; font-size: 12px; cursor: pointer; transition: background-color .15s, color .15s; }
.guide-code button:hover { background: var(--docs-hover); color: var(--docs-fg); }
.guide-code button[data-copied] { color: var(--docs-focus); }
.guide-copy-icons { display: inline-block; width: 18px; height: 18px; position: relative; }
.guide-copy-icons svg { position: absolute; inset: 0; transition: opacity .15s, scale .15s, filter .15s; }
.guide-copy-icons svg:last-child { opacity: 0; scale: .25; filter: blur(4px); }
[data-copied] .guide-copy-icons svg:first-child { opacity: 0; scale: .25; filter: blur(4px); }
[data-copied] .guide-copy-icons svg:last-child { opacity: 1; scale: 1; filter: blur(0); }
.guide-toc { position: sticky; top: 112px; align-self: start; font-size: 12px; }
.guide-toc h2 { margin: 0 0 14px; font-size: 12px; font-weight: 600; }
.guide-toc a, .guide-mobile-toc a { display: block; text-decoration: none; padding: 8px 0; color: var(--docs-muted); }
[data-guide-toc] a[aria-current=true], [data-guide-toc] a:hover { color: var(--docs-fg); }
.guide-mobile-toc { display: none; }
.guide-pagination { display: flex; justify-content: space-between; gap: 24px; margin-top: 48px; }
.guide-pagination a { max-width: 48%; text-decoration: none; padding: 8px 0; font-size: 13px; }
.guide-pagination a:last-child { margin-left: auto; text-align: right; }
.guide-pagination span { display: block; font-size: 12px; color: var(--docs-muted); margin-bottom: 4px; }
.guide-footer { color: var(--docs-muted); font-size: 12px; margin-top: 32px !important; }
.guide-copy-status { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
@media (max-width: 1200px) {
  .guide-layout { grid-template-columns: minmax(0,720px); gap: 0; }
  .guide-toc { display: none; }
  .guide-mobile-toc { display: block; margin-bottom: 24px; font-size: 12px; }
  .guide-mobile-toc summary { cursor: pointer; min-height: 40px; color: var(--docs-muted); }
}
@media (max-width: 760px) {
  .docs-header { padding: 0 16px; gap: 12px; }
  .docs-header .docs-menu { display: inline-flex; }
  .docs-header-label { display: none; }
  .docs-layout { display: block; }
  .docs-sidebar { display: none; position: fixed; z-index: 9; top: 64px; left: 0; bottom: 0; width: min(300px,100vw); background: #0f0f0f; }
  .docs-sidebar[data-open=true] { display: flex; }
  :root[data-theme="light"] .docs-sidebar { background: #fff; }
  .docs-skeleton { padding: 48px 24px; }
  .guide-layout { padding: 48px 24px 32px; }
  .guide-article h1 { font-size: 24px; }
  .guide-article .ways div { grid-template-columns: minmax(0,1fr); gap: 4px; }
}
@media (prefers-reduced-motion: reduce) { .docs-skeleton div { animation: none; } .guide-copy-icons svg, .guide-code button { transition: none; } }
`;
