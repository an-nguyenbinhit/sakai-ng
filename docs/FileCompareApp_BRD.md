# 📄 FILE COMPARE APPLICATION
## Tài liệu Đặc tả Nghiệp vụ & Yêu cầu Hệ thống
### Business Requirements Document (BRD)

| Trường         | Giá trị                                          |
|----------------|--------------------------------------------------|
| Phiên bản      | v1.0.0                                           |
| Ngày lập       | 19/02/2026                                       |
| Tác giả        | Senior Business Analyst                          |
| Loại ứng dụng  | Frontend-Only Web App (SPA)                      |
| Bảo mật        | Toàn bộ xử lý tại client — không gửi dữ liệu lên server |

---

# 1. Tổng quan dự án

## 1.1 Mục tiêu

File Compare Application là ứng dụng web chạy hoàn toàn trên trình duyệt (Frontend-Only SPA), cho phép người dùng so sánh sự khác biệt giữa hai file văn bản, file mã nguồn, hoặc nội dung text bất kỳ — tương tự chức năng diff/merge trong các IDE và công cụ quản lý phiên bản.

Điểm khác biệt quan trọng nhất: toàn bộ dữ liệu chỉ tồn tại trong bộ nhớ trình duyệt của người dùng. Không có bất kỳ thông tin nào được gửi lên server hay lưu trữ bên ngoài thiết bị.

## 1.2 Đối tượng người dùng

| Đối tượng             | Nhu cầu chính                                 | Use Case điển hình                                          |
|-----------------------|-----------------------------------------------|-------------------------------------------------------------|
| Developer / DevOps    | So sánh code, config, diff PR                 | Review thay đổi file `.env`, `.yaml`, `.json`               |
| Tester / QA           | Kiểm tra output/expected vs actual            | So sánh log, test result, snapshot                          |
| Business Analyst      | Đối chiếu tài liệu nghiệp vụ                 | So sánh 2 phiên bản yêu cầu                                 |
| Người dùng phổ thông  | So sánh văn bản, hợp đồng                    | Tìm điểm khác nhau giữa 2 file Word đã export              |

## 1.3 Nguyên tắc thiết kế cốt lõi

- **Privacy First**: Không upload file lên server — toàn bộ xử lý bằng JavaScript tại client.
- **Zero Backend**: Ứng dụng là static HTML/CSS/JS thuần túy, có thể deploy trên GitHub Pages, Netlify, S3.
- **Accessibility**: Giao diện trực quan, không cần đăng ký tài khoản, không cần cài đặt.
- **Performance**: Xử lý file lớn (lên đến 10MB) không gây lag hoặc crash tab trình duyệt.
- **Responsive**: Hoạt động tốt trên desktop; hỗ trợ tablet ở chế độ xem đơn giản.

---

# 2. Danh sách tính năng (Feature List)

## 2.1 Nhập dữ liệu đầu vào

### F-01: Nhập file từ máy tính (File Upload)

Người dùng kéo thả (Drag & Drop) hoặc click để chọn file từ hệ thống. Ứng dụng đọc nội dung file bằng FileReader API — hoàn toàn phía client.

| Thuộc tính          | Giá trị                                                                                                                           |
|---------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Loại file hỗ trợ    | `.txt`, `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.java`, `.go`, `.rb`, `.php`, `.cs`, `.cpp`, `.c`, `.h`, `.json`, `.yaml`, `.yml`, `.xml`, `.html`, `.css`, `.scss`, `.md`, `.sql`, `.sh`, `.bat`, `.env`, `.log`, `.csv` |
| Giới hạn kích thước | 10 MB / file (có thể cấu hình)                                                                                                   |
| Encoding hỗ trợ     | UTF-8 (mặc định), UTF-16, Latin-1 (tự detect)                                                                                   |
| Xử lý file nhị phân | Hiển thị cảnh báo — không hỗ trợ so sánh                                                                                         |

### F-02: Nhập thủ công (Text Paste / Direct Input)

Mỗi panel có text area riêng. Người dùng có thể paste trực tiếp nội dung mà không cần file. Phù hợp cho snippet code ngắn, JSON API response, error message, v.v.

