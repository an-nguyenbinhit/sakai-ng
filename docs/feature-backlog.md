# DevWorkspace Feature Backlog

## 1. Purpose | Mục tiêu

Tài liệu này tổng hợp các ý tưởng tính năng tiếp theo cho `DevWorkspace`, bám sát bề mặt sản phẩm hiện tại: Code Compare, Code Formatter, JSON Tools, Regex Tester, Encode / Decode, và Dummy File Generator.

This document consolidates candidate features for `DevWorkspace` based on the current product surface: Code Compare, Code Formatter, JSON Tools, Regex Tester, Encode / Decode, and Dummy File Generator.

Mục tiêu là tạo một backlog cấp sản phẩm đủ cụ thể để dùng cho roadmap, nhưng vẫn ngắn gọn để đội ngũ có thể đọc nhanh và ưu tiên theo pha.

The goal is to provide a product-level backlog that is specific enough for roadmap planning while still compact enough to scan quickly.

## 2. Prioritization Rules | Nguyên tắc ưu tiên

- `P1`: High user value, close to current tool capabilities, feasible with client-side processing, and low product ambiguity.
- `P2`: Strong value but needs deeper UX design, heavier browser processing, or broader validation.
- `P3`: Strategic differentiator, advanced workflow, or feature with higher implementation and maintenance cost.
- Favor ideas that remain browser-first and SSR-safe when adding storage, sharing, or file APIs.
- Keep implementation aligned with Angular standalone components, signals, zoneless change detection, and existing PrimeNG + Tailwind patterns.

## 3. Feature Ideas By Tool | Ý tưởng theo từng công cụ

### 3.1. Code Compare

#### 1. Three-Way Compare and Merge Assist
- **Tool:** Code Compare
- **VN:** Thêm chế độ so sánh 3 chiều giữa bản gốc, bản A và bản B để hỗ trợ review hoặc xử lý xung đột merge.
- **EN:** Add a three-way comparison mode across base, version A, and version B to support review and merge-conflict workflows.
- **User problem / value:** Người dùng hiện chỉ so sánh được 2 khối nội dung, chưa đủ cho các ca đồng bộ thay đổi từ nhiều nguồn.
- **Scope v1:** Cho phép nhập 3 nguồn, highlight vùng xung đột, và hiển thị đề xuất giữ trái, giữ phải, hoặc giữ cả hai theo từng block.
- **UX / interaction notes:** Dùng layout 3 cột trên desktop, fallback sang tab hoặc stacked sections trên màn hình nhỏ.
- **Technical notes:** Cần cân đối hiệu năng render diff lớn trong browser; phần merge action phải thuần client-side và không phụ thuộc API server.
- **Priority:** `P2`

#### 2. Ignore Modes for Whitespace, Case, and Line Endings
- **Tool:** Code Compare
- **VN:** Bổ sung các tùy chọn bỏ qua khoảng trắng, chữ hoa/thường, và khác biệt line ending khi tính diff.
- **EN:** Add ignore options for whitespace, casing, and line-ending differences during diff calculation.
- **User problem / value:** Nhiều lần diff bị nhiễu bởi thay đổi định dạng thay vì thay đổi nội dung thực.
- **Scope v1:** Toolbar có các toggle độc lập, tính lại diff theo thời gian thực, và hiển thị trạng thái đang áp dụng.
- **UX / interaction notes:** Tùy chọn nên nằm gần view mode để người dùng hiểu đó là bộ lọc diff chứ không phải thay đổi input.
- **Technical notes:** Nên chuẩn hóa input trước khi diff nhưng vẫn giữ bản gốc để export và preview chính xác.
- **Priority:** `P1`

#### 3. File and Folder Upload Compare
- **Tool:** Code Compare
- **VN:** Hỗ trợ tải lên 2 file hoặc 2 thư mục nhỏ để so sánh nội dung nhanh thay vì chỉ dán text thủ công.
- **EN:** Support comparing two uploaded files or small folders instead of relying only on manual text input.
- **User problem / value:** Người dùng thường cần so sánh file cấu hình, JSON, hoặc source snapshot trực tiếp từ máy.
- **Scope v1:** Hỗ trợ upload 2 file text trước; thư mục là bước mở rộng cho danh sách file đơn giản và diff từng file.
- **UX / interaction notes:** Cần hiển thị rõ giới hạn dung lượng, loại file hỗ trợ, và trạng thái khi file không đọc được.
- **Technical notes:** Dùng browser file APIs có guard SSR; thư mục cần chiến lược degrade khi browser không hỗ trợ directory picker đồng nhất.
- **Priority:** `P2`

