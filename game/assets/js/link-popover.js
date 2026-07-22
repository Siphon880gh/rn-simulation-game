/**
 * Hover preview for internal markdown links (Preview + Contents tabs).
 * Uses the Help/docs fetch path — no separate note API.
 */

import { slugifyHeading } from './markdown-renderer.js';

const SHOW_DELAY_MS = 300;
const HIDE_GRACE_MS = 200;

function stripInlineMarkdown(text) {
    return String(text)
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/[*_`~]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function extractFirstParagraph(markdown) {
    let text = String(markdown).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
    const lines = text.split(/\r?\n/);
    let inFence = false;
    const buf = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('```')) {
            inFence = !inFence;
            continue;
        }
        if (inFence) continue;
        if (!trimmed) {
            if (buf.length) break;
            continue;
        }
        if (/^#{1,6}\s/.test(trimmed)) continue;
        if (/^!\[/.test(trimmed) || /^!\[\[/.test(trimmed)) continue;
        if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) continue;
        if (/^>\s?/.test(trimmed)) continue;
        buf.push(trimmed);
        // keep gathering soft-wrapped paragraph lines
        // stop at blank handled above; also stop if next would be heading — checked next loop
    }

    if (!buf.length) return '';
    const paragraph = stripInlineMarkdown(buf.join(' '));
    const hasMore = text.length > paragraph.length + 20;
    return hasMore ? `${paragraph}…` : paragraph;
}

export function extractHeadingToc(markdown) {
    let text = String(markdown).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
    const toc = [];
    let inFence = false;
    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed.startsWith('```')) {
            inFence = !inFence;
            continue;
        }
        if (inFence) continue;
        const m = /^(#{1,6})\s+(.+)$/.exec(trimmed);
        if (!m) continue;
        const level = m[1].length;
        const title = m[2].replace(/#+\s*$/, '').trim();
        toc.push({ level, title, id: slugifyHeading(title) });
    }
    return toc;
}

export function createLinkPopover(options = {}) {
    const fetchNote = options.fetchNote;
    const openNote = options.openNote;
    const cache = new Map();

    let popoverEl = null;
    let showTimer = null;
    let hideTimer = null;
    let activeAnchor = null;

    function ensurePopover() {
        if (popoverEl) return popoverEl;
        popoverEl = document.createElement('div');
        popoverEl.id = 'md-link-popover';
        popoverEl.className = 'md-link-popover hidden';
        popoverEl.innerHTML = `
            <div class="md-link-popover__chrome">
                <div class="md-link-popover__tabs" role="tablist">
                    <button type="button" class="md-link-popover__tab is-active" data-tab="preview">Preview</button>
                    <button type="button" class="md-link-popover__tab" data-tab="contents">Contents</button>
                </div>
                <div class="md-link-popover__body" data-panel="preview">
                    <div class="md-link-popover__loading">Fetching…</div>
                </div>
                <div class="md-link-popover__body hidden" data-panel="contents"></div>
                <div class="md-link-popover__footer">
                    <button type="button" class="md-link-popover__open">Open full note</button>
                </div>
            </div>
        `;
        document.body.appendChild(popoverEl);

        popoverEl.addEventListener('mouseenter', () => clearTimeout(hideTimer));
        popoverEl.addEventListener('mouseleave', scheduleHide);

        popoverEl.querySelectorAll('.md-link-popover__tab').forEach((tab) => {
            tab.addEventListener('click', () => {
                const name = tab.getAttribute('data-tab');
                popoverEl.querySelectorAll('.md-link-popover__tab').forEach((t) => t.classList.toggle('is-active', t === tab));
                popoverEl.querySelectorAll('.md-link-popover__body').forEach((panel) => {
                    panel.classList.toggle('hidden', panel.getAttribute('data-panel') !== name);
                });
            });
        });

        popoverEl.querySelector('.md-link-popover__open').addEventListener('click', () => {
            if (!activeAnchor || typeof openNote !== 'function') return;
            openNote(activeAnchor);
            hideNow();
        });

        return popoverEl;
    }

    function positionPopover(anchor) {
        const el = ensurePopover();
        const rect = anchor.getBoundingClientRect();
        const pad = 8;
        const width = Math.min(360, window.innerWidth - pad * 2);
        el.style.width = `${width}px`;
        let left = rect.left + window.scrollX;
        let top = rect.bottom + window.scrollY + 6;
        el.classList.remove('hidden');
        const box = el.getBoundingClientRect();
        if (left + box.width > window.scrollX + window.innerWidth - pad) {
            left = window.scrollX + window.innerWidth - box.width - pad;
        }
        if (left < window.scrollX + pad) left = window.scrollX + pad;
        if (rect.bottom + box.height + 6 > window.innerHeight && rect.top > box.height + 6) {
            top = rect.top + window.scrollY - box.height - 6;
        }
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
    }

    function renderPayload(payload) {
        const previewPanel = popoverEl.querySelector('[data-panel="preview"]');
        const contentsPanel = popoverEl.querySelector('[data-panel="contents"]');
        if (!payload || payload.error) {
            previewPanel.innerHTML = `<p class="md-link-popover__error">${payload?.error || 'Preview unavailable'}</p>`;
            contentsPanel.innerHTML = '<p class="md-link-popover__muted">No headings</p>';
            return;
        }
        previewPanel.innerHTML = `<p class="md-link-popover__preview">${payload.preview || 'No preview text.'}</p>`;
        if (!payload.toc || !payload.toc.length) {
            contentsPanel.innerHTML = '<p class="md-link-popover__muted">No headings</p>';
            return;
        }
        contentsPanel.innerHTML = `<ul class="md-link-popover__toc">${payload.toc.map((item) => `
            <li class="md-link-popover__toc-item" style="padding-left:${(item.level - 1) * 12}px">
                <a href="#${item.id}" data-md-toc-id="${item.id}">${item.title}</a>
            </li>`).join('')}</ul>`;
        contentsPanel.querySelectorAll('[data-md-toc-id]').forEach((a) => {
            a.addEventListener('click', (event) => {
                event.preventDefault();
                if (typeof openNote === 'function' && activeAnchor) {
                    openNote(activeAnchor, { hash: a.getAttribute('data-md-toc-id') });
                }
                hideNow();
            });
        });
    }

    async function loadForAnchor(anchor) {
        const category = anchor.getAttribute('data-md-category') || '';
        const filename = anchor.getAttribute('data-md-filename') || '';
        const note = decodeURIComponent(anchor.getAttribute('data-md-note') || '');
        const cacheKey = `${category}/${filename || note}`;
        if (cache.has(cacheKey)) {
            renderPayload(cache.get(cacheKey));
            return;
        }
        const previewPanel = popoverEl.querySelector('[data-panel="preview"]');
        previewPanel.innerHTML = '<div class="md-link-popover__loading">Fetching…</div>';
        try {
            if (typeof fetchNote !== 'function') throw new Error('No fetchNote');
            const markdown = await fetchNote({ category, filename, note, anchor });
            const payload = {
                preview: extractFirstParagraph(markdown),
                toc: extractHeadingToc(markdown)
            };
            cache.set(cacheKey, payload);
            renderPayload(payload);
        } catch (err) {
            const payload = { error: 'Preview unavailable' };
            cache.set(cacheKey, payload);
            renderPayload(payload);
        }
    }

    function scheduleHide() {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hideNow, HIDE_GRACE_MS);
    }

    function hideNow() {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
        if (popoverEl) popoverEl.classList.add('hidden');
        activeAnchor = null;
    }

    function onEnter(event) {
        const anchor = event.currentTarget;
        clearTimeout(hideTimer);
        clearTimeout(showTimer);
        showTimer = setTimeout(async () => {
            activeAnchor = anchor;
            ensurePopover();
            positionPopover(anchor);
            await loadForAnchor(anchor);
            positionPopover(anchor);
        }, SHOW_DELAY_MS);
    }

    function onLeave() {
        clearTimeout(showTimer);
        scheduleHide();
    }

    function bindAnchor(anchor) {
        if (anchor.dataset.mdPopoverBound === '1') return;
        if (!anchor.classList.contains('md-internal-link')) return;
        if (anchor.classList.contains('md-missing-link')) return;
        anchor.dataset.mdPopoverBound = '1';
        anchor.addEventListener('mouseenter', onEnter);
        anchor.addEventListener('mouseleave', onLeave);
    }

    function rescan(rootEl) {
        if (!rootEl) return;
        rootEl.querySelectorAll('a.md-internal-link').forEach(bindAnchor);
    }

    return { rescan, hide: hideNow, _cache: cache };
}

if (typeof window !== 'undefined') {
    window.RnLinkPopover = { createLinkPopover, extractFirstParagraph, extractHeadingToc };
}
