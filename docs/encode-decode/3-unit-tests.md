# Encode / Decode - Phase 2 (Unit Tests) Tasks

## 1. Business Analyst (BA)

*   **Task BA-2.1: Define Unit Test Coverage Requirements**
    *   **Description**: Identify all user-facing behaviors that require test coverage: encoding and decoding for all three modes (Base64, URL, HTML), round-trip fidelity, helper methods (`encodeHTML`, `decodeHTML`), clipboard operations, clear action, and all error paths. Target ≥ 90% branch coverage for the `EncodeDecode` class.

## 2. Developer / AI Coding

*   **Task DEV-2.1: Configure Test Environment**
    *   **Description**: `TestBed.createComponent()` cannot be used easily due to PrimeNG module DI requirements. Replace with `TestBed.runInInjectionContext(() => new EncodeDecode(...))` to instantiate the class directly without rendering the full template.
    *   **Clipboard Mock**: `navigator.clipboard` is unavailable in ChromeHeadless. Solution: polyfill once in `beforeAll()` with a controllable plain object (`mockClipboard`) and spy on its `writeText` method per test.
    *   **HTML Decode**: `decodeHTML()` creates a real `document.createElement('textarea')` which works in ChromeHeadless. It is tested via spy delegation to verify the integration boundary.
    *   **Async Strategy**: Use Jasmine `done()` callbacks for all Promise-based tests (`copyToClipboard()`). Avoid `fakeAsync` + `tick()` to prevent microtask zone hangs in Karma.
    *   **Factory Helper**: A `build()` factory function creates a fresh `MessageService` spy and component instance for each test group, keeping `beforeEach` blocks clean.

*   **Task DEV-2.2: Implement Test Suite (`encode-decode.spec.ts`)**
    *   **Description**: Write 48 unit tests covering all component behaviors across 14 `describe` blocks.

## 3. Quality Control (QC) - Verification

### Test Results
```
Chrome Headless 145.0.0.0 (Windows 10): Executed 48 of 48 SUCCESS (0.071 secs / 0.051 secs)
TOTAL: 48 SUCCESS
```

| Test Group | Count |
|---|---|
| Initialisation | 7 |
| `encode()` empty input guard | 1 |
| `encode()` — Base64 (ASCII, UTF-8, symbols) | 4 |
| `encode()` — URL (spaces, special chars, Unicode) | 3 |
| `encode()` — HTML (entities, plain text passthrough) | 3 |
| `decode()` empty input guard | 1 |
| `decode()` — Base64 (round-trip ASCII & UTF-8, invalid input error) | 3 |
| `decode()` — URL (`%20` decode, round-trip, invalid sequence error) | 3 |
| `decode()` — HTML (`decodeHTML()` delegation, `&amp;`, `&lt;&gt;`) | 3 |
| `encodeHTML()` helper (each special char + non-ASCII) | 7 |
| `clearInputs()` | 3 |
| `copyToClipboard()` (empty guard, clipboard call, success toast) | 4 |
| `encode()` error path | 1 |
| Full round-trip (Base64 × 4 strings + URL) | 5 |
| **Total** | **48** |

*   **Task QC-2.1: Run Tests**
    *   **Command**: `npx ng test --include="**/encode-decode/encode-decode.spec.ts" --watch=false --browsers=ChromeHeadless`
    *   **Result**: ✅ 48/48 PASS
