# 퇴근하겠습니다! — Mission: Clock Out

A static visual-novel vocabulary game for the first Military English terminology lesson.

## Two modes

- **Classroom game:** Four fictional NPCs, sixteen context-based questions, answer reactions, and a clock-out ending.
- **Individual Comms Lab:** Browser-spoken English dictation followed by one-sentence report writing. Open the same site with `?mode=solo`.

The live scene is rendered with a lightweight canvas layer: parallax camera movement, character entrances, speaking motion, answer reactions, confetti, and walking transitions. It uses no backend or API key.

## Edit content

- `dist/game.mjs`: Classroom-game questions and state transitions.
- `dist/app.js`: Individual dictation and writing drills in the `drills` array.
- `dist/motion.mjs`: Canvas choreography.
- `dist/style.css`: Game interface and responsive styling.

## Validation

`node --test test/game.test.mjs` validates the classroom game's core progression. The static site is intended for ordinary modern browsers; the individual listening mode uses the browser's native Web Speech voice.
