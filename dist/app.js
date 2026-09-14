import {
  lessons, defaultLessonId, freshState, currentLesson, chaptersFor, questionsFor,
  drillsFor, current, choose, advance, completionTime, endingLabel
} from './game.mjs?v=8';
import {MotionScene} from './motion.mjs?v=8';
import {Typewriter} from './typewriter.mjs?v=8';
import {isAcceptedDictation, normalizeDictation} from './dictation.mjs?v=8';

const initialUrl = new URL(location.href);
const requestedLesson = lessons.find(item => item.id === initialUrl.searchParams.get('lesson') && item.available);
let state = freshState(requestedLesson?.id || defaultLessonId);
let surface = initialUrl.searchParams.get('mode') === 'solo' ? 'solo' : 'game';
let motion = null;
let typewriter = null;
let audioContext;
let soundEnabled = false;
let typedQuestionIds = new Set();
let individual;

function freshIndividual() {
  return {
    index: 0, stage: 'dictation', dictation: '', dictationAttempts: 0,
    dictationResult: null, showDictation: false, writing: '',
    writingResult: null, finished: false, audioMessage: ''
  };
}
individual = freshIndividual();

try {
  soundEnabled = (localStorage.getItem('military-english-sound') || localStorage.getItem('clock-out-sound')) === 'on';
} catch {}

const game = document.querySelector('#game');
const notebook = document.querySelector('#notebook');
const soundButton = document.querySelector('#sound');
const edition = document.querySelector('.edition');
const footerLesson = document.querySelector('#footer-lesson');
const notebookIntro = document.querySelector('.notebook-intro');
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const iconArrow = '<span aria-hidden="true"> ▸</span>';
const activeChapters = () => chaptersFor(state);
const activeQuestions = () => questionsFor(state);
const activeDrills = () => drillsFor(state);

function sound(kind) {
  if (!soundEnabled) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const notes = kind === 'wrong' ? [165, 131] : kind === 'correct' ? [440, 554, 659] : kind === 'finish' ? [392, 494, 587, 784] : [330];
    const now = audioContext.currentTime;
    notes.forEach((hz, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const time = now + index * .09;
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(hz, time);
      gain.gain.setValueAtTime(.022, time);
      gain.gain.exponentialRampToValueAtTime(.001, time + .075);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(time);
      oscillator.stop(time + .085);
    });
  } catch {}
}

function updateSound() {
  soundButton.textContent = soundEnabled ? '♪ 소리 끄기' : '♪ 소리 켜기';
  soundButton.setAttribute('aria-pressed', String(soundEnabled));
}

soundButton.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  try { localStorage.setItem('military-english-sound', soundEnabled ? 'on' : 'off'); } catch {}
  updateSound();
  if (soundEnabled) sound('tap');
});
updateSound();

const fullButton = document.querySelector('#fullscreen');
if (!document.fullscreenEnabled) fullButton.hidden = true;
fullButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { fullButton.hidden = true; }
});
document.addEventListener('fullscreenchange', () => {
  fullButton.textContent = document.fullscreenElement ? '화면 복귀' : '전체 화면';
});

function stopSpeech() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function disposeCinematic() {
  typewriter?.cancel();
  typewriter = null;
  motion?.dispose();
  motion = null;
}

function mountScene(options) {
  const canvas = document.querySelector('[data-motion-scene]');
  if (canvas) motion = new MotionScene(canvas, options);
  return motion;
}

function syncUrl() {
  const url = new URL(location.href);
  if (surface === 'solo') url.searchParams.set('mode', 'solo');
  else url.searchParams.delete('mode');
  if (surface === 'game' && state.phase === 'start') url.searchParams.delete('lesson');
  else url.searchParams.set('lesson', state.lessonId);
  history.replaceState({}, '', url);
}

function updateShell() {
  const lesson = currentLesson(state);
  const selecting = surface === 'game' && state.phase === 'start';
  edition.textContent = selecting ? 'MILITARY ENGLISH · MISSION SELECT' : `MILITARY ENGLISH · LESSON ${String(lesson.number).padStart(2, '0')}`;
  footerLesson.textContent = selecting ? '차시를 선택해 학습 임무를 시작하세요' : lesson.footer;
  notebookIntro.textContent = `${lesson.number}차시에서 만날 ${lesson.questions.length}개 표현입니다. 막히면 잠깐 확인해도 괜찮아요.`;
}

