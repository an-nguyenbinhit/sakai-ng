# Code Formatter - Phase 3 (Unit Tests) Tasks

## 1. Business Analyst (BA)
*   **Task BA-3.1: Define Unit Test Coverage Requirements**
    *   **Description**: Identify all user-facing behaviors that require test coverage: formatting per language, file upload/download, clipboard operations, settings configurations, drag-and-drop, and theme synchronization. Target ≥ 90% branch coverage for the `CodeFormatter` class.

## 2. Developer / AI Coding
*   **Task DEV-3.1: Configure Test Environment for Monaco & Prettier**
    *   **Description**: `TestBed.createComponent()` cannot be used directly due to Monaco Editor's AMD loader and DI tokens. Replace with `TestBed.runInInjectionContext(() => new CodeFormatter(...))` to instantiate the class directly without rendering the Monaco template.
    *   **Prettier Mock**: `prettier/standalone` is a sealed ESM module — `spyOn` on it throws at runtime. Solution: add a `protected callPrettierFormat()` wrapper method to the component; tests spy on the wrapper instead.
    *   **Clipboard Mock**: `navigator.clipboard` is unavailable in ChromeHeadless. Solution: polyfill once in `beforeAll()` with a controllable plain object and spy on it per test.
    *   **Async Strategy**: Use Jasmine `done()` callbacks for all Promise-based tests (clipboard, `formatCode()`). Use `jasmine.clock().install()/tick()/uninstall()` for debounce/`setTimeout` tests. Avoid `fakeAsync` + `tick()` as it causes microtask zone hangs in Karma.

*   **Task DEV-3.2: Implement Test Suite (`code-formatter.spec.ts`)**
    *   **Description**: Write 117 unit tests covering all component behaviors across 19 `describe` blocks.

## 3. Quality Control (QC) - Verification

### Test Results
```
Chrome Headless 145.0.0.0 (Windows 10): Executed 117 of 117 SUCCESS (1.384 secs / 1.347 secs)
TOTAL: 117 SUCCESS
```

| Test Group | Count |
|---|---|
| Initialisation | 12 |
| `getLanguageLabel()` | 8 |
| `onLanguageChange()` | 4 |
| `onFormatConfigChange` / `onAutoUpdateChange` | 4 |
| `onInputChange()` debounce | 5 |
| Font size increase / decrease | 4 |
| `clearInput()` / `clearOutput()` | 4 |
| `copyCode()` — clipboard | 5 |
| `formatCode()` empty input guard | 2 |
| `formatCode()` SQL path | 4 |
| `formatCode()` Prettier path (7 parsers + options) | 16 |
| `formatCode()` error path | 3 |
| `detectLanguageFromFile()` (13 extensions) | 14 |
| `downloadCode()` (warn, success, prefixes, 7 extensions) | 15 |
| `loadSample()` | 7 |
| Drag & Drop (dragover, enter, leave, drop, file select) | 7 |
| Dark theme effect | 2 |
| Editor cursor callbacks | 2 |
| `undoInput()` | 2 |
| **Total** | **117** |

*   **Task QC-3.1: Run Tests**
    *   **Command**: `npx ng test --include="**/code-formatter/code-formatter.spec.ts" --watch=false --browsers=ChromeHeadless`
    *   **Result**: ✅ 117/117 PASS
