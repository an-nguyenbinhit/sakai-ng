Review an Angular component in the Sakai-NG project for best practices and project conventions.

Arguments: $ARGUMENTS

## Instructions

$ARGUMENTS should be a file path (e.g. `src/app/pages/dashboard/dashboard.ts`) or a component name. If no path is given, ask the user which component to review.

### Step 1 — Read the file

Read the specified component file completely. If it imports other files, read those too when relevant.

### Step 2 — Review checklist

Evaluate each item and report pass ✅, warning ⚠️, or fail ❌:

**Angular Architecture**
- [ ] `standalone: true` is set (NgModules are not used anywhere)
- [ ] No zone.js dependencies (`ngZone.run()`, `ApplicationRef.tick()`, etc.)
- [ ] Reactive state uses `signal()` / `computed()` / `effect()` — not `BehaviorSubject` or manual CD triggers
- [ ] `inject()` used for DI where appropriate (preferred over constructor injection for new code)
- [ ] `OnPush` change detection is NOT manually set (zoneless handles this automatically)
- [ ] No deprecated lifecycle hooks misused

**TypeScript Strictness**
- [ ] No implicit `any` — all variables and parameters have explicit types
- [ ] No `@ts-ignore` or `@ts-expect-error` without a comment explaining why
- [ ] Non-trivial functions have return type annotations
- [ ] Nullable types handled safely (optional chaining `?.`, nullish coalescing `??`)

**Project Conventions**
- [ ] Class name has **no "Component" suffix** (ESLint rule: empty suffixes array)
- [ ] Selector uses `app-` prefix for page/layout components
- [ ] Import paths use `@/` alias (not `../../../../`) for cross-directory imports
- [ ] Single quotes used (not double quotes) — Prettier config
- [ ] 4-space indentation — Prettier config
- [ ] PrimeNG modules imported **only if used in template** (no unused imports)

**Template Quality**
- [ ] No direct DOM manipulation (no `document.querySelector`, `ElementRef.nativeElement` for styling)
- [ ] `@for` with `track` expression (not `*ngFor`)
- [ ] `@if` / `@else` (not `*ngIf`) for Angular 17+ control flow
- [ ] Tailwind CSS v4 classes for layout (not inline styles where avoidable)
- [ ] Dark mode: uses `dark:` Tailwind variants or PrimeNG surface tokens

**State & Data**
- [ ] Signals used for mutable component state (`signal<T>()`)
- [ ] Computed values use `computed()` (not methods called from template — those run on every CD cycle)
- [ ] Async data loaded via service Promise → `.then(data => signal.set(data))` pattern
- [ ] `@ViewChild` uses signal-based query where possible (Angular 17+: `viewChild()`)

**PrimeNG Usage**
- [ ] Services (`MessageService`, `ConfirmationService`) provided at component level — not root
- [ ] PrimeNG components used for UI — not custom re-implementations of existing PrimeNG functionality
- [ ] `p-toast` included when `MessageService` is used
- [ ] `p-confirmdialog` included when `ConfirmationService` is used

**Performance**
- [ ] No expensive computations in template expressions — use `computed()` instead
- [ ] Large lists use `p-table` with pagination or virtual scroll — not `@for` rendering thousands of items
- [ ] Images have `alt` attributes

### Step 3 — Summary report

Provide a structured report:
1. **Overall score**: X/Y checks passed
2. **Critical issues** (❌) — must fix, explain why and show corrected code
3. **Warnings** (⚠️) — recommended improvements with before/after examples
4. **Passed** (✅) — brief list of what's done correctly

### Step 4 — Offer to fix

Ask the user: "Would you like me to fix the critical issues automatically?"
If yes, apply all ❌ fixes in one pass.
