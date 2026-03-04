# Code Compare - Phase 2 (Advanced Features) Tasks

## 1. Business Analyst (BA)
*   **Task BA-2.1: AC for Diff Filters and Settings**
    *   **Description**: Define behaviors for diff customization: Ignore Whitespace, Ignore Case, Ignore Blank Lines, Ignore Comments, Trim Lines. Describe how highlighting handles Word/Char differences within modified lines.
*   **Task BA-2.2: AC for Navigation, Minimap & Search**
    *   **Description**: Define a Minimap overview panel on the right side. Define "Next/Prev" block navigation, "Show/Hide Unchanged" line folding, and a diff search box that highlights text matches.
*   **Task BA-2.3: AC for File Tooling and Export**
    *   **Description**: Support drag-and-drop or clicking to select files up to 10MB (deny binary or unsupported). Define export behavior: Export to self-contained HTML and Export to high-quality PNG. Define session state auto-saving.

## 2. Developer / AI Coding
*   **Task DEV-2.1: Implement Diff Filter Logic**
    *   **Description**: Extend `DiffEngine` to pre-process lines according to the selected filter options before diffing. Pair adjacent removed/added blocks to identify Modified lines, computing exact Word/Char token diffs.
*   **Task DEV-2.2: Implement Minimap and Search**
    *   **Description**: Create `diff-minimap` component utilizing an HTML `<canvas>` to draw an overview of the diff. Update the viewport indicator on scroll. Implement full-text search across the computed `DiffResult`. Add unchanged line folding (`... N unchanged lines ...`).
*   **Task DEV-2.3: Implement File Upload & Validation**
    *   **Description**: Use HTML5 Drag & Drop API in `code-input`. Read file via `FileReader`, auto-detect encoding from BOM (UTF-8, UTF-16), and guess the language by file extension. Add max-size validations.
*   **Task DEV-2.4: Implement Export Service & Session Persistence**
    *   **Description**: Create `export.service.ts` to generate inline-CSS HTML documents and construct PNGs using hidden canvases (respecting browser size limits). Save `diffOptions`, file contents, and settings into `sessionStorage` automatically on change.

## 3. Quality Control (QC)
*   **Task QC-2.1: Feature Interaction Testing**
    *   **Scenario**: Upload a 5MB JavaScript file -> Filter "Ignore Whitespace" -> Search for `function` -> Click Minimap to navigate -> Verify layout and diff state accurately reflect these combined actions without crashing.
*   **Task QC-2.2: Export Feature Verification**
    *   **Scenario**: Generate an HTML export and verify it opens correctly in a new tab with styling intact. Generate a PNG export and verify it correctly renders the visible diffs, colors, and line numbers. Check error states for oversized PNGs.
*   **Task QC-2.3: Session Restoration Validation**
    *   **Scenario**: Paste Code A and B, set Font Size to 16px -> Refresh the page -> Verify inputs and configurations are restored exactly as they were using `sessionStorage`.
