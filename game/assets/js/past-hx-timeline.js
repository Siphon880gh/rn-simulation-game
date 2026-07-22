/**
 * Patient chart history (past hx) via TimelineJS — decisions.timeline_library = timelinejs
 */

const timelineInstances = new Map();

export function parseIsoDateParts(isoDate) {
    const [y, m, d] = String(isoDate).split('-').map(Number);
    return { year: y, month: m, day: d };
}

export function pastHxToTimelineJs(patientPack) {
    const events = (patientPack.pastHx || []).map((entry) => {
        const event = {
            start_date: parseIsoDateParts(entry.start),
            text: {
                headline: entry.headline || 'Event',
                text: entry.text || ''
            }
        };
        if (entry.media) {
            event.media = {
                url: entry.media,
                caption: entry.caption || ''
            };
        }
        return event;
    });

    return {
        title: {
            text: {
                headline: `${patientPack.displayName || 'Patient'} — chart history`,
                text: 'Fictional teaching record.'
            }
        },
        events
    };
}

export async function loadPastHxPack(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load past hx: ${url}`);
    }
    return response.json();
}

/**
 * Lazy-init TimelineJS when the past-hx panel becomes visible.
 * @returns {object|null} TL.Timeline instance
 */
export function ensurePastHxTimeline(patientId, container, patientPack, options = {}) {
    if (!container || !window.TL || !window.TL.Timeline) {
        console.warn('TimelineJS (window.TL) not available');
        return null;
    }

    if (timelineInstances.has(patientId)) {
        return timelineInstances.get(patientId);
    }

    if (!container.id) {
        container.id = `past-hx-timeline-${patientId}`;
    }

    container.innerHTML = '';
    const data = pastHxToTimelineJs(patientPack);
    if (!data.events.length) {
        container.innerHTML = '<p class="text-sm text-gray-500 p-2">No chart history on file.</p>';
        return null;
    }

    const instance = new window.TL.Timeline(container.id, data, {
        language: 'en',
        initial_zoom: 2,
        timenav_height: 120,
        scale_factor: 1,
        hash_bookmark: false,
        ...options
    });

    timelineInstances.set(patientId, instance);
    return instance;
}

export function destroyPastHxTimeline(patientId) {
    const instance = timelineInstances.get(patientId);
    if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
    }
    timelineInstances.delete(patientId);
}

if (typeof window !== 'undefined') {
    window.RnPastHx = {
        pastHxToTimelineJs,
        ensurePastHxTimeline,
        loadPastHxPack,
        parseIsoDateParts
    };
}
