/**
 * Department picker — census / admission start options before entering the game.
 * Modes: full | minus1 | admitStart | admitMiddle
 */
(function () {
    const dialog = document.getElementById('census-choice-dialog');
    const titleEl = document.getElementById('census-choice-title');
    const blurbEl = document.getElementById('census-choice-blurb');
    const btnCancel = document.getElementById('census-choice-cancel');
    const modeButtons = dialog
        ? dialog.querySelectorAll('[data-census]')
        : [];

    if (!dialog || !modeButtons.length) return;

    let pendingHref = '';

    function openChoice(tile) {
        const dept = tile.querySelector('.unit-tile__dept')?.textContent?.trim() || 'Unit';
        const base = Number(tile.getAttribute('data-census-full')) || 0;
        const startN = Math.max(0, base - 1);
        pendingHref = tile.getAttribute('data-href') || '';
        if (titleEl) titleEl.textContent = `${dept} assignment`;
        if (blurbEl) {
            blurbEl.textContent = base
                ? `Full census is ${base}. Lighter starts use ${startN} patient${startN === 1 ? '' : 's'} until (or unless) an admission arrives.`
                : 'Choose full census, a lighter start with no admit, or when a new admission should arrive.';
        }
        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else {
            dialog.setAttribute('open', '');
        }
    }

    function closeChoice() {
        pendingHref = '';
        if (typeof dialog.close === 'function') {
            dialog.close();
        } else {
            dialog.removeAttribute('open');
        }
    }

    function navigateWithCensus(mode) {
        if (!pendingHref) return;
        try {
            const url = new URL(pendingHref, window.location.href);
            if (!mode || mode === 'full') {
                url.searchParams.delete('census');
            } else {
                url.searchParams.set('census', mode);
            }
            window.location.href = url.pathname + url.search + url.hash;
        } catch {
            if (!mode || mode === 'full') {
                window.location.href = pendingHref;
                return;
            }
            const join = pendingHref.includes('?') ? '&' : '?';
            window.location.href = `${pendingHref}${join}census=${encodeURIComponent(mode)}`;
        }
    }

    document.querySelectorAll('.unit-tile[data-href]').forEach((tile) => {
        tile.addEventListener('click', (e) => {
            e.preventDefault();
            openChoice(tile);
        });
        tile.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openChoice(tile);
            }
        });
    });

    modeButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            navigateWithCensus(btn.getAttribute('data-census') || 'full');
        });
    });

    btnCancel?.addEventListener('click', () => closeChoice());
    dialog.addEventListener('cancel', () => {
        pendingHref = '';
    });
})();
