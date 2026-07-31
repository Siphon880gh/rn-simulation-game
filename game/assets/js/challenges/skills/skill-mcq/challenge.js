/**
 * Shared skill-library MCQ — bank keyed by metadata.skillId.
 * Author content: ./config.js
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

export function getSkillMcqPoolSize(skillId) {
  const bank = getSkillMcqBank(skillId);
  const pool = Array.isArray(bank?.questions) ? bank.questions : [];
  return pool.length;
}

export function pickSkillMcqQuestion(skillId, opts = {}) {
  const bank = getSkillMcqBank(skillId);
  const pool = Array.isArray(bank?.questions) ? bank.questions : [];
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

/**
 * @returns {{ title: string, prompt: string, choices: {label:string,correct:boolean}[], expected: string, skillId: string }|null}
 */
export function buildSkillMcqQuiz(task, opts = {}) {
  if (!isSkillMcqTask(task)) return null;
  const skillId = String(task?.metadata?.skillId || opts.skillId || '').trim();
  if (!skillId) return null;
  const picked = pickSkillMcqQuestion(skillId, opts);
  if (!picked?.question) return null;
  const { bank, question } = picked;
  const labels = shuffle(question.choices || [], opts.random);
  return {
    title: bank.title || skillId,
    prompt: question.prompt,
    choices: labels.map((label) => ({
      label,
      correct: String(label).trim() === String(question.correct).trim()
    })),
    expected: question.correct,
    questionId: question.id,
    skillId
  };
}

export function renderSkillMcqHtml(quiz, taskName, opts = {}) {
  if (!quiz) return '';
  const poolSize = Number(opts.poolSize) || getSkillMcqPoolSize(quiz.skillId) || 1;
  const levelHtml = poolSize > 1
    ? (opts.levelHtml || '')
    : '';
  const choices = (quiz.choices || []).map((c, i) => `
      <button type="button" class="challenge-choice px-3 py-2 rounded border border-gray-200 text-left text-sm hover:bg-gray-50"
        data-challenge-correct="${c.correct ? '1' : '0'}" data-choice-index="${i}">${c.label}</button>
    `).join('');
  const randomHint = poolSize > 1
    ? '<p class="text-xs text-gray-500">Give up on this prompt? Use <strong>Random</strong> for another question.</p>'
    : '';
  return `
      <div class="challenge-gate space-y-3 text-left" data-challenge="skill-mcq" data-question-id="${quiz.questionId || ''}" data-pool-size="${poolSize}">
        ${levelHtml}
        <p class="text-sm text-gray-900 font-semibold" data-quiz-prompt>${quiz.prompt}</p>
        <p class="text-sm text-gray-600">${GameConfig.challengeCopy?.pauseBanner
          || 'Timer is paused. Complete this game/quiz.'}</p>
        <p class="text-xs text-gray-500">Skill focus: ${taskName || quiz.title}.</p>
        ${randomHint}
        <div class="flex flex-col gap-2" data-quiz-choices>${choices}</div>
        <p id="challenge-feedback" class="text-sm font-medium rounded px-3 py-2 hidden" role="status" aria-live="polite"></p>
      </div>
    `;
}

export default {
  isSkillMcqTask,
  buildSkillMcqQuiz,
  renderSkillMcqHtml,
  getSkillMcqBank,
  getSkillMcqPoolSize,
  pickSkillMcqQuestion
};
