import test from 'node:test';
import assert from 'node:assert/strict';
import {isAcceptedDictation,normalizeDictation} from '../dist/dictation.mjs';

test('treats military-time words and digits as the same dictation answer',()=>{
  const expected='Be at the training brief no later than zero eight thirty.';
  assert.equal(isAcceptedDictation('Be at the training brief no later than 0830',expected),true);
  assert.equal(isAcceptedDictation('Be at the training brief no later than 08:30.',expected),true);
});

test('ignores hyphen and punctuation differences',()=>{
  const expected='Please update the time-phased force and deployment data.';
  assert.equal(normalizeDictation(expected),normalizeDictation('Please update the time phased force and deployment data'),true);
});

test('allows the approved shortened TPFDD dictation variant only when listed',()=>{
  const expected='Please update the time-phased force and deployment data.';
  const shortened='Please update the time phased force deployment data.';
  assert.equal(isAcceptedDictation(shortened,expected),false);
  assert.equal(isAcceptedDictation(shortened,expected,[shortened]),true);
});
