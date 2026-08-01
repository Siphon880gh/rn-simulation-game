/**
 * Declarative image/video placeholders — config-gated mounts at landing,
 * situation stills, critical labs, and busy task slots.
 *
 * Catalog: media-placeholder-catalog.json
 * PHP service (optional): /placeholders/image.php|video.php + partials/media-tag.php
 * Static servers: source=data-url draws the same titled SVG client-side.
 */
import { GameConfig } from './game-config.js';
import gameState from './game-state.js';

let catalogCache = null;
let catalogPromise = null;

function cfg() {
    return GameConfig.mediaPlaceholders || {};
}

function isEnabled() {
    if (cfg().enabled === false) return false;
    if (typeof location !== 'undefined') {
        const q = new URLSearchParams(location.search).get('placeholders');
        if (q === '0' || q === 'false') return false;
    }
    try {
        if (typeof localStorage !== 'undefined'
            && localStorage.getItem('rngame.mediaPlaceholders') === '0') {
            return false;
        }
    } catch {
        /* ignore */
    }
    return true;
}

export function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Shared style line appended to every creation prompt (config overrideable). */
export function promptStyleAppendix() {
    const fromCfg = cfg().promptStyleAppendix;
    if (typeof fromCfg === 'string' && fromCfg.trim()) return fromCfg.trim();
    return (
        'Style (fun medical simulation): approachable educational game art for an RN shift sim — '
        + 'clear readable shapes, lightly playful personality without cartoon stickers, horror, or gore; '
        + 'bright but clinical hospital palette; panels-first UI friendly; fictional patients/signage only '
        + '(no real faces, no PHI); readable at small sizes; include any requested title as subtle in-frame caption.'
    );
}

/** Append style once (idempotent if already present). */
export function withPromptStyle(basePrompt) {
    const base = String(basePrompt || '').trim();
    const style = promptStyleAppendix();
    if (!style) return base;
    if (!base) return style;
    if (base.includes('Style (fun medical simulation)')) return base;
    return `${base} ${style}`;
}

/** Append dimensions once from asset.w / asset.h (defaults 640×360). */
export function withPromptDimensions(basePrompt, asset = {}) {
    const w = Math.max(1, Number(asset?.w) || 640);
    const h = Math.max(1, Number(asset?.h) || 360);
    const kind = asset?.kind === 'video' ? 'video' : 'image';
    const dimLine = kind === 'video'
        ? `Dimensions: ${w}×${h}px — produce the video framed for this size (export usable at ${w}×${h}; short silent loop).`
        : `Dimensions: ${w}×${h}px — produce the still at these pixel dimensions (2× retina optional).`;
    const base = String(basePrompt || '').trim();
    if (!base) return dimLine;
    if (/\bDimensions:\s*\d+×\d+px\b/.test(base) || /\bDimensions:\s*\d+x\d+px\b/i.test(base)) {
        return base;
    }
    return `${base} ${dimLine}`;
}

/**
 * Full copy-paste creation prompt: subject + dimensions + shared style.
 */
export function resolvePrompt(asset) {
    const title = asset?.title || 'Untitled';
    const kind = asset?.kind === 'video' ? 'video' : 'image';
    let body;
    if (asset?.prompt && String(asset.prompt).trim()) {
        body = String(asset.prompt).trim();
    } else {
        const kindLabel = kind === 'video' ? 'short looping video clip' : 'still image';
        body = (
            `Create a ${kindLabel} for an RN hospital shift simulation UI. `
            + `Subject title: ${title}. `
            + `Include the title text "${title}" as a subtle caption or signage in-frame.`
        );
    }
    return withPromptStyle(withPromptDimensions(body, { ...asset, kind }));
}

