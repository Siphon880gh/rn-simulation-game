/**
 * Shared skill-library quizzes — bank keyed by metadata.skillId.
 * Types: choice (default) | sata | match | flash
 * Author content: ./config.js (+ ./banks/*)
 */
import { GameConfig } from '../../../game-config.js';
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

function visibleQuestions(bank) {
  const pool = Array.isArray(bank?.questions) ? bank.questions : [];
  return pool.filter((q) => q && q.rank !== -1 && q.hidden !== true);
}

export function getSkillMcqPoolSize(skillId) {
  return visibleQuestions(getSkillMcqBank(skillId)).length;
}

export function pickSkillMcqQuestion(skillId, opts = {}) {
  const bank = getSkillMcqBank(skillId);
  const pool = visibleQuestions(bank);
  if (!pool.length) return null;
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
  return 'choice';
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

  if (type === 'choice') {
    const correctLabel = String(expectedLabelForChoice(question) ?? '').trim();
    const labels = shuffle(question.choices || [], opts.random);
    return {
      ...base,
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
    const expected = indexed.filter((c) => c.correct).map((c) => c.label).join('; ');
    return {
      ...base,
      choices: shuffled,
      expected
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

function renderSataHtml(quiz) {
  const opts = (quiz.choices || []).map((c, i) => `
      <label class="flex items-start gap-2 px-3 py-2 rounded border border-gray-200 text-sm cursor-pointer hover:bg-gray-50">
        <input type="checkbox" class="mt-1 skill-sata-choice" data-choice-index="${i}"
          data-challenge-correct="${c.correct ? '1' : '0'}" data-label="${escapeHtml(c.label)}" />
        <span>${escapeHtml(c.label)}</span>
      </label>
    `).join('');
  return `
      <div class="flex flex-col gap-2" data-quiz-choices>${opts}</div>
      <button type="button" class="skill-quiz-check mt-2 px-3 py-2 rounded bg-slate-800 text-white text-sm hover:bg-slate-700">
        Check answer
      </button>
    `;
}

function renderMatchHtml(quiz) {
  const terms = (quiz.terms || []).map((t) => `
      <button type="button" class="skill-match-term w-full px-3 py-2 rounded border border-indigo-200 bg-indigo-50 text-left text-sm"
        data-pair-index="${t.pairIndex}" data-term-id="${escapeHtml(t.id)}">${escapeHtml(t.term)}</button>
    `).join('');
  const defs = (quiz.definitions || []).map((d) => `
      <button type="button" class="skill-match-def w-full px-3 py-2 rounded border border-gray-200 text-left text-sm hover:bg-gray-50"
        data-pair-index="${d.pairIndex}" data-def-id="${escapeHtml(d.id)}">${escapeHtml(d.definition)}</button>
    `).join('');
  return `
      <p class="text-xs text-gray-500">Click a term, then its matching definition. Matched pairs lock in.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" data-match-board>
        <div class="space-y-2" data-match-terms>${terms}</div>
        <div class="space-y-2" data-match-defs>${defs}</div>
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
      </div>
    `;
}

/**
 * Bind interactions for choice / sata / match / flash after mount.
 * onGraded({ ok, expected }) — caller continues pool or finishes.
 */
export function wireSkillMcqInteractions(onGraded) {
  const gate = document.querySelector('.challenge-gate[data-challenge="skill-mcq"]');
  if (!gate || typeof onGraded !== 'function') return;
  const type = gate.getAttribute('data-quiz-type') || 'choice';

  if (type === 'choice') {
    gate.querySelectorAll('.challenge-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
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
        onGraded({ ok: false, expected: undefined, empty: true });
        return;
      }
      const ok = boxes.every((b) => (b.checked ? b.getAttribute('data-challenge-correct') === '1'
        : b.getAttribute('data-challenge-correct') !== '1'));
      onGraded({ ok });
    });
    return;
  }

  if (type === 'match') {
    let selectedTerm = null;
    const matched = new Set();
    const status = gate.querySelector('[data-match-status]');
    const total = gate.querySelectorAll('.skill-match-term').length;

    const refreshStatus = () => {
      if (status) status.textContent = `${matched.size} / ${total} matched`;
    };

    gate.querySelectorAll('.skill-match-term').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        gate.querySelectorAll('.skill-match-term').forEach((b) => b.classList.remove('ring-2', 'ring-indigo-500'));
        selectedTerm = btn;
        btn.classList.add('ring-2', 'ring-indigo-500');
      });
    });

    gate.querySelectorAll('.skill-match-def').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!selectedTerm || btn.disabled) return;
        const termIdx = selectedTerm.getAttribute('data-pair-index');
        const defIdx = btn.getAttribute('data-pair-index');
        if (termIdx === defIdx) {
          matched.add(termIdx);
          selectedTerm.disabled = true;
          btn.disabled = true;
          selectedTerm.classList.add('opacity-60', 'line-through');
          btn.classList.add('opacity-60', 'bg-emerald-50', 'border-emerald-300');
          selectedTerm.classList.remove('ring-2', 'ring-indigo-500');
          selectedTerm = null;
          refreshStatus();
        } else {
          btn.classList.add('bg-rose-50');
          setTimeout(() => btn.classList.remove('bg-rose-50'), 350);
          selectedTerm.classList.remove('ring-2', 'ring-indigo-500');
          selectedTerm = null;
        }
      });
    });

    gate.querySelector('.skill-quiz-check')?.addEventListener('click', () => {
      const ok = matched.size === total && total > 0;
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
  renderSkillMcqHtml,
  wireSkillMcqInteractions,
  getSkillMcqBank,
  getSkillMcqPoolSize,
  pickSkillMcqQuestion
};