### F-03: Tải ví dụ mẫu (Load Sample)

Nút "Load Sample" tự động điền sẵn hai đoạn code mẫu để người dùng trải nghiệm tính năng ngay mà không cần chuẩn bị dữ liệu. Hữu ích cho người dùng lần đầu.

## 2.2 Công cụ so sánh (Diff Engine)

### F-04: Chế độ Diff hiển thị dòng (Line-by-Line Diff)

Hai file được hiển thị song song (side-by-side). Từng dòng được đánh màu theo trạng thái: xanh lá = thêm mới, đỏ = xóa, vàng = thay đổi. Dòng không thay đổi hiển thị màu trắng/xám nhẹ.

### F-05: Chế độ Inline Diff

Thay vì hai cột, nội dung hiển thị trong một cột duy nhất. Các đoạn thêm/xóa xen kẽ nhau, dễ đọc hơn khi màn hình nhỏ hoặc khi diff có nhiều block liên tiếp.

### F-06: Word-level Diff (Highlight theo từ)

Trong mỗi dòng bị thay đổi, ứng dụng highlight chính xác từng từ hoặc ký tự khác nhau thay vì tô màu cả dòng. Giúp phát hiện sự thay đổi nhỏ (ví dụ: sửa một từ trong câu dài).

### F-07: Character-level Diff

Tùy chọn nâng cao: highlight sự khác biệt ở cấp ký tự. Hữu ích khi so sánh số liệu, mã hóa, hash, hoặc chuỗi ký tự đặc biệt.

### F-08: Ignore Options (Bỏ qua khi so sánh)

| Tùy chọn         | Mô tả                                                    |
|------------------|----------------------------------------------------------|
| Ignore Whitespace | Bỏ qua khoảng trắng thừa đầu/cuối dòng                 |
| Ignore Blank Lines | Bỏ qua các dòng trống                                  |
| Ignore Case       | Phân biệt HOA/thường (tắt mặc định)                    |
| Ignore Comments   | Bỏ qua dòng comment (theo ngôn ngữ đã chọn)            |
| Trim Lines        | Chuẩn hóa indent trước khi so sánh                      |

## 2.3 Điều hướng & Trải nghiệm người dùng

### F-09: Navigation Panel (Bảng điều hướng diff)

Thanh minimap bên phải hiển thị toàn bộ file thu nhỏ. Các vùng diff được highlight trên minimap. Người dùng click để nhảy đến vị trí bất kỳ.

### F-10: Prev / Next Diff

Nút điều hướng "← Prev" / "Next →" và phím tắt bàn phím (`Alt+↑` / `Alt+↓`) để nhảy nhanh từ diff block này sang diff block kế tiếp.

### F-11: Summary Panel (Bảng thống kê)

Hiển thị tóm tắt phía đầu trang: tổng dòng thêm, tổng dòng xóa, tổng dòng sửa, tổng dòng không đổi, tỉ lệ tương đồng (similarity %).

### F-12: Syntax Highlighting

Tự động detect ngôn ngữ lập trình dựa theo extension file hoặc nội dung. Áp dụng syntax highlight (dùng thư viện như Prism.js hoặc highlight.js) trong khi vẫn giữ màu diff.

### F-13: Tìm kiếm trong file (Search)

`Ctrl+F` mở thanh tìm kiếm nội tuyến. Highlight tất cả kết quả khớp. Có thể giới hạn tìm trong "chỉ vùng diff" hoặc toàn bộ file.

### F-14: Fold/Collapse Unchanged Sections

Các đoạn không thay đổi dài được tự động thu gọn (collapse) để người dùng tập trung vào diff. Có thể mở rộng bằng click. Số dòng bị ẩn hiển thị rõ ràng.

## 2.4 Xuất kết quả (Export)

### F-15: Copy to Clipboard

Nút sao chép diff kết quả dưới dạng plain text (unified diff format) hoặc HTML với màu sắc vào clipboard.

### F-16: Export HTML

