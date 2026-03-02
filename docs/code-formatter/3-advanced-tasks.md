# Code Formatter - Phase 2 (Advanced Features) Tasks

## 1. Business Analyst (BA)
*   **Task BA-2.1: AC for Syntax Highlighting & Code Editor**
    *   **Description**: Replace plain text areas with a professional compiler display (Monaco/VS Code web editor). Require the editor theme to synchronize (Dark/Light theme) with the entire App (Sakai-NG).
*   **Task BA-2.2: AC for Formatting Settings Menu**
    *   **Description**: Create advanced configuration inputs: Tab size (2, 4, 8), Print Width (80, 100, 120), "Use tabs" vs "Use spaces", Single quotes vs Double quotes.
*   **Task BA-2.3: AC for File Tooling**
    *   **Description**: Add drag-and-drop file support to load code for formatting; add a button to download the code as a file (`.js`, `.json`, `.html`) instead of just copying it.

## 2. Developer / AI Coding
*   **Task DEV-2.1: Integrate Monaco Editor (or CodeMirror)**
    *   **Description**: Add `@monaco-editor` or `ngx-monaco-editor-v2` component for Angular. Implement two-way data binding. Detect theme changes from the layout service to set `vs-dark`/`vs-light`.
*   **Task DEV-2.2: Integrate Plugins and Extended Languages**
    *   **Description**: Install additional parsers to support highly structured languages like SQL tables (SQL-formatter), XML, Markdown. Update the Factory function to handle more syntax types.
*   **Task DEV-2.3: Build Settings Sidebar Panel**
    *   **Description**: Use a Drawer/Sidebar overlay to contain the options. Pass dynamic config options directly into the Prettier formatter's parameters.
*   **Task DEV-2.4: Handle Internal File Upload/Download**
    *   **Description**: Capture HTML5 Dropzone events to read the source using `FileReader()`. Create a `Blob` object + ObjectURL and a hidden `<a>` tag to trigger a text download to the user's local machine when Exporting.

## 3. Quality Control (QC)
*   **Task QC-2.1: High-Performance UI Testing**
    *   **Scenario**: Paste a massive raw code file (20,000 lines of minified Javascript) -> Wait for formatting -> Browser must not freeze for more than 3 seconds. Highlighting should cover everything. Change tab width to see if it updates responsively.
*   **Task QC-2.2: File Upload & Download Testing**
    *   **Scenario**: Drag a `test.sql` file -> Configure formatting -> Download to the machine with the same original file name (or an added suffix) containing the standard beautified format.
