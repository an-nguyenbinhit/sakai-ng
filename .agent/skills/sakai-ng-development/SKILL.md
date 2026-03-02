---
name: sakai-ng-development
description: Guidelines, architecture overview, and conventions for developing the Sakai-NG Angular project.
---

# Sakai-NG Development Skill

This skill provides essential guidelines, architectural choices, and commands for working on the Sakai-NG project, an Angular 21 admin template built on PrimeNG with Tailwind CSS v4.

## Commands

- **Start Dev Server**: `npm start` (Runs on http://localhost:4200 with auto-reload)
- **Production Build**: `npm run build` (Builds to `dist/sakai-ng/`)
- **Dev Build with Watch**: `npm run watch`
- **Run Unit Tests**: `npm test` (via Karma/Jasmine)
- **Format Code**: `npm run format` (Format all JS/TS/HTML files with Prettier)

To run a single test file:
```bash
npx ng test --include='**/path/to/file.spec.ts'
```

## Architecture

### Key Architectural Choices

1. **Standalone Components**: The project uses standalone components exclusively (no `NgModules`). Every component must have `standalone: true`.
2. **Zoneless Change Detection**: The app uses `provideZonelessChangeDetection()` and Angular signals for reactivity, avoiding traditional zone-based change detection.
3. **Signals-based State**: `LayoutService` manages all layout/theme state via `signal()` and `computed()` from `@angular/core`.
4. **Path Alias**: Always use `@/` to import from `src/` (e.g., `import { LayoutService } from '@/app/layout/service/layout.service'`).
5. **Dark Mode**: Dark mode is toggled by adding or removing the `.app-dark` class on the `<html>` element.

### Code Conventions

- **Component Structure**: Always separate HTML, SCSS, and TS into distinct files (`.html`, `.scss`, `.ts`). Do **NOT** use inline `template` or `styles` in the `@Component` decorator.
- **Component Class Names**: Do **NOT** use suffixes for component classes. Use `Dashboard` instead of `DashboardComponent`.
- **Component Selectors**: Custom layout components should use the `app-` prefix. PrimeNG components use the `p-` prefix.
- **Formatting**: The project uses single quotes, 4-space indent, and a 250-char print width (enforced by Prettier).

### Routing Structure

- `/` → `AppLayout` (Main shell with sidebar + topbar)
  - `/` → Dashboard
  - `/pages/**` → Lazy-loaded routing for CRUD, empty, notfound
  - `/uikit/**` → Lazy-loaded UI kit demos
  - `/documentation` → Documentation
- `/landing` → Public landing page (no shell)
- `/auth/**` → Lazy-loaded auth pages (login, error, access denial)
- `/notfound` → 404 page

### Layout System (`src/app/layout/`)

The main shell component `AppLayout` is composed of:
- `AppTopbar`: Top navigation and menus.
- `AppSidebar` → `AppMenu` → `AppMenuitem`: Recursive sidebar navigation.
- `AppFooter`: Bottom footer.
- `AppConfigurator` / `AppFloatingConfigurator`: Theme and preset switchers.

**LayoutService (`src/app/layout/service/layout.service.ts`)** handles the state:
- `layoutConfig` signal: Theme configuration (`preset`, `primary`, `surface`, `darkTheme`, `menuMode`).
- `layoutState` signal: UI state (`staticMenuDesktopInactive`, `overlayMenuActive`, `mobileMenuActive`, etc.).
- Menu modes: Supported modes are `'static'` (default) or `'overlay'`.

### Theming & Styling

- The project uses the PrimeNG `Aura` preset by default (`src/app.config.ts`).
- **Global Styles**: Defined in `src/assets/styles.scss` and `src/assets/tailwind.css`.
- **Component Styles**: Use external SCSS files for component-specific styles (`styleUrl: './component-name.scss'`).
- The project implements **Tailwind CSS v4** via PostCSS and PrimeUI Tailwind integration.
