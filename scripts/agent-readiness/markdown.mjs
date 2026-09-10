import { parseHTML } from 'linkedom';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

export function toMarkdown(html, canonical) {
  const { document } = parseHTML(html);
  const title = document.querySelector('title')?.textContent || 'SCHNGN';
  for (const node of document.querySelectorAll('script, style, svg, [hidden], [aria-hidden="true"]')) node.remove();
  for (const node of document.querySelectorAll('[href], [src]')) {
    for (const attribute of ['href', 'src']) {
      const value = node.getAttribute(attribute);
      if (value) node.setAttribute(attribute, new URL(value, canonical).href);
    }
  }
  const converter = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  converter.use(gfm);
  const main = document.querySelector('main');
  // Footers carry reviewed legal limitations and privacy/terms links.
  const content = main
    ? main.outerHTML + [...document.querySelectorAll('footer')]
      .filter((footer) => !main.contains(footer)).map((footer) => footer.outerHTML).join('')
    : document.body.innerHTML;
  return `# ${title}\n\nSource: ${canonical}\n\n${converter.turndown(content)}\n`;
}
