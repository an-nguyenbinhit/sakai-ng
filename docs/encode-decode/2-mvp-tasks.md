# Encode / Decode - Phase 1 (MVP) Tasks

## 1. Business Analyst (BA) - Acceptance Criteria (AC)

*   **Task BA-1.1: Define Main Layout AC**
    *   **Description**: Design a two-panel wireframe: left panel has an Input textarea + operation selector (Base64 / URL / HTML) + Encode/Decode/Clear buttons; right panel shows the Result in a read-only textarea + a Copy to Clipboard button.

*   **Task BA-1.2: Define Encoding/Decoding Behavior AC**
    *   **Description**: Define the three supported operation modes and their expected output:
        *   **Base64**: Encode uses `btoa(unescape(encodeURIComponent(input)))` to support full UTF-8. Decode uses `decodeURIComponent(escape(atob(input)))`.
        *   **URL**: Encode uses `encodeURIComponent`. Decode uses `decodeURIComponent`.
        *   **HTML**: Encode replaces special characters (`<`, `>`, `&`, `"`, `'`, non-ASCII) with numeric HTML entities (`&#nn;`). Decode uses the browser's `textarea.innerHTML` trick to unescape entities.
    *   **Exception rule**: If encode or decode throws (e.g. invalid Base64 string, malformed percent-sequence), a toast error notification must appear. The output field must not be mutated.

*   **Task BA-1.3: Define Auxiliary Action AC (Copy & Clear)**
    *   **Description**: "Copy to Clipboard" button is disabled while the result is empty. Clicking it writes the result to the clipboard and shows a success toast. "Clear" resets both input and output simultaneously.

## 2. Developer / AI Coding - Implementation

*   **Task DEV-1.1: Component & Routing Initialization**
    *   **Description**: Follow the standard Sakai-NG folder structure. Create standalone Angular components `EncodeDecode` (main page) and `EncodeDecodeMenu` (sidebar menu entry). Register routes and configure the sidebar menu item.

*   **Task DEV-1.2: Build User Interface (UI)**
    *   **Description**: Use PrimeNG components: `p-selectbutton` for the operation toggle, `pTextarea` for input/output, `p-button` for actions, `p-toast` for notifications. Apply a responsive two-column grid layout (single-column on mobile). Use `[(ngModel)]` for two-way binding on inputs and `[ngModel]` (one-way) on the read-only result textarea.

*   **Task DEV-1.3: Implement Encoding/Decoding Logic**
    *   **Description**: Implement `encode()` and `decode()` methods in the component class, dispatching to the correct browser API or helper based on `this.operation`. Implement `encodeHTML(str)` using a regex char replacement and `decodeHTML(str)` using a hidden `<textarea>` element. Wrap all operations in `try/catch` and report errors via `MessageService`.

*   **Task DEV-1.4: Implement Copy & Clear Actions**
    *   **Description**: Use `navigator.clipboard.writeText()` for copy; show a success toast in `.then()`. Implement `clearInputs()` to reset both `inputString` and `outputString`.

## 3. Quality Control (QC) - Verification

*   **Task QC-1.1: Verify Encoding Correctness**
    *   **Scenario**: Input `Hello World` → select Base64 → click Encode → verify output is `SGVsbG8gV29ybGQ=`. Input `a=1&b=2` → select URL → click Encode → verify output is `a%3D1%26b%3D2`. Input `<b>` → select HTML → click Encode → verify output is `&#60;b&#62;`.

*   **Task QC-1.2: Verify Round-Trip Fidelity**
    *   **Scenario**: For each mode, encode a string then paste the output back and decode — the result must exactly match the original input, including Unicode and symbols.

*   **Task QC-1.3: Audit Error Handling**
    *   **Scenario**: Input `!!!` → select Base64 → click Decode → system must NOT crash; a toast with `severity: 'error'` and `summary: 'Decoding Error'` must appear. Input `%GG` → select URL → click Decode → same behavior.

*   **Task QC-1.4: Cross-Screen UI Validation**
    *   **Scenario**: Resize the browser to mobile width → verify the two panels stack vertically, all buttons remain accessible, and no content is hidden or overlapped.