/** Client-side SVG matching placeholders/lib/render.php (scales text for small thumbs). */
export function buildPlaceholderSvg(asset, overrides = {}) {
    const kind = (overrides.kind || asset?.kind) === 'video' ? 'video' : 'image';
    const title = String(overrides.title || asset?.title || 'Untitled');
    const w = Number(overrides.w || asset?.w) || 640;
    const h = Number(overrides.h || asset?.h) || 360;
    const id = String(overrides.id || asset?.id || '');
    const bg = kind === 'video' ? '#1a2332' : '#2c3e50';
    const fg = '#e8eef2';
    const accent = kind === 'video' ? '#3d8bfd' : '#0d6e6e';
    const badge = kind === 'video' ? 'VIDEO' : 'IMAGE';
    const compact = w <= 220 || h <= 160;
    const pad = compact ? 6 : 12;
    const badgeSize = compact ? Math.max(8, Math.round(h * 0.1)) : 13;
    const titleSize = compact ? Math.max(11, Math.round(Math.min(w, h) * 0.16)) : 28;
    const idSize = compact ? Math.max(7, Math.round(h * 0.08)) : 12;
    const maxChars = compact ? Math.max(8, Math.floor(w / (titleSize * 0.55))) : 42;
    let display = title;
    if (display.length > maxChars) display = `${display.slice(0, Math.max(1, maxChars - 1))}…`;
    const titleY = kind === 'video'
        ? Math.round(h * (compact ? 0.78 : 0.72))
        : Math.round(h * (compact ? 0.58 : 0.52));
    const innerW = Math.max(0, w - pad * 2);
    const innerH = Math.max(0, h - pad * 2);
    let play = '';
    if (kind === 'video') {
        const cx = Math.round(w * 0.5);
        const cy = Math.round(h * (compact ? 0.38 : 0.42));
        const r = compact ? Math.max(10, Math.round(Math.min(w, h) * 0.18)) : 36;
        const tri = Math.max(6, Math.round(r * 0.45));
        play = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${accent}" fill-opacity="0.85"/>`
            + `<polygon points="${cx - tri * 0.55},${cy - tri} ${cx - tri * 0.55},${cy + tri} ${cx + tri},${cy}" fill="${fg}"/>`;
    }
    const idLine = id
        ? `<text x="50%" y="${h - Math.max(8, Math.round(pad * 1.4))}" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="${idSize}" fill="${fg}" fill-opacity="0.55">${escapeHtml(compact && id.length > 14 ? `${id.slice(0, 12)}…` : id)}</text>`
        : '';
    const badgeY = pad + badgeSize;
    return (
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeHtml(title)}">`
        + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
        + `<stop offset="0%" stop-color="${bg}"/>`
        + `<stop offset="100%" stop-color="${accent}" stop-opacity="0.55"/>`
        + `</linearGradient></defs>`
        + `<rect width="100%" height="100%" fill="url(#g)"/>`
        + `<rect x="${pad}" y="${pad}" width="${innerW}" height="${innerH}" rx="${compact ? 4 : 8}" fill="none" stroke="${fg}" stroke-opacity="0.25" stroke-width="${compact ? 1 : 2}"/>`
        + `<text x="${pad + 4}" y="${badgeY}" font-family="ui-sans-serif,system-ui,sans-serif" font-size="${badgeSize}" font-weight="700" letter-spacing="0.06em" fill="${accent}">${badge}</text>`
        + play
        + `<text x="50%" y="${titleY}" text-anchor="middle" font-family="Georgia,ui-serif,serif" font-size="${titleSize}" font-weight="700" fill="${fg}">${escapeHtml(display)}</text>`
        + idLine
        + `</svg>`
    );
}

export function svgDataUrl(svg) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function phpBase() {
    const base = cfg().phpBase || '/placeholders';
    return String(base).replace(/\/$/, '');
}

/**
 * Resolve display URL for an asset (replaceWith → php → data-url).
 */
export function resolveAssetUrl(asset, overrides = {}) {
    if (!asset) return null;
    const replace = overrides.replaceWith ?? asset.replaceWith;
    if (typeof replace === 'string' && replace.trim()) {
        return replace.trim();
    }
    const kind = (overrides.kind || asset.kind) === 'video' ? 'video' : 'image';
    const title = String(overrides.title || asset.title || 'Untitled');
    const prompt = resolvePrompt({ ...asset, ...overrides, title, kind });
    const w = Number(overrides.w || asset.w) || 640;
    const h = Number(overrides.h || asset.h) || 360;
    const id = String(overrides.id || asset.id || '');
    const source = cfg().source || 'data-url';

    if (source === 'php') {
        const endpoint = kind === 'video' ? 'video.php' : 'image.php';
        const qs = new URLSearchParams({
            title,
            prompt,
            w: String(w),
            h: String(h),
            id
        });
        return `${phpBase()}/${endpoint}?${qs.toString()}`;
    }

    return svgDataUrl(buildPlaceholderSvg(asset, { ...overrides, title, kind, w, h, id }));
}

