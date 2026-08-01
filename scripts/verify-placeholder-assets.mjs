#!/usr/bin/env node
/**
 * AUTO checks for media placeholder catalog + PHP service + wiring hooks.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

// Catalog
const catalogPath = 'game/assets/js/media-placeholder-catalog.json';
if (!exists(catalogPath)) {
  errors.push(`missing ${catalogPath}`);
} else {
  let catalog;
  try {
    catalog = JSON.parse(read(catalogPath));
  } catch (e) {
    errors.push(`catalog JSON parse: ${e.message}`);
    catalog = null;
  }
  if (catalog) {
    if (!Array.isArray(catalog.assets) || !catalog.assets.length) {
      errors.push('catalog.assets must be a non-empty array');
    }
    const ids = new Set();
    for (const a of catalog.assets || []) {
      if (!a.id) errors.push('asset missing id');
      else if (ids.has(a.id)) errors.push(`duplicate id ${a.id}`);
      else ids.add(a.id);
      if (!a.title) errors.push(`${a.id}: missing title`);
      if (!a.kind || !['image', 'video'].includes(a.kind)) {
        errors.push(`${a.id}: kind must be image|video`);
      }
      if (!a.mount) warnings.push(`${a.id}: missing mount`);
      if (!a.prompt) warnings.push(`${a.id}: missing prompt`);
      if (a.replaceWith) {
        const rw = String(a.replaceWith);
        const candidates = [
          rw.replace(/^\//, ''),
          path.join('game', rw),
          rw
        ];
        if (!candidates.some((c) => exists(c))) {
          warnings.push(`${a.id}: replaceWith not found on disk (${rw})`);
        }
      }
    }
    const required = [
      'dept-tele',
      'dept-medsurg',
      'dept-icu',
      'situation-code-blue',
      'challenge-code-blue',
      'challenge-code-blue-video',
      'situation-critical-lab',
      'situation-bed-prep',
      'challenge-bed-prep',
      'challenge-med-identity',
      'challenge-ivpb-hang',
      'challenge-iv-check',
      'challenge-code-blue-after',
      'challenge-bed-prep-after',
      'slot-perform'
    ];
    for (const id of required) {
      if (!ids.has(id)) errors.push(`catalog missing required id ${id}`);
    }
  }
}

// Inventory doc
if (!exists('PLACEHOLDER_ASSETS.md')) {
  errors.push('missing PLACEHOLDER_ASSETS.md');
} else {
  const md = read('PLACEHOLDER_ASSETS.md');
  for (const id of ['dept-tele', 'situation-code-blue', 'challenge-code-blue', 'challenge-code-blue-video', 'slot-perform']) {
    if (!md.includes(id)) errors.push(`PLACEHOLDER_ASSETS.md missing ${id}`);
  }
}

// PHP service
for (const rel of [
  'placeholders/image.php',
  'placeholders/video.php',
  'placeholders/lib/render.php',
  'placeholders/partials/media-tag.php'
]) {
  if (!exists(rel)) errors.push(`missing ${rel}`);
}

const php = spawnSync('php', ['-v'], { encoding: 'utf8' });
if (php.status !== 0) {
  warnings.push('php CLI not available — skip live endpoint smoke');
} else {
  const smoke = spawnSync(
    'php',
    ['-r', `
      $_GET = ['title' => 'Verify', 'id' => 'verify', 'w' => '64', 'h' => '48'];
      ob_start();
      include '${path.join(root, 'placeholders/image.php').replace(/\\/g, '/')}';
      $out = ob_get_clean();
      if (strpos($out, 'svg') === false || strpos($out, 'Verify') === false) {
        fwrite(STDERR, "image.php output missing svg/title\\n");
        exit(1);
      }
    `],
    { encoding: 'utf8' }
  );
  if (smoke.status !== 0) {
    errors.push(`PHP image.php smoke failed: ${smoke.stderr || smoke.stdout}`);
  }
}

// Wiring hooks
const hooks = [
  ['game/assets/js/game-config.js', 'mediaPlaceholders'],
  ['game/assets/js/media-placeholders.js', 'resolveAssetUrl'],
  ['game/assets/js/app.js', 'MediaPlaceholdersModule'],
  ['game/assets/js/slot-system.js', 'slotMediaHtml'],
  ['game/assets/js/critical-labs.js', 'showCriticalLabMedia'],
  ['game/assets/js/challenges/emergencies/code-blue/challenge.js', 'challengeMediaHtml'],
  ['game/assets/js/media-placeholders.js', 'challengeMediaHtml'],
  ['game/assets/js/media-placeholders.js', 'revealChallengeAfterMedia'],
  ['game/assets/js/challenges/challenge-gate.js', 'revealChallengeAfterMedia'],
  ['game/assets/js/game-config.js', 'afterImageId'],
  ['game/assets/js/media-placeholders.js', 'promptStyleAppendix'],
  ['game/assets/js/media-placeholders.js', 'withPromptDimensions'],
  ['game/assets/js/game-config.js', 'promptStyleAppendix'],
  ['placeholders/lib/render.php', 'ph_prompt_style_appendix'],
  ['placeholders/lib/render.php', 'ph_with_prompt_dimensions'],
  ['assets/js/landing-media.js', 'Style (fun medical simulation)'],
  ['assets/js/landing-media.js', 'Dimensions:'],
  ['.agents/skills/scan-placeholder-assets/SKILL.md', 'scan-placeholder-assets'],
  ['assets/js/landing-media.js', 'unit-tile__media'],
  ['index.html', 'landing-media.js']
];
for (const [rel, needle] of hooks) {
  if (!exists(rel)) {
    errors.push(`missing ${rel}`);
    continue;
  }
  if (!read(rel).includes(needle)) {
    errors.push(`${rel} missing hook "${needle}"`);
  }
}

if (warnings.length) {
  console.log('WARN:');
  warnings.forEach((w) => console.log(`  - ${w}`));
}

if (errors.length) {
  console.error('FAIL: placeholder assets verify');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log('PASS: placeholder assets verify');
process.exit(0);
