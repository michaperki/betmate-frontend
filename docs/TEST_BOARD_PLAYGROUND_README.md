# Test Board Playground

This README captures the compacted context from our earlier discussion plus the documentation pointers that govern Chessground styling and the resizable test rig under `/test`.

## Chessground Documentation Index
- `backend/CHESSGROUND_STYLING.md` — canonical checklist on keeping Chessground's sizing logic untouched (no width/height overrides, maintain `content-box`, avoid flex/grid distortions).
- `frontend/docs/CHESSGROUND_STYLING.md` — frontend-specific guardrails covering `.cg-wrap`, responsive wrapper sizing, and the pseudo-element square lock.
- `frontend/src/style.scss` (global section near lines 60–90) — enforces `box-sizing: content-box` and strips conflicting padding/margins from `.cg-board`, `.cg-wrap`, and related wrappers. Keep new styles scoped so we do not regress these guarantees.

## Current Test Page Snapshot
The sandbox lives in `frontend/src/containers/TestBoardPage/component.tsx` and now renders:
- A resizable primary column that binds the player clocks, board, eval bar, and resize triangle into a single cohesive unit.
- A neighboring outcome rail whose buttons align with the associated clocks (top = black, center = draw, bottom = white). Candidate move slots are scaffolded but still show placeholder text.
- A thinner eval bar split into black (top cap), blue (dynamic center), and white (bottom cap) segments sized relative to the square width.

Recent fixes addressed:
- Chessground crash caused by undefined `rookCastle` configuration now avoided by guarding config assembly inside the component.
- Eval bar and resize affordance now resize in lockstep with the board so gaps do not appear between the clocks and board when scaling down.

## Outstanding TODOs (Next Build Targets)
1. **Rewire move market data** — Reintroduce `MOVE_SETS` above the snapshot definitions inside `component.tsx` and ensure each loop iteration feeds unique white/black candidate arrays so the collapsible panes update per move.
2. **Panel choreography** — Implement the collapsible behavior so only the side-to-move pane expands while the opposite side collapses, keeping the draw button centered regardless of which panel is active.
3. **ChessMatch parity** — Once satisfied with the `/test` sandbox, mirror the finalized layout in `frontend/src/containers/ChessMatch/component.tsx` so the live game view benefits from the new structure.

## Operating the Playground
- Branch: `feature/test-board-playground`.
- Commands: `cd frontend && yarn start`, then visit `http://localhost:8080/test`.
- Resize behavior: drag the lower-right triangle; the outcome rail width/height is tethered to the board column, so both panels stay aligned.

Keep this README updated as new UI systems (move wagering carousel, notation stack, chat, etc.) graduate from the sandbox into the main ChessMatch layout described in `BETMATE_DESKTOP_BACKLOG.md`.