#### 4. Unified Diff and Patch Export
- **Tool:** Code Compare
- **VN:** Cho phép xuất kết quả dưới dạng unified diff hoặc patch để dùng lại trong review, email, hoặc tooling khác.
- **EN:** Allow exporting results as unified diff or patch output for reuse in reviews, emails, or external tooling.
- **User problem / value:** Người dùng cần mang kết quả diff ra ngoài app mà không chỉ chụp ảnh màn hình hoặc copy thủ công.
- **Scope v1:** Export text-based patch, copy to clipboard, và download `.diff` file.
- **UX / interaction notes:** Kết hợp với nút export hiện có hoặc menu export tập trung để tránh rải nút hành động.
- **Technical notes:** Phải giữ mapping chính xác giữa input gốc và normalized diff khi người dùng bật ignore modes.
- **Priority:** `P1`

#### 5. Shareable Compare Session
- **Tool:** Code Compare
- **VN:** Tạo URL chia sẻ cho phiên so sánh hiện tại với chế độ rút gọn hoặc nén nội dung trong query/hash.
- **EN:** Generate a shareable URL for the current compare session using compact or compressed query/hash payloads.
- **User problem / value:** Người dùng muốn gửi nhanh kết quả cho đồng nghiệp mà không phải dán lại hai khối code.
- **Scope v1:** Chia sẻ text nhỏ qua URL; với nội dung lớn thì fallback sang export file hoặc copy JSON session.
- **UX / interaction notes:** Phải có cảnh báo rõ về dữ liệu nhạy cảm trước khi tạo link chia sẻ.
- **Technical notes:** Cần giới hạn kích thước URL và tránh làm SSR/prerender phụ thuộc dữ liệu runtime.
- **Priority:** `P2`

### 3.2. Code Formatter

#### 6. Auto-Detect Language and Format on Paste
- **Tool:** Code Formatter
- **VN:** Tự nhận diện ngôn ngữ phổ biến khi dán nội dung và có thể format ngay nếu người dùng bật chế độ tự động.
- **EN:** Auto-detect common languages on paste and optionally format immediately when auto-format is enabled.
- **User problem / value:** Người dùng mất thời gian chọn language trước khi thử format, nhất là với snippet ngắn.
- **Scope v1:** Nhận diện HTML, CSS, JS, TS, JSON, XML, SQL; cho phép bật/tắt auto-format on paste.
- **UX / interaction notes:** Nên hiển thị badge ngôn ngữ được suy đoán và cho phép override nhanh nếu nhận sai.
- **Technical notes:** Chỉ nên áp dụng heuristic nhẹ để tránh lag khi paste dữ liệu lớn; formatter lỗi phải không làm mất input gốc.
- **Priority:** `P1`

#### 7. Formatter Warning Panel
- **Tool:** Code Formatter
- **VN:** Thêm bảng cảnh báo kiểu lint khi input không hợp lệ, ngôn ngữ chưa hỗ trợ, hoặc formatter phải fallback.
- **EN:** Add a lint-style warning panel when the input is invalid, unsupported, or processed through a fallback formatter.
- **User problem / value:** Khi format thất bại, người dùng thường không biết lỗi do cú pháp, ngôn ngữ, hay giới hạn tool.
- **Scope v1:** Hiển thị warning level, message ngắn, và gợi ý hành động tiếp theo như đổi parser hoặc giữ nguyên text.
- **UX / interaction notes:** Warning nên nằm gần output để gắn với lần chạy gần nhất, không nên bật modal chặn thao tác.
- **Technical notes:** Cần chuẩn hóa error mapping từ nhiều formatter khác nhau thành một model cảnh báo thống nhất.
- **Priority:** `P1`

#### 8. Framework Snippet Presets
- **Tool:** Code Formatter
- **VN:** Cung cấp preset cấu hình theo framework hoặc style guide như Angular, React, Node, hoặc SQL style.
- **EN:** Provide formatter presets for frameworks or style guides such as Angular, React, Node, or SQL conventions.
- **User problem / value:** Người dùng muốn kết quả gần coding style quen thuộc thay vì chỉ format mặc định.
- **Scope v1:** Preset áp dụng indent, quote, semicolon, line width, và parser phù hợp cho một số nhóm ngôn ngữ chính.
- **UX / interaction notes:** Nên hiển thị preset dưới dạng dropdown đơn giản thay vì quá nhiều toggle chi tiết ở v1.
- **Technical notes:** Cần phân biệt preset UI với khả năng thật của từng formatter backend-in-browser để tránh option giả.
- **Priority:** `P2`

