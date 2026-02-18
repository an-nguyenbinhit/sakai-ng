Create a new Angular page component for this Sakai-NG project.

Arguments: $ARGUMENTS

## Instructions

Parse $ARGUMENTS to extract:
- **Page name**: PascalCase class name (e.g. `UserManagement`, `Reports`)
- **Route path**: kebab-case path segment (e.g. `user-management`, `reports`) — derive from page name if not given
- **Route group**: which routes file to add to — default is `pages` (`src/app/pages/pages.routes.ts`), or `uikit`

### Step 1 — Create the component file

Create `src/app/pages/{route-path}/{route-path}.ts` with this pattern:

```typescript
import { Component } from '@angular/core';

@Component({
    selector: 'app-{route-path}',
    standalone: true,
    imports: [],
    template: `
        <div class="card">
            <div class="font-semibold text-xl mb-4">{Page Name}</div>
            <!-- page content here -->
        </div>
    `
})
export class {PageName} {}
```

**Conventions to follow (non-negotiable):**
- `standalone: true` — no NgModules ever
- Class name has **no "Component" suffix** (ESLint enforces this): use `UserManagement`, not `UserManagementComponent`
- Selector uses `app-` prefix for pages: `app-user-management`
- Use Angular **signals** (`signal()`, `computed()`) for reactive state — NOT `BehaviorSubject` or manual CD
- Never use `ngZone.run()` — project uses `provideZonelessChangeDetection()`
- Import path alias `@/*` maps to `src/*` — use `@/app/...` not relative `../../`
- Single quotes, 4-space indent, max 250-char lines (Prettier config)
- TypeScript strict mode — no implicit `any`, explicit return types on non-trivial methods

**Styling:**
- Tailwind CSS v4 utility classes for layout
- `class="card"` for white card containers (PrimeNG surface style)
- PrimeNG components for UI (buttons, tables, forms, etc.)
- Dark mode: use `dark:` Tailwind variants or PrimeNG surface tokens (`bg-surface-0`, `text-surface-900`)

### Step 2 — Register the route

Add a lazy-loaded route to the target routes file.

For `src/app/pages/pages.routes.ts`:
```typescript
{
    path: '{route-path}',
    loadComponent: () => import('./{route-path}/{route-path}').then(m => m.{PageName})
}
```

### Step 3 — Add menu item (optional, ask user)

If the page should appear in the sidebar, add it to `src/app/layout/component/app.menu.ts` under the appropriate section (Home, Pages, etc.):
```typescript
{ label: '{Page Label}', icon: 'pi pi-{icon}', routerLink: ['/pages/{route-path}'] }
```

### Step 4 — Report what was created

List all files created/modified with their paths as clickable markdown links.
