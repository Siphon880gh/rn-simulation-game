/**
 * Landing department tile placeholders (no game-config import).
 * Catalog: game/assets/js/media-placeholder-catalog.json
 * Toggle: ?placeholders=0 to hide; localStorage rngame.mediaPlaceholders=0
 */
(function () {
    const CATALOG_URL = 'game/assets/js/media-placeholder-catalog.json';
    const UNIT_ASSETS = {
        tele: 'dept-tele',
        medsurg: 'dept-medsurg',
        icu: 'dept-icu'
    };

    function enabled() {
        const q = new URLSearchParams(location.search).get('placeholders');
        if (q === '0' || q === 'false') return false;
        try {
            if (localStorage.getItem('rngame.mediaPlaceholders') === '0') return false;
        } catch {
            /* ignore */
        }
        return true;
    }

    function escapeHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    const STYLE_APPENDIX =
        'Style (fun medical simulation): approachable educational game art for an RN shift sim — '
        + 'clear readable shapes, lightly playful personality without cartoon stickers, horror, or gore; '
        + 'bright but clinical hospital palette; panels-first UI friendly; fictional patients/signage only '
        + '(no real faces, no PHI); readable at small sizes; include any requested title as subtle in-frame caption.';

    function withPromptStyle(base) {
        const b = String(base || '').trim();
        if (!b) return STYLE_APPENDIX;
        if (b.includes('Style (fun medical simulation)')) return b;
        return `${b} ${STYLE_APPENDIX}`;
    }

    function withPromptDimensions(base, asset) {
        const w = Math.max(1, Number(asset?.w) || 640);
        const h = Math.max(1, Number(asset?.h) || 360);
        const dim = `Dimensions: ${w}×${h}px — produce the still at these pixel dimensions (2× retina optional).`;
        const b = String(base || '').trim();
        if (!b) return dim;
        if (/\bDimensions:\s*\d+[×x]\d+px\b/i.test(b)) return b;
        return `${b} ${dim}`;
    }

    function resolvePrompt(asset) {
        let body;
        if (asset?.prompt && String(asset.prompt).trim()) {
            body = String(asset.prompt).trim();
        } else {
            const title = asset?.title || 'Untitled';
            body = (
                `Create a still image for an RN hospital shift simulation UI. Subject title: ${title}. `
                + `Include the title text "${title}" as a subtle caption or signage in-frame.`
            );
        }
        return withPromptStyle(withPromptDimensions(body, asset));
    }

    function buildSvgDataUrl(asset) {
        const title = String(asset.title || 'Untitled');
        const w = Number(asset.w) || 640;
        const h = Number(asset.h) || 360;
        const id = String(asset.id || '');
        let display = title;
        if (display.length > 42) display = `${display.slice(0, 39)}…`;
        const titleY = Math.round(h * 0.52);
        const svg =
            `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
            + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
            + `<stop offset="0%" stop-color="#2c3e50"/><stop offset="100%" stop-color="#0d6e6e" stop-opacity="0.55"/>`
            + `</linearGradient></defs>`
            + `<rect width="100%" height="100%" fill="url(#g)"/>`
            + `<text x="24" y="40" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="#0d6e6e">IMAGE PLACEHOLDER</text>`
            + `<text x="50%" y="${titleY}" text-anchor="middle" font-family="Georgia,serif" font-size="28" font-weight="700" fill="#e8eef2">${escapeHtml(display)}</text>`
            + (id ? `<text x="50%" y="${h - 28}" text-anchor="middle" font-size="12" fill="#e8eef2" fill-opacity="0.55">${escapeHtml(id)}</text>` : '')
            + `</svg>`;
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    function resolveUrl(asset) {
        if (typeof asset.replaceWith === 'string' && asset.replaceWith.trim()) {
            return asset.replaceWith.trim();
        }
        const usePhp = new URLSearchParams(location.search).get('phSource') === 'php';
        if (usePhp) {
            const prompt = resolvePrompt(asset);
            const qs = new URLSearchParams({
                title: asset.title || asset.id,
                prompt,
                w: String(asset.w || 640),
                h: String(asset.h || 360),
                id: asset.id || ''
            });
            return `placeholders/image.php?${qs.toString()}`;
        }
        return buildSvgDataUrl(asset);
    }

    function inject(catalog) {
        const byId = new Map((catalog.assets || []).map((a) => [a.id, a]));
        Object.entries(UNIT_ASSETS).forEach(([unit, assetId]) => {
            const tile = document.querySelector(`.unit-tile--${unit}`);
            if (!tile || tile.querySelector('.unit-tile__media')) return;
            const asset = byId.get(assetId);
            if (!asset) return;
            const prompt = resolvePrompt(asset);
            const url = resolveUrl(asset);
            const wrap = document.createElement('div');
            wrap.className = 'unit-tile__media-wrap';
            wrap.innerHTML =
                `<img class="unit-tile__media media-ph media-ph--image"`
                + ` src="${escapeHtml(url)}"`
                + ` alt="${escapeHtml(asset.title || assetId)}"`
                + ` width="${Number(asset.w) || 640}" height="${Number(asset.h) || 360}"`
                + ` data-asset-id="${escapeHtml(assetId)}"`
                + ` data-asset-title="${escapeHtml(asset.title || '')}"`
                + ` data-asset-prompt="${escapeHtml(prompt)}"`
                + ` data-media-kind="image" loading="lazy" decoding="async">`;
            tile.insertBefore(wrap, tile.firstChild);
        });
    }

    if (!enabled()) return;
    fetch(CATALOG_URL)
        .then((r) => (r.ok ? r.json() : { assets: [] }))
        .then(inject)
        .catch(() => { /* silent */ });
})();
