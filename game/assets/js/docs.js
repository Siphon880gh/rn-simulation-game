/**
 * Docs / Help FAB — opens authored .md via shared markdown-it renderer.
 */
import {
    renderMarkdown,
    enhanceMarkdownDom
} from './markdown-renderer.js';
import { createLinkPopover } from './link-popover.js';

const docsStructure = {
    devs: {
        displayName: 'Developers',
        icon: 'code',
        color: 'text-purple-500',
        files: [
            'MEDICATION_WINDOW_MECHANICS.md',
            'README_UTILS.md',
            'REFACTORING_SUMMARY.md'
        ]
    },
    players: {
        displayName: 'Players',
        icon: 'users',
        color: 'text-green-500',
        files: [
            'ABOUT.md'
        ]
    },
    learning: {
        displayName: 'Learning',
        icon: 'book',
        color: 'text-amber-500',
        files: [
            'PRIORITIZATION_BASICS.md',
            'SEPSIS_GUIDELINES.md'
        ]
    }
};

const noteCatalog = buildNoteCatalog(docsStructure);
let expandedCategories = new Set(['players', 'learning']);
let linkPopover = null;

function buildNoteCatalog(structure) {
    const byKey = new Map();

    function add(entry) {
        const keys = [
            entry.filename,
            entry.filename.replace(/\.md$/i, ''),
            entry.title,
            entry.title.toLowerCase(),
            entry.filename.replace(/\.md$/i, '').replace(/_/g, ' '),
            entry.filename.replace(/\.md$/i, '').replace(/_/g, ' ').toLowerCase()
        ];
        keys.forEach((key) => {
            if (key) byKey.set(String(key), entry);
        });
    }

    Object.keys(structure).forEach((category) => {
        structure[category].files.forEach((filename) => {
            const title = formatDisplayName(filename);
            add({
                category,
                filename,
                title,
                path: `../docs/${category}/${filename}`
            });
        });
    });

    return byKey;
}

function resolveNote(titleOrPath) {
    if (!titleOrPath) return null;
    const raw = String(titleOrPath).trim();
    const decoded = decodeURIComponent(raw);
    const noHash = decoded.split('#')[0];

    if (noteCatalog.has(noHash)) return toResolved(noteCatalog.get(noHash));
    if (noteCatalog.has(noHash.toLowerCase())) return toResolved(noteCatalog.get(noHash.toLowerCase()));

    const basename = noHash.split('/').pop();
    if (basename && noteCatalog.has(basename)) return toResolved(noteCatalog.get(basename));
    if (basename && noteCatalog.has(basename.replace(/\.md$/i, ''))) {
        return toResolved(noteCatalog.get(basename.replace(/\.md$/i, '')));
    }

    return null;
}

function toResolved(entry) {
    return {
        href: `#doc=${encodeURIComponent(entry.category + '/' + entry.filename)}`,
        category: entry.category,
        filename: entry.filename,
        title: entry.title,
        path: entry.path
    };
}

function resolveFromHref(href) {
    if (!href) return null;
    const clean = href.replace(/^\.\.\//, '').replace(/^docs\//, '');
    return resolveNote(clean) || resolveNote(href);
}

function formatDisplayName(filename) {
    return filename
        .replace(/\.md$/i, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
}

function ensureViewer() {
    let viewer = document.getElementById('docs-viewer');
    if (viewer) return viewer;

    viewer = document.createElement('div');
    viewer.id = 'docs-viewer';
    viewer.className = 'hidden';
    viewer.innerHTML = `
        <div class="docs-viewer__panel" role="dialog" aria-modal="true" aria-labelledby="docs-viewer-title">
            <div class="docs-viewer__header">
                <div class="flex items-center gap-3 min-w-0">
                    <span id="docs-viewer-category" class="px-3 py-1 rounded-full text-xs font-medium bg-gray-100"></span>
                    <h2 id="docs-viewer-title" class="text-xl font-bold text-gray-900 truncate"></h2>
                </div>
                <button type="button" id="docs-viewer-close"
                        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                    Close
                </button>
            </div>
            <div id="docs-viewer-body" class="docs-viewer__body markdown-content"></div>
        </div>
    `;
    document.body.appendChild(viewer);

    viewer.querySelector('#docs-viewer-close').addEventListener('click', closeViewer);
    viewer.addEventListener('click', (event) => {
        if (event.target === viewer) closeViewer();
    });

    return viewer;
}

function closeViewer() {
    const viewer = document.getElementById('docs-viewer');
    if (viewer) viewer.classList.add('hidden');
    if (linkPopover) linkPopover.hide();
}

async function fetchNoteMarkdown({ category, filename, note }) {
    let entry = null;
    if (category && filename) {
        entry = noteCatalog.get(filename) || { category, filename, path: `../docs/${category}/${filename}` };
    } else {
        entry = resolveNote(note);
    }
    if (!entry || !entry.path && !(entry.category && entry.filename)) {
        throw new Error('Note not found');
    }
    const path = entry.path || `../docs/${entry.category}/${entry.filename}`;
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to fetch ${path}`);
    return response.text();
}

async function openMarkdownDocument(categoryKey, filename, options = {}) {
    const categoryInfo = docsStructure[categoryKey];
    if (!categoryInfo) {
        alert(`Unknown docs category: ${categoryKey}`);
        return;
    }

    try {
        const markdownContent = await fetchNoteMarkdown({ category: categoryKey, filename });
        const htmlContent = renderMarkdown(markdownContent, { resolveNote });
        const viewer = ensureViewer();
        const body = viewer.querySelector('#docs-viewer-body');
        const titleEl = viewer.querySelector('#docs-viewer-title');
        const categoryEl = viewer.querySelector('#docs-viewer-category');

        titleEl.textContent = formatDisplayName(filename);
        categoryEl.textContent = categoryInfo.displayName;
        categoryEl.className = `px-3 py-1 rounded-full text-xs font-medium bg-gray-100 ${categoryInfo.color}`;
        body.innerHTML = htmlContent;
        viewer.classList.remove('hidden');

        if (!linkPopover) {
            linkPopover = createLinkPopover({
                fetchNote: fetchNoteMarkdown,
                openNote: (anchor, opts = {}) => {
                    const cat = anchor.getAttribute('data-md-category');
                    const file = anchor.getAttribute('data-md-filename');
                    if (cat && file) {
                        openMarkdownDocument(cat, file, opts);
                    }
                }
            });
        }

        await enhanceMarkdownDom(body, {
            resolveFromHref,
            linkPopover,
            onInternalLinkClick: (anchor) => {
                const cat = anchor.getAttribute('data-md-category');
                const file = anchor.getAttribute('data-md-filename');
                if (cat && file) {
                    openMarkdownDocument(cat, file);
                }
            }
        });

        if (options.hash) {
            const target = body.querySelector(`#${CSS.escape(options.hash)}`);
            if (target) target.scrollIntoView({ block: 'start' });
        }
    } catch (error) {
        console.error('Error loading markdown file:', error);
        alert(`Error loading ${filename}. Please check if the file exists in the ${categoryKey} folder.`);
    }
}

