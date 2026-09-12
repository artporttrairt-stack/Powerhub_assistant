# PowerHub / PowerSchool — cấu trúc frontend đã kiểm tra

Ngày kiểm tra: 12/09/2026. Đích: https://vas.educator.powerschool.com/.

**Có lượt tiếp nối:** xem `CONTINUATION.md` và `event-appointment-evidence.json` cho Event/Appointment và trạng thái cleanup mới nhất. Các số đếm và trạng thái đóng form trong báo cáo này chỉ thuộc lượt đầu.

Đã dùng skill trong ZIP người dùng cung cấp, điều chỉnh phần đọc DOM cho đúng PowerSchool. Kết quả gồm **25 snapshot DOM (gồm 2 snapshot đang tải/chưa đủ phạm vi), 9 remote frontend module và 5 tuyến trang chính**. Đây là kiểm tra cấu trúc của **một phiên tài khoản đang đăng nhập**, không phải chứng nhận mọi tài khoản hay kiểm thử ghi dữ liệu end-to-end.

## 1. Skill đã được áp dụng thế nào

- Đã đọc đầy đủ `SKILL.md`, inspector, audit và loader trong ZIP. Sáu file gốc được giải nén nguyên trạng ở thư mục này; chưa cài skill toàn cục.
- Skill gốc nhắm SharePoint/Viva và chỉ liệt kê `*.sharepoint.com` / `*.vas.edu.vn`. Người dùng chỉ định PowerSchool, nên adapter chỉ cho hostname `vas.educator.powerschool.com`.
- Đã tái sử dụng cách query, serialize phần tử, cây DOM, hình chữ nhật và kiểm tra cấu trúc. Bổ sung quét open Shadow DOM dưới `dynamic-component`, đếm ID trùng theo từng root, tách rendered / inViewport và giảm dữ liệu trả về.
- Không chạy loader, highlight hoặc tour; không thêm script từ địa chỉ SharePoint cố định trong loader; không tạo biến toàn cục trong trang. Không lấy điểm audit SharePoint làm kết luận cho PowerSchool.
- Tài liệu ZIP ghi `PHInspector.audit()` nhưng module cung cấp `PHAudit.run()`. `extractTree` thực tế nhận `(rootSelector, depth)`, không chỉ `(depth)`.
- `powerschool-readonly.cjs` lưu hàm đọc được dùng cho các capture sau khi phát hiện Shadow DOM. Dùng qua browser evaluator được cho phép; đây không phải bookmarklet tự cài hay bản thay thế extension.

## 2. Bản đồ frontend

DOM có `dynamic-component[data-remote-url][data-remote][data-module]`; các script `remoteEntry.js` và các thuộc tính đó là bằng chứng cho cấu trúc frontend chia module. Các bản Neon trong bảng là quan sát tại thời điểm kiểm tra, không phải hợp đồng tương thích lâu dài.

| Vùng | Tuyến / kiểu hiển thị | Module | Neon quan sát |
|---|---|---|---|
| Khung ứng dụng | Header, điều hướng, `main#app-shell_main-injection-point` | dashboard | 4.4.0 |
| Newsfeed | `/`, bài viết và editor phủ trang | post-newsfeed | 4.4.0 |
| Directory | `/directory`, People / Departments | directory | 4.1.0 |
| Groups | `/groups`, danh sách / chi tiết thành viên | group-mgmt | 2.23.0 |
| PowerBuddy | `/powerbuddytools`, catalog / tool detail trong open Shadow DOM | pb-prompt-bank-ui | 4.1.0 |
| Observations | `/observations`, danh sách / form chi tiết | student-observations | 2.20.1 |
| Messaging | Overlay; URL trang nền không đổi | messenger-inbox | 4.3.0 |
| Applications | Drawer | applicationmenu | 4.3.0 |
| Communication preferences | Overlay; URL trang nền không đổi | communication-preference | 4.0.0 |

Danh sách URL module chính xác nằm trong `evidence-summary.json`. Ví dụ trên Newsfeed: dashboard xuất `./header` và `./dashboard-app`, newsfeed xuất `./post-newsfeed-app`.

Giới hạn lưu bằng chứng: JSON hiện giữ danh sách tổng hợp URL và phiên bản, chưa lưu đủ inventory từng module/root để tái tạo độc lập toàn bộ cột Neon trong bảng. Các cặp trong bảng dựa trên quan sát theo màn hình ở phiên inspect; nên bổ sung `dynamic-component` attributes và tag inventory theo module khi có kết nối lại, không coi bảng này là phân tích dependency từ source/bundle.

## 3. Các vùng đã đọc trực tiếp

