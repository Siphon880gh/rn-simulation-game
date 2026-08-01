/**
 * Shared skill-library quizzes — bank keyed by metadata.skillId.
 * Types: choice (default) | sata | match | flash
 * Author content: ./config.js (+ ./banks/*)
 */
import { GameConfig } from '../../../game-config.js';
import gameState from '../../../game-state.js';
import { skillMcqChallengeConfig, skillMcqBanks } from './config.js';

function cfg() {
  return GameConfig.skillMcqChallenge || skillMcqChallengeConfig || {};
}

export function isSkillMcqTask(task) {
  return String(task?.metadata?.challenge || '').toLowerCase() === 'skill-mcq';
}

export function getSkillMcqBanks() {
  const banks = cfg().banks;
  return banks && typeof banks === 'object' ? banks : skillMcqBanks;
}

export function getSkillMcqBank(skillId) {
  const id = String(skillId || '').trim();
  const banks = getSkillMcqBanks();
  return banks[id] || null;
}

/** Current scenario unit (`icu` | `medsurg` | `tele`); empty when unknown / skill-test blank. */
export function resolveSkillMcqUnit(opts = {}) {
  if (opts.unit != null && String(opts.unit).trim() !== '') {
    return String(opts.unit).trim().toLowerCase();
  }
  const pack = gameState.getStateSlice?.('scenarioPack') || gameState.state?.scenarioPack;
  const raw = pack?.department || pack?.scene?.theme || '';
  return String(raw).trim().toLowerCase();
}

/** Questions with `units: ['icu']` (etc.) only appear on those departments; no tag = all units. */
function questionAllowedForUnit(question, unit) {
  const allowed = Array.isArray(question?.units)
    ? question.units.map((u) => String(u).toLowerCase()).filter(Boolean)
    : [];
  if (!allowed.length) return true;
  if (!unit) return true;
  return allowed.includes(unit);
}

function normalizeQuestionType(question) {
  const t = String(question?.type || 'choice').toLowerCase();
  if (t === 'strip') return 'image';
  if (t === 'video' || t === 'audio') return 'audio';
  return t;
}

/** Optional filters: types (e.g. image), rhythmPool (question.pools / tags). */
function questionMatchesOpts(question, opts = {}) {
  const types = Array.isArray(opts.types)
    ? opts.types.map((t) => String(t).toLowerCase()).filter(Boolean)
    : [];
  if (types.length && !types.includes(normalizeQuestionType(question))) return false;

  const rhythmPool = String(opts.rhythmPool || '').trim().toLowerCase();
  if (rhythmPool) {
    const pools = [
      ...(Array.isArray(question?.pools) ? question.pools : []),
      ...(Array.isArray(question?.tags) ? question.tags : [])
    ].map((p) => String(p).toLowerCase());
    if (!pools.includes(rhythmPool)) return false;
  }
  return true;
}

function visibleQuestions(bank, opts = {}) {
  const unit = typeof opts === 'string' ? opts : resolveSkillMcqUnit(opts);
  const filterOpts = typeof opts === 'string' ? {} : opts;
  const pool = Array.isArray(bank?.questions) ? bank.questions : [];
  return pool.filter(
    (q) => q
      && q.rank !== -1
      && q.hidden !== true
      && questionAllowedForUnit(q, unit)
      && questionMatchesOpts(q, filterOpts)
  );
}