Tải xuống file `.html` chứa kết quả diff có màu sắc — mở được ngay trên trình duyệt, không cần cài thêm tool. Bao gồm CSS inline để hiển thị đúng kể cả khi offline.

### F-17: Export Unified Diff (.diff / .patch)

Tải xuống file `.diff` theo chuẩn unified diff format — có thể dùng với `git apply`, `patch` command.

### F-18: Share via URL (Optional)

Nội dung text ngắn (< 2KB) có thể encode vào URL hash (`#`) để chia sẻ. Không gửi qua server. Người nhận mở link sẽ thấy sẵn nội dung diff. Cảnh báo rõ nếu nội dung quá lớn.

> ⚠️ **Lưu ý bảo mật F-18:** Nếu nội dung nhạy cảm, không nên dùng tính năng Share URL. URL có thể được lưu trong browser history, server log của CDN, hoặc bị chia sẻ không chủ ý.

---

# 3. Thiết kế UI/UX

## 3.1 Bố cục tổng thể

Ứng dụng được chia thành 3 vùng chính theo chiều dọc:

1. **Header Bar**: Logo, tên app, nút Settings, nút About, toggle Dark/Light mode.
2. **Input Zone**: Hai panel nhập liệu (trái/phải) với các control bên trên mỗi panel.
3. **Diff Viewer**: Vùng hiển thị kết quả so sánh, chiếm phần lớn màn hình.

## 3.2 Input Zone — Chi tiết

| Thành phần    | Mô tả                                                                                  |
|---------------|----------------------------------------------------------------------------------------|
| Panel Header  | Hiển thị tên file đã chọn; nút X để xóa; badge encoding/language                      |
| Drop Zone     | Vùng kéo thả với icon và text hướng dẫn. Highlight khi có file kéo vào (drag-over)    |
| Text Area     | Có line number. Tự thay đổi chiều cao. Hỗ trợ Tab để indent.                           |
| Toolbar       | Nút Upload File, Paste Text, Clear, Load Sample, Copy Content                          |
| Swap Button   | Nút ↔ ở giữa hai panel để hoán đổi nội dung trái/phải                                 |

## 3.3 Diff Viewer — Chi tiết

| Thành phần    | Mô tả                                                                                                    |
|---------------|----------------------------------------------------------------------------------------------------------|
| Summary Bar   | Thống kê nhanh: `+N added` / `-N removed` / `~N changed` / `N unchanged` / `N% similar`                |
| Mode Selector | Toggle: Side-by-Side \| Inline \| Unified Diff text                                                     |
| Toolbar       | Prev Diff \| Next Diff \| Fold All \| Expand All \| Font Size +/-                                       |
| Line Numbers  | Số thứ tự dòng của từng file (trái/phải độc lập) sticky khi scroll ngang                                |
| Diff Content  | Nội dung với màu sắc, syntax highlight, word-level diff mark                                             |
| Minimap       | Thu nhỏ bên phải, kéo để scroll nhanh đến vị trí diff bất kỳ                                            |

## 3.4 Màu sắc quy ước diff

| Trạng thái    | Màu nền               | Ý nghĩa                                                              |
|---------------|-----------------------|----------------------------------------------------------------------|
| Added         | `#D4EDDA` (xanh)      | Dòng xuất hiện trong File B nhưng không có trong File A              |
| Removed       | `#F8D7DA` (đỏ)        | Dòng có trong File A nhưng không có trong File B                     |
| Modified      | `#FFF3CD` (vàng)      | Dòng tồn tại ở cả hai nhưng nội dung khác nhau                       |
| Unchanged     | Trắng / Xám nhạt      | Dòng giống hệt nhau                                                  |
| Word highlight | Xanh đậm / Đỏ đậm   | Từ/ký tự thay đổi trong dòng Modified                               |

## 3.5 Responsive & Accessibility

