/**
 * AUTO checks for E0.M5 markdown renderer (no browser required for pure helpers).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    slugifyHeading,
    stripFrontmatter,
    preprocessMarkdown,
    replaceWikiLinks
} from '../game/assets/js/markdown-renderer.js';
import {
    extractFirstParagraph,
    extractHeadingToc
} from '../game/assets/js/link-popover.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function assert(cond, msg) {
    if (!cond) failures.push(msg);
}

const indexHtml = readFileSync(join(root, 'game/index.html'), 'utf8');
const docsJs = readFileSync(join(root, 'game/assets/js/docs.js'), 'utf8');

assert(!/marked\.min\.js|marked\.parse/.test(indexHtml + docsJs), 'marked should not be used');
assert(/markdown-it@/.test(indexHtml), 'index.html loads markdown-it');
assert(/mermaid@/.test(indexHtml), 'index.html loads mermaid');
assert(/katex@/.test(indexHtml), 'index.html loads katex');
assert(/markdown-it-texmath/.test(indexHtml), 'index.html loads texmath');
assert(/type="module" src="assets\/js\/docs\.js"/.test(indexHtml), 'docs.js is an ES module');
assert(existsSync(join(root, 'game/assets/js/markdown-renderer.js')), 'markdown-renderer.js exists');
assert(existsSync(join(root, 'game/assets/js/link-popover.js')), 'link-popover.js exists');
assert(existsSync(join(root, 'docs/learning/PRIORITIZATION_BASICS.md')), 'learning sample exists');
assert(/PRIORITIZATION_BASICS\.md/.test(docsJs), 'learning note registered in docs.js');
assert(/renderMarkdown/.test(docsJs), 'docs.js calls renderMarkdown');
assert(/createLinkPopover/.test(docsJs), 'docs.js wires link popover');

assert(slugifyHeading('Shift pressure') === 'Shift-pressure', `slugify got ${slugifyHeading('Shift pressure')}`);
assert(slugifyHeading('12 lead') === 'at12-lead', `slugify numeric start`);

const stripped = stripFrontmatter('---\ntitle: X\n---\n# Hi\n');
assert(stripped.startsWith('# Hi'), 'frontmatter strip');

const pre = preprocessMarkdown('See ![[photo.png]] and keep [[About]]');
assert(pre.includes('![](photo.png)'), 'obsidian image rewrite');
assert(pre.includes('[[About]]'), 'wiki left for post-pass');

const html = replaceWikiLinks('Go [[About]] now', (title) => {
    if (title === 'About') {
        return { href: '#doc=players/ABOUT.md', category: 'players', filename: 'ABOUT.md' };
    }
    return null;
});
assert(html.includes('md-internal-link') && html.includes('ABOUT.md'), 'wiki link rewrite');

const learning = readFileSync(join(root, 'docs/learning/PRIORITIZATION_BASICS.md'), 'utf8');
const preview = extractFirstParagraph(learning);
assert(/short learning note/i.test(preview), `preview paragraph: ${preview}`);
const toc = extractHeadingToc(learning);
assert(toc.some((t) => t.title === 'Shift pressure'), 'TOC includes Shift pressure');
assert(toc.some((t) => t.id === 'Shift-pressure'), 'TOC slug matches slugify');
assert(/```mermaid/.test(learning), 'learning note has mermaid fence');
assert(/\$Dose/.test(learning) || /\$\$/.test(learning), 'learning note has math');

if (failures.length) {
    console.error('E0.M5 AUTO FAIL');
    failures.forEach((f) => console.error(' -', f));
    process.exit(1);
}
console.log('E0.M5 AUTO PASS');
