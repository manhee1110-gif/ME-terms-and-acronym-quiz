import {lessons, defaultLessonId, getLesson} from './lessons.mjs?v=13';

export {lessons, defaultLessonId};

// First-lesson aliases keep the data easy to inspect and test. The state
// helpers below support every future lesson added to lessons.mjs.
export const chapters = getLesson(defaultLessonId).chapters;
export const questions = getLesson(defaultLessonId).questions;
export const drills = getLesson(defaultLessonId).drills;

export function currentLesson(state) {
  return getLesson(state?.lessonId || defaultLessonId);
}

export function chaptersFor(state) {
  return currentLesson(state).chapters;
}

export function questionsFor(state) {
  const all = currentLesson(state).questions;
  if (!state?.questionIds?.length) return all;
  const selected = new Set(state.questionIds);
  return all.filter(question => selected.has(question.id));
}

export function drillsFor(state) {
  return currentLesson(state).drills;
}

function shuffled(items, random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function drawQuestionIds(lesson, random = Math.random) {
  const limit = lesson.classroomQuestionLimit;
  if (!limit || lesson.questions.length <= limit) return lesson.questions.map(question => question.id);
  const base = Math.floor(limit / lesson.chapters.length);
  let remainder = limit % lesson.chapters.length;
  const selected = new Set();
  lesson.chapters.forEach((_, chapter) => {
    const quota = base + (remainder-- > 0 ? 1 : 0);
    shuffled(lesson.questions.filter(question => question.chapter === chapter), random)
      .slice(0, quota)
      .forEach(question => selected.add(question.id));
  });
  return lesson.questions.filter(question => selected.has(question.id)).map(question => question.id);
}

export function freshState(lessonId = defaultLessonId, questionIds) {
  const lesson = getLesson(lessonId);
  return {
    lessonId: lesson.id,
    questionIds: questionIds || drawQuestionIds(lesson),
    phase: 'start', index: 0, misses: 0, firstTry: 0, tries: 0,
    selected: null, completed: 0, showTranslation: false,
    seen: [], wrongIds: []
  };
}

export function current(state) {
  const lessonQuestions = questionsFor(state);
  return lessonQuestions[Math.min(state.index, lessonQuestions.length - 1)];
}

export function start(state) {
  const first = questionsFor(state)[0];
  if (!first) return state;
  return {...freshState(state.lessonId, state.questionIds), phase: 'question', seen: [first.id]};
}

export function choose(state, option) {
  if (state.phase !== 'question' || !Number.isInteger(option) || option < 0 || option > 3) return state;
  const item = current(state);
  const right = option === item.correct;
  return {
    ...state,
    selected: option,
    phase: right ? 'correct' : 'incorrect',
    tries: state.tries + 1,
    misses: state.misses + (right ? 0 : 1),
    firstTry: state.firstTry + (right && state.tries === 0 ? 1 : 0),
    completed: state.completed + (right ? 1 : 0),
    wrongIds: right ? state.wrongIds : [...new Set([...state.wrongIds, item.id])]
  };
}

export function advance(state) {
  if (state.phase === 'start') return start(state);
  if (state.phase === 'incorrect') return {...state, phase: 'question', selected: null};
  if (state.phase === 'correct') {
    const lessonQuestions = questionsFor(state);
    if (state.index === lessonQuestions.length - 1) return {...state, phase: 'ending'};
    if (lessonQuestions[state.index + 1].chapter !== current(state).chapter) return {...state, phase: 'chapterClear'};
    return nextQuestion(state);
  }
  if (state.phase === 'chapterClear') return nextQuestion(state);
  return state;
}

function nextQuestion(state) {
  const index = state.index + 1;
  const next = questionsFor(state)[index];
  return {
    ...state, index, phase: 'question', tries: 0, selected: null,
    showTranslation: false, seen: [...new Set([...state.seen, next.id])]
  };
}

export function completionTime(state) {
  const total = 17 * 60 + state.misses * 5;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function endingLabel(state) {
  if (state.misses === 0) return '전 문항 최초 시도 정답 — 완벽한 임무 수행';
  if (state.misses <= 3) return '정확한 판단으로 학습 임무 완수';
  if (state.misses <= 8) return '재도전 끝에 학습 목표 달성';
  return '끝까지 포기하지 않은 끈기의 임무 수행자';
}
