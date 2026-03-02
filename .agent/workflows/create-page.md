---
description: How to correctly scaffold and register a new page component in the Sakai-NG application
---

# Creating a New Page Component

This workflow shows how to quickly add a new routed page component to the Sakai-NG template.

## 1. Create the Component
Create a new directory in the appropriate module under `src/app/pages/` (or related feature directory). Create a `.ts` file representing the component.

```typescript
// src/app/pages/my-feature/my-feature.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-my-feature',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
        <div class="card">
            <div class="font-semibold text-xl mb-4">My Feature</div>
            <p>Welcome to the new feature.</p>
            <p-button label="Click Me" icon="pi pi-check"></p-button>
        </div>
    `
})
export class MyFeature {}
```
*Note: Do not append `Component` to the class name as per the style guide.*

## 2. Generate Routing (if needed)

If this is the main entry for a lazy-loaded route, include a routes array in the file:

```typescript
import { Routes } from '@angular/router';
export default [
    { path: '', component: MyFeature }
] as Routes;
```

## 3. Register Route in App / Feature Routing
Register the new route in the main layout routes (e.g., `src/app/app.routes.ts`):

```typescript
export const routes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            // ...existing routes
            { path: 'my-feature', loadChildren: () => import('./pages/my-feature/my-feature') }
        ]
    }
];
```

## 4. Add to Sidebar Navigation
To make the page visible in the menu, update `src/app/layout/component/app.menu.ts`. Add a new item object to the `model` array.

```typescript
{
    label: 'My Feature Group',
    items: [
        { label: 'My Feature', icon: 'pi pi-fw pi-star', routerLink: ['/my-feature'] }
    ]
}
```