#### 9. Safe Fallback Formatter Flow
- **Tool:** Code Formatter
- **VN:** Nếu formatter chính thất bại, tool sẽ thử fallback an toàn hoặc hiển thị raw normalized output để người dùng không bị bế tắc.
- **EN:** When the primary formatter fails, the tool should attempt a safe fallback or provide normalized raw output instead of hard failure.
- **User problem / value:** Một lỗi formatter hiện có thể làm trải nghiệm bị ngắt hoàn toàn dù vẫn còn cách xử lý cơ bản.
- **Scope v1:** Thiết kế chuỗi fallback rõ ràng cho từng nhóm ngôn ngữ và giữ nguyên input ban đầu.
- **UX / interaction notes:** Cần cho người dùng biết kết quả đến từ fallback để họ không hiểu nhầm là output chuẩn tuyệt đối.
- **Technical notes:** Fallback phải deterministic và không được mutate source state ngoài ý muốn.
- **Priority:** `P2`

#### 10. Batch Formatting Workspace
- **Tool:** Code Formatter
- **VN:** Hỗ trợ format nhiều đoạn nội dung trong cùng một phiên để phục vụ xử lý hàng loạt snippet nhỏ.
- **EN:** Support formatting multiple snippets in one session for lightweight batch processing workflows.
- **User problem / value:** Người dùng phải lặp lại thao tác dán, format, copy cho từng snippet riêng biệt.
- **Scope v1:** Dạng danh sách nhiều input card, mỗi card có language, status, output, và thao tác copy riêng.
- **UX / interaction notes:** Cần ưu tiên khả năng collapse từng item để màn hình không bị quá dài.
- **Technical notes:** Nên tách state từng job bằng signals độc lập để tránh re-render toàn bộ workspace.
- **Priority:** `P3`

### 3.3. JSON Tools

#### 11. JSONPath Query Panel
- **Tool:** JSON Tools
- **VN:** Thêm khu vực truy vấn JSONPath để lọc và trích xuất nhanh các node từ payload lớn.
- **EN:** Add a JSONPath query panel for filtering and extracting nodes from large payloads.
- **User problem / value:** Khi JSON lớn hoặc lồng sâu, người dùng khó tìm đúng trường cần kiểm tra bằng mắt thường.
- **Scope v1:** Nhập JSONPath, chạy query, xem kết quả dạng list hoặc preview JSON riêng.
- **UX / interaction notes:** Query panel nên đồng bộ với tree view và highlight node tương ứng nếu có.
- **Technical notes:** Cần chọn thư viện query nhẹ, xử lý lỗi query rõ ràng, và không block UI với payload lớn.
- **Priority:** `P1`

#### 12. JSON Schema Validation
- **Tool:** JSON Tools
- **VN:** Hỗ trợ kiểm tra payload theo JSON Schema để dùng cho API contract và cấu hình.
- **EN:** Support validating payloads against JSON Schema for API contracts and configuration files.
- **User problem / value:** Format đúng chưa đủ; nhiều người cần biết dữ liệu có đúng cấu trúc nghiệp vụ hay không.
- **Scope v1:** Cho phép nhập payload và schema, chạy validate, trả về danh sách lỗi theo đường dẫn trường.
- **UX / interaction notes:** Nên có hai vùng editor tách biệt và bảng lỗi có thể click để focus vào path liên quan.
- **Technical notes:** Cần cân nhắc bundle size của validator và chiến lược lazy-load để không làm nặng route mặc định.
- **Priority:** `P1`

#### 13. JSON Diff and Merge
- **Tool:** JSON Tools
- **VN:** Bổ sung chế độ so sánh hai JSON theo cấu trúc và hỗ trợ merge trường hợp đơn giản.
- **EN:** Add structural JSON diff and simple merge support between two JSON documents.
- **User problem / value:** So sánh text thuần không đủ tốt khi key order thay đổi hoặc object quá lồng nhau.
- **Scope v1:** Highlight added, removed, changed nodes; hỗ trợ merge một chiều cho selected nodes.
- **UX / interaction notes:** Tree diff hoặc split pane sẽ trực quan hơn text diff cho dữ liệu dạng object.
- **Technical notes:** Cần quyết định rõ semantic compare theo parsed object thay vì raw string để giảm nhiễu.
- **Priority:** `P2`

