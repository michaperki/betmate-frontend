# Component Audit (Frontend)

Summary
- Many components already reference the new dark/mobile-first styling; some still use legacy `style.scss` with hard-coded colors and heavy effects.
- The design tokens system is present and solid (`tokens.scss`, `mixins.scss`, `utilities.scss`, `components.scss`) but not uniformly adopted.

High-Priority Targets (tokenize + de-chrome)
- ChessMatch (container)
  - Files: `src/containers/ChessMatch/dark-style.scss`, `src/containers/ChessMatch/style.scss` (imports `styles/chessmatch-layout.scss`), `src/styles/chessmatch-layout.scss`
  - Issues: duplicate layout/style tracks; many hard-coded hex/rgba; heavy box-shadow in places; mobile and desktop variants both present and sometimes conflicting
  - Plan: Tokenize `dark-style.scss`, remove hard-coded colors, then retire `styles/chessmatch-layout.scss` after parity

- MoveBubbles
  - Files: `src/components/MoveBubbles/style.scss`, plus backups (`component.tsx.bak`, `component.tsx.bak2`, `component.original.tsx`)
  - Issues: gradients, glows, heavy effects; backup files in source tree
  - Plan: Flatten styles with tokens; replace glow with subtle border/hover; archive/remove backups at Phase 4

- WagerPanel
  - Files: `src/components/WagerPanel/style.scss`
  - Issues: hard-coded colors; glow on WDL bar; fixed widths
  - Plan: Tokenize; replace glow with `shadow-sm` or none; use responsive tokens for width/padding

- IntegratedBettingSidebar
  - Files: `src/components/IntegratedBettingSidebar/style.scss`
  - Issues: hard-coded colors/borders
  - Plan: Tokenize; align to `.card` patterns; ensure scroll areas use `@include custom-scrollbar`

- NavBar
  - Files: `src/components/NavBar/unified-navbar.scss` (good), but component imports `mobile-navbar.scss` and has legacy `style.scss`
  - Issues: duplicated nav styles; inconsistent theme
  - Plan: Switch component import to `unified-navbar.scss`; archive old scss

Medium Priority (converge on tokens/primitives)
- WagerReceipts
  - Files: `src/components/WagerReceipts/dark-style.scss` (already on tokens), `style.scss` (legacy)
  - Plan: Keep dark-style; delete legacy later

- TabPanel
  - Files: `src/components/TabPanel/dark-style.scss` (tokens), legacy `style.scss`
  - Plan: Keep dark-style; delete legacy later

- PlayerInfo (ChessMatch player header)
  - Files: `src/containers/ChessMatch/playerInfo/dark-style.scss`
  - Issues: tokens partly used; several hard-coded colors
  - Plan: Tokenize; ensure timer active state matches brand accents subtly

- Dashboard and children
  - Files: `src/containers/Dashboard/style.scss` (good, uses tokens); components under `Dashboard/components/*/style.scss`
  - Issues: mostly aligned, but reduce heavy accents (e.g., bright outlines, large shadows) where present

- Leaderboard
  - Files: `src/components/Leaderboard/styles.scss`
  - Issues: mostly tokenized; special gradients for top 3
  - Plan: keep minimal accents; consider removing gradients in favor of token backgrounds

Legacy/Redundant Artifacts
- `src/styles/chessmatch-layout.scss` (imported by `containers/ChessMatch/style.scss`)
  - Plan: fold into tokenized `dark-style.scss` and remove

- Authentication legacy styles
  - `src/containers/authentication/style.scss` marks itself deprecated;
  - Plan: keep `dark-style.scss` variants and remove legacy after migration

- Backup source files in repo
  - e.g., `MoveBubbles/component.tsx.bak`, `.bak2`, `component.original.tsx`
  - Plan: move to `frontend/legacy/` or delete in Phase 4

Global Styles
- `src/style.scss`
  - Minor: replace `#050505` in `.dashboard-page` with `$bg-primary`
  - Confirm Chessground overrides use tokens (they currently do for squares/highlights)

Lint/Tooling (Optional)
- Add stylelint with SCSS plugin enforcing token usage for colors and spacing
- Rule of thumb: no hex colors allowed outside `tokens.scss`

