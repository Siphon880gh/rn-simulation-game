/**
 * Shared markdown-it + Mermaid + KaTeX renderer for Help/Docs and learning MD.
 * Globals expected (CDN): markdownit, markdownItAnchor, texmath, katex, mermaid
 */

let mdInstance = null;
let mermaidReady = false;

export function slugifyHeading(s) {
    let out = String(s).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '');
    if (out.length && !/[a-zA-Z]/.test(out[0])) {
        out = 'at' + out;
    }
    return out;
}

export function stripFrontmatter(source) {
    return String(source).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

export function preprocessMarkdown(source) {
    let text = stripFrontmatter(source);
    // Obsidian image paste: ![[photo.png]] → ![](photo.png)
    text = text.replace(
        /!\[\[(?!http)([^\/\]]+\.(png|bmp|jpg|jpeg|gif|webp|svg))\]\]/gi,
        '![]($1)'
    );
    return text;
}

export function ensureMermaidInitialized() {
    if (mermaidReady || typeof window === 'undefined' || !window.mermaid) return;
    window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
    mermaidReady = true;
}

export function createMarkdownRenderer() {
    if (typeof window === 'undefined' || typeof window.markdownit !== 'function') {
        throw new Error('markdown-it CDN not loaded (window.markdownit)');
    }

    let md = window.markdownit({
        html: true,
        linkify: true,
        breaks: false,
        typographer: false
    });

    if (typeof window.texmath === 'function' && window.katex) {
        md = md.use(window.texmath, {
            engine: window.katex,
            delimiters: 'dollars',
            katexOptions: { throwOnError: false }
        });
    }

    const anchorPlugin = window.markdownItAnchor || window.markdownitAnchor;
    if (typeof anchorPlugin === 'function' || (anchorPlugin && typeof anchorPlugin.default === 'function')) {
        const plugin = typeof anchorPlugin === 'function' ? anchorPlugin : anchorPlugin.default;
        md = md.use(plugin, {
            level: [1, 2, 3, 4, 5, 6],
            slugify: slugifyHeading,
            permalink: false
        });
    }

    return md;
}

function getMd() {
    if (!mdInstance) {
        mdInstance = createMarkdownRenderer();
    }
    return mdInstance;
}

/**
 * @param {string} html
 * @param {(title: string) => { href: string, category?: string, filename?: string } | null} resolveNote
 */
export function replaceWikiLinks(html, resolveNote) {
    return html.replace(/\[\[([^\]]+?)\]\]/g, (match, rawTitle) => {
        const title = String(rawTitle).trim();
        const resolved = typeof resolveNote === 'function' ? resolveNote(title) : null;
        if (!resolved) {
            return `<a href="#" class="md-internal-link md-missing-link" data-md-note="${encodeURIComponent(title)}">${title}</a>`;
        }
        return `<a href="${resolved.href}" class="md-internal-link" data-md-note="${encodeURIComponent(title)}" data-md-category="${resolved.category || ''}" data-md-filename="${resolved.filename || ''}">${title}</a>`;
    });
}

/**
 * Mark relative *.md anchors as internal note links.
 */
export function markRelativeMdLinks(rootEl, resolveFromHref) {
    if (!rootEl) return;
    rootEl.querySelectorAll('a[href$=".md"], a[href*=".md#"]').forEach((anchor) => {
        const href = anchor.getAttribute('href') || '';
        if (/^https?:\/\//i.test(href)) return;
        const resolved = typeof resolveFromHref === 'function' ? resolveFromHref(href) : null;
        if (!resolved) return;
        anchor.classList.add('md-internal-link');
        anchor.setAttribute('data-md-note', encodeURIComponent(resolved.title || resolved.filename || href));
        if (resolved.category) anchor.setAttribute('data-md-category', resolved.category);
        if (resolved.filename) anchor.setAttribute('data-md-filename', resolved.filename);
    });
}

export function renderMarkdown(source, ctx = {}) {
    const text = preprocessMarkdown(source);
    const md = getMd();
    let html = md.render(text);
    if (typeof ctx.resolveNote === 'function') {
        html = replaceWikiLinks(html, ctx.resolveNote);
    } else {
        html = replaceWikiLinks(html, () => null);
    }
    return html;
}

export async function enhanceMermaid(rootEl) {
    if (!rootEl || typeof window === 'undefined' || !window.mermaid) return;
    ensureMermaidInitialized();

    const nodes = rootEl.querySelectorAll('pre code.language-mermaid, pre.mermaid, .mermaid');
    const hosts = [];
    nodes.forEach((node, i) => {
        if (node.classList && node.classList.contains('mermaid') && node.tagName === 'DIV') {
            hosts.push(node);
            return;
        }
        const pre = node.closest('pre') || node;
        const source = node.textContent || '';
        const host = document.createElement('div');
        host.className = 'mermaid';
        host.id = `mermaid-${Date.now()}-${i}`;
        host.textContent = source;
        pre.replaceWith(host);
        hosts.push(host);
    });

    if (hosts.length) {
        await window.mermaid.run({ nodes: hosts });
    }
}

/**
 * @param {HTMLElement} rootEl
 * @param {{ resolveFromHref?: Function, onInternalLinkClick?: Function, linkPopover?: { rescan: Function } }} ctx
 */
export async function enhanceMarkdownDom(rootEl, ctx = {}) {
    if (!rootEl) return;
    markRelativeMdLinks(rootEl, ctx.resolveFromHref);

    if (typeof ctx.onInternalLinkClick === 'function') {
        rootEl.querySelectorAll('a.md-internal-link').forEach((anchor) => {
            if (anchor.dataset.mdBound === '1') return;
            anchor.dataset.mdBound = '1';
            anchor.addEventListener('click', (event) => {
                event.preventDefault();
                ctx.onInternalLinkClick(anchor, event);
            });
        });
    }

    await enhanceMermaid(rootEl);

    if (ctx.linkPopover && typeof ctx.linkPopover.rescan === 'function') {
        ctx.linkPopover.rescan(rootEl);
    }
}

export function resetMarkdownRendererForTests() {
    mdInstance = null;
    mermaidReady = false;
}

if (typeof window !== 'undefined') {
    ensureMermaidInitialized();
    window.RnMarkdown = {
        slugifyHeading,
        stripFrontmatter,
        preprocessMarkdown,
        renderMarkdown,
        enhanceMarkdownDom,
        enhanceMermaid,
        createMarkdownRenderer,
        replaceWikiLinks
    };
}