#### 14. Flatten and Unflatten Transformer
- **Tool:** JSON Tools
- **VN:** Cho phép chuyển JSON lồng sâu thành key path phẳng và khôi phục ngược lại.
- **EN:** Allow transforming nested JSON into flat key paths and restoring it back to nested structure.
- **User problem / value:** Tính năng này hữu ích cho import/export CSV, cấu hình env, và debug payload sâu.
- **Scope v1:** Hỗ trợ dot notation hoặc bracket notation và cho phép copy kết quả dạng JSON mới.
- **UX / interaction notes:** Cần mô tả rõ cách xử lý array để tránh hiểu nhầm về format key path.
- **Technical notes:** Biến đổi phải an toàn với key chứa dấu chấm hoặc ký tự đặc biệt; cần policy escape rõ ràng trong UI text.
- **Priority:** `P2`

#### 15. JSON to Type Generator
- **Tool:** JSON Tools
- **VN:** Sinh type hoặc interface từ mẫu JSON để tăng tốc việc dựng model phía frontend và backend.
- **EN:** Generate types or interfaces from sample JSON to speed up frontend and backend model creation.
- **User problem / value:** Người dùng thường copy payload mẫu rồi tự viết type bằng tay, khá chậm và dễ thiếu field.
- **Scope v1:** Hỗ trợ TypeScript interface trước; v2 có thể mở rộng sang C# class hoặc Java record.
- **UX / interaction notes:** Nên có panel output riêng với lựa chọn naming style và readonly/optional cơ bản.
- **Technical notes:** Phải làm rõ rule suy đoán optional fields, nullability, và array item shape để tránh output gây hiểu sai.
- **Priority:** `P2`

### 3.4. Regex Tester

Ghi chú: Nhóm ý tưởng này bám theo hướng đã có trong `docs/regex-tester/5-feature-proposals.md`, nhưng được viết lại ở mức backlog sản phẩm để tránh lặp nguyên nội dung.

#### 16. Capture Groups Explorer
- **Tool:** Regex Tester
- **VN:** Hiển thị chi tiết từng capture group cho mỗi match, bao gồm chỉ số, giá trị, và vị trí trong chuỗi.
- **EN:** Show detailed capture groups for each match, including group index, value, and source position.
- **User problem / value:** Người dùng viết regex để trích xuất dữ liệu nhưng hiện khó thấy nhóm con nào thực sự match.
- **Scope v1:** Bảng match có expandable rows cho group list và named groups nếu runtime hỗ trợ.
- **UX / interaction notes:** Cần phân biệt rõ full match và sub-groups bằng màu hoặc indentation dễ nhìn.
- **Technical notes:** Nên chuẩn hóa output giữa các regex flags và bảo đảm không crash với pattern chứa nhiều nhóm lặp.
- **Priority:** `P1`

#### 17. Replacement Preview
- **Tool:** Regex Tester
- **VN:** Thêm ô replacement string và khu vực preview kết quả sau khi áp dụng replace.
- **EN:** Add a replacement-string input and preview area showing the transformed output after replacement.
- **User problem / value:** Nhiều use case thực tế là tìm và thay thế, không chỉ test match.
- **Scope v1:** Hỗ trợ backreferences cơ bản, preview realtime, và copy output sau thay thế.
- **UX / interaction notes:** Nên đặt replacement cạnh regex input để thể hiện cùng một flow thao tác.
- **Technical notes:** Cần xử lý an toàn khi pattern lỗi và tránh vòng lặp re-compute không cần thiết với input lớn.
- **Priority:** `P1`

#### 18. Regex Explanation View
- **Tool:** Regex Tester
- **VN:** Diễn giải pattern hiện tại thành mô tả từng phần để hỗ trợ học tập và debug regex phức tạp.
- **EN:** Translate the current regex into a part-by-part explanation to support learning and debugging complex patterns.
- **User problem / value:** Regex khó đọc; người dùng mới thường không hiểu từng token đang làm gì.
- **Scope v1:** Giải thích token phổ biến, quantifier, anchors, character classes, groups, và flags cơ bản.
- **UX / interaction notes:** Có thể dùng panel bên phải hoặc accordion dưới kết quả để tránh phá flow nhập liệu chính.
- **Technical notes:** Nên chấp nhận đây là feature heuristic; cần gắn nhãn rõ nếu explanation không hỗ trợ hết engine syntax.
- **Priority:** `P2`

