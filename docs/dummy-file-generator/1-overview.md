# Dummy File Generator - Overview

## 1. Description
A utility tool that allows users to quickly generate and download dummy files of a specific size (in MB) with custom sample text and file extensions, directly in the browser safely and without server-side processing.

## 2. Objective
To provide developers, QA testers, and end-users with a fast, zero-network-cost way to generate files of various sizes and formats for testing upload limits, storage capacity, or file parsing logic.

## 3. Roadmap
- **Phase 1 (MVP - Minimum Viable Product):** Basic file generation with custom size, sample text input, file extension selection (.txt, .csv, .log, .json, .pdf, .html, .jpg, .png), and download capability. **Crucially, all generated files must be valid and correctly openable in their respective viewers (e.g., valid PDF headers, valid HTML structure, valid image envelopes filled with padding data).** Includes validation to prevent browser crashes when generating excessively large files.
- **Phase 2 (Advanced Features):** Support for generating complex file types (Word, Excel) with random data generation, batch file creation, and integration with cloud storage mock APIs.
