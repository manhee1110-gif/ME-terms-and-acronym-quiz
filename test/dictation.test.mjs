import test from 'node:test';
import assert from 'node:assert/strict';
import {isAcceptedDictation,normalizeDictation} from '../dist/dictation.mjs';

test('treats military-time words and digits as the same dictation answer',()=>{
  const expected='Be at the training brief no later than zero eight thirty.';
  assert.equal(isAcceptedDictation('Be at the training brief no later than 0830',expected),true);
  assert.equal(isAcceptedDictation('Be at the training brief no later than 08:30.',expected),true);
});

test('ignores hyphen and punctuation differences',()=>{
  const expected='Issue one meal ready-to-eat to each Soldier.';
  assert.equal(normalizeDictation(expected),normalizeDictation('Issue one meal ready to eat to each soldier'),true);
});

test('ignores commas in the CBRN expansion but still requires every word',()=>{
  const expected='The team is operating in a chemical, biological, radiological, and nuclear environment.';
  const punctuationVariant='The team is operating in a chemical biological radiological and nuclear environment';
  const missingWord='The team is operating in a chemical biological and nuclear environment';
  assert.equal(isAcceptedDictation(punctuationVariant,expected),true);
  assert.equal(isAcceptedDictation(missingWord,expected),false);
});

test('accepts decoded phonetic, time, and DTG answers',()=>{
  assert.equal(isAcceptedDictation('h-q','HQ'),true);
  assert.equal(isAcceptedDictation('14:40','1440'),true);
  assert.equal(isAcceptedDictation('151845-zsep20','151845ZSEP20'),true);
});

test('accepts military numerical hyphen variants',()=>{
  assert.equal(normalizeDictation('NIN-ER ZE-RO'),normalizeDictation('niner zero'));
});

test('accepts harmless article differences but keeps core spelling strict',()=>{
  const expected='The headquarters will conduct a command post exercise.';
  assert.equal(isAcceptedDictation('Headquarters will conduct the command post exercise',expected),true);
  assert.equal(isAcceptedDictation('Headquarters will conduct a command pose exercise',expected),false);
});