### Khung trang và menu

Điều hướng có Newsfeed, Directory, Groups, PowerBuddy tools, Observations và Resource links. Menu tài khoản có Help center, Language & locale settings, Communication preferences và Sign out. Đã mở rồi đóng dialog ngôn ngữ, preferences và application drawer; không đổi lựa chọn hoặc lưu cài đặt.

Resource links có ba liên kết: thư viện VAS, VAS Parent Tech Portal và VAS Technology Hub. Không đi sang các website đó. Applications hiển thị MyPowerHub Educator và PowerSchool SIS; không chuyển ứng dụng. Nút chuyển school context có `aria-haspopup=listbox`, không disabled, nhưng một lần click không mở danh sách; chưa xác minh khả năng đổi trường của tài khoản này.

### Newsfeed

Đã quan sát bài viết, ô tìm kiếm, bộ lọc và mở một editor mới trống. Editor có audience picker, ba loại người nhận, tiêu đề, rich text, dịch, tùy chọn thông báo, Event / Appointment sign-ups và các nút Discard / Draft / Preview.

**Editor hiện tại có class `sun-editor-editable` và toolbar `button.se-btn[data-command]`**: đây là bằng chứng DOM của SunEditor, không phải selector CKEditor/SharePoint trong ZIP. Đã thấy command table, link, image, video, audio và showBlocks; chưa kiểm thử chèn nội dung hoặc upload.

Audience picker có 11 checkbox và 11 node role option tương ứng, không phải 22 lựa chọn khác nhau. Không chọn audience. Đã đóng picker, Discard và xác nhận bỏ đúng bài mới trống vừa mở; không mở hay xóa bản nháp có sẵn.

### Directory

People / Departments là radio, không phải các node có role tab. People có Students / Guardians / Staff và ô Name. Trạng thái ban đầu yêu cầu nhập tìm kiếm; không tìm tên cá nhân. Departments có bảng ba cột và empty state. Chuỗi `None None None` xuất hiện trên giao diện, được ghi nhận là vấn đề trình bày dữ liệu, chưa xác định nguyên nhân backend.

### Groups

Danh sách có Group name / Category / Owner / Actions. Đã mở chi tiết một nhóm có sẵn và quay lại; không mở New group hoặc đổi thành viên. Chi tiết có bảng Name / Grade / School / Role; tên cá nhân không lưu trong báo cáo.

Chi tiết nhóm phủ lên navigation. Link nền vẫn có trong DOM nhưng click không chuyển trang khi overlay còn mở. Phải dùng nút Back của detail rồi chờ panel đóng trước khi điều hướng tiếp.

Console có thông báo Neon 2.23.0 về popover thiếu `h2[data-slot="popper-header"]` và ID nút thành viên không hợp lệ. Đã thấy danh sách thành viên hoạt động; chưa chứng minh các thông báo này gây lỗi thao tác. Không giữ ID người dùng trong báo cáo.

### PowerBuddy

Catalog có 32 tool, search, Favorites và 32 checkbox đánh dấu yêu thích. Inspector chỉ đọc document ban đầu thấy 0 tool: đó là thiếu phạm vi quét, **không phải trang không tải được**. Sau khi đi vào open shadow root của div dưới `dynamic-component`, thấy đầy đủ 32 nút tool.

Đã mở Academic content: mô tả nhu cầu, đính kèm, learning standards/objective, grade level, text length, Generate, Copy và Cancel. Không nhập, upload, đánh dấu favorite hoặc Generate. Catalog vẫn còn phía sau detail, nên số control không đồng nghĩa số control thao tác được.

### Observations

Danh sách hiện empty state. Đã mở form mới: participant type, class filter, student selector, date/time, timeframe/location, title, description, remediation và comments. Class picker có 10 checkbox lớp. Không chọn học sinh hay nhập dữ liệu.

Cancel yêu cầu xác nhận bỏ thay đổi ngay cả với form mới không nhập gì. Đã bỏ đúng form vừa mở. Không nhấn Save draft hoặc Save and refer. Việc hỏi xác nhận chưa chứng minh có thay đổi phía server.

### Messaging

Overlay có Conversation list, search, New message, Messaging tools và ba accordion Classes / Direct messages / Groups. Có Show more / Show all; không coi phần danh sách đang tải là toàn bộ tài khoản.

Đã mở composer mới trống: searchbox người nhận, gợi ý ban đầu, contenteditable, Send và attach file. Không chọn người nhận, nhập nội dung hoặc gửi. Nút Back của channel có trong DOM nhưng bị ẩn tại viewport desktop; đã dùng nút Back của overlay để thoát.