export async function loadCatalog() {
    if (catalogCache) return catalogCache;
    if (catalogPromise) return catalogPromise;
    const url = cfg().catalogUrl || 'assets/js/media-placeholder-catalog.json';
    catalogPromise = fetch(url)
        .then((r) => (r.ok ? r.json() : { assets: [] }))
        .then((data) => {
            const fromCfg = cfg().assets;
            const list = Array.isArray(data?.assets) ? data.assets : [];
            const byId = new Map(list.map((a) => [a.id, { ...a }]));
            if (fromCfg && typeof fromCfg === 'object') {
                Object.entries(fromCfg).forEach(([id, patch]) => {
                    const prev = byId.get(id) || { id };
                    byId.set(id, { ...prev, ...patch, id });
                });
            }
            catalogCache = { version: data?.version || 1, assets: [...byId.values()] };
            return catalogCache;
        })
        .catch(() => {
            catalogCache = { version: 0, assets: [] };
            return catalogCache;
        });
    return catalogPromise;
}

export function getAssetById(id, catalog) {
    if (!id || !catalog?.assets) return null;
    return catalog.assets.find((a) => a.id === id) || null;
}

export function getAssetByMount(mount, catalog) {
    if (!mount || !catalog?.assets) return null;
    return catalog.assets.find((a) => a.mount === mount) || null;
}

/** Mute / unmute control for autoplay hero clips (starts muted for autoplay policy). */
export function videoAudioToggleHtml({ muted = true } = {}) {
    const isMuted = muted !== false;
    return (
        `<button type="button" class="media-ph-audio-toggle${isMuted ? ' is-muted' : ''}"`
        + ` data-media-audio-toggle`
        + ` aria-pressed="${isMuted ? 'false' : 'true'}"`
        + ` aria-label="${isMuted ? 'Unmute video' : 'Mute video'}"`
        + ` title="${isMuted ? 'Unmute' : 'Mute'}">`
        + `<i class="fas fa-volume-up${isMuted ? ' hidden' : ''}" data-audio-icon="on" aria-hidden="true"></i>`
        + `<i class="fas fa-volume-mute${isMuted ? '' : ' hidden'}" data-audio-icon="off" aria-hidden="true"></i>`
        + `</button>`
    );
}

function syncMediaAudioToggleUi(btn, muted) {
    if (!btn) return;
    const isMuted = !!muted;
    btn.classList.toggle('is-muted', isMuted);
    btn.setAttribute('aria-pressed', isMuted ? 'false' : 'true');
    btn.setAttribute('aria-label', isMuted ? 'Unmute video' : 'Mute video');
    btn.title = isMuted ? 'Unmute' : 'Mute';
    const iconOn = btn.querySelector('[data-audio-icon="on"]');
    const iconOff = btn.querySelector('[data-audio-icon="off"]');
    if (iconOn) iconOn.classList.toggle('hidden', isMuted);
    if (iconOff) iconOff.classList.toggle('hidden', !isMuted);
}

let mediaAudioToggleWired = false;

/** Document-level click wiring for [data-media-audio-toggle] (safe to call often). */
export function wireMediaAudioToggles() {
    if (mediaAudioToggleWired || typeof document === 'undefined') return;
    mediaAudioToggleWired = true;
    document.addEventListener('click', (event) => {
        const btn = event.target?.closest?.('[data-media-audio-toggle]');
        if (!btn) return;
        event.preventDefault();
        event.stopPropagation();
        const host = btn.closest('.challenge-media-wrap, .media-ph-video-host') || btn.parentElement;
        const video = host?.querySelector?.('video');
        if (!video) return;
        video.muted = !video.muted;
        if (!video.muted) {
            video.play?.().catch(() => {});
        }
        syncMediaAudioToggleUi(btn, video.muted);
    });
}

/**
 * Build media element HTML string (mirrors PHP ph_media_tag).
 */
