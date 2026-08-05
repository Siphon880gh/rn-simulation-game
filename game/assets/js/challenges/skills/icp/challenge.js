/**
 * ICP monitoring skill check — random MCQ.
 * Author content: ./config.js
 */
import { GameConfig } from '../../../game-config.js';
import { icpChallengeConfig } from './config.js';
import { challengeMediaHtml } from '../../../media-placeholders.js';

function cfg() {
  return GameConfig.icpChallenge || icpChallengeConfig || {};
}

export function isIcpTask(task) {
  const challenge = String(task?.metadata?.challenge || '').toLowerCase();
  return challenge === 'icp';
}

export function getIcpQuestions() {
  const list = cfg().questions;
  return Array.isArray(list) && list.length ? list : icpChallengeConfig.questions;
}

export function getIcpPoolSize() {
  return getIcpQuestions().length;
}

/** Question ids in config order (caller should shuffle for a run). */
export function getIcpQuestionIds() {
  return getIcpQuestions()
    .map((q) => q?.id)
    .filter((id) => id != null && id !== '')
    .map(String);
}

export function pickIcpQuestion(opts = {}) {
  const pool = getIcpQuestions();
  if (opts.questionId != null && opts.questionId !== '') {
    const wanted = String(opts.questionId);
    const exact = pool.find((q) => String(q.id) === wanted);
    if (exact) return exact;
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
  return candidates[idx];
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
 * @returns {{ title: string, prompt: string, choices: {label:string,correct:boolean}[], expected: string }|null}
 */
export function buildIcpQuiz(task, opts = {}) {
  if (!isIcpTask(task)) return null;
  const question = opts.question || pickIcpQuestion(opts);
  if (!question) return null;
  const labels = shuffle(question.choices || [], opts.random);
  return {
    title: 'ICP monitoring',
    prompt: question.prompt,
    choices: labels.map((label) => ({
      label,
      correct: String(label).trim() === String(question.correct).trim()
    })),
    expected: question.correct,
    questionId: question.id
  };
}

export function renderIcpQuizHtml(quiz, taskName, opts = {}) {
  if (!quiz) return '';
  const poolSize = Number(opts.poolSize) || getIcpPoolSize() || 1;
  const levelHtml = poolSize > 1 ? (opts.levelHtml || '') : '';
  const choices = (quiz.choices || []).map((c, i) => `
      <button type="button" class="challenge-choice px-3 py-2 rounded border border-gray-200 text-left text-sm hover:bg-gray-50"
        data-challenge-correct="${c.correct ? '1' : '0'}" data-choice-index="${i}">${c.label}</button>
    `).join('');
  const randomHint = poolSize > 1
    ? '<p class="text-xs text-gray-500">Give up on this prompt? Use <strong>Random</strong> for another question.</p>'
    : '';
  return `
      <div class="challenge-gate space-y-3 text-left" data-challenge="icp" data-question-id="${quiz.questionId || ''}" data-pool-size="${poolSize}">
        ${levelHtml}
        ${challengeMediaHtml('icp')}
        <p class="text-sm text-gray-900 font-semibold" data-quiz-prompt>${quiz.prompt}</p>
        <p class="text-xs text-gray-500">Skill focus: ${taskName || 'ICP monitoring'}.</p>
        ${randomHint}
        <div class="flex flex-col gap-2" data-quiz-choices>${choices}</div>
        <p id="challenge-feedback" class="text-sm font-medium rounded px-3 py-2 hidden" role="status" aria-live="polite"></p>
      </div>
    `;
}

export default {
  isIcpTask,
  buildIcpQuiz,
  renderIcpQuizHtml,
  pickIcpQuestion,
  getIcpPoolSize
};
