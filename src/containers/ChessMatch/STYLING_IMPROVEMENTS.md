# Bottom Toolbar Styling Improvements

This document outlines the styling improvements made to the Bottom Toolbar component to align it with the application's design system and best practices.

## Key Improvements

### 1. Proper Theme Integration

- Added imports for themes.scss to support theme variables
- Replaced hardcoded color values with theme variables
- Ensured consistent light/dark theme transitions
- Implemented proper handling of both themes using CSS variables

Before:
```scss
background: linear-gradient(135deg, #0f172a, #0b1120);
color: #e0f2ff;
```

After:
```scss
background: var(--bg-secondary);
color: var(--text-primary);
```

### 2. Consistent BEM Naming

- Refactored all class names to follow BEM conventions
- Used more semantic class naming
- Added proper nesting for child elements
- Improved selector specificity

Before:
```scss
.bt-icon-btn {}
.stake-chip-row {}
```

After:
```scss
.bottom-toolbar__icon-btn {}
.bottom-toolbar__stake-row {}
```

### 3. Design Token Usage

- Replaced hardcoded values with design tokens
- Used spacing tokens consistently
- Applied typography scale properly
- Implemented border radius tokens

Before:
```scss
font-size: 12px;
padding: 4px 10px;
border-radius: 999px;
```

After:
```scss
font-size: $text-xs;
padding: $space-1 $space-2;
border-radius: $radius-pill;
```

### 4. Proper Responsive Techniques

- Replaced direct media queries with application mixins
- Implemented mobile-first approach consistently
- Used responsive breakpoints from the design system

Before:
```scss
@media (max-width: 640px) {
  // Styles
}
```

After:
```scss
@include mobile {
  // Styles
}
```

### 5. Added Missing Components

- Added proper styling for the `live-pill` indicator
- Implemented consistent status indicators
- Created better visual feedback for various states

### 6. Improved Transitions & Animations

- Used standard transition timing variables
- Implemented consistent easing functions
- Improved animation performance

Before:
```scss
transition: opacity 0.12s ease;
```

After:
```scss
transition: opacity $duration-base $ease-out;
```

### 7. Component Decoupling

- Removed overlay/modal styles from this component
- Focused on a single responsibility pattern

### 8. CSS Variables for Theme-Specific Values

- Used CSS variables for themeable values
- Implemented proper fallbacks
- Used RGB triplets for opacity variations

Before:
```scss
border-color: rgba(96, 165, 250, 0.45);
```

After:
```scss
border-color: rgba(var(--info), 0.45);
```

## Benefits of These Improvements

1. **Maintainability**: The component is now easier to maintain with standardized patterns
2. **Consistency**: Visual styling aligns with the rest of the application
3. **Performance**: Better CSS specificity and fewer overrides
4. **Theming**: Proper theme support with smooth transitions
5. **Responsiveness**: Better adaptation to different screen sizes
6. **Accessibility**: Improved states for focus, hover, and active