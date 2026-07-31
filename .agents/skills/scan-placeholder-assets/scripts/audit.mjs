#!/usr/bin/env node
/**
 * List challenge folders / config keys that lack media placeholder wiring.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const catalogPath = path.join(root, 'game/assets/js/media-placeholder-catalog.json');
const memoryPath = path.join(root, '.agents/skills/scan-placeholder-assets/memory.json');
const configPath = path.join(root, 'game/assets/js/game-config.js');
const skillsDir = path.join(root, 'game/assets/js/challenges/skills');
const emergenciesDir = path.join(root, 'game/assets/js/challenges/emergencies');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
const excluded = new Set((memory.excluded || []).map((e) => e.id || e));
const catalogIds = new Set((catalog.assets || []).map((a) => a.id));
const mounts = new Set((catalog.assets || []).map((a) => a.mount).filter(Boolean));

const configSrc = fs.readFileSync(configPath, 'utf8');
const challengeKeys = new Set();
// mediaPlaceholders.challenges: { 'code-blue': {...}, bed-prep: {...}, ... }
const block = configSrc.match(
  /mediaPlaceholders:\s*\{[\s\S]*?\n\s*challenges:\s*\{([\s\S]*?)\n\s*\},[\s\S]*?\n\s*assets:\s*\{/
);
if (block) {
  for (const m of block[1].matchAll(/['"]([a-z0-9-]+)['"]\s*:\s*\{/g)) {
    challengeKeys.add(m[1]);
  }
  for (const m of block[1].matchAll(/(?:^|\n)\s*([a-z][a-z0-9-]*)\s*:\s*\{/g)) {
    challengeKeys.add(m[1]);
  }
}
// Catalog challenge.* mounts count as wired
for (const a of catalog.assets || []) {
  const m = String(a.mount || '').match(/^challenge\.([a-z0-9-]+)(?:\.|$)/);
  if (m) challengeKeys.add(m[1]);
}

function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => n !== 'shared' && !n.startsWith('.'));
}

const skipSkills = new Set(['skill-mcq']); // engine, not a single hero
const candidates = [];

for (const id of listDirs(skillsDir)) {
  if (skipSkills.has(id) || excluded.has(`challenge-${id}`)) continue;
  const challengeFile = path.join(skillsDir, id, 'challenge.js');
  const hasHtml = fs.existsSync(challengeFile)
    && fs.readFileSync(challengeFile, 'utf8').includes('challengeMediaHtml');
  const mapped = challengeKeys.has(id) || catalogIds.has(`challenge-${id}`);
  if (!hasHtml || !mapped) {
    candidates.push({
      id: `challenge-${id}`,
      kind: 'image',
      mount: `challenge.${id}`,
      reason: !mapped ? 'not in mediaPlaceholders.challenges / catalog' : 'missing challengeMediaHtml call',
      suggestedWh: [720, 280]
    });
  }
}

for (const id of listDirs(emergenciesDir)) {
  if (excluded.has(`challenge-${id}`)) continue;
  const challengeFile = path.join(emergenciesDir, id, 'challenge.js');
  const src = fs.existsSync(challengeFile) ? fs.readFileSync(challengeFile, 'utf8') : '';
  const hasHtml = src.includes('challengeMediaHtml');
  const mapped = challengeKeys.has(id) || catalogIds.has(`challenge-${id}`);
  if (!hasHtml || !mapped) {
    candidates.push({
      id: `challenge-${id}`,
      kind: id === 'code-blue' ? 'video' : 'image',
      mount: `challenge.${id}`,
      reason: !mapped ? 'not in mediaPlaceholders.challenges / catalog' : 'missing challengeMediaHtml call',
      suggestedWh: [720, 320]
    });
  }
}

// Catalog assets missing Dimensions once resolved — soft check via w/h presence
const missingSize = (catalog.assets || []).filter((a) => !a.w || !a.h).map((a) => a.id);

console.log(JSON.stringify({
  catalogCount: catalogIds.size,
  wiredChallengeKeys: [...challengeKeys],
  candidates,
  catalogMissingWh: missingSize,
  excluded: [...excluded],
  knownMounts: [...mounts].sort()
}, null, 2));

if (process.argv.includes('--write-progress')) {
  const progressPath = path.join(root, '.agents/skills/scan-placeholder-assets/progress.json');
  const queue = candidates.map((c) => ({
    id: c.id,
    status: 'pending',
    kind: c.kind,
    mount: c.mount,
    w: c.suggestedWh[0],
    h: c.suggestedWh[1],
    reason: c.reason
  }));
  fs.writeFileSync(progressPath, JSON.stringify({
    status: queue.length ? 'active' : 'idle',
    updatedAt: new Date().toISOString(),
    queue
  }, null, 2) + '\n');
  console.error(`Wrote ${queue.length} candidates to progress.json`);
}
