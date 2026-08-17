# Cinematic Review Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a synchronized cinematic chess-review animation system where the piece moves first, the landing/verdict reacts second, and the board, move row, review story, arrows, and bookmark state update as one coherent experience.

**Architecture:** Preserve `boardMotion.js` for deterministic piece identity and UCI/FEN replay. Add a pure `reviewMotion.js` policy module for classification mapping, timing, verdict placement, and reduced-motion rules; integrate it into focused board overlay components and the existing review UI. Use CSS keyframes for visuals and a small shared phase value derived in `App.jsx` so board and review surfaces stay synchronized without adding dependencies.

**Tech Stack:** React 19 JSX, Vite 8, plain CSS, Node `node:test`, oxlint, existing Python backend regression suite.

## Global Constraints

- Preserve the existing backend API and analysis response contract.
- Preserve board orientation, bookmarks, history/profile behavior, sound, keyboard navigation, captures, castling, promotions, one-ply backward replay, and FEN jump fallback.
- Do not add dependencies, a styling framework, WebGL/canvas particles, sounds, or backend changes.
- Piece movement must lead; verdicts never appear before landing.
- Rapid multi-move jumps must settle immediately and must not replay stale verdicts.
- Reduced motion must remove shake/bounce/sweep while preserving classification information.
- Only the selected move row and current review story may animate.
- Negative moves reveal the corrective best-move arrow after the verdict, not concurrently with piece travel.

---

### Task 1: Motion policy and edge-safe verdict placement

**Files:**
- Create: `frontend/src/utils/reviewMotion.js`
- Create: `frontend/src/utils/reviewMotion.test.js`

**Interfaces:**
- Produces: `MOTION_TIMING`, `normalizeMotionClassification(classification)`, `getMotionPreset(classification, reducedMotion = false)`, `getVerdictPlacement(uci, isFlipped = false)`, `shouldAnimateReview(delta, reducedMotion = false)`, `getArrowReveal(classification, playedMove, bestMove, phase)`.
- Consumers: board overlays, `ChessBoard.jsx`, `App.jsx`, `RightPanel.jsx`.

- [ ] **Step 1: Write failing tests** for classification presets, reduced-motion fallback, four board-edge placement cases, single-step-vs-jump behavior, and delayed best-arrow visibility for negative classifications.
- [ ] **Step 2: Run `cd frontend && npm run test:unit`** and verify the new test fails because `reviewMotion.js` does not exist.
- [ ] **Step 3: Implement the pure policy module** with the exact preset names: `subtle`, `book`, `great`, `brilliant`, `inaccuracy`, `mistake`, `miss`, `blunder`; provide symbols for `book`, `good`, `great`, `brilliant`, `inaccuracy`, `mistake`, `miss`, and `blunder`.
- [ ] **Step 4: Run unit tests** and verify all tests pass.
- [ ] **Step 5: Commit** `test/feat: add cinematic review motion policy`.

### Task 2: Shared review-motion phase coordinator

**Files:**
- Create: `frontend/src/utils/reviewMotionState.js`
- Create: `frontend/src/utils/reviewMotionState.test.js`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Produces: `createMotionState({ moveIndex, previousMoveIndex, reducedMotion })` returning `{ delta, isJump, mode, phase }` where `mode` is `animate` or `settled` and the initial phase is `pieceMoving` for single-step motion, otherwise `settled`.
- `App.jsx` produces `reviewMotion` containing `phase`, `mode`, `token`, `isJump`, and `delta`; passes it to `BoardArea` and `RightPanel`.

- [ ] **Step 1: Write failing state tests** for forward one-ply, backward one-ply, jump, and reduced-motion behavior.
- [ ] **Step 2: Run unit tests** and confirm RED.
- [ ] **Step 3: Implement `reviewMotionState.js`.**
- [ ] **Step 4: Update `App.jsx`** with one cancellable `useEffect` timer chain: `pieceMoving -> landing -> verdictReveal -> panelSync -> settled`; increment a token per move change; clear all timers on a newer move; skip directly to `settled` for jumps/reduced motion.
- [ ] **Step 5: Run unit tests, lint, and build**; fix only coordinator regressions.
- [ ] **Step 6: Commit** `feat: coordinate review motion phases`.

### Task 3: Destination-attached verdict and landing overlays

**Files:**
- Create: `frontend/src/components/BoardVerdictBadge.jsx`
- Create: `frontend/src/components/LandingEffect.jsx`
- Modify: `frontend/src/components/ChessBoard.jsx`
- Modify: `frontend/src/components/BoardArea.jsx`
- Modify: `frontend/src/ReviewEnhancements.css`
- Create: `frontend/src/utils/reviewMotionIntegration.test.js`

**Interfaces:**
- `BoardVerdictBadge({ classification, playedMove, isFlipped, phase, mode, token })`
- `LandingEffect({ classification, playedMove, isFlipped, phase, token })`
- `BoardArea` receives `reviewMotion` and forwards it to `ChessBoard`.
- `ChessBoard` keeps current piece transition code unchanged except for verdict/arrow staging.

