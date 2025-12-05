# Frontend Docs Index

This folder centralizes all frontend documentation to reduce sprawl and keep the redesign aligned. Start here for the current plan, status, and pointers to deeper docs.

## Quick Nav
- Unification Plan: `frontend/docs/unification-plan.md`
- Component Audit: `frontend/docs/component-audit.md`
- Dark Theme Migration: `frontend/docs/dark-theme-migration.md`
- Mobile-First Redesign Notes: `frontend/docs/mobile-first-redesign.md`
- Chessground Styling Guide: `frontend/docs/CHESSGROUND_STYLING.md`
- Redux Sagas Reference: `frontend/docs/redux/sagas.md`
- Dashboard Redesign Plan: `frontend/DASHBOARD_REDESIGN.md`

## What’s New
- Consolidated plan to reduce visual chrome and unify styling across app
- Clear phases with acceptance criteria for desktop and mobile
- Component-by-component audit with migration checklist

## Document Conventions
- Prefer design tokens over hard-coded values (see `src/styles/tokens.scss`)
- Use component-scoped SCSS files; name `style.scss` or `dark-style.scss` only when necessary
- Link to existing docs instead of duplicating content

## Status
- This index supersedes ad-hoc READMEs in component folders. Legacy docs remain for now and will be merged or retired as we complete migration phases.

