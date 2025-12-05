# Frontend Unification Plan

Goals
- Reduce visual chrome and achieve a clean, chess-forward aesthetic (inspired by lichess sheets).
- Unify styling across desktop and mobile using a single design system.
- Improve code quality and DRY-ness (no hard-coded colors; consistent primitives).

Principles
- Design tokens are the source of truth: `src/styles/tokens.scss` and `src/styles/mixins.scss`.
- Prefer flat surfaces, subtle borders, minimal shadows. Accent with brand green sparingly.
- Mobile-first layouts; progressive enhancement to desktop.
- Consolidate to one SCSS approach (Tailwind left configured, but not required for this iteration).

Styling Decisions
- Colors, spacing, typography, radii, and shadows come from tokens only.
- Replace hex codes in SCSS with tokens; avoid custom gradients/glows unless specified by tokens.
- Use provided primitives (`.btn`, `.card`, utilities in `utilities.scss`) consistently.
- Prefer BEM-ish naming within component styles (e.g., `.navbar__item`, `.wager-receipt-card`).

Theming
- Step 1: Use existing SCSS tokens everywhere (eliminate inline hex/rgba literals).
- Step 2: Optionally expose CSS variables in `:root` mapped from tokens for runtime theming.

Desktop vs Mobile Layout
- Desktop: keep the new toolbar; board can expand/contract. Right sidebar hosts analysis/betting.
- Mobile: remove expand/contract; bottom toolbar houses Draw/Leaderboard/Chat; tap player clocks to wager; move selection buttons below the board.

Shared Primitives To Standardize
- Button: `.btn --primary|--secondary|--ghost --sm|--lg`
- Card/Panel: `.card --elevated|--compact` for containers, panels, receipts
- Input: `@include input-base` in component SCSS as needed
- Toolbar: shared toolbar container + item styles (for chess actions)
- Tag/Badge: compact pill style using tokens

Immediate Quick Wins (low risk)
1) Replace hard-coded colors with tokens in:
   - `src/containers/ChessMatch/dark-style.scss`
   - `src/components/IntegratedBettingSidebar/style.scss`
   - `src/components/WagerPanel/style.scss`
   - `src/components/NavBar/style.scss` (then swap to `unified-navbar.scss`)
   - `src/style.scss` (`.dashboard-page` background -> `$bg-primary`)
2) Reduce heavy shadows/glows:
   - `src/components/MoveBubbles/style.scss` (remove gradients/glows; use token borders and subtle hover states)
   - `src/components/Leaderboard/styles.scss` (remove accent borders/shadows where unnecessary)
3) Use unified navbar styles:
   - Update NavBar component import to `unified-navbar.scss`; delete or archive `mobile-navbar.scss` and legacy `style.scss`
4) Remove duplicative layout styles for ChessMatch:
   - Merge `styles/chessmatch-layout.scss` into container styles or retire it once dark-style is tokenized

Component & Layout Roadmap
- Phase 0: Organization & Acceptance Criteria
  - Add docs index (done), unification plan (done), component audit (done)
- Phase 1: Token Adoption + Chrome Reduction
  - Convert hex/rgba -> tokens in top offenders listed above
  - Adopt `.btn` & `.card` primitives across Dashboard and ChessMatch side panels
  - Switch NavBar to unified styles
- Phase 2: ChessMatch Unification (Desktop + Mobile)
  - Grid layout with named areas only; remove legacy layout overrides
  - Mobile: bottom toolbar with Draw/Leaderboard/Chat; clock-tap bets
  - Desktop: keep toolbar; ensure eval bar + move bubbles play well with resizing
- Phase 3: Dashboard Unification
  - Apply clean, minimal card styling to Hero/QuickStats/Featured/Live grid
  - Ensure no horizontal scrolling on mobile; simplify cards (less chrome)
- Phase 4: Cleanup & Deletions
  - Remove `.bak`/`original` files; remove deprecated `style.scss` duplicates; drop `chessmatch-layout.scss`
  - Optional: Add stylelint with SCSS rules for token usage

Acceptance Criteria
- No hard-coded colors in active component SCSS; all from `tokens.scss`.
- NavBar uses `unified-navbar.scss`; old variants removed or archived.
- ChessMatch: single source of layout/styles; no conflicting legacy imports; bottom toolbar on mobile; boards sized consistently; expand/collapse only desktop.
- Dashboard: consistent card/button styles; minimal shadows; no gradient-heavy surfaces; no horizontal scroll on mobile.
- MoveBubbles: flat, legible, focus/hover states with token borders; no neon/glow gradients.
- Wager flows: mobile clock-tap -> wager; desktop toolbar has Draw/Leaderboard/Chat; shared styles for receipts, lists, tabs.

Dependencies & Risks
- Ensure no visual regressions on Chessground sizing; validate across breakpoints.
- Retest interaction timings (hold-to-bet) on touch devices.
- Check contrast ratios post-chrome-reduction; adjust tokens if necessary.

Notes
- Tailwind is configured; current code mostly uses SCSS tokens/utilities. We’ll keep Tailwind in place but not depend on it. If desired later, map tokens into Tailwind theme for dual usage.

