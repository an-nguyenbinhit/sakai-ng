Add a new route to the Sakai-NG routing system.

Arguments: $ARGUMENTS

## Instructions

Parse $ARGUMENTS to extract:
- **Route path**: the URL segment (e.g. `reports`, `user-management`, `auth/register`)
- **Component**: class name or file path of the component to route to
- **Route group**: which routes file — auto-detect from path prefix:
  - `auth/...` → `src/app/pages/auth/auth.routes.ts`
  - `uikit/...` → `src/app/pages/uikit/uikit.routes.ts`
  - Anything else → `src/app/pages/pages.routes.ts`
  - `top-level` → `src/app.routes.ts` (inside AppLayout children)

### Step 1 — Read the target routes file

Read the appropriate routes file to understand the current structure:
- `src/app/pages/pages.routes.ts`
- `src/app/pages/auth/auth.routes.ts`
- `src/app/pages/uikit/uikit.routes.ts`
- `src/app/app.routes.ts`

### Step 2 — Verify the component exists

Check that the component file exists at the expected path. If it doesn't exist, warn the user and suggest running `/new-page` or `/new-crud` first.

### Step 3 — Add the route

**For lazy-loaded routes (default — use this for all new pages):**
```typescript
{
    path: '{route-path}',
    loadComponent: () =>
        import('./{component-path}').then(m => m.{ComponentClass})
}
```

**For eagerly loaded routes (only if user explicitly asks):**
```typescript
{
    path: '{route-path}',
    component: {ComponentClass}
}
```

**For routes with child routes:**
```typescript
{
    path: '{route-path}',
    loadChildren: () => import('./{path}/{path}.routes').then(m => m.{routesExport})
}
```

**Routing conventions:**
- Always use **lazy loading** (`loadComponent`) for new pages — never eager load page components
- Place new routes before any wildcard or redirect routes
- Use kebab-case for path segments
- No leading slash in the `path` value

### Step 4 — Check for navigation

Ask the user if they also want to add a sidebar menu item. If yes, mention they can run `/add-menu-item` or offer to do it inline.

### Step 5 — Report

Show the exact diff of what was added to the routes file, with a clickable link to the file.
