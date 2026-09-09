import {chapters,questions,freshState,current,choose,advance,clockOut,endingLabel} from './game.mjs';
import {MotionScene} from './motion.mjs';
import {Typewriter} from './typewriter.mjs';
import {isAcceptedDictation} from './dictation.mjs';

let state=freshState();
let surface=new URL(location.href).searchParams.get('mode')==='solo'?'solo':'game';
let motion=null;
let typewriter=null;
let audioContext;
let soundEnabled=false;
let typedQuestionIds=new Set();
let individual;

const drills=[
 {term:'NLT',chapter:0,listen:'Be at the training brief no later than zero eight thirty.',accepted:['Be at the training brief no later than 0830.','Be at the training brief no later than 08:30.'],write:'You are replying to SGM Miller. Write one sentence: tell him that you will arrive by 0830.',required:['NLT','0830'],model:'I will be at the training brief NLT 0830.'},
 {term:'CPX',chapter:0,listen:'Today is a command post exercise.',write:'Write one sentence to tell your teammate what today’s training is.',required:['CPX'],model:'Today is a CPX.'},
 {term:'FTX',chapter:0,listen:'Next week, the troops will go to the field for a field training exercise.',write:'Write one sentence to explain what the troops will do next week.',required:['FTX'],model:'The troops will conduct an FTX next week.'},
 {term:'ETA',chapter:2,listen:'The convoy’s estimated time of arrival is fourteen hundred.',write:'Reply to the receiving team in one sentence. Include the convoy’s ETA and 1400.',required:['ETA','1400'],model:'The convoy’s ETA is 1400.'},
 {term:'TPFDD',chapter:2,listen:'Please update the time-phased force and deployment data.',accepted:['Please update the time phased force and deployment data.','Please update the time-phased force and deployment data.','Please update the time phased force deployment data.'],write:'Write one sentence to report that the deployment data has been updated.',required:['TPFDD'],model:'The TPFDD has been updated.'},
 {term:'RSOI',chapter:2,listen:'The incoming unit is going through reception, staging, onward movement, and integration.',write:'Write one sentence to tell your team what the incoming unit is going through.',required:['RSOI'],model:'The incoming unit is going through RSOI.'},
 {term:'NEO',chapter:3,listen:'We will practice moving noncombatants to safety.',write:'Write one sentence to identify this exercise.',required:['NEO'],model:'We will conduct an NEO exercise.'}
];

function freshIndividual(){return {index:0,stage:'dictation',dictation:'',dictationAttempts:0,dictationResult:null,showDictation:false,writing:'',writingResult:null,finished:false,audioMessage:''};}
individual=freshIndividual();
try{soundEnabled=localStorage.getItem('clock-out-sound')==='on';}catch{}

const game=document.querySelector('#game');
const notebook=document.querySelector('#notebook');
const soundButton=document.querySelector('#sound');
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const iconArrow='<span aria-hidden="true"> ▸</span>';

function sound(kind){
 if(!soundEnabled)return;
 try{
  audioContext??=new(window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
  const notes=kind==='wrong'?[165,131]:kind==='correct'?[440,554,659]:kind==='finish'?[392,494,587,784]:[330];
  const now=audioContext.currentTime;
  notes.forEach((hz,index)=>{const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),time=now+index*.09;oscillator.type='square';oscillator.frequency.setValueAtTime(hz,time);gain.gain.setValueAtTime(.022,time);gain.gain.exponentialRampToValueAtTime(.001,time+.075);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(time);oscillator.stop(time+.085);});
 }catch{}
}
function updateSound(){soundButton.textContent=soundEnabled?'♪ 소리 끄기':'♪ 소리 켜기';soundButton.setAttribute('aria-pressed',String(soundEnabled));}
soundButton.addEventListener('click',()=>{soundEnabled=!soundEnabled;try{localStorage.setItem('clock-out-sound',soundEnabled?'on':'off');}catch{}updateSound();if(soundEnabled)sound('tap');});
updateSound();

const fullButton=document.querySelector('#fullscreen');
if(!document.fullscreenEnabled)fullButton.hidden=true;
fullButton.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{fullButton.hidden=true;}});
document.addEventListener('fullscreenchange',()=>{fullButton.textContent=document.fullscreenElement?'화면 복귀':'전체 화면';});