- [ ] **Step 1: Write failing integration/source-contract tests** asserting board overlays exist, `ChessBoard` imports them, the old permanently top-left primary badge is removed, and `BoardArea` forwards `reviewMotion`.
- [ ] **Step 2: Run unit tests** and confirm RED.
- [ ] **Step 3: Implement `BoardVerdictBadge.jsx`** using `getMotionPreset` + `getVerdictPlacement`; render no badge for missing/unrecognized classification; use a safe corner fallback only when placement is unavailable.
- [ ] **Step 4: Implement `LandingEffect.jsx`** as a small non-interactive overlay shown during `landing`/`verdictReveal`.
- [ ] **Step 5: Integrate into `ChessBoard.jsx`** while preserving piece identity/transition code, last-move squares, coordinates, themes, capture/promotion/castling behavior, and flipped orientation.
- [ ] **Step 6: Gate arrows by phase:** played arrow after verdict begins; negative best arrow only in `panelSync`/`settled`; jump mode shows final arrows immediately.
- [ ] **Step 7: Add CSS keyframes** for book unfold, good pop, great spring, brilliant burst/ring, inaccuracy tilt, mistake drop, miss snap, blunder drop/shake, plus landing pulse variants.
- [ ] **Step 8: Run unit tests, lint, and build.**
- [ ] **Step 9: Commit** `feat: add destination verdict and landing motion`.

### Task 4: Synchronize MoveStory, move rows, and bookmarks

**Files:**
- Modify: `frontend/src/components/MoveStory.jsx`
- Modify: `frontend/src/components/RightPanel.jsx`
- Modify: `frontend/src/ReviewEnhancements.css`
- Modify: `frontend/src/utils/reviewMotionIntegration.test.js`

**Interfaces:**
- `RightPanel` receives `reviewMotion` from `App.jsx`.
- `MoveStory` receives `motionPhase`, `motionToken`, and existing bookmark props.
- Move buttons receive `data-motion-tone` and animate only when selected and `reviewMotion.phase === 'panelSync'`.

- [ ] **Step 1: Add failing source-contract tests** asserting `RightPanel` accepts `reviewMotion`, selected rows receive a verdict-tone class/attribute, `MoveStory` accepts motion props, and bookmark animation state is isolated from board motion.
- [ ] **Step 2: Run unit tests** and confirm RED.
- [ ] **Step 3: Update `MoveStory.jsx`** so changing story content uses a short fade/slide class keyed by `motionToken`; bookmark click uses a local pulse token/state and never changes board motion inputs.
- [ ] **Step 4: Update `RightPanel.jsx`** so only the selected move button receives the classification sweep class during `panelSync`; keep persistent bookmark marker and existing navigation/autoplay behavior.
- [ ] **Step 5: Add CSS** for positive/gold/warning/danger row sweeps, story fade-slide, and bookmark snap/fill.
- [ ] **Step 6: Run unit tests, lint, and build.**
- [ ] **Step 7: Commit** `feat: sync review panel and bookmark motion`.

### Task 5: Accessibility, rapid navigation, and responsive polish

**Files:**
- Modify: `frontend/src/ReviewEnhancements.css`
- Modify: `frontend/src/utils/reviewMotion.test.js`
- Modify: `frontend/src/utils/reviewMotionIntegration.test.js`

**Interfaces:**
- Reduced motion keeps all badges/labels but uses static/fade-only classes.
- `prefers-reduced-motion: reduce` disables piece lift, badge shake/spring, landing bursts, row sweeps, and story slide while retaining final state.

- [ ] **Step 1: Add failing tests/source contracts** for reduced-motion selectors, no whole-board shake, and the rule that only selected/current UI can carry sweep classes.
- [ ] **Step 2: Run unit tests** and confirm RED.
- [ ] **Step 3: Implement CSS fallback** under `@media (prefers-reduced-motion: reduce)` with near-instant transitions and no shake/bounce/sweep.
- [ ] **Step 4: Verify edge placements** for a/h files and ranks 1/8 in both orientations through unit tests.
- [ ] **Step 5: Run `npm run test:unit`, `npm run lint`, and `npm run build`.**
- [ ] **Step 6: Commit** `fix: harden cinematic motion accessibility`.

### Task 6: Full regression verification and documentation

**Files:**
- Modify: `AGENTS.md` only if the frontend architecture map needs the new motion modules documented.
- Modify: `README.md` only if current user-facing review feature documentation has an animation section worth updating.

**Interfaces:** None; verification task.

- [ ] **Step 1: Run frontend unit tests**: `cd frontend && npm run test:unit`.
- [ ] **Step 2: Run frontend lint**: `npm run lint`.
- [ ] **Step 3: Run production build**: `npm run build`.
- [ ] **Step 4: Run backend syntax/regression checks** using the repository workflow equivalents: `python -m py_compile *.py` and `python -m unittest test_main.py test_chesscom_profile.py -v` inside `backend`.
- [ ] **Step 5: Review `main...feature` diff** and verify no backend/API/dependency changes were introduced.
- [ ] **Step 6: Update `AGENTS.md` architecture map** to name `reviewMotion.js` and the board verdict/landing components if created.
- [ ] **Step 7: Re-run the complete CI-equivalent suite after documentation changes.**
- [ ] **Step 8: Commit** `docs: document cinematic review motion architecture`.

## Final Acceptance Checklist

- Piece travel always begins before a verdict animation.
- Book, good, great, brilliant, inaccuracy, mistake, miss, and blunder have distinct motion presets.
- Verdict badge is destination-attached and flips placement near board edges in both orientations.
- Capture animation remains deterministic and captured piece still survives one animation frame.
- Promotion, castling, backward replay, jump sync, orientation, coordinates, themes, and sounds still work.
- Negative corrective arrow appears only after the verdict stage.
- Bookmarking animates locally and never replays the chess move.
- Rapid navigation cancels stale phases and settles to the newest move.
- Reduced-motion users receive static/fade-only information.
- Frontend tests/lint/build and backend regression checks all pass in GitHub Actions before merge.
