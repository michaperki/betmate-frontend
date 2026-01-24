# Chess Match Components

## Bottom Toolbar Component

The Bottom Toolbar provides quick access controls for the chess match interface, including stake selection, game status indicator, and action buttons.

### Usage

```jsx
import BottomToolbar from './BottomToolbar';

<BottomToolbar
  selectedStake={5}
  onSelectStake={handleStakeSelection}
  stakePresets={[1, 3, 5, 10, 25]}
  viewerCount={15}
  onOpenChat={handleOpenChat}
  onOpenLeaderboard={handleOpenLeaderboard}
  isLive={true}
  onDraw={handleDrawBet}
  drawState="idle"
  canDraw={true}
  pricingVersion="1.2"
  isRealMode={false}
  drawMult={2.5}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `selectedStake` | number | Currently selected stake value |
| `onSelectStake` | function | Handler for stake selection |
| `stakePresets` | number[] | Available stake options |
| `viewerCount` | number | Number of viewers watching the match |
| `onOpenChat` | function | Handler to open the chat overlay |
| `onOpenLeaderboard` | function | Handler to open the leaderboard overlay |
| `isLive` | boolean | Whether the match is currently live |
| `onDraw` | function | Handler for betting on a draw |
| `drawState` | string | State of the draw button ('idle', 'loading', 'success', 'error') |
| `canDraw` | boolean | Whether draw betting is available |
| `pricingVersion` | string | Optional pricing model version for display |
| `isRealMode` | boolean | Whether the game is in real betting mode |
| `drawPct` | number | Optional draw percentage (0-100) for real mode |
| `drawMult` | number | Optional draw multiplier for display in real mode |

### Styling

The Bottom Toolbar uses BEM naming conventions for all CSS classes:

- Base class: `.bottom-toolbar`
- Elements: `.bottom-toolbar__element` (e.g., `.bottom-toolbar__left`)
- Modifiers: `.bottom-toolbar__element--modifier` or `.is-state` (e.g., `.is-active`)

#### Example of BEM Structure

```scss
.bottom-toolbar {}               // Block
.bottom-toolbar__left {}         // Element
.bottom-toolbar__stake-chip {}   // Element
.bottom-toolbar__stake-chip.is-active {} // Element with state modifier
```

### Responsive Behavior

The Bottom Toolbar adapts to different screen sizes using the application's responsive mixins:

- Desktop: Full controls with more spacing
- Tablet: Slightly compressed layout
- Mobile: Compact layout with reduced padding and element sizes

### Theme Support

The component supports both light and dark themes through CSS variables, following the application's theming system:

```scss
.bottom-toolbar {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

html.light-mode & {
  // Light mode overrides
}
```

### Animation States

The draw button has multiple states with visual feedback:

- `idle`: Default state
- `loading`: Shows spinner animation
- `success`: Shows confirmation checkmark
- `error`: Shows error state

### Accessibility

- All interactive elements have appropriate ARIA attributes
- Focus states are styled consistently 
- The component includes appropriate keyboard navigation support