#### 19. Language Snippet Generator
- **Tool:** Regex Tester
- **VN:** Sinh đoạn mã dùng regex hiện tại cho JavaScript/TypeScript và .NET với escaping phù hợp.
- **EN:** Generate ready-to-use regex snippets for JavaScript/TypeScript and .NET with proper escaping rules.
- **User problem / value:** Người dùng hay test regex xong nhưng lại gặp lỗi khi nhúng vào mã nguồn thật.
- **Scope v1:** Cho chọn ngôn ngữ, mode test/replace, và copy snippet đã escape đúng.
- **UX / interaction notes:** Snippet nên có preview ngắn, không cần editor nặng nếu chỉ hiển thị vài dòng mã.
- **Technical notes:** Cần quy tắc escape riêng theo từng runtime và phải tách bạch với regex flavor đang test.
- **Priority:** `P2`

#### 20. Session History and Share Link
- **Tool:** Regex Tester
- **VN:** Lưu lịch sử regex gần đây trong trình duyệt và tạo link chia sẻ cho các case nhỏ.
- **EN:** Store recent regex sessions in the browser and generate share links for smaller cases.
- **User problem / value:** Regex thường được thử nhiều lần và cần quay lại hoặc gửi cho người khác cùng kiểm tra.
- **Scope v1:** Recent list cục bộ, pin một số mẫu, và chia sẻ qua query/hash cho pattern ngắn.
- **UX / interaction notes:** Cần thông báo rõ dữ liệu được lưu local và cảnh báo trước khi tạo URL chia sẻ.
- **Technical notes:** Local storage phải được browser-guarded; cần giới hạn payload để không tạo URL quá dài.
- **Priority:** `P2`

#### 21. Regex Performance Warning
- **Tool:** Regex Tester
- **VN:** Cảnh báo các pattern có nguy cơ backtracking nặng hoặc gây treo trình duyệt trong trường hợp xấu.
- **EN:** Warn about patterns that are likely to cause heavy backtracking or freeze the browser in worst-case scenarios.
- **User problem / value:** Người dùng hiếm khi nhận ra regex nguy hiểm cho tới khi tool chạy chậm hoặc đơ.
- **Scope v1:** Rule-based warning cho một số pattern nguy cơ cao, kèm giải thích ngắn và khuyến nghị sửa.
- **UX / interaction notes:** Dùng warning card không chặn thao tác; chỉ escalates khi input lớn hoặc pattern nghi ngờ rõ ràng.
- **Technical notes:** Không nên hứa hẹn phát hiện đầy đủ; cần mô tả đây là heuristic safety check.
- **Priority:** `P3`

### 3.5. Encode / Decode

#### 22. JWT Inspector
- **Tool:** Encode / Decode
- **VN:** Thêm chế độ đọc JWT để xem header, payload, expiry, và các claim phổ biến mà không xác minh chữ ký.
- **EN:** Add a JWT inspection mode to decode header, payload, expiry, and common claims without signature verification.
- **User problem / value:** JWT là nhu cầu rất phổ biến khi debug API và frontend auth flow.
- **Scope v1:** Parse token, hiển thị JSON đẹp, cảnh báo rõ là decode-only, không phải verify token.
- **UX / interaction notes:** Nên tách ô token và 2 panel kết quả, kèm badge trạng thái hết hạn nếu đọc được `exp`.
- **Technical notes:** Phải xử lý base64url đúng chuẩn và tránh để UI ngụ ý rằng token hợp lệ về bảo mật.
- **Priority:** `P1`

#### 23. Hash Generation Utility
- **Tool:** Encode / Decode
- **VN:** Sinh hash cho text hoặc file nhỏ bằng các thuật toán phổ biến như SHA-256, SHA-512, và MD5 cho mục đích tương thích.
- **EN:** Generate hashes for text or small files using common algorithms such as SHA-256, SHA-512, and MD5 for compatibility use cases.
- **User problem / value:** Người dùng thường cần checksum nhanh khi so sánh nội dung hoặc kiểm thử upload/download.
- **Scope v1:** Input text trước; file hashing là mở rộng có giới hạn dung lượng rõ ràng.
- **UX / interaction notes:** Cần dán nhãn rõ MD5 là compatibility-only, không nên dùng cho mục đích bảo mật mới.
- **Technical notes:** Ưu tiên Web Crypto khi có thể; cần fallback messaging nếu thuật toán không được môi trường hỗ trợ.
- **Priority:** `P1`