export function buildMediaTagHtml(asset, extras = {}) {
    if (!asset) return '';
    const kind = asset.kind === 'video' ? 'video' : 'image';
    const title = asset.title || asset.id || 'Untitled';
    const prompt = resolvePrompt(asset);
    const url = resolveAssetUrl(asset);
    const w = Number(asset.w) || 640;
    const h = Number(asset.h) || 360;
    const cls = extras.className || (kind === 'video' ? 'media-ph media-ph--video' : 'media-ph media-ph--image');
    const common =
        ` class="${escapeHtml(cls)}"`
        + ` data-asset-id="${escapeHtml(asset.id || '')}"`
        + ` data-asset-title="${escapeHtml(title)}"`
        + ` data-asset-prompt="${escapeHtml(prompt)}"`
        + ` data-media-kind="${kind}"`
        + ` width="${w}" height="${h}"`;

    if (kind === 'video') {
        const replace = asset.replaceWith;
        const isFile = typeof replace === 'string' && /\.(mp4|webm|ogg)(\?|$)/i.test(replace);
        if (isFile) {
            // Real clip: autoplay+loop (muted) for in-modal heroes. Do not use the
            // .mp4 path as poster — browsers need an image URL, so an mp4 poster
            // paints black while preload=none never fetches a frame.
            return `<video${common} src="${escapeHtml(replace)}" muted autoplay loop playsinline preload="auto" aria-label="${escapeHtml(title)}"></video>`;
        }
        return `<video${common} poster="${escapeHtml(url)}" muted playsinline preload="none" aria-label="${escapeHtml(title)}"></video>`;
    }
    return `<img${common} src="${escapeHtml(url)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async">`;
}

/** Apply situation still URLs from placeholders when scene config leaves them null. */
export function applySituationPlaceholderUrls(catalog) {
    if (!isEnabled() || !cfg().mounts?.situations) return;
    const scene = GameConfig.scene || (GameConfig.scene = {});
    const stills = scene.situationStills || (scene.situationStills = {});
    const map = {
        'code-blue': 'situation-code-blue',
        'bed-prep': 'situation-bed-prep',
        'critical-lab': 'situation-critical-lab'
    };
    Object.entries(map).forEach(([key, assetId]) => {
        if (stills[key]) return;
        const asset = getAssetById(assetId, catalog);
        if (!asset) return;
        stills[key] = resolveAssetUrl(asset);
    });
}

function injectLandingTiles(catalog) {
    if (!cfg().mounts?.landingDepartments) return;
    const map = {
        tele: 'dept-tele',
        medsurg: 'dept-medsurg',
        icu: 'dept-icu'
    };
    Object.entries(map).forEach(([unit, assetId]) => {
        const tile = document.querySelector(`.unit-tile--${unit}`);
        if (!tile || tile.querySelector('.unit-tile__media')) return;
        const asset = getAssetById(assetId, catalog);
        if (!asset) return;
        const wrap = document.createElement('div');
        wrap.className = 'unit-tile__media-wrap';
        wrap.innerHTML = buildMediaTagHtml(asset, { className: 'unit-tile__media media-ph media-ph--image' });
        tile.insertBefore(wrap, tile.firstChild);
    });
}

/** Show critical-lab still in toast / status host when a lab call spawns. */
export function showCriticalLabMedia(opts = {}) {
    if (!isEnabled() || !cfg().mounts?.criticalLab) return;
    const run = (catalog) => {
        const hostSel = cfg().criticalLabHost || '#shell-critical-lab-media';
        let host = document.querySelector(hostSel);
        if (!host) {
            host = document.createElement('div');
            host.id = 'shell-critical-lab-media';
            host.className = 'shell-critical-lab-media';
            host.setAttribute('role', 'status');
            const chrome = document.querySelector('#shell-status-bar')
                || document.querySelector('#shell-main')
                || document.body;
            chrome.appendChild(host);
        }
        const asset = getAssetById('situation-critical-lab', catalog);
        if (!asset) return;
        const label = opts.labShort ? `Critical lab — ${opts.labShort}` : asset.title;
        host.hidden = false;
        host.innerHTML =
            buildMediaTagHtml({ ...asset, title: label }, { className: 'shell-critical-lab-media__img media-ph' })
            + `<span class="shell-critical-lab-media__caption">${escapeHtml(label)}</span>`;
        if (opts.autoHideMs !== 0) {
            const ms = Number(opts.autoHideMs) || Number(cfg().criticalLabAutoHideMs) || 12000;
            clearTimeout(showCriticalLabMedia._t);
            showCriticalLabMedia._t = setTimeout(() => {
                host.hidden = true;
            }, ms);
        }
    };
    if (catalogCache) {
        run(catalogCache);
        return;
    }
    loadCatalog().then(run).catch(() => {});
}