function getCategoryIcon(iconType) {
    const icons = {
        code: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lucide text-purple-500"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
        users: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lucide text-green-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
        book: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lucide text-amber-500"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`
    };
    return icons[iconType] || icons.code;
}

function getFileIcon(filename) {
    if (filename.toLowerCase().includes('about')) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lucide text-blue-500"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lucide text-gray-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
}

function getChevronPath(iconType) {
    return iconType === 'chevron-down'
        ? '<polyline points="6 9 12 15 18 9"></polyline>'
        : '<polyline points="9 18 15 12 9 6"></polyline>';
}

function createCategoryItem(categoryKey, category, isExpanded) {
    const expandIcon = isExpanded ? 'chevron-down' : 'chevron-right';
    return $(`
        <div class="category-item px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-100"
             data-category="${categoryKey}">
            <div class="flex items-center gap-2 flex-1">
                ${getCategoryIcon(category.icon)}
                <span class="${category.color}">${category.displayName}</span>
                <span class="text-xs text-gray-400">(${category.files.length})</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" class="lucide text-gray-400">
                ${getChevronPath(expandIcon)}
            </svg>
        </div>
    `);
}

function createFileItem(filename, categoryKey) {
    return $(`
        <div class="file-item pl-8 pr-4 py-2 text-sm text-gray-600 hover:bg-blue-50 cursor-pointer flex text-left gap-2 border-l-2 border-transparent hover:border-blue-300"
             data-filename="${filename}" data-category="${categoryKey}">
            ${getFileIcon(filename)}
            <span>${formatDisplayName(filename)}</span>
        </div>
    `);
}

function loadNestedDocsList() {
    const docsList = $('#docs-list');
    docsList.empty();
    Object.keys(docsStructure).forEach((categoryKey) => {
        const category = docsStructure[categoryKey];
        const isExpanded = expandedCategories.has(categoryKey);
        docsList.append(createCategoryItem(categoryKey, category, isExpanded));
        if (isExpanded) {
            category.files.forEach((filename) => {
                docsList.append(createFileItem(filename, categoryKey));
            });
        }
    });
}

function toggleCategory(categoryKey) {
    if (expandedCategories.has(categoryKey)) {
        expandedCategories.delete(categoryKey);
    } else {
        expandedCategories.add(categoryKey);
    }
    loadNestedDocsList();
}

function initializeDocsDropdown() {
    const docsButton = $('#docs-button');
    const docsDropdown = $('#docs-dropdown');

    docsButton.on('click', function (e) {
        e.stopPropagation();
        docsDropdown.toggleClass('hidden');
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('#docs-button, #docs-dropdown').length) {
            docsDropdown.addClass('hidden');
        }
    });
}

function setupEventListeners() {
    $(document).on('click', '.category-item', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleCategory($(this).data('category'));
    });

    $(document).on('click', '.file-item', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const filename = $(this).data('filename');
        const categoryKey = $(this).data('category');
        openMarkdownDocument(categoryKey, filename);
        $('#docs-dropdown').addClass('hidden');
    });
}

function openDocFromHash() {
    if (typeof window === 'undefined') return;
    const raw = String(window.location.hash || '').replace(/^#/, '');
    if (!raw.startsWith('doc=')) return;
    const encoded = raw.slice(4);
    let path = '';
    try {
        path = decodeURIComponent(encoded);
    } catch {
        path = encoded;
    }
    const parts = path.split('/');
    if (parts.length < 2) return;
    const category = parts[0];
    const filename = parts.slice(1).join('/');
    if (category && filename) {
        openMarkdownDocument(category, filename);
    }
}

$(document).ready(function () {
    initializeDocsDropdown();
    loadNestedDocsList();
    setupEventListeners();
    ensureViewer();
    openDocFromHash();
    window.addEventListener('hashchange', openDocFromHash);
});

/** Challenge / shell helpers — open a registered learning/player/dev note. */
export function openMarkdownDocumentExport(categoryKey, filename, options = {}) {
    return openMarkdownDocument(categoryKey, filename, options);
}

if (typeof window !== 'undefined') {
    window.docsOpenMarkdown = (categoryKey, filename, options) => {
        openMarkdownDocument(categoryKey, filename, options);
    };
}