- **Desktop (≥1280px)**: Side-by-side mode mặc định, minimap hiển thị.
- **Tablet (768–1279px)**: Inline mode mặc định, minimap ẩn. Toggle chuyển chế độ vẫn có.
- **Mobile (<768px)**: Chỉ hỗ trợ view Inline + text area stacked dọc. Cảnh báo khuyến khích dùng desktop.
- **Keyboard navigation**: Tab qua các control, `Alt+↑↓` điều hướng diff, `Ctrl+F` tìm kiếm.
- **Screen reader**: Thêm `aria-label` trên tất cả button và region. Dòng diff có `aria-description` trạng thái (added/removed/modified).
- **Font size**: Hỗ trợ tăng/giảm font trong Diff Viewer (12–20px), lưu vào localStorage.

---

# 4. Logic nghiệp vụ chi tiết

## 4.1 Quy trình xử lý tổng quát

| Bước | Tên bước           | Mô tả                                                                                        |
|------|--------------------|----------------------------------------------------------------------------------------------|
| 1    | Nhận đầu vào       | Đọc File A và File B qua `FileReader.readAsText()` hoặc lấy từ textarea                     |
| 2    | Tiền xử lý         | Áp dụng các Ignore Options: chuẩn hóa whitespace, xóa dòng trống, lowercase nếu Ignore Case |
| 3    | Tách dòng          | Split theo `\n` và `\r\n`. Xử lý cả trường hợp file chỉ có `\r` (Mac classic)               |
| 4    | Chạy Diff Algorithm | Myers diff algorithm tính danh sách edit script (insert/delete/equal)                       |
| 5    | Tạo Diff Blocks    | Gom các thay đổi liên tiếp thành block. Xác định loại: added / removed / modified / equal   |
| 6    | Word-level diff    | Với block modified: chạy diff lại ở cấp word để highlight nội tuyến                         |
| 7    | Render             | Render kết quả vào DOM với màu sắc, line number, syntax highlight                            |
| 8    | Minimap update     | Vẽ lại minimap canvas từ tỉ lệ diff blocks                                                   |

## 4.2 Phát hiện ngôn ngữ (Language Detection)

Thứ tự ưu tiên phát hiện ngôn ngữ:

1. **Extension file**: `.py` → Python, `.js`/`.jsx` → JavaScript, `.ts`/`.tsx` → TypeScript, v.v.
2. **Shebang line**: `#!/usr/bin/env python` → Python.
3. **Pattern matching**: Detect dựa trên keyword đặc trưng của ngôn ngữ (fallback).
4. **Unknown**: Không áp syntax highlight, chỉ dùng monospace font.

## 4.3 Xử lý file lớn (Performance)

Với file > 1000 dòng, ứng dụng áp dụng chiến lược **virtual scrolling**: chỉ render các dòng hiện đang visible trong viewport. Phần ngoài viewport được placeholder bằng div trống đúng chiều cao. Giúp xử lý file hàng chục nghìn dòng mà không làm chậm trình duyệt.

Với file > 5MB: Hiển thị cảnh báo hiệu năng. Hỏi người dùng có muốn tiếp tục không. Tự động tắt syntax highlighting để giảm tải.

## 4.4 Xử lý encoding

FileReader mặc định dùng UTF-8. Nếu detect có ký tự decode lỗi (replacement character `U+FFFD`), ứng dụng thử lại với các encoding khác: UTF-16 LE/BE, ISO-8859-1 (Latin-1). Hiển thị encoding đã dùng trên header panel để người dùng biết.

## 4.5 State Management

Ứng dụng lưu trạng thái làm việc vào `sessionStorage` (không phải `localStorage`) để:

- Không mất dữ liệu khi vô tình refresh tab.
- Tự động xóa khi đóng tab/browser — không để lại dấu vết nhạy cảm.

> 📌 **Lưu ý:** `sessionStorage` chỉ tồn tại trong phiên trình duyệt hiện tại. Khi đóng tab, toàn bộ dữ liệu bị xóa hoàn toàn. Đây là hành vi mong muốn để bảo vệ thông tin nhạy cảm.

---

# 5. Bảo mật & Quyền riêng tư (Security & Privacy)

## 5.1 Cam kết bảo mật

> 🔒 **Toàn bộ nội dung file chỉ tồn tại trong RAM của trình duyệt người dùng.** Không có bất kỳ dữ liệu nào được gửi qua mạng — kể cả tên file, kích thước file, hay metadata. Nhà phát triển không thể biết người dùng đang so sánh gì.