function resetGame(lessonId = state.lessonId) {
  typedQuestionIds = new Set();
  state = freshState(lessonId);
}

function showLessonSelect() {
  stopSpeech();
  surface = 'game';
  resetGame(defaultLessonId);
  individual = freshIndividual();
  syncUrl();
  render();
}

function launchLesson(lessonId, mode) {
  const lesson = lessons.find(item => item.id === lessonId && item.available);
  if (!lesson) return;
  stopSpeech();
  resetGame(lesson.id);
  individual = freshIndividual();
  surface = mode === 'solo' ? 'solo' : 'game';
  if (surface === 'game') state = advance(state);
  syncUrl();
  render();
  sound('tap');
}

document.querySelector('.wordmark').addEventListener('click', event => {
  event.preventDefault();
  showLessonSelect();
});

function openNotebook() {
  const lesson = currentLesson(state);
  document.querySelector('#notebook-list').innerHTML = activeQuestions().map(item => `
    <div class="notebook-entry">
      <strong>${escape(item.term)}</strong>
      <div>${state.seen.includes(item.id) ? '<small class="seen-badge">만난 단어</small>' : ''}${escape(item.meaning)}<span>${escape(item.full)}</span></div>
    </div>`).join('') + `<p class="source-note">${escape(lesson.sourceNote || '')}</p>`;
  if (!notebook.open) notebook.showModal();
}

document.querySelector('#notebook-open').addEventListener('click', openNotebook);
document.querySelector('#notebook-close').addEventListener('click', () => notebook.close());
notebook.addEventListener('click', event => {
  if (event.target !== notebook) return;
  const rect = notebook.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) notebook.close();
});

