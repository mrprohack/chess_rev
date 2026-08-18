# Cinematic Chess Review Motion — Design

Date: 2026-08-17
Status: Approved interaction direction; implementation pending written-spec review
Repository: `mrprohack/chess_rev`
Base: `main`

## Goal

Upgrade the existing chess review experience so every reviewed move feels connected across the board, verdict badge, move list, right-side review story, best-move arrow, and bookmark state. The animation must feel cinematic and dramatic for major moments while keeping the chess move readable first.

The chosen interaction style is **Hybrid + Full Experience + Cinematic**:

1. The chess piece moves first.
2. The destination landing effect happens second.
3. The verdict badge appears attached to the destination piece/square.
4. The review panel and move-list row echo the same verdict.
5. Negative moves reveal the corrective best-move arrow only after the verdict is understood.

## Non-goals

- No rewrite of chess rules, move generation, Stockfish analysis, game import, profile/history, or board orientation.
- No particle engine or canvas/WebGL animation system.
- No sound effects in this version.
- No continuous glow, camera shake, or whole-board bouncing.
- No animation of every move-list row at once.
- No animation that blocks keyboard navigation.

## Existing foundation to preserve

The current app already provides:

- piece motion via `frontend/src/utils/boardMotion.js`
- capture, promotion, restore, castling, forward/backward navigation states
- played/best arrows in `ChessBoard.jsx`
- board classification badge in `ChessBoard.jsx`
- review story/bookmark UI in `MoveStory.jsx`
- move list and review layout in `RightPanel.jsx`
- reduced-motion CSS support

The new system extends these pieces instead of replacing them.

## Experience principles

### 1. Move clarity comes first

The user must visually understand the physical chess move before any verdict appears. The verdict never covers the moving piece during travel.

### 2. Big moments earn stronger motion

- normal/good: subtle
- book: elegant
- great: satisfying
- brilliant: celebratory
- inaccuracy: uncertain
- mistake: noticeable
- miss: sharp
- blunder: strongest negative
- checkmate: strongest overall

### 3. One move, one synchronized story

The board, badge, move row, and review story should feel like one coordinated interaction, not separate widgets updating independently.

### 4. Fast navigation must stay fast

Single-step forward/back navigation can play the full sequence. Large jumps or rapid scrubbing must skip theatrical stages and settle immediately on the latest requested move.

## Motion timeline

Default single-step timeline:

- `0–330ms`: piece lift + travel
- `300–430ms`: landing/capture impact starts
- `390–650ms`: verdict badge reveal
- `450–750ms`: move-row and review-story echo
- positive played arrow: after verdict begins
- negative best-move arrow: after verdict has settled enough to understand the error

Reference negative sequence:

- `0ms`: piece starts
- `330ms`: destination impact
- `400ms`: mistake/blunder badge appears
- `520ms`: review story changes
- `620ms`: green best-move arrow begins

Exact timing may be tuned within ±60ms during visual QA, but ordering is fixed.

## Animation state model

Every single-step reviewed move moves through:

`idle -> pieceMoving -> landing -> verdictReveal -> panelSync -> settled`

### State meanings

- `idle`: no staged animation active
- `pieceMoving`: existing board piece transition is running
- `landing`: target-square/capture effect runs
- `verdictReveal`: destination-attached classification badge becomes visible
- `panelSync`: move row and `MoveStory` transition to the same verdict
- `settled`: stable final state

### Cancellation behavior

If the user changes move again before the sequence completes:

- cancel pending timers for the previous move
- update to the newest requested board position
- if navigation is still single-step and not rapid, start a new sequence
- if requests arrive rapidly or `isJump` is true, render the newest move directly in `settled`

No stale badge, row, arrow, or story transition may appear after a newer move has been selected.

## New architecture

### `frontend/src/utils/reviewMotion.js`

Pure, testable motion policy module.

Responsibilities:

