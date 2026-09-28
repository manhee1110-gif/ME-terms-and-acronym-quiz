import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons,questions,chapters,drills,freshState,start,current,choose,advance,completionTime,drawQuestionIds} from '../dist/game.mjs';

test('the hub exposes four available lesson sets',()=>{
 assert.equal(lessons.length,4);
 assert.ok(lessons.every(lesson=>lesson.available===true));
 assert.deepEqual(lessons.map(lesson=>lesson.questions.length),[24,36,101,27]);
 assert.deepEqual(lessons.map(lesson=>lesson.chapters.length),[3,3,3,3]);
});

test('every lesson question has complete and valid game data',()=>{
 for(const lesson of lessons){
  assert.equal(new Set(lesson.questions.map(q=>q.id)).size,lesson.questions.length);
  for(const q of lesson.questions){
   assert.equal(q.options.length,4);
   assert.equal(new Set(q.options).size,4);
   assert.ok(q.correct>=0&&q.correct<4);
   for(const key of ['term','full','meaning','line','translation','ask','hint','good','bad']) assert.ok(q[key],`${lesson.id}:${q.id}:${key}`);
  }
  assert.ok(lesson.drills.length>0);
  assert.ok(lesson.drills.every(d=>d.chapter>=0&&d.chapter<lesson.chapters.length));
 }
});

test('lesson one keeps the finalized terms, phonetics, and numbers structure',()=>{
 assert.equal(questions.length,24); assert.equal(chapters.length,3); assert.equal(drills.length,16);
 assert.deepEqual(chapters.map((_,i)=>questions.filter(q=>q.chapter===i).length),[12,6,6]);
});

test('lesson three draws a balanced random set of fifteen classroom questions',()=>{
 const lesson=lessons[2];
 const first=drawQuestionIds(lesson,()=>0.1),second=drawQuestionIds(lesson,()=>0.9);
 assert.equal(first.length,15); assert.equal(new Set(first).size,15);
 assert.equal(second.length,15); assert.notDeepEqual(first,second);
 for(const ids of [first,second]){
  const picked=lesson.questions.filter(q=>ids.includes(q.id));
  assert.deepEqual([0,1,2].map(chapter=>picked.filter(q=>q.chapter===chapter).length),[5,5,5]);
 }
});

test('perfect play completes every lesson without a penalty',()=>{
 for(const lesson of lessons){
  let s=start(freshState(lesson.id)),visited=[];
  while(s.phase!=='ending'){
   if(s.phase==='question'){visited.push(current(s).id);s=choose(s,current(s).correct);} else s=advance(s);
  }
  const expected=lesson.classroomQuestionLimit||lesson.questions.length;
  assert.equal(visited.length,expected);
  assert.equal(s.completed,expected);
  assert.equal(s.firstTry,expected);
  assert.equal(s.misses,0);
  assert.equal(completionTime(s),'17:00');
 }
});

test('a mistake stays on the same question and adds five minutes only once',()=>{
 let s=start(freshState()); const wrong=(current(s).correct+1)%4; s=choose(s,wrong);
 assert.equal(s.phase,'incorrect'); assert.equal(s.index,0); assert.equal(s.completed,0); assert.equal(s.misses,1);
 assert.deepEqual(choose(s,wrong),s); s=advance(s); assert.equal(s.phase,'question'); assert.equal(s.tries,1);
 s=choose(s,current(s).correct); assert.equal(s.completed,1); assert.equal(s.firstTry,0); assert.equal(completionTime(s),'17:05');
});

test('invalid input cannot change progress',()=>{
 const s=start(freshState()); for(const x of [-1,4,1.2,NaN,'1']) assert.deepEqual(choose(s,x),s);
 assert.deepEqual(advance(s),s);
});
