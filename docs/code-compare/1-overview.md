# Code Compare - Overview

## 1. Description
A tool that allows users to compare two code snippets or text files, displaying diffs with multiple view modes, search, filtering, and export capabilities.

## 2. Objective
To provide a fast, accurate, and highly customizable diff viewing tool for developers, helping them quickly identify code changes directly in the browser.

## 3. Roadmap
- **Phase 1 (MVP - Minimum Viable Product):** Basic code input (Paste/Type), Language & Encoding detection, core Myers diff algorithm (jsdiff), two view modes (Side-by-Side and Inline), syntax highlighting (Prism.js), and virtual scrolling for performance.
- **Phase 2 (Advanced Features):** Diff filter options (Ignore whitespace/case, etc.), Word/Char diffing, Collapsible unchanged regions, Minimap visualization, Search within diff, File upload support (max 10MB), HTML/PNG diff Export, and automatic session persistence.
- **Phase 3 (Unit Tests):** Comprehensive unit test suite covering the `DiffEngine` algorithm, `CodeCompareState` management signals, component behaviors (inputs, toolbars, view modes), canvas rendering for minimap, and export services.