- normalize classification names
- map classification to tone, badge, motion, landing effect, row effect, and arrow delay
- identify positive/negative/key-moment classifications
- calculate destination badge placement with board orientation
- return reduced-motion variants
- expose timing constants used by components

No React or DOM access.

### `frontend/src/components/BoardVerdictBadge.jsx`

Dedicated verdict overlay component.

Inputs:

- classification
- played move UCI
- board orientation
- motion phase
- reduced-motion flag
- jump/scrub state

Responsibilities:

- render the correct symbol/label
- anchor to destination square
- choose edge-safe placement
- apply classification-specific motion class
- keep screen-reader behavior non-disruptive; detailed verdict text remains in review panel

### `frontend/src/components/LandingEffect.jsx`

Small board overlay component.

Responsibilities:

- target-square pulse/ring/impact
- classification tone
- capture emphasis
- no pointer interaction
- auto-hidden outside the `landing`/`verdictReveal` window

No particle engine.

### `frontend/src/components/ChessBoard.jsx`

Continue to own board rendering and piece position transitions.

Changes:

- remove the current permanent top-left board verdict as the primary presentation
- integrate destination-attached `BoardVerdictBadge`
- integrate `LandingEffect`
- gate arrow visibility/timing from the shared motion phase
- preserve board themes, coordinates, last-move squares, castling, promotion, captures, forward/back motion, `isJump`, and orientation
- retain a safe fallback corner badge only if destination coordinates cannot be computed

### `frontend/src/components/MoveStory.jsx`

Changes:

- transition changing verdict/title/description/played-best details without reanimating the whole right panel
- add bookmark snap animation state
- keep bookmark animation independent from board motion
- keep key-moment navigation controls working throughout animations

### `frontend/src/components/RightPanel.jsx`

Changes:

- receive or derive current review-motion phase
- add active move-row sweep for the selected move only
- classification-colored row accent for key moments
- persistent bookmarked row marker
- no animation of unrelated rows

### Optional `frontend/src/hooks/useReviewMotion.js`

Use only if central coordination in the current parent component cannot remain clear.

Responsibilities if added:

- stage timers
- cancellation on move change
- rapid-navigation detection
- reduced-motion shortcut

The hook must not own chess state; it only derives animation phase from current move/navigation metadata.

## Verdict badges and visual language

The UI uses compact symbols where appropriate, with the textual classification still available in the review panel.

### Book

Badge: book glyph/icon or `Book`

Motion:

- soft gold/parchment target pulse
- badge rises 6–8px from behind the landed piece
- subtle `scaleX(.72) -> 1.05 -> 1` page-opening feel
- no shake

### Good

Badge: check or subdued `!`

Motion:

- small scale-in
- gentle green pulse
- minimal row tint

### Great

Badge: `!`

Motion:

- piece landing compresses subtly
- badge rises approximately 8px with one clean spring
- teal/blue target ring
- short positive move-row sweep

### Brilliant

Badge: `!!` or the app's existing brilliant label/icon

Motion:

- cyan/gold target ring
- badge `scale(.45) translateY(8px) -> scale(1.18) translateY(-3px) -> .96 -> 1`
- small radial ring/burst using CSS only
- review story/row use matching accent
- no permanent glow after settling

### Inaccuracy

Badge: `?!`

Motion:

- yellow pulse
- badge `rotate(-8deg) -> 3deg -> 0`
- no shake

### Mistake

Badge: `?`

Motion:

- orange impact
- badge `translateY(-7px) -> 2px -> 0`
- corrective arrow waits until verdict sequence is understood

### Miss

Badge: `✕`

Motion:

- red/orange flash
- quick diagonal snap `translate(4px,-4px) -> 0`
- stronger than mistake, weaker than blunder

### Blunder

Badge: `??` or `✕`, chosen consistently with current classification language

Motion:

- red destination impact
- moved piece may use a tiny landing compression but never whole-board shake
- badge `scale(.65) -> 1.12 -> 1`
- badge-only short horizontal shake `0 -> -3px -> 3px -> -1px -> 0`
- green corrective arrow appears after the verdict

