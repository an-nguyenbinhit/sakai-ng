# Encode / Decode - Overview

## 1. Description
A client-side tool that converts strings between **Base64**, **URL**, and **HTML entity** formats entirely in the browser — no server round-trips required.

## 2. Objective
To provide developers and end-users a simple, instant tool for encoding and decoding text in the three most common web-safe formats, with copy-to-clipboard support and clear error feedback.

## 3. Roadmap
- **Phase 1 (MVP - Minimum Viable Product):** Two-panel layout (Input / Result). Support for Base64, URL, and HTML entity encoding/decoding. Copy to clipboard and Clear actions. Toast error notifications for invalid inputs.
- **Phase 2 (Unit Tests):** Comprehensive unit test suite (48 tests) covering all encoding/decoding operations, round-trip fidelity, helper methods (`encodeHTML`, `decodeHTML`), clipboard behavior, and error paths. All tests run in ChromeHeadless via Karma/Jasmine.
