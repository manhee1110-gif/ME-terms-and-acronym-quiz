# 임무 수행하겠습니다! — Military English Mission

A static, lesson-selectable visual-novel game for Military English.

## Current lesson

Lesson 1 follows the finalized lecture slides and worksheet in three stages:

1. Military terms and abbreviations: COP, CPX, ROC Drill, FTX, UFS, NEO, RSOI, TPFDD, DEFCON, WATCHCON, C-Day, D-Day, M-Day, and H-Hour.
2. NATO phonetic alphabet encoding and decoding.
3. Military numerical pronunciation, military time, and DTG.

## Two modes

- **Classroom game:** Three fictional NPC encounters, 24 context-based questions, retry hints, and a mission-complete ending.
- **Individual Comms Lab:** 16 browser-spoken activities combining dictation, code/number decoding, and one-sentence report writing.

Dictation accepts capitalization, punctuation, hyphen, and article variants while preserving core spelling. Repeated attempts progressively reveal the listening focus, answer structure, and model answer. Writing prompts hide the target term until staged feedback is needed.

The live scene uses a lightweight canvas layer for parallax movement, diagonal character staging, entrances, speaking motion, answer reactions, confetti, and transitions. It needs no backend or API key.

## Add future lessons

All lesson content lives in `dist/lessons.mjs`. Add a new lesson object to the `lessons` catalog and set `available: true`; the lesson-select screen, classroom game, notebook, and individual training will use its questions and drills automatically.

Other core files:

- `dist/game.mjs`: lesson-aware game state and progression.
- `dist/app.js`: interface, classroom flow, and individual-training flow.
- `dist/motion.mjs`: canvas choreography.
- `dist/style.css`: responsive game styling.

## Validation

Run `node --test`. The individual listening mode uses the browser's native Web Speech voice and works best in a current Chrome or Edge browser.