function screenTime() {
  const item = current(state);
  const chapter = activeChapters()[item.chapter];
  const parts = chapter.time.split(':').map(Number);
  const positionInChapter = activeQuestions().slice(0, state.index).filter(question => question.chapter === item.chapter).length;
  const total = parts[0] * 60 + parts[1] + positionInChapter * 8 + state.misses * 5;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function highlighted(text, term) {
  const safe = escape(text);
  const needle = escape(term);
  const index = safe.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return safe;
  return safe.slice(0, index) + '<mark>' + safe.slice(index, index + needle.length) + '</mark>' + safe.slice(index + needle.length);
}

function path() {
  const chapters = activeChapters();
  const active = current(state).chapter;
  return `<nav class="quest-path" aria-label="학습 임무 단계">${chapters.map((chapter, index) => `
    <div class="path-step ${index === active ? 'active' : index < active ? 'done' : ''}" ${index === active ? 'aria-current="step"' : ''}>
      <span class="step-num">${index < active ? '✓' : String(index + 1).padStart(2, '0')}</span>${escape(chapter.name)}
    </div>`).join('')}</nav>`;
}

function scene() {
  const chapter = activeChapters()[current(state).chapter];
  const questions = activeQuestions();
  const progress = state.completed / questions.length * 100;
  return `<section class="scene cinematic-scene ${state.phase === 'incorrect' ? 'wrong-scene' : state.phase === 'correct' ? 'correct-scene' : ''}" data-chapter="${current(state).chapter}">
    <canvas class="motion-canvas" data-motion-scene aria-hidden="true"></canvas>
    <div class="scene-top">
      <div class="location"><b>${screenTime()}</b><span>${escape(chapter.place)}</span></div>
      <div class="shift-status">
        <div class="shift-head"><span>학습 임무 ${state.completed} / ${questions.length}</span><strong>${state.misses ? `재도전 ${state.misses}회` : '정확도 보너스 도전'}</strong></div>
        <div class="meter" role="progressbar" aria-label="학습 임무 진행률" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${state.completed}"><div class="meter-fill" style="width:${progress}%"></div></div>
      </div>
    </div>
    <div class="npc-label"><strong>${escape(chapter.nameEn)}</strong><span>${escape(chapter.role)}</span></div>
    <div class="talk-indicator" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="scene-callout">${escape(chapter.callout)}</div>
  </section>`;
}

function controls() {
  const item = current(state);
  const questions = activeQuestions();
  if (state.phase === 'question') {
    return `<p class="question-label">${escape(item.ask)}</p><div class="choices">${item.options.map((option, index) => `
      <button class="choice" data-option="${index}" type="button"><span class="choice-no">${index + 1}</span><span>${escape(option)}</span></button>`).join('')}</div>`;
  }
  const wrong = state.phase === 'incorrect';
  const next = questions[state.index + 1];
  const nextLabel = wrong ? '힌트 보고 다시 선택하기' : !next ? '임무 결과 보기' : next.chapter !== item.chapter ? '다음 관문으로' : '다음 상황';
  return `<div class="feedback ${wrong ? 'wrong' : 'correct'}" role="status">
    <div class="feedback-stamp">${wrong ? '재확인 필요' : '판단 완료'}</div>
    ${wrong ? '<p class="penalty">보완 학습 +5분</p>' : ''}
    <p class="reaction">${escape(wrong ? item.bad : item.good)}</p>
    <p class="hint">${wrong ? `<b>힌트.</b> ${escape(item.hint)}` : `<b>${escape(item.term)}</b> = ${escape(item.full)}<br>${escape(item.meaning)}`}</p>
    <button id="advance" class="primary-button next-button" type="button">${nextLabel}${iconArrow}</button>
  </div>`;
}

function revealDialogue(item, line, instant) {
  const update = text => { line.innerHTML = highlighted(text, item.term); };
  if (instant) { update(item.line); return; }
  motion?.react('talk');
  typewriter = new Typewriter();
  typewriter.start(item.line, {speed: 24, onUpdate: update, onDone: () => motion?.react('idle')});
  line.closest('.dialogue')?.addEventListener('click', () => typewriter?.finish(), {once: true});
}

function renderQuestion() {
  disposeCinematic();
  const chapter = activeChapters()[current(state).chapter];
  const item = current(state);
  const questions = activeQuestions();
  game.innerHTML = `${scene()}${path()}<div class="encounter">
    <section class="dialogue" aria-labelledby="speaker-name">
      <div class="speaker"><b id="speaker-name">${escape(chapter.nameEn)}</b><span>${escape(chapter.nameKo)}</span><small class="skip-cue">대사창 클릭: 빨리 보기</small></div>
      <p id="dialogue-line" class="line" lang="en" aria-live="polite"></p>
      ${state.showTranslation ? `<p class="translation">${escape(item.translation)}</p>` : ''}
      <div class="dialogue-tools"><button id="translation" class="translate-button" type="button" aria-expanded="${state.showTranslation}">${state.showTranslation ? '해석 닫기' : '한국어 도움'}</button><span class="question-count">${String(state.index + 1).padStart(2, '0')} / ${String(questions.length).padStart(2, '0')}</span></div>
    </section>
    <section class="choices-panel" aria-label="답변 선택">${controls()}</section>
  </div>`;
  const entering = state.phase === 'question' && (state.index === 0 || questions[state.index - 1]?.chapter !== item.chapter) && state.tries === 0;
  mountScene({mode: 'encounter', chapter: item.chapter, entering});
  if (state.phase === 'incorrect') motion?.react('wrong');
  else if (state.phase === 'correct') motion?.react('happy');
  const typedId = `${state.lessonId}:${item.id}`;
  const firstDisplay = state.phase === 'question' && !typedQuestionIds.has(typedId);
  if (firstDisplay) typedQuestionIds.add(typedId);
  revealDialogue(item, document.querySelector('#dialogue-line'), !firstDisplay);
  document.querySelectorAll('[data-option]').forEach(button => button.addEventListener('click', () => pick(Number(button.dataset.option))));
  document.querySelector('#translation').addEventListener('click', () => {
    state = {...state, showTranslation: !state.showTranslation};
    renderQuestion();
    document.querySelector('#translation').focus({preventScroll: true});
  });
  document.querySelector('#advance')?.addEventListener('click', go);
}

function lessonCard(lesson) {
  const number = String(lesson.number).padStart(2, '0');
  if (!lesson.available) {
    return `<article class="lesson-card locked" aria-disabled="true">
      <div class="lesson-card-top"><span>LESSON ${number}</span><b>LOCKED</b></div>
      <h2>${escape(lesson.titleKo)}</h2><p>${escape(lesson.description)}</p>
      <div class="lesson-pending">단어 목록 추가 예정</div>
    </article>`;
  }
  return `<article class="lesson-card available">
    <div class="lesson-card-top"><span>LESSON ${number}</span><b>READY</b></div>
    <h2>${escape(lesson.titleKo)}</h2><p>${escape(lesson.description)}</p>
    <div class="lesson-actions">
      <button class="lesson-play" data-classroom="${escape(lesson.id)}" type="button">강의실 게임${iconArrow}</button>
      <button class="lesson-solo" data-solo="${escape(lesson.id)}" type="button">개별 훈련</button>
    </div>
  </article>`;
}

function renderStart() {
  disposeCinematic();
  game.innerHTML = `<section class="scene start-scene mission-select cinematic-scene">
    <canvas class="motion-canvas" data-motion-scene aria-hidden="true"></canvas>
    <div class="start-content">
      <span class="day-tag">MILITARY ENGLISH · MISSION SELECT</span>
      <h1 class="game-title"><em>임무</em> 수행하겠습니다!</h1>
      <div class="title-en">MILITARY ENGLISH MISSION</div>
      <p class="start-tagline">차시를 선택하고, 상황 속 군사용어 임무에 도전하세요.</p>
      <div class="lesson-grid">${lessons.map(lessonCard).join('')}</div>
      <p class="start-guide">강의실 게임은 함께 선택하고, 개별 훈련은 각자 듣고 받아쓰고 보고합니다.</p>
    </div>
  </section>`;
  mountScene({mode: 'start', chapter: 0, entering: true});
  document.querySelectorAll('[data-classroom]').forEach(button => button.addEventListener('click', () => launchLesson(button.dataset.classroom, 'game')));
  document.querySelectorAll('[data-solo]').forEach(button => button.addEventListener('click', () => launchLesson(button.dataset.solo, 'solo')));
}

function renderClear() {
  disposeCinematic();
  const chapters = activeChapters();
  const questions = activeQuestions();
  const chapterIndex = current(state).chapter;
  const next = chapters[chapterIndex + 1];
  const learned = questions.filter(item => item.chapter === chapterIndex);
  game.innerHTML = `<section class="clear-layout cinematic-clear">
    <canvas class="motion-canvas" data-motion-scene aria-hidden="true"></canvas>
    <div class="travel-caption"><span>NEXT MISSION</span><b>${escape(next.nameKo)}</b></div>
    <div class="clear-panel">
      <span class="eyebrow">STAGE ${chapterIndex + 1} CLEAR</span>
      <h2>${escape(chapters[chapterIndex].clear)}</h2>
      <p class="clear-message">${escape(chapters[chapterIndex].clearLine)}</p>
      <div class="words-earned">${learned.map(item => `<span>${escape(item.term)}</span>`).join('')}</div>
      <button id="advance" class="primary-button" type="button">${escape(next.nameKo)} 만나러 가기${iconArrow}</button>
      <p class="next-chapter">${escape(next.intro)}</p>
    </div>
  </section>`;
  mountScene({mode: 'travel', chapter: chapterIndex + 1, duration: 3200});
  document.querySelector('#advance').addEventListener('click', go);
}

function renderEnding() {
  disposeCinematic();
  const lesson = currentLesson(state);
  const questions = activeQuestions();
  const chapters = activeChapters();
  game.innerHTML = `<section class="clear-layout cinematic-clear ending-layout">
    <canvas class="motion-canvas" data-motion-scene aria-hidden="true"></canvas>
    <div class="clear-panel">
      <span class="eyebrow">LESSON ${String(lesson.number).padStart(2, '0')} · MISSION COMPLETE</span>
      <h1>학습 임무 완료!</h1>
      <div class="clock-out-label">임무 완료 시각</div>
      <div class="clock-out">${completionTime(state)}</div>
      <p class="clear-message">${escape(endingLabel(state))}</p>
      <div class="ending-stats">
        <div><b>${state.completed} / ${questions.length}</b><span>용어 임무 완료</span></div>
        <div><b>${state.firstTry}</b><span>한 번에 정답</span></div>
        <div><b>${state.misses}</b><span>다시 도전</span></div>
      </div>
      <div class="ending-actions">
        <button id="again" class="primary-button" type="button">같은 차시 다시 도전</button>
        <button id="lesson-select" class="secondary-button" type="button">차시 선택으로</button>
        <button id="review-words" class="secondary-button" type="button">단어 수첩 보기</button>
      </div>
      ${state.wrongIds.length ? `<p class="mistake-list">한 번 더 볼 단어: ${state.wrongIds.map(id => escape(questions.find(item => item.id === id).term)).join(' · ')}</p>` : ''}
      <p class="ending-note">“Mission complete. Well done.”<br>오늘의 용어를 다음 상황에서도 정확히 적용해 보자.</p>
    </div>
  </section>`;
  mountScene({mode: 'ending', chapter: chapters.length - 1, duration: 9000});
  document.querySelector('#again').addEventListener('click', () => launchLesson(lesson.id, 'game'));
  document.querySelector('#lesson-select').addEventListener('click', showLessonSelect);
  document.querySelector('#review-words').addEventListener('click', openNotebook);
}

function currentDrill() {
  return activeDrills()[individual.index];
}

function phraseWasHeard(phrase, input) {
  const words = String(phrase).toLowerCase().match(/[a-z0-9]+/g) || [];
  const received = String(input).toLowerCase().match(/[a-z0-9]+/g) || [];
  return words.length && words.every(word => received.includes(word));
}

function dictationGuidance(drill) {
  const caught = drill.keyPhrases.filter(phrase => phraseWasHeard(phrase, individual.dictation));
  const common = drill.commonMistakes?.find(item => item.pattern.test(individual.dictation));
  const caughtLine = caught.length ? `잡은 표현: ${caught.map(escape).join(' · ')}` : drill.decode ? '코드워드를 한 묶음씩 다시 확인해 봐요.' : '이번에는 문장 뼈대부터 다시 잡아 봐요.';
  return `<p>${caughtLine}</p>${common ? `<p class="specific-correction"><b>바로잡기.</b> ${escape(common.message)}</p>` : ''}<div class="listen-scaffold"><span>다시 들을 곳</span><p>${escape(drill.listenFocus)}</p><code>${escape(drill.frame)}</code></div>`;
}

function speak(text) {
  if (!('speechSynthesis' in window)) {
    individual.audioMessage = '이 브라우저에서는 자동 읽기가 지원되지 않습니다.';
    renderSolo();
    return;
  }
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = .78;
  utterance.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(item => /^en-US/i.test(item.lang)) || voices.find(item => /^en/i.test(item.lang));
  if (voice) utterance.voice = voice;
  utterance.onstart = () => motion?.react('talk');
  utterance.onend = () => motion?.react('idle');
  utterance.onerror = () => { individual.audioMessage = '소리가 재생되지 않았어요. 다시 눌러 보세요.'; };
  window.speechSynthesis.speak(utterance);
}

function dictationFeedback(drill) {
  const answer = drill.expected || drill.listen;
  const transmission = drill.expected && drill.expected !== drill.listen ? `<span>들린 무전</span>${escape(drill.listen)}` : '';
  if (individual.dictationResult === 'correct') {
    return `<div class="solo-feedback correct"><b>TRANSMISSION RECEIVED</b><p>${drill.decode ? '좋아. 무전 내용을 정확히 해독했어.' : '좋아. 문장이 정확히 들렸어.'}</p><div class="model-answer"><span>${drill.decode ? '해독 결과' : '정답 문장'}</span>${escape(answer)}${transmission}</div><button id="to-writing" class="primary-button" type="button">이제 문장 답변 쓰기${iconArrow}</button></div>`;
  }
  if (individual.dictationResult === 'wrong') {
    return `<div class="solo-feedback wrong"><b>CHECK THE COMMS</b><p>${drill.decode ? '아직 해독 결과가 맞지는 않아. 하이픈·문장부호·대소문자는 표기 차이로 처리하니, 코드워드의 문자와 숫자를 다시 확인해 봐.' : '아직 문장 전체가 맞지는 않아. 하이픈·문장부호·대소문자는 표기 차이로 처리하니, 그 외에 들린 단어를 다시 확인해 봐.'}</p>${dictationGuidance(drill)}${individual.dictationAttempts > 1 ? `<button id="show-dictation" class="secondary-button" type="button">정답 + 끊어 읽기 보기</button>${individual.showDictation ? `<div class="model-answer"><span>${drill.decode ? '해독 결과' : '정답 문장'}</span>${escape(answer)}${transmission}<span>끊어 읽기</span>${escape(drill.frame.replaceAll('___', '…'))}</div>` : ''}` : ''}</div>`;
  }
  return '';
}

function writingFeedback(drill) {
  const drills = activeDrills();
  if (!individual.writingResult) return '';
  if (individual.writingResult.correct) {
    return `<div class="solo-feedback correct"><b>MESSAGE SENT</b><p>핵심 정보가 들어간 문장이야.</p><div class="model-answer"><span>예시 답안</span>${escape(drill.model)}</div><button id="next-drill" class="primary-button" type="button">${individual.index === drills.length - 1 ? '개별 훈련 종료' : '다음 표현'}${iconArrow}</button></div>`;
  }
  return `<div class="solo-feedback wrong"><b>MESSAGE NEEDS WORK</b><p>${escape(individual.writingResult.message)}</p><div class="model-answer"><span>예시 답안</span>${escape(drill.model)}</div></div>`;
}

function renderSolo() {
  disposeCinematic();
  const lesson = currentLesson(state);
  const drills = activeDrills();
  if (individual.finished) {
    game.innerHTML = `<section class="clear-layout cinematic-clear solo-finish">
      <canvas class="motion-canvas" data-motion-scene aria-hidden="true"></canvas>
      <div class="clear-panel"><span class="eyebrow">LESSON ${String(lesson.number).padStart(2, '0')} · INDIVIDUAL TRAINING COMPLETE</span><h1>개별 통신 훈련 완료</h1><p class="clear-message">듣고, 해독하고, 한 문장으로 보고하는 ${drills.length}개 훈련을 마쳤어.</p><div class="words-earned">${drills.map(item => `<span>${escape(item.term)}</span>`).join('')}</div><div class="ending-actions"><button id="solo-again" class="primary-button" type="button">같은 훈련 다시 하기</button><button id="classroom-game" class="secondary-button" type="button">강의실 게임</button><button id="lesson-select" class="secondary-button" type="button">차시 선택</button></div></div>
    </section>`;
    mountScene({mode: 'ending', chapter: activeChapters().length - 1, duration: 9000});
    document.querySelector('#solo-again').addEventListener('click', () => { individual = freshIndividual(); renderSolo(); });
    document.querySelector('#classroom-game').addEventListener('click', () => launchLesson(lesson.id, 'game'));
    document.querySelector('#lesson-select').addEventListener('click', showLessonSelect);
    return;
  }
  const drill = currentDrill();
  const dictation = individual.stage === 'dictation';
  game.innerHTML = `<section class="solo-layout">
    <div class="solo-cinema"><canvas class="motion-canvas" data-motion-scene aria-hidden="true"></canvas><div class="solo-hud"><button id="lesson-select" class="back-button" type="button">← 차시 선택</button><span>LESSON ${String(lesson.number).padStart(2, '0')} · PERSONAL COMMS LAB</span><b>${String(individual.index + 1).padStart(2, '0')} / ${String(drills.length).padStart(2, '0')}</b></div><div class="solo-term">${escape(drill.term)}</div></div>
    <div class="solo-workspace"><header class="solo-header"><span class="eyebrow">${dictation ? (drill.decode ? 'LISTEN · DECODE' : 'LISTEN · DICTATE') : 'WRITE · REPORT'}</span><h1>${dictation ? (drill.dictationTitle || '듣고, 한 문장을 받아쓰세요.') : '상황에 맞게 한 문장으로 답하세요.'}</h1><p>${dictation ? (drill.dictationInstruction || '소리를 원하는 만큼 반복해서 듣고, 문장 전체를 입력해요.') : '정답 하나를 외우는 문제가 아니라, 핵심 정보가 들어간 짧은 보고 문장을 만드는 연습이에요.'}</p></header>
      ${dictation ? `<section class="solo-card"><button id="listen" class="listen-button" type="button"><span aria-hidden="true">▶</span> 0.8× 속도로 듣기</button><p class="listen-note">${individual.audioMessage || '영어 음성은 이 기기의 브라우저가 읽어 줍니다.'}</p><form id="dictation-form"><label for="dictation">${escape(drill.inputLabel || '들린 문장')}</label><input id="dictation" autocomplete="off" autocapitalize="none" spellcheck="false" value="${escape(individual.dictation)}" placeholder="${escape(drill.placeholder || 'Type the whole sentence…')}" aria-describedby="dictation-help"><small id="dictation-help">${escape(drill.inputHelp || '하이픈, 쉼표, 마침표와 대소문자는 신경 쓰지 않아도 돼요.')}</small><button class="primary-button" type="submit">${drill.decode ? '해독 확인' : '받아쓰기 확인'}${iconArrow}</button></form>${dictationFeedback(drill)}</section>` : `<section class="solo-card writing-card"><div class="writing-situation"><span>SITUATION</span><p>${escape(drill.write)}</p></div><form id="writing-form"><label for="writing">나의 보고 문장</label><textarea id="writing" rows="4" spellcheck="true" placeholder="Write one clear sentence in English.">${escape(individual.writing)}</textarea><div class="required-words"><span>문장에 포함할 정보</span>${drill.required.map(item => `<b>${escape(item)}</b>`).join('')}</div><button class="primary-button" type="submit">문장 점검${iconArrow}</button></form>${writingFeedback(drill)}</section>`}
    </div>
  </section>`;
  mountScene({mode: 'encounter', chapter: drill.chapter, entering: true});
  motion?.react(dictation ? 'talk' : 'idle');
  document.querySelector('#lesson-select').addEventListener('click', showLessonSelect);
  if (dictation) {
    document.querySelector('#listen').addEventListener('click', () => { speak(drill.listen); sound('tap'); });
    document.querySelector('#dictation').addEventListener('input', event => { individual.dictation = event.target.value; });
    document.querySelector('#dictation-form').addEventListener('submit', event => {
      event.preventDefault();
      individual.dictationAttempts++;
      individual.dictationResult = isAcceptedDictation(individual.dictation, drill.expected || drill.listen, drill.accepted) ? 'correct' : 'wrong';
      sound(individual.dictationResult === 'correct' ? 'correct' : 'wrong');
      renderSolo();
    });
    document.querySelector('#show-dictation')?.addEventListener('click', () => { individual.showDictation = true; renderSolo(); });
    document.querySelector('#to-writing')?.addEventListener('click', () => { individual.stage = 'writing'; renderSolo(); });
  } else {
    document.querySelector('#writing').addEventListener('input', event => { individual.writing = event.target.value; });
    document.querySelector('#writing-form').addEventListener('submit', event => {
      event.preventDefault();
      const answer = individual.writing.trim();
      const normalizedAnswer = normalizeDictation(answer);
      const missing = drill.required.filter(item => !normalizedAnswer.includes(normalizeDictation(item)));
      const enoughWords = answer.split(/\s+/).filter(Boolean).length >= (drill.minWords ?? 3);
      individual.writingResult = missing.length || !enoughWords
        ? {correct: false, message: missing.length ? `문장에 ${missing.join(', ')}을(를) 넣어 보세요.` : '짧은 단어 나열보다, 3단어 이상 한 문장으로 써 보세요.'}
        : {correct: true};
      sound(individual.writingResult.correct ? 'correct' : 'wrong');
      renderSolo();
    });
    document.querySelector('#next-drill')?.addEventListener('click', () => {
      if (individual.index === drills.length - 1) individual.finished = true;
      else individual = {...freshIndividual(), index: individual.index + 1};
      renderSolo();
    });
  }
}

function render() {
  disposeCinematic();
  updateShell();
  syncUrl();
  if (surface === 'solo') { renderSolo(); return; }
  if (state.phase === 'start') renderStart();
  else if (state.phase === 'chapterClear') renderClear();
  else if (state.phase === 'ending') renderEnding();
  else renderQuestion();
}

function pick(option) {
  if (state.phase !== 'question') return;
  typewriter?.finish();
  state = choose(state, option);
  sound(state.phase === 'correct' ? 'correct' : 'wrong');
  renderQuestion();
  document.querySelector('#advance')?.focus({preventScroll: true});
}

function go() {
  const prior = state.phase;
  typewriter?.finish();
  state = advance(state);
  if (prior === state.phase && state.phase === 'ending') return;
  render();
  sound(state.phase === 'ending' ? 'finish' : 'tap');
  const target = document.querySelector('.choice') || document.querySelector('#advance') || document.querySelector('#again');
  target?.focus({preventScroll: true});
}

document.addEventListener('keydown', event => {
  if (event.repeat || notebook.open || event.altKey || event.metaKey || event.ctrlKey) return;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  if (surface === 'game' && typewriter?.active && event.key === 'Enter') {
    event.preventDefault();
    typewriter.finish();
    return;
  }
  if (surface === 'game' && state.phase === 'question' && /^[1-4]$/.test(event.key)) {
    event.preventDefault();
    pick(Number(event.key) - 1);
  } else if (surface === 'game' && event.key === 'Enter' && document.activeElement?.tagName !== 'BUTTON' && ['incorrect', 'correct', 'chapterClear'].includes(state.phase)) {
    event.preventDefault();
    go();
  }
});

render();
