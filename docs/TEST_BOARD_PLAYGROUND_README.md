# Test Board Playground

This README captures the compacted context from our earlier discussion plus the documentation pointers that govern Chessground styling and the resizable test rig under `/test`.

## Chessground Documentation Index
- `backend/CHESSGROUND_STYLING.md` — canonical checklist on keeping Chessground's sizing logic untouched (no width/height overrides, maintain `content-box`, avoid flex/grid distortions).
- `frontend/docs/CHESSGROUND_STYLING.md` — frontend-specific guardrails covering `.cg-wrap`, responsive wrapper sizing, and the pseudo-element square lock.
- `frontend/src/style.scss` (global section near lines 60–90) — enforces `box-sizing: content-box` and strips conflicting padding/margins from `.cg-board`, `.cg-wrap`, and related wrappers. Keep new styles scoped so we do not regress these guarantees.

## Current Test Page Snapshot
The sandbox lives in `frontend/src/containers/TestBoardPage/component.tsx` and now renders:
- A resizable primary column that binds the player clocks, board, eval bar, and resize triangle into a single cohesive unit. The resize logic respects `MIN_BOARD_SIZE = 350` and updates both desktop and mobile wrappers in sync.
- A neighboring outcome rail whose buttons align with the associated clocks (top = black, center = draw, bottom = white). Each outcome button now uses the new `idle ↔ loading ↔ success/error` animation cycle (spinner overlay + check flash, error shake), and the dev panel lets us force each outcome into success or error for testing.
- Move wagering panels on both sides respond to the side-to-move and the same hover arrow preview. Each move button/chip includes subtle loading shimmers, success glows, and error shakes so move bets feel consistent with outcome bets.
- Mobile layout shows the move chips + stacked outcome buttons below the board while the desktop outcome rail hides at <768px; both share the same state engine.
- A floating “Dev Tools” toggle opens the new diagnostics popup (playback controls, per-outcome success/error selectors, and live state readouts). This replaces the in-line dev banner so the main layout stays clean.

Recent fixes addressed:
- Chessground crash caused by undefined `rookCastle` configuration now avoided by guarding config assembly inside the component.
- Eval bar and resize affordance now resize in lockstep with the board so gaps do not appear between the clocks and board when scaling down.
- Outcome buttons no longer stick in loading states thanks to per-button reset timers, and the checkmark/spinner overlays only appear in their respective state.
- Low-level move bet interactions now mimic outcome behavior (per-move state map, dev toggle, automatic resets).

## Desktop Layout Planning Notes
- **Board-centric shell**: we deliberately keep the board/clock/eval unit free to scale up to the max window bounds. Right rail houses outcome/move betting; when the board shrinks, there’s room for additional panels, but when it grows we’ll let auxiliaries wrap below or slide to other sides.
- **Notation + controls**: natural place is to the left of the board—a slim rail holding the move list, click-to-scrub, and Prev/Pause/Next. When the user scrubs to a historical move we’ll add a “not live” tint on the board/clock shell and put outcome/move rails into a disabled state (or show historical winners).
- **Game controls + wager history**: plan to live beneath the board/outcome row on large viewports (two skinny rows) and stack cleanly underneath when the board consumes the entire width.
- **Dev toggles**: the popup will eventually house move/outcome dev controls only; playback will move to the notation rail once it exists.

## Outstanding TODOs (Next Build Targets)
1. **Notation & history rail (“left column”)** — Build the move list + playback controls with a “Jump to Live” affordance. Hook move clicks to `setPositionIndex` and apply a not-live overlay to the board + disable betting rails while rewound.
2. **Game controls / wager history modules** — Design lightweight cards under the board for stake selection, wager feed, and chat placeholders that collapse gracefully when the board is maxed out.
3. **Move bet UX while rewound** — When scrubbing back, show the historical winning move (green highlight) and fade/disable other candidates; ensure outcome buttons reflect the historical state too.
4. **ChessMatch parity** — Once we’re satisfied with `/test`, port the responsive layout + interaction model into `frontend/src/containers/ChessMatch/component.tsx`, wiring it to real pool data and live wager endpoints.
5. **Accessibility polish** — Respect `prefers-reduced-motion` by disabling shimmer/shake animations and ensure the floating dev toggle is keyboard-friendly.

## Operating the Playground
- Branch: `feature/test-board-playground`.
- Commands: `cd frontend && yarn start`, then visit `http://localhost:8080/test`.
- Resize behavior: drag the lower-right triangle; the outcome rail width/height is tethered to the board column, so both panels stay aligned.

Keep this README updated as new UI systems (move wagering carousel, notation stack, chat, etc.) graduate from the sandbox into the main ChessMatch layout described in `BETMATE_DESKTOP_BACKLOG.md`.
