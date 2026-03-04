# JSON Tools - Phase 3 (Unit Tests) Tasks

## 1. Business Analyst (BA)
*   **Task BA-3.1: Define Unit Test Coverage Requirements**
    *   **Description**: Identify all user-facing behaviors that require test coverage: JSON formatting via Prettier, minification, validation, custom transform scripts, file upload/download, clipboard operations, drag-and-drop, settings configurations, and theme synchronization. Target ≥ 90% branch coverage for the `JsonTools` class.

## 2. Developer / AI Coding
*   **Task DEV-3.1: Configure Test Environment for Monaco & Prettier**
    *   **Description**: `TestBed.createComponent()` cannot be used directly due to Monaco Editor's AMD loader. Replace with `TestBed.runInInjectionContext(() => new JsonTools(...))` to instantiate the class without rendering the Monaco template.
    *   **Prettier Mock**: `prettier/standalone` is a sealed ESM module — `spyOn` on it throws at runtime. Solution: add a `protected callPrettierFormat()` wrapper method to the component; tests spy on the wrapper instead.
    *   **Clipboard Mock**: `navigator.clipboard` is unavailable in ChromeHeadless. Solution: polyfill once in `beforeAll()` with a controllable plain object and spy on it per test.
    *   **Console Suppression**: Error-path tests intentionally trigger `console.error` calls inside the component. Add a global `beforeEach(() => spyOn(console, 'error'))` to suppress noise in the Karma output.
    *   **Async Strategy**: Use Jasmine `done()` callbacks for all Promise-based tests (clipboard, `formatJson()`). Use `jasmine.clock().install()/tick()/uninstall()` for debounce/`setTimeout` tests.

*   **Task DEV-3.2: Implement Test Suite (`json-tools.spec.ts`)**
    *   **Description**: Write 91 unit tests covering all component behaviors across 19 `describe` blocks.

## 3. Quality Control (QC) - Verification

### Test Results
```
Chrome Headless 145.0.0.0 (Windows 10): Executed 91 of 91 SUCCESS (0.132 secs / 0.105 secs)
TOTAL: 91 SUCCESS
```

| Test Group | Count |
|---|---|
| Initialisation | 12 |
| `onFormatConfigChange()` | 2 |
| `onAutoUpdateChange()` | 2 |
| `onInputChange()` debounce | 5 |
| `increaseFontSize()` | 2 |
| `decreaseFontSize()` | 2 |
| `clearInput()` / `clearOutput()` | 4 |
| `copyCode()` — clipboard | 5 |
| `validateJson()` | 6 |
| `formatJson()` empty input guard | 2 |
| `formatJson()` Prettier path (tabWidth, useTabs, mock) | 7 |
| `formatJson()` error path | 2 |
| `minifyJson()` | 6 |
| `transformJson()` | 7 |
| `loadSample()` | 6 |
| Drag & Drop (dragover, enter, leave, drop, fileselect) | 7 |
| `downloadCode()` (warn, success, prefixes, filename) | 8 |
| Dark theme effect | 2 |
| Editor cursor callbacks | 2 |
| `undoInput()` | 2 |
| **Total** | **91** |

*   **Task QC-3.1: Run Tests**
    *   **Command**: `npx ng test --include="**/json-tools/json-tools.spec.ts" --watch=false --browsers=ChromeHeadless`
    *   **Result**: ✅ 91/91 PASS
