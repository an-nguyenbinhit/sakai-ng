# Regex Tester - Phase 1 (MVP) Tasks

## 1. Business Analyst (BA) - Acceptance Criteria (AC)
*   **Task BA-1.1: Define Main Layout AC**
    *   **Description**: Design Wireframe/Mockup including: Page title, 1 input for Regex pattern, checkboxes/toggles for flags (g, i, m), 1 textarea for Test String, and a results section showing live highlights and list of matches.
*   **Task BA-1.2: Define Live Highlighting AC**
    *   **Description**: Define how the matching text will be highlighted within the Test String section. Define error handling when the entered Regex is invalid (e.g., missing closing parenthesis).
*   **Task BA-1.3: Define Auxiliary Actions AC**
    *   **Description**: Add buttons to copy the Regex, copy the matching results, and clear all inputs.

## 2. Developer / AI Coding - Implementation
*   **Task DEV-1.1: Component & Routing Initialization**
    *   **Description**: Follow the standard folder structure (Sakai-NG framework). Create the Angular Component `regex-tester`. Import it into the router module. Configure the sidebar menu.
*   **Task DEV-1.2: Build Basic User Interface (UI)**
    *   **Description**: Use PrimeNG API (`p-inputtext`, `p-checkbox`, `p-button`, `p-toast`) and TailwindCSS/Sakai layout to build the View. Ensure the UI is responsive.
*   **Task DEV-1.3: Implement Regex Evaluation Engine**
    *   **Description**: Create a service/util to parse the regex pattern and flags safely. Apply the regex to the test string and extract matches. Render highlighted HTML text for live highlighting.
    *   **Exception Handling**: Catch `SyntaxError` from invalid regex pattern and display error in UI (e.g., using `p-message` or underneath the input).
*   **Task DEV-1.4: Implement Matches Data Table**
    *   **Description**: Display an array of matched strings, along with their start/end indices.

## 3. Quality Control (QC) - Verification
*   **Task QC-1.1: Verify Basic Matching**
    *   **Scenario**: Input pattern `\d+`, input text `abc 123 def 456`. Verify matches `123` and `456` are highlighted and listed.
*   **Task QC-1.2: Audit Error Handling**
    *   **Scenario**: Input pattern `[a-z` without closing bracket. Verify system catches exception and displays an invalid regex warning instead of crashing.
*   **Task QC-1.3: Flag Testing**
    *   **Scenario**: Test case-insensitive flag `i` against text `aBc` with pattern `b`. Verify it matches `B`.
