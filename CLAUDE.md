# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:4200 (auto-reloads on changes)
npm run build      # Production build to dist/devworkspace/
npm run watch      # Dev build with file watching
npm test           # Unit tests via Karma/Jasmine
npm run format     # Format all JS/TS/HTML files with Prettier
```

To run a single test file, use:
```bash
npx ng test --include='**/path/to/file.spec.ts'
```

## Architecture

**DevWorkspace** is an Angular 21 admin template built on [PrimeNG](https://primeng.org/) component library with Tailwind CSS v4.

### Key architectural choices

- **Standalone components** throughout — no NgModules. Every component uses `standalone: true`.
- **Zoneless change detection** (`provideZonelessChangeDetection()`) — use Angular signals for reactivity instead of triggering zone-based CD.
- **Signals-based state** — `LayoutService` manages all layout/theme state via `signal()` and `computed()` from `@angular/core`.
- **Path alias** — `@/*` maps to `src/*` (e.g., `import { LayoutService } from '@/app/layout/service/layout.service'`).
- **Dark mode** — toggled by adding/removing the `.app-dark` class on `<html>`. Uses View Transitions API when available.

### Routing structure

```
/                    → AppLayout (shell with sidebar + topbar)
  /                  → Dashboard
  /uikit/**          → Lazy-loaded UI kit demos
  /documentation     → Documentation page
  /pages/**          → Lazy-loaded: crud, empty, notfound
/landing             → Public landing page (no shell)
/auth/**             → Lazy-loaded: login, error, access
/notfound            → 404 page
```

### Layout system (`src/app/layout/`)

The `AppLayout` component is the main shell. It composes:
- `AppTopbar` — top navigation bar with menu toggle and theme configurator trigger
- `AppSidebar` → `AppMenu` → `AppMenuitem` — recursive sidebar navigation
- `AppFooter` — bottom footer
- `AppConfigurator` / `AppFloatingConfigurator` — theme/preset switcher panel

`LayoutService` is the single source of truth for layout state:
- `layoutConfig` signal: `{ preset, primary, surface, darkTheme, menuMode }` — theme configuration
- `layoutState` signal: `{ staticMenuDesktopInactive, overlayMenuActive, mobileMenuActive, ... }` — UI state
- Menu modes: `'static'` (default) or `'overlay'`

### Theming

PrimeNG is configured with the `Aura` preset by default (`src/app.config.ts`). The `AppConfigurator` component allows runtime switching between Aura, Lara, and Nora presets, primary colors, and surface palettes using `@primeuix/themes` utilities (`updatePreset`, `updateSurfacePalette`, `$t()`).

### Page services (`src/app/pages/service/`)

Demo data services providing mock data for the UI kit examples:
- `ProductService`, `CustomerService` — CRUD demo data
- `CountryService`, `NodeService`, `PhotoService`, `IconService` — various component demos

### Styling

- Global styles: `src/assets/styles.scss` and `src/assets/tailwind.css`
- Component styles use inline SCSS (`inlineStyleLanguage: "scss"` in angular.json)
- Tailwind CSS v4 via PostCSS (`@tailwindcss/postcss`)
- PrimeUI Tailwind integration via `tailwindcss-primeui` plugin

### Code conventions

- Component class names have **no suffix** (ESLint enforces `@angular-eslint/component-class-suffix` with empty suffixes array) — e.g., `Dashboard`, `AppLayout`, not `DashboardComponent`
- Component selectors use prefix `p` (per ESLint config), but built-in layout components use `app-` prefix
- Single quotes, 4-space indent, 250-char print width (see `.prettierrc.json`)
- TypeScript strict mode enabled with `noImplicitOverride`, `noImplicitReturns`, `strictTemplates`
