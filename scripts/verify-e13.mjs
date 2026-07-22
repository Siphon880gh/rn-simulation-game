/**
 * AUTO verify E13 — Delegate rail (ICU CCT / floor CNAs) + turn assist factor.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fail = (msg) => {
    console.error('FAIL:', msg);
    process.exit(1);
};

const gameConfigUrl = pathToFileURL(path.join(root, 'game/assets/js/game-config.js')).href;
const delegationUrl = pathToFileURL(path.join(root, 'game/assets/js/delegation.js')).href;
const classUrl = pathToFileURL(path.join(root, 'game/assets/js/task-class-interactions.js')).href;

const { GameConfig } = await import(gameConfigUrl);
const {
    buildDelegationState,
    isAideAvailable,
    findAvailableAideForPatient,
    formatAideLabel,
    withTurnAssist,
    isTurnCareTask
} = await import(delegationUrl);
const { resolveEffectiveDuration, resetClassInteractions } = await import(classUrl);

const cfg = GameConfig.delegation;
if (!cfg?.icu || !cfg?.floor) fail('GameConfig.delegation missing icu/floor');
if (cfg.sectionLabel !== 'Delegate') fail('sectionLabel should be Delegate');
if (Number(cfg.turnAssistFactor) !== 0.5) fail('turnAssistFactor should be 0.5');
if (cfg.floor.maxCount !== 2) fail('floor maxCount should be 2');
if (Math.abs(cfg.floor.availabilityFraction - 1 / 3) > 1e-9) fail('availabilityFraction should be 1/3');

// Deterministic RNG sequence
function seqRandom(values) {
    let i = 0;
    return () => {
        const v = values[i % values.length];
        i += 1;
        return v;
    };
}

const icu = buildDelegationState({
    pack: { department: 'icu', shiftStart: 1900, shiftDurationHours: 12 },
    patientIds: ['maria', 'robert'],
    shiftStart: 1900,
    shiftMins: 720,
    random: seqRandom([0.1, 0.9, 0.2, 0.8, 0.3, 0.7, 0.4, 0.6, 0.15, 0.85, 0.25, 0.75])
});
if (icu.mode !== 'icu-cct') fail('ICU mode');
if (icu.aides.length !== 1) fail('ICU should have 1 CCT');
if (icu.aides[0].role !== 'cct') fail('ICU aide role');
if (!icu.aides[0].hourHalfPlan) fail('ICU hourHalfPlan missing');

const hourKey = Object.keys(icu.aides[0].hourHalfPlan)[0];
const half = icu.aides[0].hourHalfPlan[hourKey];
const hourStart = Number(hourKey);
const firstMins = hourStart; // :00
const secondMins = Math.floor(hourStart / 100) * 100 + 30;
const inFirst = isAideAvailable(icu.aides[0], firstMins);
const inSecond = isAideAvailable(icu.aides[0], secondMins);
if (half === 'first') {
    if (!inFirst || inSecond) fail('CCT first-half window wrong');
} else if (inFirst || !inSecond) {
    fail('CCT second-half window wrong');
}

const floor = buildDelegationState({
    pack: { department: 'medsurg', shiftStart: 1900, shiftDurationHours: 12 },
    patientIds: ['joe', 'maria', 'derek', 'aisha', 'lin'],
    shiftStart: 1900,
    shiftMins: 720,
    random: seqRandom([0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7])
});
if (floor.mode !== 'floor-cna') fail('floor mode');
if (floor.aides.length !== 2) fail('floor should have 2 CNAs');
const covered = new Set(floor.aides.flatMap((a) => a.patientIds));
if (covered.size !== 5) fail('CNAs must cover all patients evenly');
const sizes = floor.aides.map((a) => a.patientIds.length).sort();
if (sizes[0] < 2 || sizes[1] < 2) fail('even split expected ~2/3');
for (const aide of floor.aides) {
    const span = (() => {
        const a = Math.floor(Number(aide.availableFrom) / 100) * 60 + (Number(aide.availableFrom) % 100);
        const b = Math.floor(Number(aide.availableUntil) / 100) * 60 + (Number(aide.availableUntil) % 100);
        let d = b - a;
        if (d < 0) d += 1440;
        return d;
    })();
    if (span !== 240) fail(`CNA window should be 240 min (1/3 of 720), got ${span}`);
}

// Label includes room when patient map provided
const patients = new Map([
    ['joe', { id: 'joe', room: 'Room 201-A' }],
    ['maria', { id: 'maria', room: 'Room 204-B' }]
]);
const label = formatAideLabel(
    { role: 'cna', roleLabel: 'CNA', name: 'Wendy', patientIds: ['joe'] },
    patients
);
if (label !== 'CNA Wendy · 201-A') fail(`label expected CNA Wendy · 201-A, got ${label}`);

resetClassInteractions();
const turnTask = {
    id: 't1',
    name: 'Turn / reposition (Q2H)',
    duration: 10,
    taskClass: 'routine',
    patientId: 'joe',
    metadata: { careSchedule: 'turnQ2h' }
};
if (!isTurnCareTask(turnTask)) fail('isTurnCareTask');
const assisted = withTurnAssist(turnTask, floor.aides[0]);
const resolved = resolveEffectiveDuration(assisted, null);
if (resolved.duration !== 5) fail(`assist duration expected 5, got ${resolved.duration}`);

// DOM wiring
const indexHtml = fs.readFileSync(path.join(root, 'game/index.html'), 'utf8');
if (!indexHtml.includes('id="delegate-rail"')) fail('delegate-rail missing in index.html');
const appJs = fs.readFileSync(path.join(root, 'game/assets/js/app.js'), 'utf8');
if (!appJs.includes('DelegationModule')) fail('app.js missing DelegationModule');
if (!appJs.includes('assistTurn')) fail('app.js missing assistTurn menu');
const rightMenu = fs.readFileSync(path.join(root, 'game/assets/js/right-menu.js'), 'utf8');
if (!rightMenu.includes('renderDelegate')) fail('right-menu missing renderDelegate');

// findAvailableAideForPatient needs gameState — smoke via covering logic only above
console.log('PASS E13 delegation', {
    icuHalf: half,
    cnaCount: floor.aides.length,
    assistDuration: resolved.duration,
    label
});
