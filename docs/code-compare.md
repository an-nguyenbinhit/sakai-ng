# Code Compare — Feature Documentation

## Overview

Code Compare là tính năng trang chủ (`/`) của ứng dụng. Cho phép người dùng so sánh hai đoạn code hoặc file văn bản, hiển thị diff với nhiều chế độ xem, tìm kiếm, lọc, và xuất kết quả.

---

## Mục lục

1. [Nhập liệu](#1-nhập-liệu)
2. [Chế độ xem diff](#2-chế-độ-xem-diff)
3. [Tùy chọn lọc](#3-tùy-chọn-lọc)
4. [Điều hướng & Tìm kiếm](#4-điều-hướng--tìm-kiếm)
5. [Minimap](#5-minimap)
6. [Xuất kết quả](#6-xuất-kết-quả)
7. [Trạng thái phiên](#7-trạng-thái-phiên)
8. [Kiến trúc kỹ thuật](#8-kiến-trúc-kỹ-thuật)
9. [Cấu trúc file](#9-cấu-trúc-file)

---

## 1. Nhập liệu

### Hai phương thức nhập

| Phương thức | Mô tả |
|---|---|
| **Paste / Gõ** | Nhập trực tiếp vào textarea |
| **Upload file** | Kéo-thả hoặc click để chọn file (tối đa 10 MB) |

### Phát hiện ngôn ngữ

Hệ thống tự động phát hiện ngôn ngữ lập trình từ phần mở rộng file. Hỗ trợ 30+ ngôn ngữ:

`JavaScript`, `TypeScript`, `Python`, `Java`, `C/C++`, `C#`, `Go`, `Rust`, `PHP`, `Ruby`, `Swift`, `Kotlin`, `HTML`, `CSS`, `SCSS`, `JSON`, `YAML`, `XML`, `SQL`, `Bash`, `PowerShell`, `Dockerfile`, `GraphQL`, `Markdown`, và nhiều ngôn ngữ khác.

### Phát hiện encoding

Tự động nhận diện encoding từ BOM header:
- `UTF-8` (mặc định)
- `UTF-16 LE`
- `UTF-16 BE`

### Giới hạn & Validation

- File nhị phân (binary): **bị từ chối**
- File quá lớn (> 10 MB): **bị từ chối kèm thông báo lỗi**
- Extension không được hỗ trợ: **bị từ chối**

### Panel thu gọn

Khi cả hai bên đã có nội dung, panel nhập liệu tự động thu gọn thành thanh tiêu đề hiển thị tên file và số dòng. Click vào để mở rộng lại. Panel cũng tự thu gọn khi người dùng click ra ngoài.

---

## 2. Chế độ xem diff

### Side-by-Side (song song)

Hiển thị hai cột trái-phải đồng bộ scroll. Khi cuộn một bên, bên còn lại tự động cuộn theo tỉ lệ.

```
| # | Code A          |  | # | Code B          |
|---|-----------------|  |---|-----------------|
| 1 | function fib(n) |  | 1 | function fib(n: |
| 2 |   if (n <= 1)   |  | 2 |   if (n < 0) th |
```

### Inline

Hiển thị tất cả thay đổi trong một cột theo thứ tự tuần tự:

```
| # | ± | Nội dung                 |
|---|---|--------------------------|
| 1 |   | function fib(n) {        |
| 2 | - |   if (n <= 1) return n;  |
| 2 | + |   if (n < 0) throw ...   |
```

Ký hiệu: `-` = dòng bị xóa, `+` = dòng thêm mới, `~` = dòng được sửa.

### Loại thay đổi

| Loại | Màu nền | Ký hiệu | Ý nghĩa |
|---|---|---|---|
| **Added** | Xanh lá | `+` | Chỉ có ở Code B |
| **Removed** | Đỏ | `-` | Chỉ có ở Code A |
| **Modified** | Vàng | `~` | Có ở cả hai nhưng khác nhau |
| **Unchanged** | Mặc định | — | Giống nhau ở cả hai |

### Word/Char diff

Với dòng **Modified**, từng từ hoặc ký tự khác nhau được tô sáng:
- Từ bị xóa: nền **đỏ đậm**
- Từ được thêm: nền **xanh đậm**

---

## 3. Tùy chọn lọc

Truy cập qua **DiffToolbar**. Mỗi tùy chọn ảnh hưởng trực tiếp đến thuật toán diff.

| Tùy chọn | Mặc định | Mô tả |
|---|---|---|
| **Ignore Whitespace** | Tắt | Bỏ qua khoảng trắng cuối dòng |
| **Ignore Case** | Tắt | So sánh không phân biệt hoa/thường |
| **Ignore Blank Lines** | Tắt | Bỏ qua dòng trống |
| **Ignore Comments** | Tắt | Bỏ qua dòng comment (`//`, `#`, `/*`) |
| **Trim Lines** | Tắt | Cắt khoảng trắng đầu/cuối dòng |
| **Word Diff** | Bật | Tô sáng từ khác nhau trong dòng Modified |
| **Char Diff** | Tắt | Tô sáng ký tự khác nhau (chi tiết hơn Word Diff) |
| **Context Lines** | 3 | Số dòng unchanged hiển thị xung quanh mỗi khối thay đổi |

---

## 4. Điều hướng & Tìm kiếm

### Điều hướng giữa các khối diff

- Nút **Prev / Next** trên toolbar (hoặc phím tắt `Alt+↑` / `Alt+↓`)
- Hiển thị vị trí hiện tại: `3 / 15`

### Show / Hide Unchanged

Toggle trên **DiffSummary**:
- **Show All**: Hiển thị toàn bộ dòng unchanged
- **Hide Unchanged**: Thu gọn các vùng unchanged thành `··· N unchanged lines ···`

### Tìm kiếm

Nhập từ khóa vào ô Search trên toolbar:
- Tô vàng tất cả kết quả trùng khớp
- Điều hướng qua lại giữa các kết quả
- Hiển thị bộ đếm: `2 / 5`
- Tìm kiếm không phân biệt hoa/thường

---

## 5. Minimap

Panel dọc bên phải màn hình, hiển thị toàn bộ diff ở dạng thu nhỏ:

- Mỗi dòng được vẽ bằng màu tương ứng loại thay đổi
- **Viewport indicator**: Thanh trắng/xám cho biết vùng đang nhìn
- **Click** để nhảy đến bất kỳ vị trí nào trong diff
- Tự động cập nhật khi diff thay đổi
- Hỗ trợ dark mode

---

## 6. Xuất kết quả

### Xuất HTML

Tạo file HTML độc lập (tự chứa CSS):

- **Side-by-side**: Bảng 4 cột (số dòng trái, code trái, số dòng phải, code phải)
- **Inline**: Bảng 3 cột (số dòng, ký hiệu, nội dung)
- Bảo toàn màu sắc word/char diff
- Header chứa: tên file, thống kê, tùy chọn đang bật
- Vùng fold hiển thị: `... N unchanged lines ...`

### Xuất PNG

Render diff thành ảnh PNG chất lượng cao:

- Font monospace (`Courier New` / `Consolas`)
- Scale 2x khi kích thước cho phép
- Header chứa tên file, chế độ xem, thống kê, tùy chọn
- Màu sắc thay đổi được giữ nguyên
- Tự động xuống dòng khi code quá dài
- **Giới hạn**: 65535px chiều cao / 268M pixel diện tích (giới hạn canvas trình duyệt)
- **Fallback**: Nếu ảnh quá lớn, hiển thị thông báo lỗi — dùng xuất HTML thay thế

---

## 7. Trạng thái phiên

### Tự động lưu (sessionStorage)

Sau mỗi thay đổi, trạng thái được tự động lưu vào `sessionStorage` với key `code-compare-session`:

```json
{
    "leftFile": { "name": "...", "content": "...", "language": "...", "encoding": "...", "size": 0 },
    "rightFile": { ... },
    "options": { "ignoreWhitespace": false, "wordDiff": true, ... },
    "viewMode": "side-by-side"
}
```

### Phạm vi lưu trữ

| Dữ liệu | Lưu? |
|---|---|
| Nội dung file trái/phải | Có |
| Tùy chọn diff | Có |
| Chế độ xem | Có |
| Từ khóa tìm kiếm | Không |
| Vị trí scroll | Không |

Dữ liệu tồn tại khi refresh tab, mất khi đóng trình duyệt.

---

## 8. Kiến trúc kỹ thuật

### Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Framework | Angular 21, Standalone components |
| State | Angular Signals (`signal`, `computed`, `effect`) |
| Diff algorithm | Myers diff (`diff` package — jsdiff) |
| Syntax highlighting | Prism.js (lazy load theo ngôn ngữ) |
| Virtual scrolling | Angular CDK `ScrollingModule` |
| Styling | Tailwind CSS v4 + PrimeNG |

### Luồng dữ liệu

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

### State service (`CodeCompareState`)

Nguồn sự thật duy nhất. Các signal chính:

| Signal | Kiểu | Mô tả |
|---|---|---|
| `leftFile` | `FileContent \| null` | Nội dung Code A |
| `rightFile` | `FileContent \| null` | Nội dung Code B |
| `options` | `DiffOptions` | Tất cả tùy chọn lọc |
| `viewMode` | `'side-by-side' \| 'inline'` | Chế độ xem hiện tại |
| `showAllUnchanged` | `boolean` | Toggle fold |
| `scrollRatio` | `number` | Đồng bộ scroll giữa 2 panel |
| `searchState` | `SearchState` | Query + kết quả tìm kiếm |
| `diffResult` | computed | Kết quả diff (tự tính lại khi input thay đổi) |

### Thuật toán diff (`DiffEngine`)

1. Áp dụng ignore options lên từng dòng (whitespace, case, blank lines, comments, trim)
2. Chạy Myers line-level diff (`diffLines`)
3. Ghép cặp khối removed + added liền kề → **Modified**
4. Với dòng Modified: tính word/char tokens
5. Gom thành **hunks** với context lines; gấp các vùng unchanged thừa
6. Tạo row sets cho side-by-side và inline
7. Tính thống kê (added, removed, modified, unchanged, similarity %)

### Performance

- **Virtual Scrolling**: Chỉ render ~40–50 dòng hiển thị, không render toàn bộ
- **Computed signal**: Diff chỉ tính lại khi input thực sự thay đổi
- **Debounce 400ms**: Tránh diff liên tục khi đang gõ
- **Lazy Prism**: Load grammar ngôn ngữ theo yêu cầu
- **Minimap canvas**: Chỉ vẽ lại khi diffResult thay đổi

### Bảo mật

Toàn bộ nội dung người dùng được HTML-escape qua `DiffEngine.escapeHtml()` trước khi lưu vào `DiffLine.raw`. Không có XSS risk khi render `[innerHTML]`.

---

## 9. Cấu trúc file

```
src/app/pages/code-compare/
├── code-compare.ts                         ← Root component (orchestrator)
├── code-compare.html
├── code-compare.scss
│
├── models/
│   └── diff.models.ts                      ← Toàn bộ TypeScript interfaces
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

| Phím | Hành động |
|---|---|
| `Alt + ↓` | Nhảy đến khối diff tiếp theo |
| `Alt + ↑` | Nhảy đến khối diff trước đó |

