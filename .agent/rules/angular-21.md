---
description: Rules for writing Angular 21 code using Standalone Components and Signals
---

# Angular 21 Coding Guidelines

All newly generated or modified Angular code should STRICTLY follow these Angular 21 best practices:

1. **Standalone Components**: 
   - Never use `NgModules` or `CommonModule`.
   - Every component MUST have `standalone: true`.
   - Use `imports: [RouterLink, DatePipe, etc.]` array directly in the `@Component` decorator to declare dependencies.
   - Do NOT import everything. Only import the exact primitives (like `NgIf`, though `@if` is preferred).

2. **Control Flow Syntax**:
   - Use the new Angular built-in control flow instead of structural directives (`*ngIf`, `*ngFor`).
   - Use `@if`, `@else def`, `@for (item of items; track item.id)`, `@switch`.

3. **Zoneless Change Detection & Signals**:
   - Favor Angular Signals over RxJS or traditional variables where applicable.
   - Use `signal()`, `computed()`, and `effect()`.
   - Example: `myValue = signal<string>('initial')`. Access via `myValue()` and update via `myValue.set('new')` or `myValue.update()`.
   - Inputs and Outputs should preferably use the new Signal APIs if appropriate, or standard `@Input()`/`@Output()` if backward compatibility in the project is needed.

4. **Path Aliases**:
   - Always use `@/` to import from `src/` (e.g., `import { MyService } from '@/app/core/services/my.service'`).

5. **Component Structuring**:
   - Naming convention for class: Drop the `Component` suffix (e.g., `export class Dashboard {}` instead of `export class DashboardComponent {}`).
   - Keep views lightweight. Let `Service` handle heavy lifting.
   - Use inline SCSS if the styling is less than 50 lines.