function shuffleIds(ids, random = Math.random) {
  const arr = [...(ids || [])].map(String).filter(Boolean);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getSkillMcqPoolSize(skillId, opts = {}) {
  return visibleQuestions(getSkillMcqBank(skillId), opts).length;
}

/** Visible question ids in bank order (caller should shuffle for a run). */
export function getSkillMcqQuestionIds(skillId, opts = {}) {
  return visibleQuestions(getSkillMcqBank(skillId), opts)
    .map((q) => q?.id)
    .filter((id) => id != null && id !== '')
    .map(String);
}

/**
 * Per-run deck for skill-mcq. Rhythm-strip tasks use strip images only.
 * When metadata.rhythmPool is set, the opener is drawn from that pool; remaining
 * strips stay available for “I want to feel challenged” boosters / Random.
 */
export function buildSkillMcqQuizDeckIds(task, opts = {}) {
  const skillId = String(task?.metadata?.skillId || opts.skillId || '').trim();
  if (!skillId) return [];
  const kind = String(task?.metadata?.kind || opts.kind || '').trim().toLowerCase();
  const rhythmPool = String(task?.metadata?.rhythmPool || opts.rhythmPool || '').trim().toLowerCase();
  const random = typeof opts.random === 'function' ? opts.random : Math.random;
  const stripOnly = kind === 'rhythm-strip';
  const baseOpts = stripOnly ? { ...opts, types: ['image'] } : { ...opts };
  delete baseOpts.rhythmPool;
  const allIds = getSkillMcqQuestionIds(skillId, baseOpts);
  if (!allIds.length) return [];
  if (!rhythmPool || !stripOnly) return shuffleIds(allIds, random);

  const matched = getSkillMcqQuestionIds(skillId, { ...baseOpts, rhythmPool });
  if (!matched.length) return shuffleIds(allIds, random);
  const opener = matched[Math.min(matched.length - 1, Math.floor(random() * matched.length))];
  const rest = shuffleIds(allIds.filter((id) => id !== opener), random);
  return [opener, ...rest];
}

export function pickSkillMcqQuestion(skillId, opts = {}) {
  const bank = getSkillMcqBank(skillId);
  const pool = visibleQuestions(bank, opts);
  if (!pool.length) return null;
  if (opts.questionId != null && opts.questionId !== '') {
    // Exact id may sit outside a rhythmPool filter (booster / Random follow-ups).
    const unit = resolveSkillMcqUnit(opts);
    const wide = visibleQuestions(bank, { unit, types: opts.types });
    const wanted = String(opts.questionId);
    const exact = (wide.length ? wide : pool).find((q) => String(q.id) === wanted)
      || (Array.isArray(bank?.questions) ? bank.questions : []).find((q) => String(q?.id) === wanted);
    if (exact && exact.rank !== -1 && exact.hidden !== true) return { bank, question: exact };
  }
  const exclude = new Set(
    [opts.excludeId, ...(Array.isArray(opts.excludeIds) ? opts.excludeIds : [])]
      .filter((id) => id != null && id !== '')
      .map(String)
  );
  let candidates = exclude.size ? pool.filter((q) => !exclude.has(String(q.id))) : pool;
  if (!candidates.length && opts.excludeId != null) {
    candidates = pool.filter((q) => String(q.id) !== String(opts.excludeId));
  }
  if (!candidates.length) candidates = pool;
  const roll = typeof opts.random === 'function' ? opts.random() : Math.random();
  const idx = Math.min(candidates.length - 1, Math.floor(roll * candidates.length));
  return { bank, question: candidates[idx] };
}

function shuffle(list, random = Math.random) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function questionType(question) {
  const t = String(question?.type || 'choice').toLowerCase();
  if (t === 'sata' || t === 'match' || t === 'flash') return t;
  // Sheet "Video" rows that are MP3/audio identify prompts
  if (t === 'audio' || t === 'video') return 'audio';
  // Rhythm-strip / still-image identify prompts
  if (t === 'image' || t === 'strip') return 'image';
  return 'choice';
}

function resolveMediaSrc(src) {
  const raw = String(src || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('/')) return raw;
  // Authored paths are relative to game/ (e.g. assets/audio/heart-sounds/normal.mp3)
  return raw;
}

function expectedLabelForChoice(question) {
  if (typeof question.correctIndex === 'number' && Array.isArray(question.choices)) {
    return question.choices[question.correctIndex];
  }
  return question.correct;
}

/**
 * @returns {object|null} quiz payload for render + grade
 */
export function buildSkillMcqQuiz(task, opts = {}) {
  if (!isSkillMcqTask(task)) return null;
  const skillId = String(task?.metadata?.skillId || opts.skillId || '').trim();
  if (!skillId) return null;
  const picked = pickSkillMcqQuestion(skillId, opts);
  if (!picked?.question) return null;
  const { bank, question } = picked;
  const type = questionType(question);
  const base = {
    title: bank.title || skillId,
    prompt: question.prompt || '',
    instruction: question.instruction || '',
    category: question.category || '',
    questionId: question.id,
    skillId,
    type
  };

  if (type === 'choice' || type === 'audio' || type === 'image') {
    const correctLabel = String(expectedLabelForChoice(question) ?? '').trim();
    const labels = shuffle(question.choices || [], opts.random);
    const resolvedType = type === 'audio' ? 'audio' : (type === 'image' ? 'image' : 'choice');
    return {
      ...base,
      type: resolvedType,
      audioSrc: type === 'audio'
        ? resolveMediaSrc(question.audio || question.media || question.video)
        : '',
      imageSrc: type === 'image'
        ? resolveMediaSrc(question.image || question.media || question.strip)
        : '',
      choices: labels.map((label) => ({
        label,
        correct: String(label).trim() === correctLabel
      })),
      expected: correctLabel
    };
  }

  if (type === 'sata') {
    const correctSet = new Set(
      (Array.isArray(question.correctIndexes) ? question.correctIndexes : []).map(Number)
    );
    const indexed = (question.choices || []).map((label, i) => ({
      label,
      index: i,
      correct: correctSet.has(i)
    }));
    const shuffled = shuffle(indexed, opts.random);
    const expectedLabels = indexed.filter((c) => c.correct).map((c) => c.label);
    return {
      ...base,
      choices: shuffled,
      expectedLabels,
      expected: expectedLabels.join('; ')
    };
  }

  if (type === 'match') {
    const pairs = Array.isArray(question.pairs) ? question.pairs : [];
    const terms = shuffle(
      pairs.map((p, i) => ({ id: `t${i}`, term: p.term, pairIndex: i })),
      opts.random
    );
    const definitions = shuffle(
      pairs.map((p, i) => ({ id: `d${i}`, definition: p.definition, pairIndex: i })),
      opts.random
    );
    return {
      ...base,
      terms,
      definitions,
      expected: pairs.map((p) => `${p.term} → ${p.definition}`).join('; ')
    };
  }

  if (type === 'flash') {
    return {
      ...base,
      front: question.front || question.prompt || '',
      back: question.back || '',
      expected: 'Self-check: Yes'
    };
  }

  return null;
}

function instructionHtml(quiz) {
  const bits = [];
  if (quiz.category) bits.push(`<span class="text-xs font-semibold text-slate-600">${escapeHtml(quiz.category)}</span>`);
  if (quiz.instruction) bits.push(`<span class="text-xs text-slate-500">${escapeHtml(quiz.instruction)}</span>`);
  return bits.length ? `<div class="flex flex-wrap gap-2 items-center">${bits.join('')}</div>` : '';
}

function renderChoiceHtml(quiz) {
  return (quiz.choices || []).map((c, i) => `
      <button type="button" class="challenge-choice px-3 py-2 rounded border border-gray-200 text-left text-sm hover:bg-gray-50"
        data-challenge-correct="${c.correct ? '1' : '0'}" data-choice-index="${i}">${escapeHtml(c.label)}</button>
    `).join('');
}

function renderAudioHtml(quiz) {
  const src = escapeHtml(quiz.audioSrc || '');
  const listenHint = escapeHtml(quiz.instruction || 'Listen, then identify the sound');
  const player = src
    ? `<div class="rounded border border-rose-200 bg-rose-50/50 p-3 space-y-2" data-skill-audio>
        <p class="text-xs text-rose-900 font-medium">${listenHint}</p>
        <audio class="w-full skill-audio-player" controls preload="auto" src="${src}">
          Your browser does not support audio playback.
        </audio>
      </div>`
    : '<p class="text-sm text-rose-700">Audio file missing for this prompt.</p>';
  return `
      ${player}
      <div class="flex flex-col gap-2" data-quiz-choices>${renderChoiceHtml(quiz)}</div>
    `;
}

function renderImageHtml(quiz) {
  const src = escapeHtml(quiz.imageSrc || '');
  const alt = escapeHtml(quiz.instruction || 'Rhythm strip');
  const strip = src
    ? `<div class="rounded border border-slate-300 bg-white p-2 space-y-2" data-skill-strip>
        <img class="w-full max-h-56 object-contain skill-strip-image" src="${src}" alt="${alt}" loading="eager" />
      </div>`
    : '<p class="text-sm text-rose-700">Rhythm strip image missing for this prompt.</p>';
  return `
      ${strip}
      <div class="flex flex-col gap-2" data-quiz-choices>${renderChoiceHtml(quiz)}</div>
    `;
}

function stopSkillMcqAudio(root = document) {
  root.querySelectorAll?.('audio.skill-audio-player')?.forEach((el) => {
    try {
      el.pause();
      el.currentTime = 0;
    } catch (_) { /* ignore */ }
  });
}

const SATA_PAINT_CLASSES = [
  'border-emerald-500',
  'bg-emerald-50',
  'border-rose-500',
  'bg-rose-50',
  'ring-2',
  'ring-amber-400',
  'bg-amber-50'
];

function clearSataOutcomePaint(gate) {
  gate?.querySelectorAll?.('.skill-sata-choice')?.forEach((b) => {
    const label = b.closest('label');
    if (!label) return;
    label.classList.remove(...SATA_PAINT_CLASSES);
    label.querySelectorAll('.skill-sata-result-badge').forEach((el) => el.remove());
  });
  const key = gate?.querySelector?.('#challenge-answer-key');
  if (key) {
    key.classList.add('hidden');
    key.innerHTML = '';
  }
}

/**
 * Paint correct / wrong SATA rows and list the expected choices under feedback.
 * Keeps the textual “Incorrect — expected …” line; this is the visual key.
 */
export function revealSataOutcome(gate = document.querySelector('.challenge-gate[data-challenge="skill-mcq"]')) {
  if (!gate) return [];
  clearSataOutcomePaint(gate);
  const correctLabels = [];
  gate.querySelectorAll('.skill-sata-choice').forEach((b) => {
    const label = b.closest('label');
    if (!label) return;
    const correct = b.getAttribute('data-challenge-correct') === '1';
    const checked = b.checked;
    const text = b.getAttribute('data-label') || label.querySelector('span')?.textContent || '';
    if (correct) {
      correctLabels.push(text);
      label.classList.add('border-emerald-500', 'bg-emerald-50');
      const badge = document.createElement('span');
      badge.className = 'skill-sata-result-badge ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-800';
      badge.textContent = checked ? 'Correct' : 'Should select';
      label.appendChild(badge);
    } else if (checked) {
      label.classList.add('border-rose-500', 'bg-rose-50');
      const badge = document.createElement('span');
      badge.className = 'skill-sata-result-badge ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wide text-rose-800';
      badge.textContent = 'Not correct';
      label.appendChild(badge);
    }
  });
  const key = gate.querySelector('#challenge-answer-key');
  if (key && correctLabels.length) {
    key.innerHTML = `
      <li class="list-none -ml-5 mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">Correct selections</li>
      ${correctLabels.map((l) => `<li class="text-emerald-900">${escapeHtml(l)}</li>`).join('')}
    `;
    key.classList.remove('hidden');
  }
  return correctLabels;
}

function renderSataHtml(quiz) {
  const opts = (quiz.choices || []).map((c, i) => `
      <label class="flex items-start gap-2 px-3 py-2 rounded border border-gray-200 text-sm cursor-pointer hover:bg-gray-50">
        <input type="checkbox" class="mt-1 skill-sata-choice" data-choice-index="${i}"
          data-challenge-correct="${c.correct ? '1' : '0'}" data-label="${escapeHtml(c.label)}" />
        <span class="flex-1 min-w-0">${escapeHtml(c.label)}</span>
      </label>
    `).join('');
  return `
      <div class="flex flex-col gap-2" data-quiz-choices>${opts}</div>
      <button type="button" class="skill-quiz-check mt-2 px-3 py-2 rounded bg-slate-800 text-white text-sm hover:bg-slate-700">
        Check answer
      </button>
    `;
}

/** Distinct colors so each locked pair is easy to tell apart. */
const MATCH_PAIR_PALETTE = [
  { letter: 'A', btn: 'bg-sky-100 border-sky-400 text-sky-950', badge: 'bg-sky-600 text-white' },
  { letter: 'B', btn: 'bg-violet-100 border-violet-400 text-violet-950', badge: 'bg-violet-600 text-white' },
  { letter: 'C', btn: 'bg-amber-100 border-amber-400 text-amber-950', badge: 'bg-amber-600 text-white' },
  { letter: 'D', btn: 'bg-emerald-100 border-emerald-400 text-emerald-950', badge: 'bg-emerald-600 text-white' },
  { letter: 'E', btn: 'bg-rose-100 border-rose-400 text-rose-950', badge: 'bg-rose-600 text-white' },
  { letter: 'F', btn: 'bg-teal-100 border-teal-400 text-teal-950', badge: 'bg-teal-600 text-white' },
  { letter: 'G', btn: 'bg-orange-100 border-orange-400 text-orange-950', badge: 'bg-orange-600 text-white' },
  { letter: 'H', btn: 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-950', badge: 'bg-fuchsia-600 text-white' }
];

const MATCH_TERM_BASE = 'skill-match-term w-full px-3 py-2 rounded border border-indigo-200 bg-indigo-50 text-left text-sm flex items-start gap-2';
const MATCH_DEF_BASE = 'skill-match-def w-full px-3 py-2 rounded border border-gray-200 text-left text-sm hover:bg-gray-50 flex items-start gap-2';
const MATCH_PAIR_BTN_CLASSES = MATCH_PAIR_PALETTE.flatMap((p) => p.btn.split(/\s+/));
const MATCH_PAIR_BADGE_CLASSES = MATCH_PAIR_PALETTE.flatMap((p) => p.badge.split(/\s+/));

function matchPalette(slot) {
  return MATCH_PAIR_PALETTE[Number(slot) % MATCH_PAIR_PALETTE.length];
}

function clearMatchPairClasses(btn) {
  if (!btn) return;
  btn.classList.remove(...MATCH_PAIR_BTN_CLASSES, 'ring-2', 'ring-indigo-500', 'ring-amber-400', 'opacity-60', 'line-through', 'bg-amber-50', 'border-amber-300');
  const badge = btn.querySelector('.skill-match-badge');
  if (badge) {
    badge.classList.add('hidden');
    badge.classList.remove(...MATCH_PAIR_BADGE_CLASSES);
    badge.textContent = '';
  }
  btn.removeAttribute('data-match-slot');
  btn.removeAttribute('data-matched-with');
  btn.removeAttribute('aria-pressed');
  btn.removeAttribute('title');
}

function applyMatchPairStyle(termBtn, defBtn, slot) {
  const style = matchPalette(slot);
  [termBtn, defBtn].forEach((btn) => {
    clearMatchPairClasses(btn);
    btn.classList.add(...style.btn.split(/\s+/));
    btn.setAttribute('data-match-slot', String(slot));
    btn.setAttribute('aria-pressed', 'true');
    btn.title = 'Click to undo this match';
    const badge = btn.querySelector('.skill-match-badge');
    if (badge) {
      badge.textContent = style.letter;
      badge.classList.remove('hidden', ...MATCH_PAIR_BADGE_CLASSES);
      badge.classList.add(...style.badge.split(/\s+/));
    }
  });
  termBtn.setAttribute('data-matched-with', defBtn.getAttribute('data-def-id') || '');
  defBtn.setAttribute('data-matched-with', termBtn.getAttribute('data-term-id') || '');
}

function renderMatchPairList(gate) {
  const list = gate.querySelector('[data-match-pair-list]');
  if (!list) return;
  const terms = [...gate.querySelectorAll('.skill-match-term[data-match-slot]')]
    .sort((a, b) => Number(a.getAttribute('data-match-slot')) - Number(b.getAttribute('data-match-slot')));
  if (!terms.length) {
    list.innerHTML = '<li class="text-xs text-slate-400" data-match-empty>None yet — pick a term, then a definition.</li>';
    return;
  }
  const defs = [...gate.querySelectorAll('.skill-match-def')];
  list.innerHTML = terms.map((termBtn) => {
    const slot = termBtn.getAttribute('data-match-slot');
    const style = matchPalette(slot);
    const defBtn = defs.find((d) => d.getAttribute('data-match-slot') === slot);
    const termText = termBtn.querySelector('.skill-match-label')?.textContent || termBtn.textContent;
    const defText = defBtn?.querySelector('.skill-match-label')?.textContent || defBtn?.textContent || '?';
    return `<li class="flex items-start gap-2 rounded border px-2 py-1.5 ${style.btn}">
      <span class="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded text-[10px] font-bold ${style.badge}">${style.letter}</span>
      <span class="text-sm leading-snug"><span class="font-medium">${escapeHtml(termText.trim())}</span>
        <span class="text-slate-500"> → </span>${escapeHtml(String(defText).trim())}</span>
    </li>`;
  }).join('');
}

function renderMatchHtml(quiz) {
  const terms = (quiz.terms || []).map((t) => `
      <button type="button" class="${MATCH_TERM_BASE}"
        data-pair-index="${t.pairIndex}" data-term-id="${escapeHtml(t.id)}"
        aria-label="Term: ${escapeHtml(t.term)}">
        <span class="skill-match-badge hidden inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded text-[10px] font-bold" aria-hidden="true"></span>
        <span class="skill-match-label flex-1">${escapeHtml(t.term)}</span>
      </button>
    `).join('');
  const defs = (quiz.definitions || []).map((d) => `
      <button type="button" class="${MATCH_DEF_BASE}"
        data-pair-index="${d.pairIndex}" data-def-id="${escapeHtml(d.id)}"
        aria-label="Definition: ${escapeHtml(d.definition)}">
        <span class="skill-match-badge hidden inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded text-[10px] font-bold" aria-hidden="true"></span>
        <span class="skill-match-label flex-1">${escapeHtml(d.definition)}</span>
      </button>
    `).join('');
  return `
      <p class="text-xs text-gray-500">Click a term, then any definition to pair them. Pairs share a letter and color (right or wrong). Click a matched item to undo. Correctness is checked when you submit.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" data-match-board>
        <div class="space-y-2">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Terms</p>
          <div class="space-y-2" data-match-terms>${terms}</div>
        </div>
        <div class="space-y-2">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Definitions</p>
          <div class="space-y-2" data-match-defs>${defs}</div>
        </div>
      </div>
      <div class="rounded border border-slate-200 bg-slate-50/80 p-2 space-y-1.5" data-match-pairs>
        <p class="text-xs font-semibold text-slate-700">Your matches</p>
        <ul class="space-y-1" data-match-pair-list>
          <li class="text-xs text-slate-400" data-match-empty>None yet — pick a term, then a definition.</li>
        </ul>
      </div>
      <p class="text-xs text-slate-600" data-match-status>0 / ${(quiz.terms || []).length} matched</p>
      <button type="button" class="skill-quiz-check mt-1 px-3 py-2 rounded bg-slate-800 text-white text-sm hover:bg-slate-700">
        Check matches
      </button>
    `;
}

function renderFlashHtml(quiz) {
  return `
      <div class="skill-flash rounded border border-amber-200 bg-amber-50/40 p-3 space-y-3" data-flash-card>
        <div data-flash-front class="text-sm text-gray-900">${quiz.front || ''}</div>
        <div data-flash-back class="hidden text-sm text-gray-900 border-t border-amber-200 pt-3">${quiz.back || ''}</div>
        <button type="button" class="skill-flash-reveal px-3 py-2 rounded border border-amber-300 bg-white text-sm hover:bg-amber-50">
          Reveal answer
        </button>
        <div class="hidden flex flex-wrap gap-2" data-flash-grade>
          <span class="text-xs text-gray-600 w-full">Did you answer correctly?</span>
          <button type="button" class="skill-flash-yes px-3 py-2 rounded bg-emerald-700 text-white text-sm">Yes</button>
          <button type="button" class="skill-flash-no px-3 py-2 rounded bg-rose-700 text-white text-sm">No</button>
        </div>
      </div>
    `;
}

export function renderSkillMcqHtml(quiz, taskName, opts = {}) {
  if (!quiz) return '';
  const poolSize = Number(opts.poolSize) || getSkillMcqPoolSize(quiz.skillId) || 1;
  const levelHtml = poolSize > 1 ? (opts.levelHtml || '') : '';
  const randomHint = poolSize > 1
    ? '<p class="text-xs text-gray-500">Give up on this prompt? Use <strong>Random</strong> for another question.</p>'
    : '';
  const type = quiz.type || 'choice';
  let body = '';
  if (type === 'sata') body = renderSataHtml(quiz);
  else if (type === 'match') body = renderMatchHtml(quiz);
  else if (type === 'flash') body = renderFlashHtml(quiz);
  else if (type === 'audio') body = renderAudioHtml(quiz);
  else if (type === 'image') body = renderImageHtml(quiz);
  else {
    body = `<div class="flex flex-col gap-2" data-quiz-choices>${renderChoiceHtml(quiz)}</div>`;
  }

  return `
      <div class="challenge-gate space-y-3 text-left" data-challenge="skill-mcq" data-quiz-type="${escapeHtml(type)}"
        data-question-id="${escapeHtml(quiz.questionId || '')}" data-pool-size="${poolSize}">
        ${levelHtml}
        ${instructionHtml(quiz)}
        <p class="text-sm text-gray-900 font-semibold" data-quiz-prompt>${escapeHtml(quiz.prompt)}</p>
        <p class="text-sm text-gray-600">${GameConfig.challengeCopy?.pauseBanner
          || 'Timer is paused. Complete this game/quiz.'}</p>
        <p class="text-xs text-gray-500">Skill focus: ${escapeHtml(taskName || quiz.title)}.</p>
        ${randomHint}
        ${body}
        <p id="challenge-feedback" class="text-sm font-medium rounded px-3 py-2 hidden" role="status" aria-live="polite"></p>
        <ul id="challenge-answer-key" class="hidden text-sm text-emerald-900 list-disc pl-5 space-y-1 rounded border border-emerald-200 bg-emerald-50/80 px-3 py-2" aria-label="Correct selections"></ul>
      </div>
    `;
}

function resetMatchBoard(gate) {
  gate.querySelectorAll('.skill-match-term, .skill-match-def').forEach((btn) => {
    const isTerm = btn.classList.contains('skill-match-term');
    clearMatchPairClasses(btn);
    btn.className = isTerm ? MATCH_TERM_BASE : MATCH_DEF_BASE;
  });
  const terms = gate.querySelectorAll('.skill-match-term');
  const status = gate.querySelector('[data-match-status]');
  if (status) status.textContent = `0 / ${terms.length} matched`;
  renderMatchPairList(gate);
}

function clearSkillMcqCheat(gate, type) {
  if (type === 'choice' || type === 'audio' || type === 'image') {
    gate.querySelectorAll('.challenge-choice').forEach((btn) => {
      btn.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-50');
    });
    return;
  }
  if (type === 'sata') {
    clearSataOutcomePaint(gate);
    gate.querySelectorAll('.skill-sata-choice').forEach((b) => {
      b.checked = false;
      b.closest('label')?.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-50');
    });
    return;
  }
  if (type === 'match') {
    resetMatchBoard(gate);
    return;
  }
  if (type === 'flash') {
    const reveal = gate.querySelector('.skill-flash-reveal');
    const back = gate.querySelector('[data-flash-back]');
    const grade = gate.querySelector('[data-flash-grade]');
    back?.classList.add('hidden');
    grade?.classList.add('hidden');
    grade?.classList.remove('flex');
    reveal?.classList.remove('hidden');
  }
}

/**
 * Fill / highlight the correct answer without grading or submitting.
 * Second click clears cheat hints.
 * @returns {{ ok: boolean, cleared?: boolean, message: string }}
 */
export function applySkillMcqCheat() {
  const gate = document.querySelector('.challenge-gate[data-challenge="skill-mcq"]');
  if (!gate) return { ok: false, message: '' };
  const type = gate.getAttribute('data-quiz-type') || 'choice';

  if (gate.getAttribute('data-cheat-active') === '1') {
    clearSkillMcqCheat(gate, type);
    gate.removeAttribute('data-cheat-active');
    return { ok: true, cleared: true, message: 'Cheat hints cleared.' };
  }

  if (type === 'choice' || type === 'audio' || type === 'image') {
    let found = false;
    gate.querySelectorAll('.challenge-choice').forEach((btn) => {
      btn.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-50');
      if (btn.getAttribute('data-challenge-correct') === '1') {
        btn.classList.add('ring-2', 'ring-amber-400', 'bg-amber-50');
        btn.focus();
        found = true;
      }
    });
    if (!found) return { ok: false, message: '' };
    gate.setAttribute('data-cheat-active', '1');
    return {
      ok: true,
      message: 'Cheat highlighted the correct choice — click it to submit. Cheat again to clear.'
    };
  }

  if (type === 'sata') {
    const boxes = [...gate.querySelectorAll('.skill-sata-choice')];
    if (!boxes.length) return { ok: false, message: '' };
    clearSataOutcomePaint(gate);
    boxes.forEach((b) => {
      const correct = b.getAttribute('data-challenge-correct') === '1';
      b.checked = correct;
      const label = b.closest('label');
      label?.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-50');
      if (correct) label?.classList.add('ring-2', 'ring-amber-400', 'bg-amber-50');
    });
    gate.setAttribute('data-cheat-active', '1');
    return {
      ok: true,
      message: 'Cheat checked the correct options — press Check answer when ready. Cheat again to clear.'
    };
  }

  if (type === 'match') {
    const terms = [...gate.querySelectorAll('.skill-match-term')];
    const defs = [...gate.querySelectorAll('.skill-match-def')];
    if (!terms.length || !defs.length) return { ok: false, message: '' };
    resetMatchBoard(gate);
    terms.forEach((termBtn, slot) => {
      const pairIndex = termBtn.getAttribute('data-pair-index');
      const defBtn = defs.find((d) => d.getAttribute('data-pair-index') === pairIndex);
      if (!defBtn) return;
      applyMatchPairStyle(termBtn, defBtn, slot);
      termBtn.classList.add('ring-2', 'ring-amber-400');
      defBtn.classList.add('ring-2', 'ring-amber-400');
    });
    renderMatchPairList(gate);
    const status = gate.querySelector('[data-match-status]');
    if (status) status.textContent = `${terms.length} / ${terms.length} matched`;
    gate.setAttribute('data-cheat-active', '1');
    return {
      ok: true,
      message: 'Cheat matched all pairs — press Check matches when ready. Cheat again to clear.'
    };
  }

  if (type === 'flash') {
    const reveal = gate.querySelector('.skill-flash-reveal');
    const back = gate.querySelector('[data-flash-back]');
    const grade = gate.querySelector('[data-flash-grade]');
    back?.classList.remove('hidden');
    grade?.classList.remove('hidden');
    grade?.classList.add('flex');
    reveal?.classList.add('hidden');
    gate.setAttribute('data-cheat-active', '1');
    return {
      ok: true,
      message: 'Cheat revealed the answer — tap Yes or No to continue. Cheat again to hide.'
    };
  }

  return { ok: false, message: '' };
}

/**
 * Bind interactions for choice / sata / match / flash after mount.
 * onGraded({ ok, expected }) — caller continues pool or finishes.
 */
export function wireSkillMcqInteractions(onGraded) {
  const gate = document.querySelector('.challenge-gate[data-challenge="skill-mcq"]');
  if (!gate || typeof onGraded !== 'function') return;
  const type = gate.getAttribute('data-quiz-type') || 'choice';

  if (type === 'choice' || type === 'audio' || type === 'image') {
    gate.querySelectorAll('.challenge-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        stopSkillMcqAudio(gate);
        const ok = btn.getAttribute('data-challenge-correct') === '1';
        onGraded({ ok });
      });
    });
    return;
  }

  if (type === 'sata') {
    const check = gate.querySelector('.skill-quiz-check');
    check?.addEventListener('click', () => {
      const boxes = [...gate.querySelectorAll('.skill-sata-choice')];
      if (!boxes.some((b) => b.checked)) {
        clearSataOutcomePaint(gate);
        onGraded({ ok: false, expected: undefined, empty: true });
        return;
      }
      const ok = boxes.every((b) => (b.checked ? b.getAttribute('data-challenge-correct') === '1'
        : b.getAttribute('data-challenge-correct') !== '1'));
      if (!ok) {
        const expectedLabels = revealSataOutcome(gate);
        onGraded({ ok: false, expectedLabels });
        return;
      }
      clearSataOutcomePaint(gate);
      onGraded({ ok: true });
    });
    return;
  }

  if (type === 'match') {
    let selectedTerm = null;
    const status = gate.querySelector('[data-match-status]');
    const terms = () => [...gate.querySelectorAll('.skill-match-term')];
    const defs = () => [...gate.querySelectorAll('.skill-match-def')];
    const total = () => terms().length;
    const matchedCount = () => terms().filter((t) => t.hasAttribute('data-match-slot')).length;

    const allocSlot = () => {
      const used = new Set(
        terms().map((t) => t.getAttribute('data-match-slot')).filter((s) => s != null && s !== '')
      );
      let slot = 0;
      while (used.has(String(slot))) slot += 1;
      return slot;
    };

    const refreshStatus = () => {
      if (status) status.textContent = `${matchedCount()} / ${total()} matched`;
      renderMatchPairList(gate);
    };

    const clearSelection = () => {
      terms().forEach((b) => b.classList.remove('ring-2', 'ring-indigo-500'));
      selectedTerm = null;
    };

    const unmatchBySlot = (slot) => {
      if (slot == null || slot === '') return;
      [...terms(), ...defs()]
        .filter((b) => b.getAttribute('data-match-slot') === String(slot))
        .forEach((b) => {
          const isTerm = b.classList.contains('skill-match-term');
          clearMatchPairClasses(b);
          b.className = isTerm ? MATCH_TERM_BASE : MATCH_DEF_BASE;
          b.removeAttribute('aria-pressed');
          b.removeAttribute('title');
        });
      gate.removeAttribute('data-cheat-active');
      refreshStatus();
    };

    gate.querySelectorAll('.skill-match-term').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.hasAttribute('data-match-slot')) {
          unmatchBySlot(btn.getAttribute('data-match-slot'));
          clearSelection();
          return;
        }
        clearSelection();
        selectedTerm = btn;
        btn.classList.add('ring-2', 'ring-indigo-500');
      });
    });

    gate.querySelectorAll('.skill-match-def').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.hasAttribute('data-match-slot')) {
          unmatchBySlot(btn.getAttribute('data-match-slot'));
          clearSelection();
          return;
        }
        if (!selectedTerm) return;
        // Pair any term ↔ definition; correctness is graded on Check.
        applyMatchPairStyle(selectedTerm, btn, allocSlot());
        gate.removeAttribute('data-cheat-active');
        clearSelection();
        refreshStatus();
      });
    });

    gate.querySelector('.skill-quiz-check')?.addEventListener('click', () => {
      const n = total();
      if (!(n > 0 && matchedCount() === n)) {
        onGraded({ ok: false });
        return;
      }
      const ok = terms().every((termBtn) => {
        const slot = termBtn.getAttribute('data-match-slot');
        const defBtn = defs().find((d) => d.getAttribute('data-match-slot') === slot);
        return !!defBtn
          && termBtn.getAttribute('data-pair-index') === defBtn.getAttribute('data-pair-index');
      });
      onGraded({ ok });
    });
    return;
  }

  if (type === 'flash') {
    const reveal = gate.querySelector('.skill-flash-reveal');
    const back = gate.querySelector('[data-flash-back]');
    const grade = gate.querySelector('[data-flash-grade]');
    reveal?.addEventListener('click', () => {
      back?.classList.remove('hidden');
      grade?.classList.remove('hidden');
      grade?.classList.add('flex');
      reveal.classList.add('hidden');
    });
    gate.querySelector('.skill-flash-yes')?.addEventListener('click', () => onGraded({ ok: true }));
    gate.querySelector('.skill-flash-no')?.addEventListener('click', () => onGraded({ ok: false }));
  }
}

export default {
  isSkillMcqTask,
  buildSkillMcqQuiz,
  buildSkillMcqQuizDeckIds,
  renderSkillMcqHtml,
  wireSkillMcqInteractions,
  applySkillMcqCheat,
  getSkillMcqBank,
  getSkillMcqPoolSize,
  getSkillMcqQuestionIds,
  pickSkillMcqQuestion
};
