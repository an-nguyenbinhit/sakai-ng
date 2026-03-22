---
name: sakai-ng-development
description: Repo-specific workflow for changing DevWorkspace, including Angular 21 conventions, routing, layout, SEO metadata, SSR-safe browser API usage, and validation for tool pages.
---

# Sakai-NG Development Skill

Use this skill for any feature, bugfix, refactor, or review inside this repo, especially when the task touches routes, tool pages, layout, SEO metadata, Monaco-based editors, or SSR/prerender behavior.

## Repo facts

- App name: `DevWorkspace`
- Stack: Angular 21, standalone components, zoneless change detection, signals, PrimeNG, Tailwind CSS v4, Monaco editor
- Main route table: `src/app.routes.ts`
- Main shell/menu: `src/app/layout/component/app.menu.ts`
- Shared layout state: `src/app/layout/service/layout.service.ts`
- Production build output: `dist/devworkspace`
- Path alias: `@/*` maps to `src/*`

Current routed pages:
- `/`
- `/code-compare`
- `/code-formatter`
- `/json-tools`
- `/regex-tester`
- `/encode-decode`
- `/dummy-file-generator`

## Working rules

- Prefer standalone Angular components and direct imports. Do not add NgModules.
- Use signals for local reactive state when state is owned by the component or shared service.
- Follow the repo's existing file pattern instead of enforcing one template style. Some components use external HTML/SCSS files, while several layout components use inline templates.
- Keep PrimeNG and Tailwind usage aligned with existing code. Reuse established patterns before introducing custom styling abstractions.
- Use the `@/*` alias for cross-directory imports.
- Keep route `title` and `data.description` metadata accurate when adding or changing pages.
- Watch for SSR/prerender safety. Any use of `window`, `document`, `localStorage`, `sessionStorage`, DOM globals, or browser-only libraries must be guarded for non-browser execution.
- Class names should not use a `Component` suffix unless the repo already has a legacy exception that is part of the current route surface.

## Task workflows

### Edit an existing tool page

1. Read the page component plus any local services/specs it depends on.
2. Check `src/app.routes.ts` for route metadata that may need to change with the feature.
3. Preserve the current UX language in `src/app/layout/component/app.menu.ts` if labels or navigation are affected.
4. When changing browser-driven behavior, review SSR impact before writing code.
5. Validate with the smallest useful test scope first, then run `npm run build` for meaningful changes.

### Add a new tool page

1. Create the new page under `src/app/pages/<tool-name>/`.
2. Register the route in `src/app.routes.ts`.
3. Add or update the matching sidebar item in `src/app/layout/component/app.menu.ts`.
4. Set a route `title` and `data.description` that match the feature and SEO intent.
5. If the page uses browser-only capabilities, make the initial render SSR-safe.

### Update layout or theming behavior

1. Treat `LayoutService` as the source of truth for layout/theme state.
2. Preserve the current preset/dark-mode behavior from `src/app.config.ts` and layout components.
3. If a change touches menu behavior, test both desktop and mobile assumptions in the existing logic.
4. Be careful with document-level effects and view transitions; they must remain browser-guarded.

## Validation

- `npm test` for broad unit coverage.
- `npx ng test --include='**/path/to/file.spec.ts'` only when the local Angular/Karma setup actually honors the filter.
- `npm run build` is the required integration check for meaningful app changes because it exercises production build plus prerender behavior.
- If build output reports SSR/prerender failures from browser globals, treat that as a real regression, not a test artifact.

## Review checklist

- Does the change match the current route map and menu structure rather than the older admin-template layout?
- Are route metadata and user-facing labels still consistent?
- Are browser APIs guarded for SSR/prerender?
- Is the change using existing PrimeNG/Tailwind patterns instead of inventing a parallel style system?