/**
 * Resolve busy-slot catalog id:
 * metadata.kind → slotByTaskKind, else task.type → slotByTaskType, else fallback.
 * Typed thumbs are always stills; slotPreferVideo only applies to the fallback.
 */
export function resolveSlotAssetId(task) {
    const kind = String(task?.kind || task?.metadata?.kind || '').toLowerCase().trim();
    const kindMap = cfg().slotByTaskKind || {};
    const kindId = kind && typeof kindMap[kind] === 'string' ? kindMap[kind].trim() : '';
    if (kindId) return kindId;

    const type = String(task?.type || '').toLowerCase().trim();
    const map = cfg().slotByTaskType || {};
    const typedId = type && typeof map[type] === 'string' ? map[type].trim() : '';
    if (typedId) return typedId;
    const fallback = (typeof cfg().slotFallbackId === 'string' && cfg().slotFallbackId.trim())
        ? cfg().slotFallbackId.trim()
        : 'slot-perform';
    if (cfg().slotPreferVideo === true) return 'slot-perform-video';
    return fallback;
}

export function slotMediaHtml(task, catalog) {
    if (!isEnabled() || !cfg().mounts?.slots || !task) return '';
    const assetId = resolveSlotAssetId(task);
    const fallbackId = (typeof cfg().slotFallbackId === 'string' && cfg().slotFallbackId.trim())
        ? cfg().slotFallbackId.trim()
        : 'slot-perform';
    let asset = getAssetById(assetId, catalog);
    if (!asset && assetId !== fallbackId) asset = getAssetById(fallbackId, catalog);
    if (!asset) asset = getAssetById('slot-perform', catalog);
    if (!asset) return '';

    // Thumb: compact SVG sized for the slot (full title stays readable).
    const thumbAsset = {
        ...asset,
        w: 160,
        h: 120,
        title: asset.title
    };
    const thumbUrl = resolveAssetUrl(thumbAsset);
    const previewUrl = resolveAssetUrl({ ...asset, w: 720, h: 405, title: asset.title });
    const alt = task.patientId
        ? `${asset.title} — ${task.patientId}`
        : (task.taskName || asset.title);
    const prompt = resolvePrompt(asset);
    const kind = asset.kind === 'video' ? 'video' : 'image';

    return (
        `<button type="button" class="task-slot-media-btn"`
        + ` data-media-preview="1"`
        + ` data-preview-src="${escapeHtml(previewUrl)}"`
        + ` data-preview-title="${escapeHtml(asset.title || '')}"`
        + ` data-preview-kind="${kind}"`
        + ` data-asset-id="${escapeHtml(asset.id || '')}"`
        + ` data-asset-prompt="${escapeHtml(prompt)}"`
        + ` title="Preview ${escapeHtml(asset.title || 'media')}"`
        + ` aria-label="Preview ${escapeHtml(alt)}">`
        + `<img class="task-slot-media media-ph media-ph--image"`
        + ` src="${escapeHtml(thumbUrl)}"`
        + ` alt="${escapeHtml(alt)}"`
        + ` width="160" height="120" decoding="async" draggable="false">`
        + `</button>`
    );
}

let previewEscBound = false;

function ensureMediaPreviewHost() {
    let host = document.getElementById('media-placeholder-preview');
    if (host) return host;
    host = document.createElement('div');
    host.id = 'media-placeholder-preview';
    host.className = 'media-ph-preview';
    host.hidden = true;
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-label', 'Media preview');
    host.innerHTML = `
      <div class="media-ph-preview__backdrop" data-preview-dismiss="1"></div>
      <div class="media-ph-preview__panel" tabindex="-1">
        <header class="media-ph-preview__header">
          <h2 class="media-ph-preview__title"></h2>
          <button type="button" class="media-ph-preview__close" data-preview-dismiss="1" aria-label="Close preview">×</button>
        </header>
        <div class="media-ph-preview__body"></div>
        <p class="media-ph-preview__hint">Click outside or press Esc to dismiss</p>
      </div>
    `;
    document.body.appendChild(host);
    host.addEventListener('click', (e) => {
        if (e.target.closest('[data-preview-dismiss]')) {
            closeMediaPreview();
        }
    });
    return host;
}

