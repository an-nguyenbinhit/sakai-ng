# Code Compare - Phase 1 (MVP) Tasks

## 1. Business Analyst (BA) - Acceptance Criteria (AC)
*   **Task BA-1.1: Define Main Layout AC**
    *   **Description**: Design Wireframe/Mockup including: Two split input panels for Code A and Code B, language selection dropdowns, and a main viewer area for displaying the diff result.
*   **Task BA-1.2: Define Diff Engine AC**
    *   **Description**: Define the behavior for generating line-level diffs (Added, Removed, Modified, Unchanged). Diffs must correctly identify changes and present them in a logical hunk sequence.
*   **Task BA-1.3: Define View Modes AC**
    *   **Description**: Define the two view modes: "Side-by-Side" (two synchronized scrolling columns) and "Inline" (a single unified column with +/- annotations).

## 2. Developer / AI Coding - Implementation
*   **Task DEV-1.1: Component & Routing Initialization**
    *   **Description**: Create the Angular Component `code-compare` and its sub-components (`code-input`, `diff-viewer`, `diff-toolbar`, `diff-summary`). Configure routing.
*   **Task DEV-1.2: Build Core UI and Virtual Scrolling**
    *   **Description**: Implement the UI using Tailwind CSS v4 + PrimeNG. Use Angular CDK `ScrollingModule` to efficiently render large diff results (~40-50 visible lines at a time) to ensure high performance.
*   **Task DEV-1.3: Integrate Diff Library (`jsdiff`) & Syntax Highlighting**
    *   **Description**: Implement `DiffEngine` service using Myers diff (`diffLines`). Implement lazy-loaded syntax highlighting per language using `Prism.js`. Escape HTML entities to prevent XSS.
*   **Task DEV-1.4: State Management with Signals**
    *   **Description**: Create `CodeCompareState` service to manage state. Use Angular Signals (`signal`, `computed`) so the `diffResult` automatically recalculates only when `leftFile` or `rightFile` changes (after a 400ms debounce).

## 3. Quality Control (QC) - Verification
*   **Task QC-1.1: Verify Diff Accuracy**
    *   **Scenario**: Input two similar pieces of code with 1 added line and 1 removed line -> Verify the diff highlights these lines accurately in Red (-) and Green (+).
*   **Task QC-1.2: Synchronized Scrolling Validation**
    *   **Scenario**: Enter long code snippets (1000+ lines) into the Side-by-Side view -> Scroll the left panel -> Verify the right panel scrolls proportionally and remains aligned.
*   **Task QC-1.3: Cross-Screen UI Validation**
    *   **Scenario**: Resize the browser to check layout behavior; ensure collapsible panels auto-collapse appropriately when viewing the diff on smaller screens.