Đã mở Classes rồi đóng lại mà không mở kênh hội thoại; mở Set availability để đọc cấu trúc ngày trong tuần / giờ bắt đầu / giờ kết thúc, sau đó Cancel. Không đổi availability, nickname hoặc tùy chọn thông báo.

## 4. Selector quan trọng

Các selector sau được quan sát trực tiếp. Cần kiểm tra scope, số match và trạng thái overlay trước mỗi thao tác; không coi ID luôn duy nhất. Bằng chứng đếm match nằm trong JSON.

| Mục đích | Selector / scope |
|---|---|
| Khung nội dung | `#app-shell_main-injection-point` |
| Newsfeed editor | `#compose-view-layout` |
| Audience trigger | `#multi-select-complex-1-main-button` |
| Audience listbox | `#multi-select-complex-1-item-picker-item-picker` |
| Tiêu đề bài | `#input-field-compose_title` |
| Nội dung bài | `#compose-view-layout .sun-editor-editable[contenteditable="true"]` |
| Directory People | `#directory-tab-menu-tab-people-tab` |
| Directory Departments | `#directory-tab-menu-tab-departments-tab` |
| Directory Name | `#input-field-mfe-directory-text-name` |
| Back chi tiết nhóm | `#button-layout-detail-back-button-group-members-list-view` |
| PowerBuddy search | `#pb_prompt_bank_uitool-searchsearch-input` trong shadow root |
| PowerBuddy tools | `button[id^="prompt-tile-"][id$="-button"]` trong shadow root |
| Observation form | `#mfe-student-observations-form-detail-layout` |
| Observation class filter | `#mfe-student-observations-form-course-section-main-button` |
| Messaging overlay | `#header-messenger-inbox-layout` |
| Recipient search | `#recipient-search-input` |
| Message content | `#messenger-inbox-message-input-text-field` |
| Classes accordion | `#messenger-inbox__conversation-list-classes-accordion-toggle` |
| Class row button | `.messenger-inbox__messenger-channel-preview__button` trong classes accordion content; `data-testid="messenger-channel-preview"` |
| Availability cancel | `#button-messenger-inbox__teacher-availability-cancel-button` |

`#directory-tabs` đã được thử và có 0 match: đó là accessible label, không phải ID. `#button-layout-detail-back-button-null` được dùng ở nhiều loại overlay; phải scope vào overlay hiện tại. ID chứa index hoặc record ID không phải danh tính ổn định có thể hard-code cho mọi tài khoản.

## 5. Phát hiện liên quan extension

Trong 10 class row đã xem ở Messaging, 8 row có `data-psqm-group-name` và `data-psqm-group-display`, đồng thời chữ hiển thị khác tên gốc. Hai row còn lại có nhiều cụm lịch dạng `)...,P...(` và không có các thuộc tính chuyển đổi. Không lưu tên giáo viên hoặc nhãn lớp đầy đủ.

Đây là bằng chứng live rằng **dạng lịch nhiều cụm vẫn bị bỏ qua trong phiên extension hiện đang chạy**. Không suy ra mã lớp là nguyên nhân; cũng không coi đây là xác minh bản pilot 1.9.6 đã nạp, vì chưa kiểm tra phiên bản extension được trình duyệt nạp. Tài khoản được quan sát không cung cấp bằng chứng live cho đúng lớp 2L3A mà người dùng nêu.

Hệ quả triển khai:

1. Parse nhiều cụm lịch; giữ tên gốc riêng, chỉ đổi display và có fallback khi không nhận dạng chắc chắn.
2. Không gắn selector với một phiên bản Neon. Dùng scope module, ID chức năng và role thực tế.
3. Quét đúng open shadow root; không đồng nhất shadow root của extension bên thứ ba với module PowerSchool.
4. Observer cần idempotent, không xử lý lại toàn bộ document cho mỗi mutation, và chịu được node SPA tái sử dụng.
5. Chờ module/dialog tải hoặc đóng; có DOM/rect khác 0 không đủ để kết luận click được.
6. Kiểm tra một tài khoản không cho phép hứa “không lỗi với tất cả tài khoản”. Cần ma trận role, school context, lịch, locale, account switch và bản extension thực sự được nạp.

Không thay đổi mã extension trong lượt áp dụng skill này.

## 6. Audit: dữ kiện và giới hạn

