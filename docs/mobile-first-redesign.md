# Mobile-First Redesign Guide

This guide documents the design patterns, components, and implementation approach for the mobile-first redesign of the Betmate UI.

## Current Design Implementation

The Betmate application has successfully implemented mobile-first design in several key components:

- **Dashboard**: Fully responsive with mobile-optimized layouts
- **ChessMatch/Game UI**: Dark theme with responsive grid layout

These implementations provide a foundation for other components that need to be updated.

## Design Tokens & Styling System

### Core Design Tokens

The application uses a comprehensive set of design tokens (`src/styles/tokens.scss`) including:

- **Colors**: Dark theme with `$bg-primary` (#050505), `$bg-secondary` (#111111), and brand colors
- **Typography**: Responsive text sizes with mobile-specific adjustments
- **Spacing**: Consistent spacing scale based on 4px increments
- **Breakpoints**: Mobile-first media queries

### Responsive Patterns

Key responsive patterns include:

- CSS Grid for main layouts with area templates that change based on screen size
- Flexbox for component layouts with column direction on mobile
- Reduced spacing and font sizes on mobile viewports
- Stack layout on mobile vs. side-by-side on desktop

## Components Needing Redesign

The following components should be updated to match the mobile-first approach:

### 1. GameInfoPanel

**Current issues:**
- Lacks proper dark theme styling consistency
- Not using design tokens effectively
- Limited responsive behavior

**Recommendations:**
- Implement proper dark theme with background colors from token system
- Use CSS Grid for better responsive layout
- Add mobile-specific styles for font sizes and spacing
- Integrate with existing dark-style.scss pattern

### 2. ChatBox/GameCommunication

**Current issues:**
- Positioning in the layout doesn't follow mobile-first principles
- Styling doesn't match the dark theme aesthetics

**Recommendations:**
- Update positioning in grid layout based on device size
- Apply dark theme styling consistent with other components
- Implement proper scrolling behavior on mobile

### 3. WagerReceipts

**Current issues:**
- Mobile layout needs optimization
- Visual hierarchy needs improvement on small screens

**Recommendations:**
- Create compact mobile view
- Improve information hierarchy for small screens
- Use consistent dark theme styling

### 4. MoveBubbles

**Current issues:**
- Could benefit from better mobile optimization
- Touch interaction can be improved

**Recommendations:**
- Optimize for touch interfaces
- Adjust sizing and spacing for mobile
- Ensure consistent dark theme styling

## Implementation Strategy

1. **Use existing patterns**: Follow the successful approaches in Dashboard and ChessMatch
2. **Leverage mixins**: Use the responsive mixins from `src/styles/mixins.scss`
3. **Apply design tokens**: Consistently use tokens instead of hard-coded values
4. **Test on mobile first**: Design and test mobile layouts first, then expand to desktop

## CSS Best Practices

- Use mobile-first media queries with `@include mobile`, `@include tablet`, and `@include desktop`
- Maintain component-specific SCSS files with responsive variations
- Follow BEM naming convention for CSS classes
- Use the existing dark theme color system

## Example Approach

For each component:

1. Create/update component-specific stylesheet
2. Add dark-style.scss variant if needed
3. Implement mobile styling first
4. Add tablet and desktop variants using mixins
5. Ensure proper grid area placement in responsive layouts
6. Test on multiple viewport sizes

---

This guide should be updated as the redesign progresses with additional patterns, components, and learnings.