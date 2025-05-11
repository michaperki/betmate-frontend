# New Game Page Layout Plan

## Components to Create

1. **CoinBalance.tsx**
   - Icon + Balance display component
   - Reusable across app (navbar, game page)

2. **BettingSidebar.tsx**
   - Tab navigation (Move/Outcome tabs)
   - Odds list with payouts
   - Stake buttons (10/50/100)
   - Mini leaderboard

3. **Updated GamePage.tsx**
   - Top bar with logo and balance
   - Main grid layout (board | sidebar)
   - Responsive design

## Files to Update

1. **package.json**
   - Add @headlessui/react for tab components
   - Add tailwindcss and dependencies

2. **tailwind.config.js**
   - Add dark theme colors
   - Configure spacing and breakpoints
   - Add neumorphic utility classes

3. **webpack.config.js**
   - Configure PostCSS for Tailwind

## Styling Updates

- Remove SCSS files once migrated to Tailwind
- Add utility hooks for betting and odds polling
- Ensure accessibility (contrast, focus states)

## Implementation Strategy

1. Set up Tailwind configuration
2. Build basic layout components
3. Replace existing components one by one
4. Wire up existing state/actions
5. Test responsive breakpoints
6. Add finishing touches (animations, transitions)