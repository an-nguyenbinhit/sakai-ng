Add a new item to the Sakai-NG sidebar navigation menu.

Arguments: $ARGUMENTS

## Instructions

Parse $ARGUMENTS to extract:
- **Label**: display text shown in the sidebar (e.g. `User Management`, `Reports`)
- **Route**: the router link path (e.g. `/pages/users`, `/pages/reports`)
- **Icon**: PrimeIcons class name (e.g. `pi-users`, `pi-chart-bar`, `pi-file`) — suggest based on label if not provided
- **Section**: which section to add to — default is `Pages`, options: `Home`, `UI Components`, `Pages`, `Get Started`

### Step 1 — Read the menu file

Read `src/app/layout/component/app.menu.ts` to understand the full menu structure.

### Step 2 — Choose the right section

The menu model has these sections (look for the `label` property on top-level items):
- **Home** — contains Dashboard (rarely add here)
- **UI Components** — PrimeNG demo pages only (do not add custom pages here)
- **Pages** — landing, auth, crud, empty pages → **add most new pages here**
- **Hierarchy** — demo submenu nesting (do not touch)
- **Get Started** — documentation links (do not touch)

### Step 3 — Add the menu item

Locate the correct section's `items` array in `src/app/layout/component/app.menu.ts` and add:

**Simple item (no children):**
```typescript
{ label: '{Label}', icon: 'pi {icon}', routerLink: ['{route}'] }
```

**Item with sub-items (if user wants a submenu):**
```typescript
{
    label: '{Parent Label}',
    icon: 'pi {icon}',
    items: [
        { label: '{Sub Label 1}', icon: 'pi {icon}', routerLink: ['{route}/sub1'] },
        { label: '{Sub Label 2}', icon: 'pi {icon}', routerLink: ['{route}/sub2'] }
    ]
}
```

**Menu item conventions:**
- `label`: Title case, concise (2-3 words max)
- `icon`: Must use `'pi pi-{name}'` format — always verify the icon exists in PrimeIcons v7
  - Common icons: `pi-home`, `pi-users`, `pi-chart-bar`, `pi-file`, `pi-cog`, `pi-shopping-cart`, `pi-calendar`, `pi-inbox`, `pi-table`, `pi-list`, `pi-tag`, `pi-shield`, `pi-database`
- `routerLink`: Always an array `['/pages/{path}']` — not a string
- Place new items at the **end** of the target section's `items` array (unless ordering matters)

### Step 4 — Verify route exists

Check that the `routerLink` path is registered in the routing system. If not, warn the user and suggest running `/add-route` first.

### Step 5 — Report

Show the exact change made with a clickable link to [app.menu.ts](src/app/layout/component/app.menu.ts) and note where in the menu the item was added.
