Create a new dashboard widget component for the Sakai-NG project.

Arguments: $ARGUMENTS

## Instructions

Parse $ARGUMENTS to extract:
- **Widget name**: PascalCase (e.g. `RevenueChart`, `UserActivity`) — derive selector/filename from this
- **Widget type hint** (optional): `stats`, `chart`, `table`, `list`, `notification` — use to pick the right PrimeNG components

### Step 1 — Read existing widgets for context

Before writing, read the existing dashboard widgets to understand the patterns:
- `src/app/pages/dashboard/components/statswidget.ts`
- `src/app/pages/dashboard/components/revenuestreamwidget.ts`
- `src/app/pages/dashboard/components/notificationswidget.ts`

### Step 2 — Create the widget file

Create `src/app/pages/dashboard/components/{widgetname}.ts`:

```typescript
import { Component, signal, computed, inject } from '@angular/core';
// import PrimeNG modules as needed

@Component({
    selector: 'app-{widget-selector}-widget',
    standalone: true,
    imports: [
        // only import what you actually use
    ],
    template: `
        <div class="card mb-8">
            <div class="font-semibold text-xl mb-4">{Widget Title}</div>
            <!-- widget content -->
        </div>
    `
})
export class {WidgetName}Widget {
    // Use signals for all reactive state
    // data = signal<Type[]>([]);
    // isLoading = signal(false);
}
```

**Conventions (non-negotiable):**
- `standalone: true`, no NgModules
- Class name ends with `Widget` suffix (matching existing pattern: `StatsWidget`, `RevenueStreamWidget`)
- Selector pattern: `app-{name}-widget`
- Use `signal()` and `computed()` for reactive state — NOT observables or zone-based CD
- Use `inject()` for dependency injection (preferred over constructor injection in new code)
- Never import unused PrimeNG modules — only import what the template uses
- Wrap content in `<div class="card mb-8">` to match dashboard card style

**Widget type guidance:**
- **stats**: Use grid + icon + number pattern (see `statswidget.ts`)
- **chart**: Import `ChartModule` from `primeng/chart`, use Chart.js config signal
- **table**: Import `TableModule` from `primeng/table`, use `signal<T[]>([])` for data
- **list**: Import `DataViewModule` or simple `@for` loop
- **notification**: Use `p-tag`, `p-badge`, timeline-style list

### Step 3 — Register in Dashboard

Update `src/app/pages/dashboard/dashboard.ts`:
1. Import the new widget class
2. Add to `imports: []` array
3. Add `<app-{name}-widget />` to the template grid

The dashboard uses a 12-column grid:
```html
<div class="col-span-12 xl:col-span-6">
    <!-- widgets stack vertically here -->
</div>
```

### Step 4 — Report

List all files created/modified as clickable markdown links.
