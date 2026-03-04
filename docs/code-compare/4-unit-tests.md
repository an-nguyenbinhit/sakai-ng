# Code Compare - Phase 3 (Unit Tests) Tasks

## 1. Business Analyst (BA)
*   **Task BA-3.1: Define Unit Test Coverage Requirements**
    *   **Description**: Identify all critical components requiring test coverage: the Myers `DiffEngine`, complex state interactions in `CodeCompareState`, syntax highlighting logic, large file handling validations, and the `ExportService`. Target near 100% coverage on algorithm and state management.

## 2. Developer / AI Coding
*   **Task DEV-3.1: Configure Test Environment and Mocks**
    *   **Description**: Configure tests for `DiffEngine` independent of Angular components. Mock the HTML5 Canvas API context for testing the Minimap component rendering. Mock `sessionStorage` for state persistence testing.
    *   **Async Strategy**: Use Jasmine `done()` for Promise-based file reading. Use `fakeAsync` with `tick()` for validating the 400ms input debounce in `code-input` and state propagation.

*   **Task DEV-3.2: Implement Test Suite (`code-compare.spec.ts` and others)**
    *   **Description**: Write unit tests across all component and service specs, heavily focusing on diff algorithm permutations.

## 3. Quality Control (QC) - Verification

### Test Coverage Requirements
*   **Core Algorithm (`diff-engine.service.spec.ts`)**:
    *   Verify basic Add/Remove/Modify/Unchanged sequences.
    *   Verify all filter toggles (Ignore Whitespace, Comment, Case, etc.).
    *   Verify word and char-level diff detection accuracy.
*   **State Service (`code-compare-state.service.spec.ts`)**:
    *   Test debounce mechanisms on input.
    *   Verify computed signals recalculate correctly when options toggle.
    *   Verify `sessionStorage` save/restore lifecycle.
*   **Components**:
    *   `code-input.spec.ts`: File upload boundary testing (valid file, >10MB, binary rejection).
    *   `diff-viewer.spec.ts`: Virtual scroll trackBy functions, line numbering continuity.
    *   `diff-toolbar.spec.ts`: Export clicks, filter selections.
    *   `diff-minimap.spec.ts`: Canvas rendering execution.

*   **Task QC-3.1: Run Tests**
    *   **Command**: `npx ng test --include="**/code-compare/**/*.spec.ts" --watch=false --browsers=ChromeHeadless`
    *   **Result**: Maintain passing CI status across all newly added specifications.