export function closeMediaPreview() {
    const host = document.getElementById('media-placeholder-preview');
    if (!host) return;
    host.classList.remove('is-open');
    const finish = () => {
        host.hidden = true;
        const body = host.querySelector('.media-ph-preview__body');
        if (body) body.innerHTML = '';
    };
    window.setTimeout(finish, 280);
}

export function openMediaPreview({ src, title = '', kind = 'image' } = {}) {
    if (!src || typeof document === 'undefined') return;
    const host = ensureMediaPreviewHost();
    const titleEl = host.querySelector('.media-ph-preview__title');
    const body = host.querySelector('.media-ph-preview__body');
    const panel = host.querySelector('.media-ph-preview__panel');
    if (titleEl) titleEl.textContent = title || 'Preview';
    if (body) {
        if (kind === 'video' && /\.(mp4|webm|ogg)(\?|$)/i.test(src)) {
            body.innerHTML = `<video class="media-ph-preview__media" src="${escapeHtml(src)}" controls playsinline></video>`;
        } else {
            body.innerHTML = `<img class="media-ph-preview__media" src="${escapeHtml(src)}" alt="${escapeHtml(title || 'Preview')}">`;
        }
    }
    host.hidden = false;
    requestAnimationFrame(() => {
        host.classList.add('is-open');
        panel?.focus?.();
    });
    if (!previewEscBound) {
        previewEscBound = true;
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMediaPreview();
        });
    }
}

/** Delegate clicks from slot thumbs (and other [data-media-preview] controls). */
export function wireMediaPreviewClicks(root = document) {
    if (!root || root.dataset.mediaPreviewWired === '1') return;
    root.dataset.mediaPreviewWired = '1';
    root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-media-preview]');
        if (!btn || !root.contains(btn)) return;
        e.preventDefault();
        e.stopPropagation();
        openMediaPreview({
            src: btn.getAttribute('data-preview-src') || btn.querySelector('img')?.src,
            title: btn.getAttribute('data-preview-title') || '',
            kind: btn.getAttribute('data-preview-kind') || 'image'
        });
    });
}

function syntheticAsset(id, kind, title) {
    const patch = cfg().assets?.[id] || {};
    return {
        id,
        kind: kind === 'video' ? 'video' : 'image',
        title: title || id,
        w: kind === 'video' ? 720 : 720,
        h: 320,
        prompt: '',
        replaceWith: null,
        ...patch
    };
}

/** Map data-challenge / session key → mediaPlaceholders.challenges key. */
export function resolveChallengeMediaKey(rawKey) {
    const raw = String(rawKey || '').toLowerCase();
    if (!raw) return '';
    const aliases = cfg().challengeMediaAliases || {};
    if (aliases[raw]) return String(aliases[raw]).toLowerCase();
    if (cfg().challenges?.[raw]) return raw;
    return raw;
}

function resolveChallengeBeforeAsset(key, catalog) {
    const spec = cfg().challenges?.[key];
    if (!spec) return null;
    const preferVideo = spec.preferVideo === true;
    let asset = null;
    if (preferVideo && spec.videoId) {
        asset = getAssetById(spec.videoId, catalog)
            || syntheticAsset(spec.videoId, 'video', key);
    }
    if (!asset && spec.imageId) {
        asset = getAssetById(spec.imageId, catalog)
            || syntheticAsset(spec.imageId, 'image', key);
    }
    if (!asset && spec.videoId) {
        asset = getAssetById(spec.videoId, catalog)
            || syntheticAsset(spec.videoId, 'video', key);
    }
    if (
        preferVideo
        && asset?.kind === 'video'
        && !asset.replaceWith
        && spec.imageId
    ) {
        const still = getAssetById(spec.imageId, catalog);
        if (still?.replaceWith) asset = still;
    }
    return asset;
}

/**
 * In-modal hero for a perform challenge/quiz (before / during the quiz).
 * @param {string} challengeKey e.g. 'code-blue', 'bed-prep'
 * @param {{ catalog?: object, className?: string }} [opts]
 */
