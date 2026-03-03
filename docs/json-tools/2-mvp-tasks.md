# JSON Tools - Phase 1 (MVP) Tasks

## 1. Business Analyst (BA) - Acceptance Criteria (AC)
*   **Task BA-1.1: Define Main Layout AC**
    *   **Description**: Design Wireframe/Mockup including: Page title, 1 Text area for JSON input/output, Action buttons (Format, Minify, Validate, Copy, Clear).
*   **Task BA-1.2: Define Validation Feature AC**
    *   **Description**: Establish the expected error display state when input JSON is invalid. Error messages should accurately display parsing errors and point out exactly what line or syntax caused the error.
*   **Task BA-1.3: Define Auxiliary Actions AC (Copy & Clear)**
    *   **Description**: Clicking "Copy" shows a "Copied to clipboard" toast notification. Clicking "Clear" empties the text area content and clears any validation errors.

## 2. Developer / AI Coding - Implementation
*   **Task DEV-1.1: Component & Routing Initialization**
    *   **Description**: Follow the standard folder structure (Sakai-NG framework). Create the Angular Component `json-tools`. Import it into the app router. Ensure top and sidebar menu links are active.
*   **Task DEV-1.2: Build Basic User Interface (UI)**
    *   **Description**: Use PrimeNG APIs (`p-button`, `p-toast`, textareas) with TailwindCSS to build the View. Make sure it is fully responsive on desktop and mobile.
*   **Task DEV-1.3: Integrate JSON Processing Utilities**
    *   **Description**: Implement `JSON.parse` and `JSON.stringify` logic for both formatting and minification functionalities.
    *   **Exception Handling**: Catch parse errors using a try-catch block to display UI toast notifications containing error information using the internal MessageService.
*   **Task DEV-1.4: Implement Auxiliary Action Buttons**
    *   **Description**: Utilize the Clipboard API for the Copy feature. Implement clear bindings using Angular template configurations or signals.

## 3. Quality Control (QC) - Verification
*   **Task QC-1.1: Verify Formatting Correctness**
    *   **Scenario**: Input an unindented, inline JSON string -> Click Format -> Verify the output is output as multi-line indented strings.
*   **Task QC-1.2: Audit Error Handling**
    *   **Scenario**: Input structurally incorrect JSON (e.g., trailing comma or missing `}`) -> Click Validate or Format -> System does not crash, a toast properly displays parsing failure.
*   **Task QC-1.3: Cross-Screen UI Validation**
    *   **Scenario**: Resize the browser to various responsive breakpoints to check margins, paddings, and button overlaps.
