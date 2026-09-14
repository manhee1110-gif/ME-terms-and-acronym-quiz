import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons,questions,chapters,drills,freshState,start,current,choose,advance,completionTime} from '../dist/game.mjs';

test('the hub exposes four lesson slots and only lesson one is currently open',()=>{
 assert.equal(lessons.length,4); assert.equal(lessons[0].available,true);
 assert.ok(lessons.slice(1).every(lesson=>lesson.available===false));
});

test('lesson one covers terms, phonetics, and numerical pronunciation',()=>{
 assert.equal(questions.length,24); assert.equal(new Set(questions.map(q=>q.id)).size,24); assert.equal(chapters.length,3);
 assert.deepEqual(chapters.map((_,i)=>questions.filter(q=>q.chapter===i).length),[12,6,6]);
 assert.deepEqual(questions.map(q=>q.id),[
  'cop','cpx','roc','ftx','ufs','neo','rsoi','tpfdd','defcon','watchcon','cday-dday','mday-hhour',
  'phonetic-hq','phonetic-cg','phonetic-xz','decode-ross','decode-kim','decode-betty',
  'number-44','number-90','number-7000','time-1440','dtg-151845','dtg-030234'
 ]);
 for(const q of questions){
  assert.equal(q.options.length,4); assert.equal(new Set(q.options).size,4); assert.ok(q.correct>=0&&q.correct<4);
  for(const key of ['term','full','meaning','line','translation','hint','good','bad']) assert.ok(q[key]);
 }
 assert.equal(drills.length,16);
 assert.deepEqual(drills.map(d=>d.chapter),[0,0,0,0,0,0,0,0,0,1,1,1,2,2,2,2]);
});

test('perfect play visits every question and ends at 17:00',()=>{
 let s=start(freshState()),visited=[];
 while(s.phase!=='ending'){
  if(s.phase==='question'){visited.push(current(s).id);s=choose(s,current(s).correct);} else s=advance(s);
 }
 assert.equal(visited.length,24); assert.equal(s.completed,24); assert.equal(s.firstTry,24); assert.equal(s.misses,0); assert.equal(completionTime(s),'17:00');
});

test('a mistake stays on the same question and adds five minutes only once',()=>{
 let s=start(freshState()); const wrong=(current(s).correct+1)%4; s=choose(s,wrong);
 assert.equal(s.phase,'incorrect'); assert.equal(s.index,0); assert.equal(s.completed,0); assert.equal(s.misses,1);
 assert.deepEqual(choose(s,wrong),s); s=advance(s); assert.equal(s.phase,'question'); assert.equal(s.tries,1);
 s=choose(s,current(s).correct); assert.equal(s.completed,1); assert.equal(s.firstTry,0); assert.equal(completionTime(s),'17:05');
});

test('wrong-answer retries can still complete the full lesson',()=>{
 let s=start(freshState()); let visited=0;
 while(s.phase!=='ending'){
  if(s.phase==='question'){
   if(s.tries===0){s=choose(s,(current(s).correct+1)%4);visited++;} else s=choose(s,current(s).correct);
  } else s=advance(s);
 }
 assert.equal(visited,24); assert.equal(s.misses,24); assert.equal(s.completed,24); assert.equal(s.firstTry,0); assert.equal(completionTime(s),'19:00'); assert.equal(s.wrongIds.length,24);
});

test('invalid input cannot change progress',()=>{
 const s=start(freshState()); for(const x of [-1,4,1.2,NaN,'1']) assert.deepEqual(choose(s,x),s);
 assert.deepEqual(advance(s),s);
});
