/**
 * Department picker — census / admission start options before entering the game.
 * Modes: full | minus1 | admitStart | admitMiddle
 * Shift kind: night (moon) | day (sun) — remaps pack times in-game when needed.
 */
(function () {
    const dialog = document.getElementById('census-choice-dialog');
    const titleEl = document.getElementById('census-choice-title');
    const blurbEl = document.getElementById('census-choice-blurb');
    const btnCancel = document.getElementById('census-choice-cancel');
    const modeButtons = dialog
        ? dialog.querySelectorAll('[data-census]')
        : [];
    const shiftButtons = dialog
        ? dialog.querySelectorAll('.census-choice-shift__btn[data-shift]')
        : [];

    if (!dialog || !modeButtons.length) return;

    let pendingHref = '';
    let selectedShift = 'night';

    const SHIFT_STARTS = { day: '0700', night: '1900' };

    function setShift(kind) {
        selectedShift = kind === 'day' ? 'day' : 'night';
        shiftButtons.forEach((btn) => {
            const isOn = btn.getAttribute('data-shift') === selectedShift;
            btn.classList.toggle('is-selected', isOn);
            btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
        });
    }

    function openChoice(tile) {
        const dept = tile.querySelector('.unit-tile__dept')?.textContent?.trim() || 'Unit';
        const base = Number(tile.getAttribute('data-census-full')) || 0;
        const startN = Math.max(0, base - 1);
        pendingHref = tile.getAttribute('data-href') || '';
        setShift('night');
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

    function hrefWithChoices(mode) {
        if (!pendingHref) return '';
        try {
            const url = new URL(pendingHref, window.location.href);
            if (!mode || mode === 'full') {
                url.searchParams.delete('census');
            } else {
                url.searchParams.set('census', mode);
            }
            url.searchParams.set('shift', selectedShift);
            url.searchParams.set('shift-starts', SHIFT_STARTS[selectedShift]);
            return url.pathname + url.search + url.hash;
        } catch {
            const parts = [];
            if (mode && mode !== 'full') parts.push(`census=${encodeURIComponent(mode)}`);
            parts.push(`shift=${encodeURIComponent(selectedShift)}`);
            parts.push(`shift-starts=${encodeURIComponent(SHIFT_STARTS[selectedShift])}`);
            const join = pendingHref.includes('?') ? '&' : '?';
            return `${pendingHref}${join}${parts.join('&')}`;
        }
    }

    function navigateWithCensus(mode) {
        const href = hrefWithChoices(mode);
        if (!href) return;
        closeChoice();
        window.location.href = href;
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

    shiftButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            setShift(btn.getAttribute('data-shift') || 'night');
        });
    });

    btnCancel?.addEventListener('click', () => closeChoice());
    dialog.addEventListener('cancel', () => {
        pendingHref = '';
    });
})();