## 5.2 Kiểm soát dữ liệu tại client

| Nguyên tắc           | Thực thi                                                                                         |
|----------------------|--------------------------------------------------------------------------------------------------|
| No Server Upload     | FileReader API đọc file trực tiếp — không qua XMLHttpRequest hay fetch                          |
| No Analytics Tracking | Không nhúng Google Analytics, Sentry, Mixpanel, Facebook Pixel                                 |
| No CDN Leakage       | Tất cả JS/CSS lib được bundle cùng app hoặc subresource integrity (SRI) được kiểm tra           |
| Session-only Storage | `sessionStorage` thay vì `localStorage`. Không có IndexedDB. Không có cookie.                  |
| No WebWorker Exfil   | WebWorker (nếu dùng) chỉ nhận `postMessage` nội bộ, không fetch ngoài                          |
| CSP Header           | `Content-Security-Policy: default-src 'self'; script-src 'self'; connect-src 'none'`            |

## 5.3 XSS Prevention

Nội dung người dùng nhập được sanitize trước khi render vào DOM. Nghiêm cấm dùng `innerHTML` trực tiếp với dữ liệu user. Tất cả nội dung diff được escape HTML entities (`&lt;` `&gt;` `&amp;` `&quot;`) trước khi hiển thị.

## 5.4 Audit & Transparency

- Source code ứng dụng là open-source, hosted trên GitHub — ai cũng có thể audit.
- Không có server-side code. Không có database. Không có API endpoint.
- Người dùng doanh nghiệp có thể tự host trên internal server/intranet để kiểm soát hoàn toàn.
- Build artifact có thể được reproduce từ source code (reproducible build).

## 5.5 Khuyến nghị sử dụng

> ✅ **An toàn sử dụng với:** source code nội bộ, file cấu hình, tài liệu hợp đồng, dữ liệu cá nhân — vì không có gì rời khỏi máy tính của bạn.

> ⚠️ **Cẩn thận với tính năng Share URL:** Nếu bật, nội dung được encode vào URL và có thể bị lưu trong browser history hoặc proxy log. Chỉ dùng với nội dung không nhạy cảm.

---

# 6. Kịch bản sử dụng (Use Cases)

## UC-01: Developer so sánh code trước/sau refactor

| Thuộc tính      | Mô tả                                                                            |
|-----------------|----------------------------------------------------------------------------------|
| Actor           | Developer                                                                        |
| Tiền điều kiện  | Có 2 phiên bản file `.py` cần so sánh                                            |
| Luồng chính     | Upload `file_old.py` → bên trái \| Upload `file_new.py` → bên phải → Click Compare → Xem diff → Export `.diff` |
| Kết quả         | File `.diff` gửi cho reviewer trong PR comments                                  |

## UC-02: Tester so sánh API response expected vs actual

| Thuộc tính      | Mô tả                                                                                     |
|-----------------|-------------------------------------------------------------------------------------------|
| Actor           | QA Engineer                                                                               |
| Tiền điều kiện  | Có 2 đoạn JSON response                                                                   |
| Luồng chính     | Paste JSON expected → panel trái \| Paste JSON actual → panel phải → Bật Ignore Whitespace → Compare |
| Kết quả         | Thấy ngay trường nào bị sai giá trị, chụp màn hình đính kèm bug report                   |

## UC-03: BA so sánh hai phiên bản tài liệu yêu cầu

| Thuộc tính      | Mô tả                                                                                         |
|-----------------|-----------------------------------------------------------------------------------------------|
| Actor           | Business Analyst                                                                              |
| Tiền điều kiện  | Đã export 2 phiên bản `.txt` hoặc `.md` từ Confluence                                        |
| Luồng chính     | Upload `v1.md` → trái \| Upload `v2.md` → phải → Compare → Export HTML để đính vào email     |
| Kết quả         | Email đính kèm file HTML cho stakeholder review các thay đổi yêu cầu                         |

---

# 7. Yêu cầu phi chức năng (Non-Functional Requirements)