#### 24. HTML Entity and Unicode Escape Toolkit
- **Tool:** Encode / Decode
- **VN:** Bổ sung encode/decode cho HTML entities, Unicode escape, và JavaScript string escaping.
- **EN:** Add encode/decode support for HTML entities, Unicode escapes, and JavaScript string escaping.
- **User problem / value:** Đây là các thao tác thường đi cùng Base64 và URL encode khi debug chuỗi ký tự phức tạp.
- **Scope v1:** Chọn mode qua tabs hoặc dropdown, cho phép convert hai chiều và copy output nhanh.
- **UX / interaction notes:** Cần giải thích ngắn khác biệt giữa từng mode để tránh người dùng chọn sai loại escape.
- **Technical notes:** Phải chuẩn hóa newline handling và tránh behavior không nhất quán giữa browser APIs.
- **Priority:** `P1`

#### 25. Line-Based Batch Encode/Decode
- **Tool:** Encode / Decode
- **VN:** Xử lý nhiều dòng input độc lập để encode/decode hàng loạt trong một lần thao tác.
- **EN:** Process multiple independent input lines for batch encode/decode in a single run.
- **User problem / value:** Người dùng có danh sách chuỗi cần xử lý nhanh mà không muốn lặp lại từng item.
- **Scope v1:** Một mode batch riêng, mỗi dòng ra một dòng kết quả tương ứng, giữ thứ tự đầu vào.
- **UX / interaction notes:** Nên có bộ đếm dòng thành công/thất bại và khả năng bỏ qua dòng lỗi.
- **Technical notes:** Cần quyết định rõ cách xử lý dòng rỗng và lỗi từng dòng mà không làm fail toàn bộ batch.
- **Priority:** `P2`

#### 26. Binary / Hex / Text Converter
- **Tool:** Encode / Decode
- **VN:** Hỗ trợ chuyển đổi giữa text, hexadecimal, binary, và UTF byte views để phục vụ debug dữ liệu thô.
- **EN:** Support conversions between text, hexadecimal, binary, and UTF byte views for raw data debugging.
- **User problem / value:** Khi làm việc với protocol, payload, hoặc encoding lỗi, người dùng cần nhìn dữ liệu ở nhiều lớp biểu diễn.
- **Scope v1:** Text <-> Hex và Text <-> Binary trước; byte table là phần nâng cao sau.
- **UX / interaction notes:** Dùng layout nhiều ô chuyển đổi song song để người dùng thấy mối liên hệ giữa các format.
- **Technical notes:** Cần quyết định encoding mặc định như UTF-8 và hiển thị rõ khi ký tự không map được.
- **Priority:** `P2`

### 3.6. Dummy File Generator

#### 27. Dataset Templates
- **Tool:** Dummy File Generator
- **VN:** Thêm template dữ liệu mẫu như CSV users, JSON orders, log files, và test records để sinh file hữu ích hơn.
- **EN:** Add dataset templates such as CSV users, JSON orders, log files, and test records to generate more realistic sample files.
- **User problem / value:** File rỗng hoặc padding thuần chưa đủ cho các ca test import, parsing, và preview dữ liệu.
- **Scope v1:** Một số template có schema cố định, số lượng record tùy chỉnh, và nội dung text hợp lệ.
- **UX / interaction notes:** Template picker nên cho preview schema ngắn trước khi generate.
- **Technical notes:** Cần giữ generation deterministic trong cùng một config để người dùng dễ tái lập kết quả.
- **Priority:** `P1`

#### 28. Multi-File Zip Export
- **Tool:** Dummy File Generator
- **VN:** Cho phép sinh nhiều file cùng lúc và tải xuống dưới dạng `.zip`.
- **EN:** Allow generating multiple files at once and downloading them as a `.zip` archive.
- **User problem / value:** QA và developer thường cần cả bộ dữ liệu test thay vì chỉ một file duy nhất.
- **Scope v1:** Batch list với tên file, loại file, kích thước, và nút generate zip tổng hợp.
- **UX / interaction notes:** Cần hiển thị ước lượng dung lượng cuối và cảnh báo trước khi tạo batch lớn.
- **Technical notes:** Zip generation trong browser có thể tốn RAM; cần hard limit và feedback tiến trình.
- **Priority:** `P2`