- Newsfeed có ID nút lặp 3 lần; mở editor còn tạo 2 ID Draft trùng. Selector toàn document có thể chọn nhầm vùng nền.
- Resource links có `undefined-tooltip-target` lặp 3 lần.
- PowerBuddy có bốn ID SVG trái tim lặp 32 lần trong cùng shadow root; không nhầm chúng với ID nút tool.
- Language dialog có một ảnh thiếu thuộc tính alt; class picker Observation có một heading trống nhưng có kích thước. Đây là ứng viên cần kiểm tra ngữ cảnh accessibility, chưa phải kết luận WCAG đầy đủ.
- `alt=""` có thể đúng với ảnh trang trí. Thiếu webpart SharePoint không phải lỗi trên PowerSchool. Không dùng điểm số tổng hợp của audit gốc.
- Adapter lưu cây nông (depth 2, tối đa 20 child/level) và tối đa 90 control. Inventory/control scan vào open module shadow roots; cây `children` vẫn là cây light DOM nông, không phải dump đầy đủ mọi root.
- Bộ lọc rendered chưa xét mọi tổ tiên, clip, overlay hay khả năng tương tác. Một số checkbox native đặt rất xa viewport nhưng label của nó vẫn hiện bình thường. Bounding box đơn thuần không xác định được UX.
- URL assets thu từ DOM cho biết script đã được nạp; không chứng minh module đó đang active. Thông tin Network/API response, quyền backend, schema dữ liệu hoặc luồng Save không được suy ra từ giao diện.
- Che dữ liệu của adapter chưa phải cơ chế anonymization tổng quát: title/navigation có thể chứa văn bản site cung cấp; ULID ngăn bởi underscore có thể không khớp regex. `personalText: omitted` trong output là mô tả mục tiêu giảm dữ liệu, không phải bảo đảm mọi chuỗi đều sạch. Chỉ artifact đã chọn lọc/kiểm tra thủ công được dùng để chia sẻ.
- Shadow traversal chỉ mở rộng đệ quy 12 root đầu dù có thể đã thu thêm root; tên root theo tag có thể trùng. Đây là hạn chế tổng quát, chưa có bằng chứng nó làm mất dữ liệu ở các capture live chỉ có một module shadow root.
- Adapter không báo đầy đủ truncation; scope không tìm thấy sẽ fallback về body, và sample mỗi selector tối đa 8 phần tử. Muốn dùng cho kiểm tra toàn diện cần lưu requested/resolved scope, total/sample counts, truncation flags và root identity rõ ràng.

## 7. Phạm vi chưa xác minh và trạng thái cuối

Chưa kiểm tra tài khoản khác, guardian/student/admin role, chuyển trường, màn hình mobile, closed shadow DOM, nội dung iframe, dữ liệu phía server, upload, Save/Publish/Send/Generate, các nhóm/công cụ chưa mở, appointment/event subforms và mọi trạng thái lỗi. Không đọc chi tiết các hội thoại riêng để phục vụ bản đồ cấu trúc.

Cuối lượt đã trở về Newsfeed `/`, không còn `#compose-view-layout` và không còn `[role="dialog"]`. Không reload hay đăng xuất. Hai form mới trống do lượt inspect mở đã được hủy; không xóa bản nháp hay bản ghi có sẵn. Các file ZIP gốc và source extension không bị sửa.

Các artifact trong thư mục này là dữ liệu cấu trúc đã được chọn lọc, không phải raw DOM hoặc log cuộc hội thoại. Không xuất tên người, địa chỉ liên hệ, record ID, nội dung post/message hoặc giá trị form.

## 8. Kiểm tra artifact

- `node --check`: cả 5 module JavaScript gốc và 2 file CJS đều hợp lệ về cú pháp; không thực thi loader/tour/highlight.
- `node verify-inspection.cjs`: fixture jsdom kiểm tra scope guard, đọc module Shadow DOM, bỏ qua shadow root extension không liên quan, đếm ID trùng theo từng root, lọc control hidden, che ID và không xuất sentinel text / giá trị form. DOM và các biến global của fixture không thay đổi.
- JSON nhất quán: 25 capture, 53 selector check, 9 module, 5 tuyến. Đây là các phép đếm trong artifact, không phải 53 bài kiểm thử end-to-end.
- Hàm adapter trên đĩa và hàm dùng trong phiên inspect có cùng fingerprint nội dung chuẩn hóa: length 3653, FNV-1a 1899049906. Fingerprint này chỉ để đối chiếu bản hàm, không phải bảo đảm mật mã.
- SHA-256 của cả sáu file gốc trùng với entry trong ZIP. Source extension không bị chỉnh trong lượt này; trạng thái Git vẫn là tập thay đổi có sẵn trước lượt áp dụng skill.
- Fixture không chứng minh khả năng tương thích mọi tài khoản, cũng không thay thế kiểm thử luồng gửi/lưu thực tế.
