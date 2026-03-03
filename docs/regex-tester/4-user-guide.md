# Regex Tester User Guide
The **Regex Tester** tool on DevWorkspace allows you to easily write, test, and experiment with Regular Expressions directly in the browser.

## 1. Main Interface Components

The tool's interface is divided into two main sections:
*   **Left Section:** Where you enter the Regex pattern, configure flags, and input the test string. The Live Highlight preview is displayed here instantly.
*   **Right Section:** Displays a detailed list of matched results (Match Results) along with their positions and indexes.

## 2. How to Use the Tool

### Step 1: Enter the Regular Expression (Regex Pattern)
*   In the **Regular Expression** input, enter the regex pattern you want to test (e.g., `\d+` to find digits, or `[a-zA-Z]+` to find letters).
*   *Note: You don't need to enter the leading and trailing `/` as the system already displays them (only enter the inner part).*

### Step 2: Configure Flags
Flags help change how the regex searches. You can toggle the following flags:
*   **Global (g):** Find all matches in the string (if unselected, only returns the first match).
*   **Case Insensitive (i):** Perform case-insensitive matching.
*   **Multiline (m):** Change the behavior of `^` (Start) and `$` (End) to match each line of text instead of the entire string.

### Step 3: Enter the Test String
*   In the **Test String** section, paste the text or source code you want to search.
*   The tool supports multi-line text and unlimited length.

### Step 4: Live Highlight Preview
*   As soon as you enter or modify the Regex/String, the **Live Highlight** section instantly highlights the text segments that match the regex pattern.
*   Contrasting colors help you easily distinguish the matched text from the original text.

### Step 5: View Match Results
*   The right column displays a table of matched segments, including the **#** index, **Match** content, and **Position** in the string.
*   This table uses smooth scrolling, allowing you to view details on long text strings.

## 3. Helpful Utilities

*   **Quick Copy Regex:** In the top corner of the **Regular Expression** section, you can click the Copy button to accurately copy the current expression.
*   **Clear All:** The Trash icon helps you quickly clear the results, regex pattern, and test string to start over.
*   **Copy Match Results:** In the **Match Results** section, the Copy button allows you to copy all matched results to the clipboard as a list, convenient for scraping text.
*   **Error Warnings:** If your regular expression has a syntax error (e.g., missing a closing bracket `]`), the screen will immediately display a red error message below the input box to help you fix it quickly.