#### 29. Deterministic Seed Control
- **Tool:** Dummy File Generator
- **VN:** Cung cấp seed để sinh lại đúng cùng một nội dung mẫu cho mục đích tái hiện bug hoặc test automation.
- **EN:** Provide a seed option so the same sample content can be regenerated for bug reproduction or test automation.
- **User problem / value:** Nội dung ngẫu nhiên khó tái sử dụng khi cần chia sẻ lại case lỗi hoặc so sánh kết quả.
- **Scope v1:** Seed dạng số hoặc text ngắn, áp dụng cho các generator hỗ trợ random data.
- **UX / interaction notes:** Nên đặt seed trong phần advanced settings và có nút random seed nếu người dùng muốn đổi nhanh.
- **Technical notes:** Cần một pseudo-random strategy ổn định giữa các lần chạy và không phụ thuộc engine runtime một cách mơ hồ.
- **Priority:** `P1`

#### 30. MIME-Aware Sample Generators
- **Tool:** Dummy File Generator
- **VN:** Sinh file hợp lệ hơn theo từng MIME/type như PDF đơn giản, image placeholder, HTML sample, hoặc JSON fixture.
- **EN:** Generate more valid MIME-aware files such as simple PDFs, placeholder images, HTML samples, or JSON fixtures.
- **User problem / value:** Người dùng cần file có thể mở được thật để test preview, parser, hoặc upload validation.
- **Scope v1:** Cải thiện các loại phổ biến nhất và ghi rõ loại nào là fully valid, loại nào là placeholder-compatible.
- **UX / interaction notes:** Nên có trạng thái capability để người dùng biết file nào tối ưu cho “openable” và file nào chỉ để test dung lượng.
- **Technical notes:** Cần cân bằng giữa tính hợp lệ của file và chi phí generation trong browser.
- **Priority:** `P1`

#### 31. Image and Document Metadata Controls
- **Tool:** Dummy File Generator
- **VN:** Cho phép cấu hình metadata cơ bản như tên tác giả, timestamp, dimensions ảnh, hoặc tiêu đề tài liệu.
- **EN:** Allow configuring basic metadata such as author name, timestamps, image dimensions, or document title.
- **User problem / value:** Một số bài test upload hoặc indexing cần metadata cụ thể chứ không chỉ nội dung file.
- **Scope v1:** Metadata cho nhóm file hỗ trợ rõ ràng như image, PDF đơn giản, và text-based formats.
- **UX / interaction notes:** Chỉ nên hiển thị các field metadata phù hợp với loại file đang chọn để tránh rối.
- **Technical notes:** Cần công khai giới hạn theo từng file type vì không phải format nào cũng dễ ghi metadata thuần browser.
- **Priority:** `P3`

### 3.7. Cross-Tool Product Capabilities

#### 32. Recent History and Saved Sessions
- **Tool:** Cross-tool
- **VN:** Tạo lớp lịch sử gần đây và saved sessions dùng chung cho nhiều tool.
- **EN:** Create a shared recent-history and saved-session layer across multiple tools.
- **User problem / value:** Người dùng thường lặp lại một số thao tác giữa các phiên nhưng hiện mỗi tool hoạt động khá tách rời.
- **Scope v1:** Recent list cho từng tool, save thủ công, rename, delete, và restore session cục bộ.
- **UX / interaction notes:** Có thể đặt trong sidebar phụ hoặc modal “Recent & Saved” thống nhất toàn app.
- **Technical notes:** Storage phải được browser-guarded, có version schema, và không làm route đầu tải quá nặng.
- **Priority:** `P2`

#### 33. Shared URL State for Small Sessions
- **Tool:** Cross-tool
- **VN:** Chuẩn hóa cơ chế chia sẻ trạng thái qua URL cho các tool có payload nhỏ.
- **EN:** Standardize URL-based state sharing for tools with small enough payloads.
- **User problem / value:** Mỗi tool có thể cần share link, nhưng làm riêng lẻ sẽ dễ lệch UX và khó bảo trì.
- **Scope v1:** Áp dụng trước cho Regex Tester, Code Compare, và Encode / Decode với payload nhỏ.
- **UX / interaction notes:** Cần một mẫu dialog thống nhất: copy link, privacy warning, và size fallback.
- **Technical notes:** Nên có utility dùng chung cho compress/decompress, versioning, và parse safety trên browser.
- **Priority:** `P2`

