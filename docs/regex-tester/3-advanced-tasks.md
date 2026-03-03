# Regex Tester - Phase 2 (Advanced Features) Tasks

## 1. Business Analyst (BA)
*   **Task BA-2.1: AC for Capture Groups**
    *   **Description**: Define UI to show details of capture groups within each match.
*   **Task BA-2.2: AC for Regex Cheat Sheet & Library**
    *   **Description**: Define a sidebar or modal with common regex patterns (email, password, URL) for quick insertion.
*   **Task BA-2.3: AC for Code Generator**
    *   **Description**: Define feature to export regex as code snippet in Javascript, Java, Python, etc.

## 2. Developer / AI Coding
*   **Task DEV-2.1: Implement Capture Groups Extraction**
    *   **Description**: Update regex evaluation to extract and store group matches (using `.exec()` or `String.prototype.matchAll()`). Display in a nested table or tree format.
*   **Task DEV-2.2: Build Cheat Sheet Sidebar**
    *   **Description**: Create a side panel containing expandable lists of syntax cheat sheets and common patterns.
*   **Task DEV-2.3: Implement Code Snippet Generator**
    *   **Description**: Add a tabbed view showing string templates of the compiled regex pattern properly escaped for different languages.

## 3. Quality Control (QC)
*   **Task QC-2.1: Capture Groups Verification**
    *   **Scenario**: Test pattern `(\w+)\s(\w+)` on `John Doe`. Verify groups 1 "John" and 2 "Doe" are correctly parsed and displayed.
*   **Task QC-2.2: Cheat Sheet Insertion**
    *   **Scenario**: Click on "Email Regex" from sidebar, verify the pattern input updates correctly.
*   **Task QC-2.3: Code Snippet Verification**
    *   **Scenario**: Verify that the generated Java snippet correctly double-escapes backslashes in the regex string.
