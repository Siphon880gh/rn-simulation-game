#!/usr/bin/env node
/**
 * Audit skill library → associated patients coverage.
 * Usage:
 *   node .agents/skills/ensure-skill-patients/scripts/audit.mjs
 *   node …/audit.mjs --skill=icp
 *   node …/audit.mjs --write-progress
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const LIBRARY = join(ROOT, 'game/events/skills/library.json');
const PATIENTS_JS = join(ROOT, 'game/assets/js/patients.js');
const SCENARIOS_DIR = join(ROOT, 'game/events/scenarios');
const PROGRESS = join(__dirname, '../progress.json');
const SKIP_IDS = new Set(['skill-mcq']);

function parseArgs(argv) {
  const out = { skill: null, writeProgress: false, json: false };
  for (const a of argv) {
    if (a.startsWith('--skill=')) out.skill = a.slice('--skill='.length);
    else if (a === '--write-progress') out.writeProgress = true;
    else if (a === '--json') out.json = true;
  }
  return out;
}

/** @returns {Map<string, string[]>} patientId → skill ids */
function parsePatientSkills(src) {
  const map = new Map();
  // Match config keys: joe: { ... skills: ['a', 'b'] ... }
  const blockRe = /(?:^|\n)\s*([a-z][a-z0-9-]*)\s*:\s*\{([\s\S]*?)\n\s*\}(?=\s*,?\s*\n\s*(?:[a-z]|\/\/|\/\*|$))/g;
  let m;
  while ((m = blockRe.exec(src))) {
    const id = m[1];
    if (id === 'patientConfigs' || id === 'vitals') continue;
    const body = m[2];
    const skillsMatch = body.match(/skills\s*:\s*\[([^\]]*)\]/);
    if (!skillsMatch) continue;
    const skills = skillsMatch[1]
      .split(',')
      .map((s) => s.replace(/['"`]/g, '').trim())
      .filter(Boolean);
    if (skills.length) map.set(id, skills);
  }
  // Fallback: any skills: [...] with nearby id: 'x'
  if (map.size === 0) {
    const loose = [...src.matchAll(/id:\s*['"]([^'"]+)['"][\s\S]{0,400}?skills\s*:\s*\[([^\]]*)\]/g)];
    for (const hit of loose) {
      const skills = hit[2]
        .split(',')
        .map((s) => s.replace(/['"`]/g, '').trim())
        .filter(Boolean);
      if (skills.length) map.set(hit[1], skills);
    }
  }
  return map;
}

/** @returns {Map<string, string[]>} patientId → pack files containing them */
function indexPacks() {
  const byPatient = new Map();
  const files = readdirSync(SCENARIOS_DIR).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const rel = `events/scenarios/${file}`;
    try {
      const pack = JSON.parse(readFileSync(join(SCENARIOS_DIR, file), 'utf8'));
      const ids = Array.isArray(pack.patients) ? pack.patients : [];
      for (const id of ids) {
        if (!byPatient.has(id)) byPatient.set(id, []);
        byPatient.get(id).push(rel);
      }
    } catch {
      // skip bad json
    }
  }
  return byPatient;
}

function unitHintFor(skill) {
  if (skill.unitHint) return skill.unitHint;
  const hay = [skill.id, ...(skill.tags || [])].join(' ').toLowerCase();
  if (/(icu|neuro|icp|ventilator|vent|central-line|code-blue|pressor|trach)/.test(hay)) {
    return 'icu';
  }
  if (/(tele|ecg|cardiac|rhythm|nstemi)/.test(hay)) return 'tele';
  return 'medsurg';
}

function auditSkill(skill, patientSkills, packsByPatient) {
  const skillId = skill.id;
  const tagged = [];
  for (const [pid, skills] of patientSkills) {
    if (skills.includes(skillId)) tagged.push(pid);
  }
  const libPatients = Array.isArray(skill.patients) ? skill.patients : [];
  const associated = [...new Set([...tagged, ...libPatients])];
  const inPack = associated.filter((pid) => (packsByPatient.get(pid) || []).length > 0);
  const pack = skill.pack || null;
  const packOk = pack
    ? associated.some((pid) => (packsByPatient.get(pid) || []).includes(pack))
    : inPack.length > 0;

  const playable = Array.isArray(skill.games) && skill.games.length > 0 && skill.status !== 'planned';
  let status = 'covered';
  const gaps = [];
  if (!playable && skill.status === 'planned') {
    status = 'deferred';
  } else if (!associated.length) {
    status = 'uncovered';
    gaps.push('no patientConfigs.skills / library.patients');
  } else if (!inPack.length) {
    status = 'uncovered';
    gaps.push('patient not in any scenario pack');
  } else if (!pack || !packOk) {
    status = 'uncovered';
    gaps.push(pack ? `library.pack does not include tagged patient` : 'library.pack missing');
  } else if (!skill.unitHint) {
    status = 'uncovered';
    gaps.push('library.unitHint missing');
  }

  return {
    id: skillId,
    label: skill.label || skillId,
    status,
    unitHint: unitHintFor(skill),
    patients: associated,
    pack,
    gaps,
    playable
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const library = JSON.parse(readFileSync(LIBRARY, 'utf8'));
  const patientsSrc = readFileSync(PATIENTS_JS, 'utf8');
  const patientSkills = parsePatientSkills(patientsSrc);
  const packsByPatient = indexPacks();

  let skills = (library.skills || []).filter(
    (s) => s && s.id && !SKIP_IDS.has(s.id) && s.status !== 'hidden'
  );
  if (args.skill) {
    skills = skills.filter((s) => s.id === args.skill);
    if (!skills.length) {
      console.error(`Unknown skill: ${args.skill}`);
      process.exit(2);
    }
  }

  const rows = skills.map((s) => auditSkill(s, patientSkills, packsByPatient));
  const uncovered = rows.filter((r) => r.status === 'uncovered');
  const covered = rows.filter((r) => r.status === 'covered');
  const deferred = rows.filter((r) => r.status === 'deferred');

  if (args.writeProgress) {
    const progress = {
      skill: 'ensure-skill-patients',
      shiftDefault: 'night',
      milestone: uncovered.length ? 'S1' : 'done',
      skills: rows.map((r) => ({
        id: r.id,
        status: r.status === 'covered' ? 'covered' : r.status === 'deferred' ? 'deferred' : 'uncovered',
        unitHint: r.unitHint,
        patientId: r.patients[0] || null,
        packFile: r.pack ? `game/${r.pack}` : null,
        notes: r.gaps.join('; ')
      })),
      blocked: null,
      updatedAt: new Date().toISOString()
    };
    writeFileSync(PROGRESS, `${JSON.stringify(progress, null, 2)}\n`);
  }

  if (args.json) {
    console.log(JSON.stringify({ covered: covered.length, uncovered: uncovered.length, deferred: deferred.length, rows }, null, 2));
  } else {
    console.log(`Skill patients audit: ${covered.length} covered, ${uncovered.length} uncovered, ${deferred.length} deferred (of ${rows.length})`);
    if (uncovered.length) {
      console.log('\nUncovered:');
      for (const r of uncovered) {
        console.log(`- ${r.id} [${r.unitHint}] ${r.gaps.join('; ')}`);
      }
    }
    if (args.skill && rows[0]) {
      console.log(JSON.stringify(rows[0], null, 2));
    }
  }

  process.exit(uncovered.length ? 1 : 0);
}

main();