#### 34. Import / Export Utilities
- **Tool:** Cross-tool
- **VN:** Chuẩn hóa thao tác import từ file và export kết quả cho các tool có input/output dạng text.
- **EN:** Standardize file import and result export flows for tools with text-based input and output.
- **User problem / value:** Người dùng mong các tool hành xử nhất quán thay vì mỗi nơi có cách tải file và tải kết quả khác nhau.
- **Scope v1:** Reusable patterns cho upload file text, copy result, download text, và error handling.
- **UX / interaction notes:** Dùng cùng ngôn ngữ microcopy, icon, và vị trí action để giảm learning cost.
- **Technical notes:** Có thể tách shared utility/service nhỏ nhưng vẫn giữ SSR-safe bằng cách guard file APIs theo runtime.
- **Priority:** `P1`

#### 35. Local-Only Privacy Messaging
- **Tool:** Cross-tool
- **VN:** Bổ sung thông điệp nhất quán rằng dữ liệu được xử lý trong trình duyệt và cảnh báo riêng khi một tính năng có thể lưu local hoặc tạo link chia sẻ.
- **EN:** Add consistent messaging that data is processed in the browser, with explicit warnings when a feature stores data locally or creates share links.
- **User problem / value:** Với tool xử lý code, token, JSON, hay regex, người dùng rất quan tâm đến riêng tư dữ liệu.
- **Scope v1:** Privacy note dùng chung ở level app và note theo ngữ cảnh ở các tool có history/share/export.
- **UX / interaction notes:** Không nên biến privacy note thành banner gây ồn; ưu tiên inline helper text và tooltip rõ ràng.
- **Technical notes:** Cần đảm bảo nội dung mô tả đúng với hành vi thật của từng feature để tránh hiểu lầm sản phẩm.
- **Priority:** `P1`

#### 36. Preset Library Across Tools
- **Tool:** Cross-tool
- **VN:** Xây dựng thư viện preset dùng chung để người dùng lưu và tái sử dụng cấu hình hay thao tác thường dùng.
- **EN:** Build a shared preset library so users can save and reuse common configurations across tools.
- **User problem / value:** Nhiều workflow lặp lại theo cùng một cấu hình, ví dụ formatter preset, generator preset, hoặc encode mode cố định.
- **Scope v1:** Save preset theo tool, đặt tên, duplicate, delete, và áp dụng lại nhanh từ dropdown.
- **UX / interaction notes:** Nên tách “Preset” khỏi “Session” để người dùng hiểu preset là cấu hình, không phải dữ liệu làm việc đầy đủ.
- **Technical notes:** Mỗi tool cần schema preset riêng nhưng nên dùng cùng storage conventions và UI shell.
- **Priority:** `P3`

## 4. Suggested Roadmap | Lộ trình đề xuất

### Quick Wins
- Ignore modes for Code Compare
- Unified diff / patch export
- Auto-detect language and format on paste
- Formatter warning panel
- JSONPath query panel
- JSON Schema validation
- Capture groups explorer
- Replacement preview
- JWT inspector
- Hash generation utility
- HTML entity and Unicode escape toolkit
- Dataset templates
- Deterministic seed control
- MIME-aware sample generators
- Shared import / export utilities
- Local-only privacy messaging

### Mid-Term
- File and folder upload compare
- Shareable compare session
- Framework snippet presets
- Safe fallback formatter flow
- JSON diff and merge
- Flatten / unflatten transformer
- JSON to type generator
- Regex explanation view
- Language snippet generator
- Session history and share link
- Line-based batch encode/decode
- Binary / hex / text converter
- Multi-file zip export
- Recent history and saved sessions
- Shared URL state for small sessions

### Strategic Differentiators
- Three-way compare and merge assist
- Batch formatting workspace
- Regex performance warning
- Image and document metadata controls
- Preset library across tools

## 5. Delivery Notes | Ghi chú triển khai

- Mọi tính năng mới nên giữ metadata route, menu labeling, và trải nghiệm nhất quán với app hiện tại.
- Các tính năng dùng `window`, `document`, `localStorage`, `sessionStorage`, clipboard, `FileReader`, hoặc Web Crypto phải được guard để không làm hỏng SSR/prerender.
- Khi có nhiều tính năng mới trong cùng một tool, nên ưu tiên utility chung và state model rõ ràng trước khi mở rộng UI phức tạp.
- Nếu triển khai dần, nên cập nhật lại backlog này sau mỗi pha để phản ánh đúng bề mặt sản phẩm thực tế.
