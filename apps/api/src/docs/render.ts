import { chapters, type Chapter, type Locale } from './content.ts';
import type { ReferenceOperation } from './operations.ts';
import { escapeHtml, icon, renderShell } from './shell.ts';

function guideCode(html: string, locale: Locale): string {
  const label = locale === 'fr' ? 'Copier le code' : 'Copy code';
  return html.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_match, code: string) =>
    `<div class="guide-code"><button type="button" data-copy-code aria-label="${label}"><span class="guide-copy-icons">${icon('<rect x="8" y="8" width="11" height="12" rx="1"/><path d="M15 8V4H4v12h4"/>')}${icon('<path d="m5 12 4 4L19 6"/>')}</span><span class="guide-copy-label">${locale === 'fr' ? 'Copier' : 'Copy'}</span></button><pre><code>${code}</code></pre></div>`);
}

export function renderChapter(locale: Locale, chapter: Chapter, operations: ReferenceOperation[], nonce: string): string {
  const fr = locale === 'fr';
  const all = chapters(locale).filter(item => !item.api);
  const index = all.findIndex(row => row.slug === chapter.slug);
  const toc = chapter.sections.map((section, i) => `<a href="#${section.id}"${i === 0 ? ' aria-current="true"' : ''}>${section.title}</a>`).join('');
  const tocLabel = fr ? 'Sur cette page' : 'On this page';
  const direction = (item: Chapter | undefined, label: string) => item ? `<a href="/docs/${locale}/${item.slug}"><span>${label}</span>${item.title}</a>` : '';
  const content = `<div class="guide-layout"><article class="guide-article"><details class="guide-mobile-toc"><summary>${tocLabel}</summary><nav data-guide-toc aria-label="${tocLabel}">${toc}</nav></details><header><h1>${escapeHtml(chapter.title)}</h1><p class="guide-lead">${chapter.description}</p></header>${chapter.sections.map(section => `<section id="${section.id}" aria-labelledby="${section.id}-heading"><h2 id="${section.id}-heading">${section.title}</h2>${guideCode(section.html, locale)}</section>`).join('')}<nav class="guide-pagination" aria-label="${fr ? 'Pages précédente et suivante' : 'Previous and next pages'}">${direction(all[index - 1], fr ? 'Précédent' : 'Previous')}${direction(all[index + 1], fr ? 'Suivant' : 'Next')}</nav><p class="guide-footer">${fr ? 'République du Congo · CG / COG · Couverture partielle' : 'Republic of the Congo · CG / COG · Partial coverage'}</p><span class="guide-copy-status" role="status" aria-live="polite"></span></article><aside class="guide-toc" aria-label="${tocLabel}"><h2>${tocLabel}</h2><nav data-guide-toc>${toc}</nav></aside></div>`;
  return renderShell(locale, { title: chapter.title, slug: chapter.slug, description: chapter.description, content }, operations, nonce);
}