function stopSpeech(){if('speechSynthesis' in window)window.speechSynthesis.cancel();}
function disposeCinematic(){typewriter?.cancel();typewriter=null;motion?.dispose();motion=null;}
function mountScene(options){const canvas=document.querySelector('[data-motion-scene]');if(canvas)motion=new MotionScene(canvas,options);return motion;}
function resetGame(){typedQuestionIds=new Set();state=freshState();}
function setSurface(next){
 stopSpeech();
 surface=next;
 const url=new URL(location.href);
 if(next==='solo')url.searchParams.set('mode','solo');else url.searchParams.delete('mode');
 history.replaceState({},'',url);
 render();
}
document.querySelector('.wordmark').addEventListener('click',event=>{event.preventDefault();resetGame();setSurface('game');});

function openNotebook(){
 document.querySelector('#notebook-list').innerHTML=questions.map(item=>`<div class="notebook-entry"><strong>${escape(item.term)}</strong><div>${state.seen.includes(item.id)?'<small class="seen-badge">만난 단어</small>':''}${escape(item.meaning)}<span>${escape(item.full)}</span></div></div>`).join('')+`<p class="source-note">1차시 훈련·시간 용어 13개와 공통약어 NLT·ETA·ETD를 연습합니다. 상황과 등장인물은 가상입니다. TPFDD 풀네임은 <a href="https://www.jcs.mil/Portals/36/Documents/Library/Handbooks/CJCS%20Guide%203130.pdf" target="_blank" rel="noopener noreferrer">미 합참 자료</a>를 참고했습니다.</p>`;
 if(!notebook.open)notebook.showModal();
}
document.querySelector('#notebook-open').addEventListener('click',openNotebook);
document.querySelector('#notebook-close').addEventListener('click',()=>notebook.close());
notebook.addEventListener('click',event=>{if(event.target===notebook){const rect=notebook.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)notebook.close();}});

function screenTime(){
 const chapter=chapters[current(state).chapter],parts=chapter.time.split(':').map(Number);
 const total=parts[0]*60+parts[1]+(state.index%4)*8+state.misses*5;
 return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}
