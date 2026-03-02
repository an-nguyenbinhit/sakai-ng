# Code Formatter - Phase 1 (MVP) Tasks

## 1. Business Analyst (BA) - Acceptance Criteria (AC)
*   **Task BA-1.1: Define Main Layout AC**
    *   **Description**: Design Wireframe/Mockup including: Page title, 1 Language selection dropdown, 1 Text area for code input/output, 3 Action buttons (Format, Copy, Clear).
*   **Task BA-1.2: Define Formatting Feature AC**
    *   **Description**: Define the list of supported languages (JS/TS, JSON, HTML, CSS). Determine the error display behavior when the input source code has severe syntax errors and cannot be formatted.
*   **Task BA-1.3: Define Auxiliary Actions AC (Copy & Clear)**
    *   **Description**: Clicking "Copy" shows a "Copied to clipboard" toast notification. Clicking "Clear" empties the text area content.

## 2. Developer / AI Coding - Implementation
*   **Task DEV-1.1: Component & Routing Initialization**
    *   **Description**: Follow the standard folder structure (Sakai-NG framework). Create the Angular Component `code-formatter`. Import it into the router module. Configure the sidebar menu.
*   **Task DEV-1.2: Build Basic User Interface (UI)**
    *   **Description**: Use PrimeNG API (`p-dropdown`, `p-button`, `p-toast`) and TailwindCSS/Sakai layout to build the View. Ensure the UI is responsive on both mobile and desktop.
*   **Task DEV-1.3: Integrate Code Formatting Library (Prettier)**
    *   **Description**: Install an NPM package that supports client-side formatting (like `prettier/standalone` with HTML, TS, CSS parsing plugins). Write a Service/Util to process strings (input -> prettier format -> output).
    *   **Exception Handling**: Catch parse errors from the code to return a UI toast notification (using MessageService).
*   **Task DEV-1.4: Implement Auxiliary Action Buttons**
    *   **Description**: Use the Javascript Clipboard API for the Copy feature. Use data binding (ngModel/Signals) to clear the code.

## 3. Quality Control (QC) - Verification
*   **Task QC-1.1: Verify Formatting Correctness per Supported Language**
    *   **Scenario**: Input a 1-line unindented JSON code -> Click Format -> Verify the output is neatly indented and properly formatted.
*   **Task QC-1.2: Audit Error Handling**
    *   **Scenario**: Input structurally incorrect/unclosed HTML or JSON missing `{}` -> Click Format -> System does not crash, a toast appears indicating the error line.
*   **Task QC-1.3: Cross-Screen UI Validation**
    *   **Scenario**: Resize the browser to check padding/margin, and ensure action buttons are not hidden or overlapped.
