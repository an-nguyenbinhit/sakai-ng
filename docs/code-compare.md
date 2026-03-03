# Code Compare — Feature Documentation

## Overview

Code Compare is the home page feature (`/`) of the application. It allows users to compare two code snippets or text files, displaying diffs with multiple view modes, search, filtering, and export capabilities.

---

## Table of Contents

1. [Input](#1-input)
2. [Diff View Modes](#2-diff-view-modes)
3. [Filter Options](#3-filter-options)
4. [Navigation & Search](#4-navigation--search)
5. [Minimap](#5-minimap)
6. [Export](#6-export)
7. [Session State](#7-session-state)
8. [Technical Architecture](#8-technical-architecture)
9. [File Structure](#9-file-structure)

---

## 1. Input

### Two Input Methods

| Method | Description |
|---|---|
| **Paste / Type** | Enter text directly into the textarea |
| **Upload File** | Drag-and-drop or click to select a file (max 10 MB) |

### Language Detection

The system automatically detects the programming language from the file extension. Supports 30+ languages:

`JavaScript`, `TypeScript`, `Python`, `Java`, `C/C++`, `C#`, `Go`, `Rust`, `PHP`, `Ruby`, `Swift`, `Kotlin`, `HTML`, `CSS`, `SCSS`, `JSON`, `YAML`, `XML`, `SQL`, `Bash`, `PowerShell`, `Dockerfile`, `GraphQL`, `Markdown`, and more.

### Encoding Detection

Automatically detects encoding from BOM header:
- `UTF-8` (default)
- `UTF-16 LE`
- `UTF-16 BE`

### Limits & Validation

- Binary files: **rejected**
- Files exceeding 10 MB: **rejected with an error message**
- Unsupported extensions: **rejected**

### Collapsible Panels

Once both sides have content, the input panels automatically collapse into a header bar showing the filename and line count. Click to expand again. Panels also auto-collapse when the user clicks outside.

---

## 2. Diff View Modes

### Side-by-Side

Displays two columns (left and right) with synchronized scrolling. Scrolling one side automatically scrolls the other proportionally.

```
| # | Code A          |  | # | Code B          |
|---|-----------------|  |---|-----------------|
| 1 | function fib(n) |  | 1 | function fib(n: |
| 2 |   if (n <= 1)   |  | 2 |   if (n < 0) th |
```

### Inline

Displays all changes in a single column in sequential order:

```
| # | ± | Content                  |
|---|---|--------------------------|
| 1 |   | function fib(n) {        |
| 2 | - |   if (n <= 1) return n;  |
| 2 | + |   if (n < 0) throw ...   |
```

Symbols: `-` = removed line, `+` = added line, `~` = modified line.

### Change Types

| Type | Background | Symbol | Meaning |
|---|---|---|---|
| **Added** | Green | `+` | Only in Code B |
| **Removed** | Red | `-` | Only in Code A |
| **Modified** | Yellow | `~` | Present in both but different |
| **Unchanged** | Default | — | Identical in both |

### Word/Char Diff

For **Modified** lines, individual words or characters that differ are highlighted:
- Removed tokens: **dark red** background
- Added tokens: **dark green** background

---

## 3. Filter Options

Accessible via the **DiffToolbar**. Each option directly affects the diff algorithm.

| Option | Default | Description |
|---|---|---|
| **Ignore Whitespace** | Off | Ignore trailing whitespace |
| **Ignore Case** | Off | Case-insensitive comparison |
| **Ignore Blank Lines** | Off | Ignore empty lines |
| **Ignore Comments** | Off | Ignore comment lines (`//`, `#`, `/*`) |
| **Trim Lines** | Off | Trim leading/trailing whitespace from each line |
| **Word Diff** | On | Highlight differing words within Modified lines |
| **Char Diff** | Off | Highlight differing characters (finer-grained than Word Diff) |
| **Context Lines** | 3 | Number of unchanged lines shown around each change block |

### Zoom / Font Size

You can adjust the display size of the code via the toolbar:
- **Increase Font Size** (Max: 22px)
- **Decrease Font Size** (Min: 10px)
- Default size is **14px**. Line height scales automatically.

---

## 4. Navigation & Search

### Navigating Between Diff Blocks

- **Prev / Next** buttons on the toolbar (or keyboard shortcuts `Alt+↑` / `Alt+↓`)
- Shows current position: `3 / 15`

### Show / Hide Unchanged

Toggle on the **DiffSummary**:
- **Show All**: Display all unchanged lines
- **Hide Unchanged**: Collapse unchanged regions into `··· N unchanged lines ···`

### Search

Type a keyword into the Search box on the toolbar:
- Highlights all matching results in yellow
- Navigate forward/backward through results
- Displays a counter: `2 / 5`
- Case-insensitive search

---

## 5. Minimap

A vertical panel on the right side of the screen that shows the entire diff in miniature:

- Each line is drawn with the color corresponding to its change type
- **Viewport indicator**: A white/gray bar shows the currently visible region
- **Click** to jump to any position in the diff
- Automatically updates when the diff changes
- Supports dark mode

---

## 6. Export

### HTML Export

Generates a self-contained HTML file (with inline CSS):

- **Side-by-side**: 4-column table (left line numbers, left code, right line numbers, right code)
- **Inline**: 3-column table (line number, symbol, content)
- Preserves word/char diff colors
- Header includes: filenames, statistics, active options
- Folded regions display: `... N unchanged lines ...`

### PNG Export

Renders the diff as a high-quality PNG image:

- Monospace font (`Courier New` / `Consolas`)
- 2x scale when dimensions allow
- Header includes filename, view mode, statistics, and options
- Change colors are preserved
- Long lines wrap automatically
- **Limit**: 65535px height / 268M pixel area (browser canvas limit)
- **Fallback**: If the image is too large, an error message is shown — use HTML export instead

---

## 7. Session State

### Auto-save (sessionStorage)

After each change, state is automatically saved to `sessionStorage` under the key `code-compare-session`:

```json
{
    "leftFile": { "name": "...", "content": "...", "language": "...", "encoding": "...", "size": 0 },
    "rightFile": { ... },
    "options": { "ignoreWhitespace": false, "wordDiff": true, ... },
    "viewMode": "side-by-side",
    "fontSize": 14
}
```

### What Is Persisted

| Data | Saved? |
|---|---|
| Left / right file content | Yes |
| Diff options | Yes |
| View mode | Yes |
| Font size | Yes |
| Search keyword | No |
| Scroll position | No |

Data persists across tab refreshes but is cleared when the browser is closed.

---

## 8. Technical Architecture

### Technology Stack

| Component | Technology |
|---|---|
| Framework | Angular 21, Standalone components |
| State | Angular Signals (`signal`, `computed`, `effect`) |
| Diff algorithm | Myers diff (`diff` package — jsdiff) |
| Syntax highlighting | Prism.js (lazy-loaded per language) |
| Virtual scrolling | Angular CDK `ScrollingModule` |
| Styling | Tailwind CSS v4 + PrimeNG |

### Data Flow

```
User Input (paste / file drop)
    ↓ debounce 400ms
CodeInput → state.setFile(side, content)
    ↓
CodeCompareState (signal)
    ↓ computed
DiffEngine.compute()
    ↓
diffResult signal (DiffResult)
    ↓ Angular change detection
DiffViewer / Minimap / DiffSummary render
```

### State Service (`CodeCompareState`)

Single source of truth. Key signals:

| Signal | Type | Description |
|---|---|---|
| `leftFile` | `FileContent \| null` | Code A content |
| `rightFile` | `FileContent \| null` | Code B content |
| `options` | `DiffOptions` | All filter options |
| `viewMode` | `'side-by-side' \| 'inline'` | Current view mode |
| `fontSize` | `number` | The display font size (10 to 22) |
| `showAllUnchanged` | `boolean` | Fold toggle |
| `scrollRatio` | `number` | Synchronized scroll between two panels |
| `searchState` | `SearchState` | Query + search results |
| `diffResult` | computed | Diff output (recomputed automatically when inputs change) |

### Diff Algorithm (`DiffEngine`)

1. Apply ignore options to each line (whitespace, case, blank lines, comments, trim)
2. Run Myers line-level diff (`diffLines`)
3. Pair adjacent removed + added blocks → **Modified**
4. For Modified lines: compute word/char tokens
5. Group into **hunks** with context lines; fold excess unchanged regions
6. Build row sets for side-by-side and inline views
7. Compute statistics (added, removed, modified, unchanged, similarity %)

### Performance

- **Virtual Scrolling**: Only renders ~40–50 visible lines at a time, never the full list
- **Computed signal**: Diff only recalculates when inputs actually change
- **Debounce 400ms**: Prevents continuous diffing while typing
- **Lazy Prism**: Language grammars loaded on demand
- **Minimap canvas**: Only redraws when `diffResult` changes

### Security

All user content is HTML-escaped via `DiffEngine.escapeHtml()` before being stored in `DiffLine.raw`. There is no XSS risk when rendering with `[innerHTML]`.

---

## 9. File Structure

```
src/app/pages/code-compare/
├── code-compare.ts                         ← Root component (orchestrator)
├── code-compare.html
├── code-compare.scss
│
├── models/
│   └── diff.models.ts                      ← All TypeScript interfaces
│
├── services/
│   ├── code-compare-state.service.ts       ← State management (signals)
│   ├── diff-engine.service.ts              ← Myers diff algorithm
│   ├── syntax-highlight.service.ts         ← Language detection + Prism.js
│   └── export.service.ts                   ← HTML/PNG export
│
└── components/
    ├── code-input/
    │   ├── code-input.ts                   ← Textarea + file upload
    │   ├── code-input.html
    │   └── code-input.scss
    ├── diff-toolbar/
    │   ├── diff-toolbar.ts                 ← Controls: view mode, options, search, export
    │   ├── diff-toolbar.html
    │   └── diff-toolbar.scss
    ├── diff-summary/
    │   ├── diff-summary.ts                 ← Stats: +/- counts, similarity bar
    │   ├── diff-summary.html
    │   └── diff-summary.scss
    ├── diff-viewer/
    │   ├── diff-viewer.ts                  ← Router: side-by-side vs inline
    │   ├── diff-viewer.html
    │   ├── diff-viewer.scss
    │   ├── side-by-side-view.ts            ← 2-column virtual scroll
    │   ├── side-by-side-view.html
    │   ├── side-by-side-view.scss
    │   ├── inline-view.ts                  ← 1-column virtual scroll
    │   ├── inline-view.html
    │   └── inline-view.scss
    ├── diff-line/
    │   ├── diff-line.ts                    ← Single line renderer (gutter, marker, tokens)
    │   ├── diff-line.html
    │   └── diff-line.scss
    └── diff-minimap/
        ├── diff-minimap.ts                 ← Canvas overview + viewport indicator
        ├── diff-minimap.html
        └── diff-minimap.scss
```

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Alt + ↓` | Jump to next diff block |
| `Alt + ↑` | Jump to previous diff block |