function highlighted(text,term){
 const safe=escape(text),needle=escape(term),index=safe.toLowerCase().indexOf(needle.toLowerCase());
 if(index<0)return safe;
 return safe.slice(0,index)+'<mark>'+safe.slice(index,index+needle.length)+'</mark>'+safe.slice(index+needle.length);
}
function path(){
 const active=current(state).chapter;
 return `<nav class="quest-path" aria-label="오늘의 업무">${chapters.map((chapter,index)=>`<div class="path-step ${index===active?'active':index<active?'done':''}" ${index===active?'aria-current="step"':''}><span class="step-num">${index<active?'✓':String(index+1).padStart(2,'0')}</span>${escape(chapter.name)}</div>`).join('')}</nav>`;
}
function scene(){
 const chapter=chapters[current(state).chapter];
 return `<section class="scene cinematic-scene ${state.phase==='incorrect'?'wrong-scene':state.phase==='correct'?'correct-scene':''}" data-chapter="${current(state).chapter}"><canvas class="motion-canvas" data-motion-scene aria-hidden="true"></canvas><div class="scene-top"><div class="location"><b>${screenTime()}</b><span>${escape(chapter.place)}</span></div><div class="shift-status"><div class="shift-head"><span>퇴근까지 ${state.completed} / ${questions.length}</span><strong>${state.misses?`지연 +${state.misses*5}분`:'정시 퇴근 도전'}</strong></div><div class="meter" role="progressbar" aria-label="오늘의 업무 완료" aria-valuemin="0" aria-valuemax="16" aria-valuenow="${state.completed}"><div class="meter-fill" style="width:${state.completed/16*100}%"></div></div></div></div><div class="npc-label"><strong>${escape(chapter.nameEn)}</strong><span>${escape(chapter.role)}</span></div><div class="talk-indicator" aria-hidden="true"><i></i><i></i><i></i></div><div class="scene-callout">${escape(chapter.callout)}</div></section>`;
}
function controls(){
 const item=current(state);
 if(state.phase==='question')return `<p class="question-label">${escape(item.ask)}</p><div class="choices">${item.options.map((option,index)=>`<button class="choice" data-option="${index}" type="button"><span class="choice-no">${index+1}</span><span>${escape(option)}</span></button>`).join('')}</div>`;
 const wrong=state.phase==='incorrect';
 return `<div class="feedback ${wrong?'wrong':'correct'}" role="status"><div class="feedback-stamp">${wrong?'퇴근 보류':'업무 완료'}</div>${wrong?'<p class="penalty">퇴근 지연 +5분</p>':''}<p class="reaction">${escape(wrong?item.bad:item.good)}</p><p class="hint">${wrong?`<b>힌트.</b> ${escape(item.hint)}`:`<b>${escape(item.term)}</b> = ${escape(item.full)}<br>${escape(item.meaning)}`}</p><button id="advance" class="primary-button next-button" type="button">${wrong?'다시 생각하기':state.index===questions.length-1?'퇴근 승인 받기':(state.index+1)%4===0?'다음 관문으로':'다음 업무'}${iconArrow}</button></div>`;
}
function revealDialogue(item,line,instant){
 const update=text=>{line.innerHTML=highlighted(text,item.term);};
 if(instant){update(item.line);return;}
 motion?.react('talk');
 typewriter=new Typewriter();
 typewriter.start(item.line,{speed:24,onUpdate:update,onDone:()=>motion?.react('idle')});
 line.closest('.dialogue')?.addEventListener('click',()=>typewriter?.finish(),{once:true});
}
function renderQuestion(){
 disposeCinematic();
 const chapter=chapters[current(state).chapter],item=current(state);
 game.innerHTML=`${scene()}${path()}<div class="encounter"><section class="dialogue" aria-labelledby="speaker-name"><div class="speaker"><b id="speaker-name">${escape(chapter.nameEn)}</b><span>${escape(chapter.nameKo)}</span><small class="skip-cue">대사창 클릭: 빨리 보기</small></div><p id="dialogue-line" class="line" lang="en" aria-live="polite"></p>${state.showTranslation?`<p class="translation">${escape(item.translation)}</p>`:''}<div class="dialogue-tools"><button id="translation" class="translate-button" type="button" aria-expanded="${state.showTranslation}">${state.showTranslation?'해석 닫기':'한국어 도움'}</button><span class="question-count">${String(state.index+1).padStart(2,'0')} / 16</span></div></section><section class="choices-panel" aria-label="답변 선택">${controls()}</section></div>`;
 const entering=state.phase==='question'&&state.index%4===0&&state.tries===0;
 mountScene({mode:'encounter',chapter:item.chapter,entering});
 if(state.phase==='incorrect')motion?.react('wrong');else if(state.phase==='correct')motion?.react('happy');
 const firstDisplay=state.phase==='question'&&!typedQuestionIds.has(item.id);
 if(firstDisplay)typedQuestionIds.add(item.id);
 revealDialogue(item,document.querySelector('#dialogue-line'),!firstDisplay);
 document.querySelectorAll('[data-option]').forEach(button=>button.addEventListener('click',()=>pick(Number(button.dataset.option))));
 document.querySelector('#translation').addEventListener('click',()=>{state={...state,showTranslation:!state.showTranslation};renderQuestion();document.querySelector('#translation').focus({preventScroll:true});});
 document.querySelector('#advance')?.addEventListener('click',go);
}
function renderStart(){
 disposeCinematic();
 game.innerHTML=`<section class="scene start-scene cinematic-scene"><canvas class="motion-canvas" data-motion-scene aria-hidden="true"></canvas><div class="start-content"><span class="day-tag">DAY 01 · 훈련 준비하는 날</span><h1 class="game-title"><em>퇴근</em>하겠습니다!</h1><div class="title-en">MISSION: CLOCK OUT</div><p class="start-tagline">미군 사무실 첫 출근.<br>영어는 들리는데… 약어는 무슨 뜻이지?</p><div class="mode-buttons"><button id="start" class="primary-button" type="button">강의실 게임 시작${iconArrow}</button><button id="solo-start" class="mode-button" type="button"><span>개별 훈련</span>듣기 · 딕테이션 · 문장 쓰기</button></div><span class="intro-short">4명의 동료 · 16개의 질문 · 목표는 17:00</span><p class="start-guide">대사를 읽고, 알맞은 답을 골라요.<br>틀려도 <strong>힌트를 보고 다시 도전</strong>할 수 있어요.<br>단, 퇴근은 조금 늦어질지도.</p></div></section>`;
 mountScene({mode:'start',chapter:0,entering:true});
 document.querySelector('#start').addEventListener('click',()=>{state=advance(state);render();sound('tap');});
 document.querySelector('#solo-start').addEventListener('click',()=>{individual=freshIndividual();setSurface('solo');sound('tap');});
}
function renderClear(){
 disposeCinematic();
 const chapterIndex=current(state).chapter,next=chapters[chapterIndex+1],learned=questions.filter(item=>item.chapter===chapterIndex);
 game.innerHTML=`<section class="clear-layout cinematic-clear"><canvas class="motion-canvas" data-motion-scene aria-hidden="true"></canvas><div class="travel-caption"><span>WALKING TO</span><b>${escape(next.nameKo)}</b></div><div class="clear-panel"><span class="eyebrow">CHAPTER ${chapterIndex+1} CLEAR</span><h2>${escape(chapters[chapterIndex].clear)}</h2><p class="clear-message">${escape(chapters[chapterIndex].clearLine)}</p><div class="words-earned">${learned.map(item=>`<span>${escape(item.term)}</span>`).join('')}</div><button id="advance" class="primary-button" type="button">${escape(next.nameKo)} 만나러 가기${iconArrow}</button><p class="next-chapter">${escape(next.intro)}</p></div></section>`;
 mountScene({mode:'travel',chapter:chapterIndex+1,duration:3200});
 document.querySelector('#advance').addEventListener('click',go);
}
function renderEnding(){
 disposeCinematic();
 game.innerHTML=`<section class="clear-layout cinematic-clear ending-layout"><canvas class="motion-canvas" data-motion-scene aria-hidden="true"></canvas><div class="clear-panel"><span class="eyebrow">MISSION COMPLETE</span><h1>퇴근을 허가한다!</h1><div class="clock-out-label">오늘의 퇴근시각</div><div class="clock-out">${clockOut(state)}</div><p class="clear-message">${escape(endingLabel(state))}</p><div class="ending-stats"><div><b>${state.completed} / 16</b><span>업무 완료</span></div><div><b>${state.firstTry}</b><span>한 번에 정답</span></div><div><b>${state.misses}</b><span>다시 도전</span></div></div><div class="ending-actions"><button id="again" class="primary-button" type="button">다시 출근하기</button><button id="review-words" class="secondary-button" type="button">단어 수첩 보기</button></div>${state.wrongIds.length?`<p class="mistake-list">한 번 더 볼 단어: ${state.wrongIds.map(id=>escape(questions.find(item=>item.id===id).term)).join(' · ')}</p>`:''}<p class="ending-note">“Good work today. See you tomorrow.”<br>내일의 나에게… 오늘 단어는 꼭 기억해 두자.</p></div></section>`;
 mountScene({mode:'ending',chapter:3,duration:9000});
 document.querySelector('#again').addEventListener('click',()=>{resetGame();render();sound('tap');});
 document.querySelector('#review-words').addEventListener('click',openNotebook);
}

