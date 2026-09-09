import test from 'node:test';
import assert from 'node:assert/strict';
import {questions,chapters,freshState,start,current,choose,advance,clockOut} from '../dist/game.mjs';

test('the lesson has sixteen unique terms and four complete encounters',()=>{
 assert.equal(questions.length,16);assert.equal(new Set(questions.map(q=>q.id)).size,16);
 for(let i=0;i<chapters.length;i++)assert.equal(questions.filter(q=>q.chapter===i).length,4);
 for(const q of questions){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.correct>=0&&q.correct<4);for(const key of ['term','full','meaning','line','translation','hint','good','bad'])assert.ok(q[key]);}
});
test('perfect play visits every question and ends at 17:00',()=>{
 let s=start(freshState()),visited=[];
 while(s.phase!=='ending'){
  if(s.phase==='question'){visited.push(current(s).id);s=choose(s,current(s).correct);}
  else s=advance(s);
 }
 assert.equal(visited.length,16);assert.equal(s.completed,16);assert.equal(s.firstTry,16);assert.equal(s.misses,0);assert.equal(clockOut(s),'17:00');
});
test('a mistake stays on the same question and adds five minutes only once',()=>{
 let s=start(freshState());const wrong=(current(s).correct+1)%4;s=choose(s,wrong);
 assert.equal(s.phase,'incorrect');assert.equal(s.index,0);assert.equal(s.completed,0);assert.equal(s.misses,1);
 assert.deepEqual(choose(s,wrong),s);s=advance(s);assert.equal(s.phase,'question');assert.equal(s.tries,1);
 s=choose(s,current(s).correct);assert.equal(s.completed,1);assert.equal(s.firstTry,0);assert.equal(clockOut(s),'17:05');
 assert.deepEqual(choose(s,current(s).correct),s);
});
test('wrong-answer retries can still complete the full day',()=>{
 let s=start(freshState());let visited=0;
 while(s.phase!=='ending'){
  if(s.phase==='question'){
   if(s.tries===0){s=choose(s,(current(s).correct+1)%4);visited++;}
   else s=choose(s,current(s).correct);
  }else s=advance(s);
 }
 assert.equal(visited,16);assert.equal(s.misses,16);assert.equal(s.completed,16);assert.equal(s.firstTry,0);assert.equal(clockOut(s),'18:20');assert.equal(s.wrongIds.length,16);
});
test('invalid input cannot change progress',()=>{
 const s=start(freshState());for(const x of [-1,4,1.2,NaN,'1'])assert.deepEqual(choose(s,x),s);
 assert.deepEqual(advance(s),s);
});