### Check

Optional secondary marker if the move data exposes check state reliably.

- sharp small pulse
- king square gets a brief outline
- must not replace the engine classification badge

If check state is not already available from current move data, this remains out of scope for this implementation.

### Checkmate

Only if current move/result data exposes mate reliably.

- strongest controlled impact
- very short contextual dim around the mating move
- no looped animation

If mate state is not already exposed cleanly, do not add new chess-analysis logic in this feature.

## Destination badge placement

Verdict badges are attached to the destination square, not fixed to the board corner.

Default placement: `top-right`.

Fallback placement rules:

- near right board edge: `top-left`
- near top edge: `bottom-right`
- top-right corner: `bottom-left`
- equivalent logic respects `isFlipped`

The pure placement helper takes:

- played move UCI
- `isFlipped`
- optional badge inset values

and returns normalized board coordinates plus a placement token.

If UCI is malformed or coordinates cannot be derived, `ChessBoard` uses the current corner-badge fallback rather than throwing.

## Piece/capture choreography

Existing piece movement remains authoritative.

For captures:

1. attacker lifts
2. attacker travels
3. captured piece begins shrinking/fading during the last ~80–120ms of travel where feasible with current piece-state timing
4. attacker lands
5. landing effect fires
6. verdict reveals

Avoid visible prolonged overlap between attacker and captured piece.

Castling, promotion, restored captures during backward navigation, and board flips must keep their existing functional behavior.

## Arrow choreography

Current played/best arrows remain, but visibility is staged.

### Positive key moment

`piece -> verdict -> played arrow`

### Negative key moment

`piece -> bad verdict -> short pause -> green best-move arrow`

The corrective arrow must not render before the bad verdict is visible.

On rapid navigation/jump, arrows render directly with the settled state.

## Move-list choreography

Only the active row animates.

Sequence:

- previous active treatment fades/reset
- selected row gets a short classification-colored left-to-right sweep
- selected classification icon/badge may use a small pop
- bookmark remains a persistent static accent after its toggle animation completes

Rows must not bounce or change layout height.

## Review-story choreography

Do not animate/unmount the entire right panel.

Only changing content receives:

- ~120ms fade-out
- ~180ms fade/slide-in

Elements:

- verdict title
- explanation
- played move
- best move when present

Navigation buttons remain stable and clickable.

## Bookmark choreography

Bookmark animation is independent of move animation state.

On add:

- icon `1 -> .8 -> 1.15 -> 1`
- fill/accent changes to warm gold
- active row gets narrow gold sweep
- optional tiny gold board accent may appear for <=500ms, but must not obscure verdict

On remove:

- subtle scale-down/fade of fill
- no dramatic effect

Toggling bookmark must never restart piece travel, verdict reveal, or arrows.

## CSS and rendering strategy

Use CSS keyframes/transitions for visuals and React state only for sequencing.

Allowed animation properties should prefer:

- `transform`
- `opacity`
- SVG `stroke-dashoffset`
- filters only where already inexpensive and brief

Avoid layout-heavy animated width/height/top/left beyond the existing piece-position system.

New CSS classes/keyframes may include:

- `verdict-unfold`
- `verdict-pop`
- `verdict-spring`
- `verdict-tilt`
- `verdict-drop`
- `verdict-blunder`
- `landing-soft`
- `landing-positive`
- `landing-warning`
- `landing-danger`
- `move-row-sweep-*`
- `review-story-enter`
- `bookmark-snap`

Names can vary during implementation, but behavior must map to the policies above.

## Reduced motion

When `prefers-reduced-motion: reduce` is active:

- piece transitions are shortened or use the project's current reduced-motion behavior
- no shake
- no bounce/spring overshoot
- no radial burst
- no row sweep
- verdict simply fades in at destination/fallback location
- arrows may appear without draw animation
- colors/text still communicate every classification

No information may depend solely on motion.

## Accessibility