export function challengeMediaHtml(challengeKey, opts = {}) {
    if (!isEnabled() || !cfg().mounts?.challenges) return '';
    const key = resolveChallengeMediaKey(challengeKey);
    if (!key) return '';
    const catalog = opts.catalog || catalogCache;
    const asset = resolveChallengeBeforeAsset(key, catalog);
    if (!asset) return '';

    const cls = opts.className
        || `challenge-media media-ph challenge-media--${key} challenge-media--before`;
    const tag = buildMediaTagHtml(asset, { className: cls });
    if (!tag) return '';
    const audioToggle = tag.startsWith('<video') ? videoAudioToggleHtml({ muted: true }) : '';
    wireMediaAudioToggles();
    return (
        `<div class="challenge-media-wrap challenge-media-wrap--before"`
        + ` data-challenge-media="${escapeHtml(key)}"`
        + ` data-challenge-media-phase="before">`
        + `<span class="challenge-media-phase-label" aria-hidden="true">Before</span>`
        + tag
        + audioToggle
        + `</div>`
    );
}

/**
 * Swap in-modal hero to the after still once the full challenge is passed
 * (after last question / level target; before Continue closes the modal).
 * @param {string} [challengeKey] — defaults from `.challenge-gate[data-challenge]`
 * @returns {boolean} true if after media was shown
 */
export function revealChallengeAfterMedia(challengeKey) {
    if (!isEnabled() || !cfg().mounts?.challenges || typeof document === 'undefined') {
        return false;
    }
    const gate = document.querySelector('.challenge-gate');
    const fromDom = challengeKey
        || gate?.getAttribute('data-challenge')
        || gate?.querySelector('[data-challenge-media]')?.getAttribute('data-challenge-media');
    const key = resolveChallengeMediaKey(fromDom);
    if (!key) return false;
    const spec = cfg().challenges?.[key];
    const afterId = spec?.afterImageId;
    if (!afterId) return false;

    const catalog = catalogCache;
    const asset = getAssetById(afterId, catalog)
        || syntheticAsset(afterId, 'image', `${key} after`);
    const tag = buildMediaTagHtml(asset, {
        className: `challenge-media media-ph challenge-media--${key} challenge-media--after`
    });
    if (!tag) return false;

    let wrap = document.querySelector('.challenge-media-wrap[data-challenge-media]');
    if (!wrap && gate) {
        wrap = document.createElement('div');
        gate.insertBefore(wrap, gate.firstChild);
    }
    if (!wrap) return false;

    wrap.className = 'challenge-media-wrap challenge-media-wrap--after is-revealed';
    wrap.setAttribute('data-challenge-media', key);
    wrap.setAttribute('data-challenge-media-phase', 'after');
    const audioToggle = tag.startsWith('<video') ? videoAudioToggleHtml({ muted: true }) : '';
    wrap.innerHTML =
        `<span class="challenge-media-phase-label" aria-hidden="true">After</span>${tag}${audioToggle}`;
    wireMediaAudioToggles();
    return true;
}

async function bootGameMounts() {
    if (!isEnabled()) return;
    wireMediaAudioToggles();
    const catalog = await loadCatalog();
    applySituationPlaceholderUrls(catalog);
    // Re-apply unit scene if stills/backgrounds changed
    try {
        const { applyUnitScene } = await import('./scene-backdrop.js');
        applyUnitScene();
    } catch {
        /* scene optional at import time */
    }
}

const MediaPlaceholdersModule = {
    loadCatalog,
    resolveAssetUrl,
    resolvePrompt,
    withPromptDimensions,
    withPromptStyle,
    promptStyleAppendix,
    buildMediaTagHtml,
    buildPlaceholderSvg,
    videoAudioToggleHtml,
    wireMediaAudioToggles,
    showCriticalLabMedia,
    resolveSlotAssetId,
    slotMediaHtml,
    challengeMediaHtml,
    revealChallengeAfterMedia,
    resolveChallengeMediaKey,
    openMediaPreview,
    closeMediaPreview,
    wireMediaPreviewClicks,
    getAssetById,
    getAssetByMount,
    applySituationPlaceholderUrls,
    async init() {
        if (!isEnabled()) return;
        wireMediaAudioToggles();
        const catalog = await loadCatalog();
        applySituationPlaceholderUrls(catalog);
        if (typeof document !== 'undefined' && document.querySelector('.unit-tile')) {
            injectLandingTiles(catalog);
        }
        gameState.subscribe('scenarioPack', () => {
            applySituationPlaceholderUrls(catalogCache);
        });
    },
    /** Landing page (non-module script can call via dynamic import or duplicate). */
    async initLanding() {
        if (!isEnabled()) return;
        const catalog = await loadCatalog();
        injectLandingTiles(catalog);
    }
};

export { bootGameMounts };
export default MediaPlaceholdersModule;