function currentDrill(){return drills[individual.index];}
function speak(text){
 if(!('speechSynthesis' in window)){individual.audioMessage='이 브라우저에서는 자동 읽기가 지원되지 않습니다.';renderSolo();return;}
 stopSpeech();
 const utterance=new SpeechSynthesisUtterance(text);
 utterance.lang='en-US';utterance.rate=.78;utterance.pitch=1;
 const voices=window.speechSynthesis.getVoices();
 const voice=voices.find(item=>/^en-US/i.test(item.lang))||voices.find(item=>/^en/i.test(item.lang));
 if(voice)utterance.voice=voice;
 utterance.onstart=()=>motion?.react('talk');
 utterance.onend=()=>motion?.react('idle');
 utterance.onerror=()=>{individual.audioMessage='소리가 재생되지 않았어요. 다시 눌러 보세요.';};
 window.speechSynthesis.speak(utterance);
}
function dictationFeedback(drill){
 if(individual.dictationResult==='correct')return `<div class="solo-feedback correct"><b>TRANSMISSION RECEIVED</b><p>좋아. 문장이 정확히 들렸어.</p><div class="model-answer">${escape(drill.listen)}</div><button id="to-writing" class="primary-button" type="button">이제 문장 답변 쓰기${iconArrow}</button></div>`;
 if(individual.dictationResult==='wrong')return `<div class="solo-feedback wrong"><b>CHECK THE COMMS</b><p>문장 전체를 다시 들어봐. 시간 숫자·하이픈·대소문자·마침표는 표기 차이로 처리해.</p>${individual.dictationAttempts>1?`<button id="show-dictation" class="secondary-button" type="button">정답 문장 보기</button>${individual.showDictation?`<div class="model-answer">${escape(drill.listen)}</div>`:''}`:''}</div>`;
 return '';
}
function writingFeedback(drill){
 if(!individual.writingResult)return '';
 if(individual.writingResult.correct)return `<div class="solo-feedback correct"><b>MESSAGE SENT</b><p>핵심 정보가 들어간 문장이야.</p><div class="model-answer"><span>예시 답안</span>${escape(drill.model)}</div><button id="next-drill" class="primary-button" type="button">${individual.index===drills.length-1?'개별 훈련 종료':'다음 표현'}${iconArrow}</button></div>`;
 return `<div class="solo-feedback wrong"><b>MESSAGE NEEDS WORK</b><p>${escape(individual.writingResult.message)}</p><div class="model-answer"><span>예시 답안</span>${escape(drill.model)}</div></div>`;
}
function renderSolo(){
 disposeCinematic();
 const drill=currentDrill();
 if(individual.finished){
  game.innerHTML=`<section class="clear-layout cinematic-clear solo-finish"><canvas class="motion-canvas" data-motion-scene aria-hidden="true"></canvas><div class="clear-panel"><span class="eyebrow">INDIVIDUAL TRAINING COMPLETE</span><h1>개별 통신 훈련 완료</h1><p class="clear-message">듣고, 적고, 한 문장으로 보고하는 연습을 마쳤어.</p><div class="words-earned">${drills.map(item=>`<span>${item.term}</span>`).join('')}</div><div class="ending-actions"><button id="solo-again" class="primary-button" type="button">다시 훈련하기</button><button id="back-to-game" class="secondary-button" type="button">강의실 게임으로</button></div></div></section>`;
  mountScene({mode:'ending',chapter:3,duration:9000});
  document.querySelector('#solo-again').addEventListener('click',()=>{individual=freshIndividual();renderSolo();});
  document.querySelector('#back-to-game').addEventListener('click',()=>{resetGame();setSurface('game');});
  return;
 }
 const dictation=individual.stage==='dictation';
 game.innerHTML=`<section class="solo-layout"><div class="solo-cinema"><canvas class="motion-canvas" data-motion-scene aria-hidden="true"></canvas><div class="solo-hud"><button id="back-to-game" class="back-button" type="button">← 강의실 게임</button><span>PERSONAL COMMS LAB</span><b>${String(individual.index+1).padStart(2,'0')} / ${String(drills.length).padStart(2,'0')}</b></div><div class="solo-term">${escape(drill.term)}</div></div><div class="solo-workspace"><header class="solo-header"><span class="eyebrow">${dictation?'LISTEN · DICTATE':'WRITE · REPORT'}</span><h1>${dictation?'듣고, 한 문장을 받아쓰세요.':'상황에 맞게 한 문장으로 답하세요.'}</h1><p>${dictation?'소리를 원하는 만큼 반복해서 듣고, 문장 전체를 입력해요.':'정답 하나를 외우는 문제가 아니라, 핵심 정보가 들어간 짧은 보고 문장을 만드는 연습이에요.'}</p></header>${dictation?`<section class="solo-card"><button id="listen" class="listen-button" type="button"><span aria-hidden="true">▶</span> 0.8× 속도로 듣기</button><p class="listen-note">${individual.audioMessage||'영어 음성은 이 기기의 브라우저가 읽어 줍니다.'}</p><form id="dictation-form"><label for="dictation">들린 문장</label><input id="dictation" autocomplete="off" autocapitalize="none" spellcheck="false" value="${escape(individual.dictation)}" placeholder="Type the whole sentence…" aria-describedby="dictation-help"><small id="dictation-help">0830 / zero eight thirty 같은 시간 표기, 하이픈, 마침표와 대소문자는 신경 쓰지 않아도 돼요.</small><button class="primary-button" type="submit">받아쓰기 확인${iconArrow}</button></form>${dictationFeedback(drill)}</section>`:`<section class="solo-card writing-card"><div class="writing-situation"><span>SITUATION</span><p>${escape(drill.write)}</p></div><form id="writing-form"><label for="writing">나의 보고 문장</label><textarea id="writing" rows="4" spellcheck="true" placeholder="Write one clear sentence in English.">${escape(individual.writing)}</textarea><div class="required-words"><span>문장에 포함할 정보</span>${drill.required.map(item=>`<b>${escape(item)}</b>`).join('')}</div><button class="primary-button" type="submit">문장 점검${iconArrow}</button></form>${writingFeedback(drill)}</section>`}</div></section>`;
 mountScene({mode:'encounter',chapter:drill.chapter,entering:true});
 motion?.react(dictation?'talk':'idle');
 document.querySelector('#back-to-game').addEventListener('click',()=>{resetGame();setSurface('game');});
 if(dictation){
  document.querySelector('#listen').addEventListener('click',()=>{speak(drill.listen);sound('tap');});
  document.querySelector('#dictation').addEventListener('input',event=>{individual.dictation=event.target.value;});
  document.querySelector('#dictation-form').addEventListener('submit',event=>{event.preventDefault();individual.dictationAttempts++;individual.dictationResult=isAcceptedDictation(individual.dictation,drill.listen,drill.accepted)?'correct':'wrong';sound(individual.dictationResult==='correct'?'correct':'wrong');renderSolo();});
  document.querySelector('#show-dictation')?.addEventListener('click',()=>{individual.showDictation=true;renderSolo();});
  document.querySelector('#to-writing')?.addEventListener('click',()=>{individual.stage='writing';renderSolo();});
 }else{
  document.querySelector('#writing').addEventListener('input',event=>{individual.writing=event.target.value;});
  document.querySelector('#writing-form').addEventListener('submit',event=>{event.preventDefault();const answer=individual.writing.trim(),upper=answer.toUpperCase(),missing=drill.required.filter(item=>!upper.includes(item.toUpperCase())),enoughWords=answer.split(/\s+/).filter(Boolean).length>=4;individual.writingResult=missing.length||!enoughWords?{correct:false,message:missing.length?`문장에 ${missing.join(', ')}을(를) 넣어 보세요.`:'짧은 단어 나열보다, 4단어 이상 한 문장으로 써 보세요.'}:{correct:true};sound(individual.writingResult.correct?'correct':'wrong');renderSolo();});
  document.querySelector('#next-drill')?.addEventListener('click',()=>{if(individual.index===drills.length-1)individual.finished=true;else individual={...freshIndividual(),index:individual.index+1};renderSolo();});
 }
}
function render(){
 disposeCinematic();
 if(surface==='solo'){renderSolo();return;}
 if(state.phase==='start')renderStart();else if(state.phase==='chapterClear')renderClear();else if(state.phase==='ending')renderEnding();else renderQuestion();
}
function pick(option){
 if(state.phase!=='question')return;
 typewriter?.finish();
 state=choose(state,option);
 sound(state.phase==='correct'?'correct':'wrong');
 renderQuestion();
 document.querySelector('#advance')?.focus({preventScroll:true});
}
function go(){
 const prior=state.phase;
 typewriter?.finish();
 state=advance(state);
 if(prior===state.phase&&state.phase==='ending')return;
 render();
 sound(state.phase==='ending'?'finish':'tap');
 const target=document.querySelector('.choice')||document.querySelector('#advance')||document.querySelector('#again');
 target?.focus({preventScroll:true});
}
document.addEventListener('keydown',event=>{
 if(event.repeat||notebook.open||event.altKey||event.metaKey||event.ctrlKey)return;
 if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 if(surface==='game'&&typewriter?.active&&event.key==='Enter'){event.preventDefault();typewriter.finish();return;}
 if(surface==='game'&&state.phase==='question'&&/^[1-4]$/.test(event.key)){event.preventDefault();pick(Number(event.key)-1);}
 else if(surface==='game'&&event.key==='Enter'&&document.activeElement?.tagName!=='BUTTON'&&['start','incorrect','correct','chapterClear'].includes(state.phase)){event.preventDefault();go();}
});

render();