- verdict meaning remains available as text in the review panel
- decorative board effects use `aria-hidden="true"`
- no focus stealing during move animation
- keyboard arrow navigation and bookmark shortcut continue to work
- motion never disables controls
- reduced-motion preference is honored
- badge colors are not the sole classification signal

## Performance constraints

- animate only the current move and current row
- no canvas/WebGL or particle library
- no new runtime animation dependency unless the existing stack already depends on one and the implementation clearly benefits; default is no dependency
- keep landing/badge FX DOM bounded to a few elements
- cancel stale timers/effects on move change/unmount
- do not re-render the full move list because an animation phase changed if a smaller state boundary can be used
- maintain responsive board interactions on typical laptop/mobile hardware

## Error/fallback behavior

### Missing classification

Normal piece animation only. No verdict effect.

### Invalid/missing UCI

Use board sync behavior; skip destination effect; optional existing corner verdict fallback if classification exists.

### Missing best move

Never render a corrective arrow requiring unavailable data.

### Rapid navigation

Cancel stale sequence and settle current requested move directly.

### Component unmount/game change

Clear timers and no delayed UI updates.

## Testing plan

### Pure unit tests — `reviewMotion`

Must cover:

- classification normalization
- classification -> motion preset mapping
- book/good/great/brilliant/inaccuracy/mistake/miss/blunder policies
- negative vs positive arrow timing policy
- destination placement normal orientation
- destination placement flipped orientation
- right-edge/top-edge/corner placement flips
- malformed UCI fallback
- reduced-motion preset behavior

### Board/component contract tests

Must prove:

- destination badge replaces primary fixed-corner badge for valid played moves
- verdict is gated until piece motion/landing phase
- negative corrective arrow is hidden before verdict and visible after its delay/settled state
- positive arrow uses shorter staged reveal
- `isJump` skips theatrical staging
- backward navigation remains supported
- board orientation feeds badge placement correctly
- reduced-motion classes/behavior exist

### Bookmark regression tests

Must prove:

- toggling bookmark updates visual state
- bookmark does not reset/retrigger board piece animation
- bookmark persists in current existing storage/state behavior

### Existing regression coverage

Must continue passing for:

- piece transitions
- capture
- promotion
- castling
- backward restore
- profile orientation
- history -> review navigation
- review hide/show
- keyboard navigation
- bookmarks
- engine settings
- frontend lint/build
- backend tests

## Manual/visual QA matrix

Verify at minimum:

- normal quiet move
- book
- great
- brilliant
- inaccuracy
- mistake
- blunder
- capture
- promotion
- castling
- forward one step
- backward one step
- jump several moves
- rapid arrow-key scrubbing
- board flipped as Black
- bookmark add/remove
- negative best-arrow delay
- review panel hidden/shown
- desktop
- narrow/mobile layout
- reduced motion

## Acceptance criteria

Implementation is ready only when:

1. A normal single-step move visibly completes piece travel before verdict reveal.
2. Valid classifications attach their badge to the destination piece/square with edge-safe placement.
3. Book, brilliant, mistake, and blunder are visually distinct without obscuring chess state.
4. Negative best-move arrows do not appear before the bad verdict.
5. Move list and review story echo the verdict without reanimating the entire panel.
6. Bookmark animation does not replay the chess move.
7. Rapid navigation and jumps settle immediately without stale delayed effects.
8. Reduced-motion mode removes shake/bounce/sweeps while retaining information.
9. No new chess-analysis/backend logic is introduced for optional check/checkmate effects unless current data already supports it.
10. All existing frontend/backend regression tests, lint, and production build pass.
11. New motion unit/component tests pass.
12. No unnecessary runtime dependency is added.

## Implementation order

1. Pure `reviewMotion` policy + placement tests
2. `BoardVerdictBadge` and board phase gating
3. `LandingEffect` + classification keyframes
4. arrow staging
5. move-row and `MoveStory` synchronization
6. bookmark micro-animation
7. reduced-motion pass
8. full regression/build loop
9. visual QA and timing tuning
10. final verification and PR