## 7.1 Hiệu năng

| Chỉ số                              | Mục tiêu              |
|-------------------------------------|-----------------------|
| Thời gian diff file < 1000 dòng     | < 200ms               |
| Thời gian diff file 10.000 dòng     | < 2 giây              |
| First Contentful Paint (FCP)        | < 1 giây (mạng 4G)    |
| Bundle size (gzip)                  | < 300KB               |
| Memory usage (file 10MB)            | < 200MB RAM trình duyệt |

## 7.2 Tương thích

- Chrome 90+, Firefox 88+, Edge 90+, Safari 14+.
- Không hỗ trợ IE11 (sử dụng ES2020+, FileReader API, CSS Grid).
- Hoạt động offline sau khi load lần đầu (Service Worker cache).

## 7.3 Khả năng triển khai

- Static files only: `index.html` + `bundle.js` + `bundle.css`.
- Deploy trên: GitHub Pages, Netlify, Vercel, AWS S3 + CloudFront, hoặc bất kỳ web server nào.
- Docker image (nginx serve static): khoảng 15MB.
- Hỗ trợ custom base URL path (ví dụ: `/tools/diff/`).

## 7.4 Bảo trì & Mở rộng

- Modular architecture: Diff Engine, Renderer, FileReader là các module độc lập.
- Có thể thêm ngôn ngữ mới vào Language Registry mà không ảnh hưởng core logic.
- Diff algorithm có thể thay thế (Myers ↔ Patience ↔ Histogram) qua config.

---

# 8. Stack kỹ thuật đề xuất

| Lớp             | Công nghệ                    | Lý do                                                        |
|-----------------|------------------------------|--------------------------------------------------------------|
| UI Framework    | React 18 + TypeScript        | Component-based, type-safe, ecosystem mạnh                   |
| Styling         | Tailwind CSS                 | Utility-first, không cần design system riêng                 |
| Diff Engine     | diff-match-patch / jsdiff    | Thuật toán Myers đã tối ưu, battle-tested                    |
| Syntax Highlight | Prism.js (lazy load)        | Nhẹ, hỗ trợ 200+ ngôn ngữ                                   |
| Build Tool      | Vite 5                       | Build nhanh, HMR tốt, output tối ưu                          |
| State           | Zustand / Context API        | Nhẹ, đủ cho app không cần backend                            |
| Testing         | Vitest + Playwright          | Unit test diff engine + E2E test UI flow                     |
| Deploy          | GitHub Pages / Netlify       | Free, CI/CD tự động từ GitHub Actions                        |

---

# 9. Tiêu chí nghiệm thu (Acceptance Criteria)

Ứng dụng được coi là **PASS** khi toàn bộ các tiêu chí dưới đây được thỏa mãn:

| # | Tiêu chí                                                                  | Phương pháp kiểm tra           |
|---|---------------------------------------------------------------------------|--------------------------------|
| 1 | Upload 2 file → diff hiển thị đúng màu thêm/xóa/sửa                      | Manual + Unit test             |
| 2 | Paste text → so sánh chính xác, không crash                               | Manual test                    |
| 3 | File 10MB so sánh xong trong < 5 giây                                     | Performance test               |
| 4 | Không có request nào gửi ra ngoài (Network tab = empty)                   | DevTools Network audit         |
| 5 | Export HTML mở đúng màu sắc trong trình duyệt khác                        | Manual test                    |
| 6 | Đóng tab → mở lại → sessionStorage đã xóa                                | Manual test                    |
| 7 | Ignore Whitespace hoạt động đúng: diff không tính khoảng trắng           | Unit test                      |
| 8 | Lighthouse score: Performance ≥ 90, Accessibility ≥ 90                    | Lighthouse CI                  |
| 9 | CSP header ngăn script ngoài load                                         | Security audit                 |
| 10 | Không có innerHTML với dữ liệu user (XSS check)                          | Code review + OWASP ZAP        |

---

*Tài liệu này được soạn thảo bởi Senior Business Analyst • File Compare App BRD v1.0.0 • 19/02/2026*
