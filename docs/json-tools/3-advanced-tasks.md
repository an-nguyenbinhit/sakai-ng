# JSON Tools - Phase 2 (Advanced Features) Tasks

## 1. Business Analyst (BA)
*   **Task BA-2.1: AC for Syntax Highlighting & Code Editor**
    *   **Description**: Replace simple text areas with a Monaco/VS Code editor that handles large JSON files smoothly. Synchronize dark/light mode themes automatically with the site preferences.
*   **Task BA-2.2: AC for Tree Viewer & Queries**
    *   **Description**: Create a split-screen or toggleable view showing the JSON payload as an interactive expandable Tree tree structure. Provide JSONPath querying to filter payload nodes on the fly.
*   **Task BA-2.3: AC for File Tooling**
    *   **Description**: Support drag-and-drop `.json` file interactions to populate the editor. Provide a button to save/export the edited output directly as a physically downloadable file on the device.

## 2. Developer / AI Coding
*   **Task DEV-2.1: Integrate Monaco Editor**
    *   **Description**: Integrate `@monaco-editor` setup. Bind model values to keep the UI in sync. Apply dynamic themes based on LayoutService.
*   **Task DEV-2.2: Integrate Tree Component & Logic**
    *   **Description**: Iterate and display parsed objects into PrimeNG Tree nodes recursively.
*   **Task DEV-2.3: Build Settings Sidebar/Menu Panel**
    *   **Description**: Setup additional toggles (Sort keys alphabetically, configure indent spaces).
*   **Task DEV-2.4: Internal Upload/Download Logic**
    *   **Description**: Leverage `FileReader()` HTML5 API and `Blob` URL approaches to trigger direct text processing locally.

## 3. Quality Control (QC)
*   **Task QC-2.1: High-Performance Verification**
    *   **Scenario**: Load deeply nested large JSON strings with thousands of rows -> Wait for format/Tree parsing -> Validate the browser stays responsive under loads up to a few MBs.
*   **Task QC-2.2: File Operations**
    *   **Scenario**: Drag a `test.json` payload into the application window boundary -> Modify the internal property visually -> Download as file -> Verify modifications are correctly preserved in the local file system.
