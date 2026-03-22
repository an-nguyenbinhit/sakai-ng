# AGENTS.md

This repository uses `AGENTS.md` plus the project skill at `.agent/skills/sakai-ng-development/SKILL.md` as the canonical guidance stack. Keep this file short, accurate, and aligned with the current app.

## Commands

```bash
npm start          # Dev server at http://localhost:4201
npm run build      # Production build to dist/devworkspace/
npm run watch      # Development build in watch mode
npm test           # Karma/Jasmine unit tests
npm run format     # Prettier for JS/TS/HTML files
```

Single-spec execution via `npx ng test --include='**/path/to/file.spec.ts'` may not work reliably in every environment. Treat it as optional and verify the command before depending on it.

## Current app shape

`DevWorkspace` is an Angular 21 tool suite built with standalone components, PrimeNG, Tailwind CSS v4, Monaco Editor, and SSR/prerender support.

- Routing is defined centrally in `src/app.routes.ts`.
- The shell is `AppLayout`, with navigation in `src/app/layout/component/app.menu.ts`.
- Current tool routes are: `/`, `/code-compare`, `/code-formatter`, `/json-tools`, `/regex-tester`, `/encode-decode`, and `/dummy-file-generator`.
- `LayoutService` in `src/app/layout/service/layout.service.ts` owns layout and theme state via Angular signals.

## Working rules

- Prefer standalone Angular components and direct imports; do not introduce NgModules.
- Use signals for local reactive state where appropriate; the app is zoneless via `provideZonelessChangeDetection()`.
- Use the `@/*` path alias for cross-directory imports from `src/*`.
- Preserve existing PrimeNG + Tailwind patterns instead of re-theming components ad hoc.
- When adding or changing routes, keep route `title` and `data.description` metadata accurate.
- Guard browser-only APIs such as `window`, `document`, `localStorage`, and `sessionStorage` so SSR/prerender does not break.

## Validation

- Use targeted tests when available.
- Run `npm run build` for integration validation on meaningful app changes.
- Treat SSR/prerender failures as first-class regressions, especially when touching pages, layout, or browser APIs.

See `.agent/skills/sakai-ng-development/SKILL.md` for detailed repo workflows.
