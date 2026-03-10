# Dummy File Generator - Phase 1 (MVP) Tasks

## 1. Business Analyst (BA) - Acceptance Criteria (AC)
*   **Task BA-1.1: Define Main Layout AC**
    *   **Description**: Design Wireframe/Mockup including: Page title, Input field/textarea for "Sample Text", Dropdown to select "File Type" (e.g., .txt, .csv, .log, .json, .pdf, .html, .jpg, .png), Input field to specify "File Size (MB)", and a primary "Generate & Download" action button.
*   **Task BA-1.2: Define Validation Feature AC**
    *   **Description**: The "File Size" input must be restricted (e.g., Min = 1, Max = 200 MB) to prevent the browser tab from running out of memory. Entering an invalid size must display a clear validation error. The "Sample Text" cannot be empty.
*   **Task BA-1.3: Define Download Action AC**
    *   **Description**: Clicking "Generate & Download" should show a processing/loading state, create the file entirely within the browser's memory, natively trigger a download prompt for the user, and show a "Download complete" toast notification upon success.

## 2. Developer / AI Coding - Implementation
*   **Task DEV-1.1: Component & Routing Initialization**
    *   **Description**: Create the Angular Component `dummy-file-generator`. Import it into the app router. Ensure top and sidebar menu links are active and appropriately named.
*   **Task DEV-1.2: Build Basic User Interface (UI)**
    *   **Description**: Use PrimeNG APIs (`p-dropdown`, `p-inputtext`, `p-inputnumber`, `p-button`, `p-toast`) with TailwindCSS utility classes to build the View. Ensure the layout is fully responsive on both desktop and mobile screens.
*   **Task DEV-1.3: Integrate Local File Generation Logic**
    *   **Description**: Implement logic to convert the MB input to bytes. Utilize `Uint8Array` to allocate memory and the `TextEncoder` API. **Crucially**: The generator must inject correct format Headers/Signatures (e.g., `%PDF-1.4...%%EOF` for PDFs, `<html><body>...</body></html>` for HTML, and proper JPEG/PNG binary wrappers) before injecting the padding "Sample Text" to ensure the resulting file can be successfully opened by document/image viewers.
*   **Task DEV-1.4: Implement File Download Mechanism**
    *   **Description**: Convert the fully populated `Uint8Array` buffer into a `Blob` object specifying the appropriate MIME type based on the selected file extension. Use `URL.createObjectURL` coupled with a hidden `<a>` element to programmatically trigger the download. Ensure `URL.revokeObjectURL` is called post-download to prevent memory leaks.

## 3. Quality Control (QC) - Verification
*   **Task QC-1.1: Verify File Generation & Correct Size**
    *   **Scenario**: Input size = 15MB, select `.csv`, enter sample text "Test Data," -> Click "Generate & Download" -> Verify the downloaded file is named correctly, has the `.csv` extension, is exactly 15MB in size, and contains the repeated sample text.
*   **Task QC-1.2: Audit Size Limitation & Error Handling**
    *   **Scenario**: Enter size = `500` (exceeding max limit of 200) -> Verify the UI displays a validation message and the form submission is prevented, ensuring the browser doesn't freeze or crash.
*   **Task QC-1.3: Cross-Screen UI Validation**
    *   **Scenario**: Resize the browser to various responsive breakpoints (mobile, tablet, desktop) to ensure the input form remains usable, and button alignments are correct.
