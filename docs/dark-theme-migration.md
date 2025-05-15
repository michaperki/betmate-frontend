# Dark Theme UI Migration Guide

This document outlines the approach, guidelines, and implementation details for updating Betmate's UI components to the new dark theme.

## Table of Contents
1. [Overview](#overview)
2. [Color Palette](#color-palette)
3. [Component Migration Guidelines](#component-migration-guidelines)
4. [CSS Architecture](#css-architecture)
5. [Example Implementations](#example-implementations)
6. [File Structure and Naming](#file-structure-and-naming)
7. [Responsive Design Considerations](#responsive-design-considerations)

## Overview

The Betmate UI is being updated with a cohesive dark theme that enhances visual appeal, reduces eye strain, and provides a more immersive chess and betting experience. This guide serves as the reference for implementing consistent dark theme styles across all components.

## Color Palette

### Primary Colors
- **Background (Primary)**: `#050505` - Main page background
- **Background (Secondary)**: `#111111` - Component backgrounds, cards, nav bars
- **Background (Tertiary)**: `#1e1e2e` - Sidebar backgrounds, modals
- **Text (Primary)**: `#F2F2F2` - Main text color
- **Text (Secondary)**: `#BDBDBD` - Secondary text, descriptions
- **Text (Tertiary)**: `#9999a8` - Labels, less prominent text

### Accent Colors
- **Primary Accent**: `#00EFB2` - Call to action, highlights, primary buttons
- **Secondary Accent**: `#3A88FE` - Links, interactive elements
- **Alert**: `#F44336` - Errors, warnings, negative outcomes
- **Success**: `#4CAF50` - Positive outcomes, confirmations

### Chess Element Colors
- **Light Square**: `#EFEFEF` (standard) 
- **Dark Square**: `#c2a06c` (customized for better contrast)
- **White Player Elements**: `#FFFFFF`
- **Black Player Elements**: `#1E1E25`
- **Draw Elements**: `#6D7A8C`

## Component Migration Guidelines

When updating a component to use the dark theme:

1. **Create dark-theme variants**:
   - For components with complex styles, create a separate `dark-style.scss` file
   - For simpler components, extend existing styles with dark theme classes

2. **Use the established color palette**:
   - Avoid hardcoded colors not in the palette
   - Use CSS variables where applicable for consistency

3. **Consider visual hierarchy**:
   - Maintain sufficient contrast between elements
   - Use accent colors sparingly to highlight important elements

4. **Optimize for readability**:
   - Ensure text meets WCAG AA contrast requirements (minimum 4.5:1 for normal text)
   - Use proper font weights and sizes for hierarchy

5. **Maintain component functionality**:
   - Dark theme changes should be visual only
   - All interactive elements should remain fully functional

## CSS Architecture

### File Structure
Components can implement dark theme styles in two ways:

1. **Separate dark theme file** (recommended for complex components):
   ```
   ComponentName/
     ├── component.tsx
     ├── index.ts
     ├── style.scss        // Base styles
     └── dark-style.scss   // Dark theme styles
   ```

2. **Integrated approach** (for simpler components):
   ```scss
   // Within style.scss
   .component {
     // Base styles
     
     &.dark-theme {
       // Dark theme overrides
     }
   }
   ```

### Class Naming Conventions
- Use `-dark` suffix for dark-themed container classes
- Use descriptive BEM-style naming for component elements

Example:
```scss
.game-page-dark {
  .player-info-dark {
    .player-name { /* ... */ }
    .player-stats { /* ... */ }
  }
}
```

## Example Implementations

### Container Component Example
The `ChessMatch` container demonstrates the dark theme implementation with its separate `dark-style.scss` file:

```scss
// dark-style.scss
.dark-game-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #050505;
  color: #F2F2F2;
  font-family: 'Roboto', sans-serif;
  width: 100vw; 
}

// Component-specific styling...
```

### Nested Component Example
The `PlayerInfo` component shows how to implement dark theme for a child component:

```scss
// playerInfo/dark-style.scss
.player-info-dark {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background-color: #111111;
  margin-bottom: 8px;
  
  &.player-turn {
    background-color: #1E1E1E;
    box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.5), -5px -5px 10px rgba(255, 255, 255, 0.05);
  }
}

// Element-specific styling...
```

### Interactive Component Example
The `IntegratedBettingSidebar` component demonstrates dark theme for interactive elements:

```scss
.integrated-betting-sidebar {
  background-color: #1e1e2e;
  // Base styling...
  
  .tab-button {
    color: #9999a8;
    
    &.active {
      color: #fff;
      background-color: rgba(255, 255, 255, 0.05);
      border-bottom: 2px solid #3a88fe;
    }
  }
  
  // Other interactive elements...
}
```

## File Structure and Naming

When creating dark theme variants of components, follow these naming conventions:

1. For component-level stylesheets:
   - Base styles: `style.scss`
   - Dark theme: `dark-style.scss`

2. For CSS classes:
   - Main containers: `component-name-dark`
   - Child elements: regular descriptive names

3. For imported styling:
   ```tsx
   // In component.tsx
   import './style.scss';
   import './dark-style.scss'; // Import dark theme styles
   ```

## Responsive Design Considerations

The dark theme implements responsive designs with these breakpoints:

- **Mobile**: < 640px
- **Tablet**: 640px - 768px
- **Small Desktop**: 768px - 1200px
- **Large Desktop**: > 1200px

Example responsive approach:
```scss
.game-content {
  display: grid;
  grid-template-columns: 1fr;
  
  @media (min-width: 768px) {
    grid-template-columns: minmax(0, 1fr) 300px;
  }
  
  @media (min-width: 1200px) {
    grid-template-columns: 300px minmax(0, 1fr) 300px;
  }
}
```

Ensure all dark theme components maintain full responsiveness according to these breakpoints.