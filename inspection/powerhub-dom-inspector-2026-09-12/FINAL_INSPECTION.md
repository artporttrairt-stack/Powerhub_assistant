# FINAL INSPECTION — PowerHub Assistant / PowerSchool Quick Message

Ngày tổng hợp: 12/09/2026  
Web được kiểm tra: `https://vas.educator.powerschool.com/`  
Source được đối chiếu: `D:\Powerhub_assistant\pilot-v1.9.0`  
Phiên bản trong source: `1.9.6` / `1.9.6-pilot.7`

## 1. Kết luận điều hành

Extension có nền tảng kỹ thuật phù hợp để tiếp tục phát triển: kiến trúc tách module, không có runtime dependency, giới hạn quyền hẹp, giữ tên gốc tách khỏi tên hiển thị và dùng hành động native của PowerSchool cho các thao tác nhạy cảm.

Kết quả kiểm tra source hiện tại:

- `npm test`: **192 passed, 0 failed, 0 skipped**.
- `npm run check`: đạt kiểm tra cú pháp, thứ tự nạp manifest, file tham chiếu, quyền và ranh giới không tự thao tác trong walkthrough.
- `node --check content.js`: đạt.
- Manifest chỉ dùng `storage`, `notifications` và host `https://vas.educator.powerschool.com/*`.

Kết quả live quan trọng nhất đối với Group chat:

- Tab **Students** đã được chọn.
- PowerSchool native hiển thị **5 người mỗi trang**: `1-5 of 22 results`.
- Chuyển sang trang 2 cho kết quả `6-10 of 22 results`, sau đó đã quay lại trang 1.
- Không có native page-size selector để đổi từ 5 lên 10.
- Extension đã trang trí row nhưng phần tổng hợp nhiều trang chưa được kích hoạt: `aggregateRows = 0`.
- Không chọn người nhận nào: `0 selected`.
- Hộp thoại Group chat đã được đóng sau khi inspect; không tạo chat và không gửi tin nhắn.

**Quyết định hiện tại:**

- Có thể mở rộng thành danh sách logic 10 tên.
- Không nên phát hành phần 10 tên bằng cách chỉ tăng CSS hoặc sao chép 5 row native.
- Cần sửa bước nhận diện source pane, hoàn thiện cả thêm và bỏ chọn, sau đó kiểm thử live có thể đảo ngược.
- Thay đổi này không cần sửa quy tắc đặt tên và không được phép dùng tên hiển thị làm identity.

## 2. Phạm vi và mức độ bằng chứng

Báo cáo phân biệt ba mức:

| Mức | Ý nghĩa |
| --- | --- |
| Xác nhận live | Đã quan sát trực tiếp trong phiên PowerHub đang đăng nhập |
| Xác nhận tự động | Đã chạy bằng Node/jsdom hoặc script kiểm tra source |
| Có trong source | Mã đã tồn tại nhưng chưa đủ bằng chứng live trên extension đang nạp |

Phiên inspect chỉ đại diện cho:

- Một tài khoản đang đăng nhập.
- Viewport desktop.
- Những module và trạng thái UI đã được mở trong phạm vi an toàn.
- DOM frontend, không phải quyền backend hoặc hợp đồng API.

Không thực hiện:

- Send message, Create chat, Publish, Save hoặc Generate.
- Chọn người nhận thật.
- Đổi setting PowerSchool.
- Đọc cookie, token, credential hoặc raw nội dung hội thoại.
- Kiểm thử tất cả tài khoản, trường, locale, role hoặc thiết bị.

## 3. Kiến trúc frontend PowerHub đã quan sát

PowerHub là SPA gồm app shell và nhiều remote frontend module. DOM có `dynamic-component[data-remote-url][data-remote][data-module]`; một số module dùng open Shadow DOM.

| Vùng | Kiểu hiển thị | Remote module quan sát |
| --- | --- | --- |
| App shell | Header và navigation | dashboard |
| Newsfeed | Route `/`, editor phủ trang | post-newsfeed |
| Messaging | Overlay, URL nền có thể không đổi | messenger-inbox |
| Directory | Route `/directory` | directory |
| Groups | Route `/groups`, detail overlay | group-mgmt |
| PowerBuddy | Route `/powerbuddytools`, open Shadow DOM | pb-prompt-bank-ui |
| Observations | Route `/observations` | student-observations |
| Applications | Drawer | applicationmenu |
| Communication preferences | Overlay | communication-preference |

Hệ quả cho extension:

- Không được suy luận context chỉ từ URL.
- Selector phải scope vào module/dialog hiện hành.
- MutationObserver phải idempotent vì SPA tái sử dụng row và thay text node.
- Có kích thước khác 0 chưa đủ chứng minh control không bị overlay che hoặc có thể click.
- Generated ID/index và ID có `null` không được dùng làm định danh ổn định.

## 4. Các vùng PowerHub đã inspect

### 4.1 Newsfeed

Đã xác nhận live:

- Search, filter và New post.
- Audience picker với To groups và các loại Students/Guardians/Staff.
- Title, rich-text body, notification option, translation option.
- Event và Appointment sign-ups.
- Draft, Preview và Discard controls.
- Editor hiện dùng SunEditor (`.sun-editor-editable`), không phải CKEditor.

Đã đọc cấu trúc Event gồm location, date, start/end time, all-day và repeat Daily/Weekly/Monthly/Yearly. Đã đọc Appointment gồm available spots, duration, break, location, avoid conflicts, Add dates và preview slots. Chỉ thay đổi trạng thái form chưa lưu để đọc cấu trúc; không lưu/publish.

### 4.2 Messaging

Đã xác nhận live:

- Conversation list, search, New message và Messaging tools.
- Classes, Direct messages và Groups accordions.
- Recipient searchbox, composer contenteditable, Send và attach file.
- Set availability với cấu trúc ngày/giờ; đã Cancel mà không lưu.
- Class group có Students, Guardians và Everyone.
- Create group chat có filter Students/Guardians/Staff, bảng chọn người, selected pane và pagination.

### 4.3 Directory

- People/Departments là radio-style switch, không phải tab thực.
- People có Students/Guardians/Staff và ô Name.
- Departments có bảng ba cột và empty state.
- Không thực hiện tìm kiếm tên cá nhân.

### 4.4 Groups

- Danh sách Group name/Category/Owner/Actions.
- Detail thành viên có Name/Grade/School/Role.
- Detail là overlay; link navigation phía sau có thể còn trong DOM nhưng không phải target tương tác hiện hành.

### 4.5 PowerBuddy

- Catalog có 32 tool trong open Shadow DOM.
- Đã mở cấu trúc một tool gồm topic, attachment, learning standards/objective, grade level, text length, Generate, Copy và Cancel.
- Không upload hoặc Generate.

### 4.6 Observations

- Đã inspect empty state và form mới.
- Có participant type, class, student, date/time, location, title, description, remediation và comments.
- Class picker quan sát được 10 lựa chọn trong tài khoản này; đây không phải giới hạn sản phẩm.
- Không Save draft hoặc Save and refer.

## 5. Kiến trúc extension hiện tại

| Thành phần | Trách nhiệm |
| --- | --- |
| `identity.js` | Tên native/display, stable identity, nickname và migration helpers |
| `hub-ui-adapter.js` | Locator tập trung, uniqueness, visibility, context và completion state |
| `guide-registry.js` | Step, nguồn, rủi ro và trạng thái verification |
| `walkthrough.js` | Engine hướng dẫn, bounded wait và progress theo tab |
| `context-help.js` | Help theo trang và entry point từ popup |
| `content.js` | Tên/lớp/account scan, Quick Message, Group chat và notification scan |
| `background.js` | Notification và storage/progress message được validate |
| `popup.*`, `guide.css` | Setting và giao diện hướng dẫn |

Module extension chạy trong isolated world; không thay thế API global của trang và không dùng bundler.

## 6. Những khả năng extension đang có

### 6.1 Quick Message trực tiếp

Khả năng:

- Thêm người nhận bằng nút `+` riêng của extension.
- Tìm theo tên gốc PowerSchool, không dùng nickname/tên đã đảo làm query identity.
- Chỉ tự đi tiếp khi tìm thấy đúng tên gốc và đúng vai trò duy nhất.
- Nếu full name không có candidate, thử tối đa ba từ Unicode giữ nguyên từ tên gốc.
- Kết quả fallback vẫn phải có đúng full original name và role; extension chỉ highlight để giáo viên chọn native.
- Giữ query khi không xác nhận được và không ghi đè input giáo viên vừa sửa.
- Chỉ đổi `+` thành `−` sau khi thấy native recipient chip có remove control.
- Chỉ trả về `+` sau khi chip thực sự biến mất.
- Không tự nhấn Send.

Giới hạn:

- Một trang kết quả một phần không chứng minh uniqueness toàn hệ thống.
- Kết quả khác role, thiếu role, ambiguous hoặc unavailable phải fail closed.
- Guided fallback của build cài trong browser vẫn cần reload và kiểm thử lại live.

### 6.2 Quy tắc hiển thị tên và nickname

Khả năng:

- Auto áp dụng quy tắc tương thích hiện có cho Student, Guardian và Staff.
- Native giữ nguyên thứ tự PowerSchool.
- Nickname chỉ thay display; tên native vẫn được giữ riêng.
- Unicode và dấu tiếng Việt được giữ.
- Rescan luôn bắt đầu từ tên native đã lưu, tránh đảo tên lặp nhiều lần.
- Có identity key gồm school scope/role/native ID khi có bằng chứng xác minh.
- Khi không có stable ID, fallback dùng exact native name + role + relationship trong phiên và fail closed khi xung đột.

Không được làm:

- Không dùng tên hiển thị/nickname làm recipient identity.
- Không tự hợp nhất hai người chỉ vì cùng tên.
- Không chạy migration nickname từ roster chưa đầy đủ.

### 6.3 Định dạng tên lớp

Khả năng của source 1.9.6:

- Chuyển standalone label thành `<class code> - <subject> - <schedule>`.
- Giữ period range, program CAP/CAPI/CEP và Unicode.
- Hỗ trợ nhiều schedule và giữ day list theo từng period.
- Giữ label gốc trong metadata/tooltip.
- Không format person name, role metadata, editor, input, danh sách nhiều lớp hoặc chuỗi malformed/ambiguous.
- Tái xử lý đúng khi SPA recycle row và native text đổi.

Ví dụ mục tiêu:

`English (Tiếng Anh) - P1(Mon-Tue,Fri),P2(Mon-Tue) - … (2L3A)`

→ `2L3A - English - P1(Mon-Tue,Fri), P2(Mon-Tue)`

Bằng chứng live trước đó thấy 8/10 class rows được format và hai row nhiều schedule chưa được format. Điều này chứng minh build đang chạy lúc inspect chưa thể được coi là source 1.9.6 đã reload. Parser mới đã vượt automated tests, nhưng đúng class 2L3A vẫn cần xác nhận trên build được nạp lại.

### 6.4 Group chat trong Class group

Khả năng hiện có trong source:

- Nhận diện member row và giữ account identity.
- Trang trí tên bằng cùng `accountDisplayName()` như các vùng khác.
- Tìm result status và pagination.
- Có cơ chế crawl các trang native, gom record và dựng aggregate list.
- Record key ưu tiên stable identity; fallback bao gồm role, original name và relationship.
- Khi bấm custom add, quay về đúng native page và tìm đúng native row trước khi click.
- Có kiểm tra selection confirmation trước khi báo thành công.

Trạng thái live:

| Quan sát | Kết quả |
| --- | --- |
| Tab class group | Students selected |
| Native page 1 | `1-5 of 22 results` |
| Native page 2 | `6-10 of 22 results` |
| Số row native/trang | 5 |
| Page-size control | Không có |
| Aggregate rows | 0 |
| Selected | 0 |
| Dialog sau inspect | Đã đóng |

Chẩn đoán:

- Mã chỉ gọi aggregation khi tìm được `sourcePane` và `memberList`.
- Live DOM đã tìm được các row/list, nhưng chưa tạo `psqm-group-chat-source-pane`, `psqm-group-chat-columns` hoặc aggregate list.
- Điểm nghẽn nằm trước `ensureExpandedGroupChatResults`: nhận diện selected/source branch hoặc common ancestor không hoàn tất trên DOM thực tế.

### 6.5 Help và walkthrough

Khả năng:

- Help ngắn theo context và có thể đóng.
- Newsfeed walkthrough 9 bước: mục đích → Newsfeed → New post → title → body → audience → Preview → review → Post handoff.
- Show me chỉ cuộn sau thao tác giáo viên; highlight không bắt pointer.
- Pause/Minimize/Resume và progress theo tab.
- Message overlay tạm dừng Newsfeed guide thay vì tiến sai bước.
- Audience yêu cầu cả To group và recipient category, cộng explicit teacher review.
- Preview review token bị vô hiệu khi edit/re-preview/restore.
- Bước cuối chỉ handoff đến native Post; không khẳng định post thành công.

Chưa bật:

- Parent messaging walkthrough.
- Directory walkthrough.
- Calendar walkthrough.
- School SOP/resource links chưa được cung cấp/xác minh.

### 6.6 Notification và setting

- Unread notification chỉ dùng tổng số, không đưa nội dung message vào notification storage.
- Notification có thể mở tab PowerSchool hiện có.
- Popup có bật/tắt notification, Help, walkthrough và name mode.
- Storage schema giữ legacy nickname data; không tự xóa dữ liệu cũ.

## 7. Khả năng mở rộng lên 10 tên trong Group chat

### 7.1 Có thể làm được không?

**Có.** PowerSchool native chỉ render 5 người/trang, vì vậy extension phải tạo một lớp trình bày logic 10 người hoặc aggregate toàn bộ kết quả. Không có native setting để đổi page size.

### 7.2 Cách triển khai an toàn được khuyến nghị

1. Scope duy nhất trong Create group chat dialog đang active.
2. Nhận diện source pane từ bảng native + result status + pagination, không phụ thuộc duy nhất vào selected pane.
3. Crawl tối đa số trang được status xác nhận và luôn trở lại trang ban đầu.
4. Dedupe bằng stable record key; không dedupe bằng display text.
5. Hiển thị 10 record mỗi logical page, có sticky summary và internal scroll.
6. Giữ native list trong DOM; chỉ collapse bằng class khi aggregate đã hoàn tất.
7. Mỗi `+`/`−` phải resolve lại native page/row/control ngay trước thao tác.
8. Chỉ cập nhật custom state sau khi selected pane xác nhận đúng identity.
9. Search/filter/class/tab/dialog close phải hủy state cũ và scan lại idempotently.
10. Trên viewport thấp, vẫn load 10 record nhưng cho cuộn thay vì ép 10 row hiển thị đồng thời.

### 7.3 Vì sao không chỉ tăng chiều cao?

Trong phiên inspect:

- Modal cao khoảng 690 px, đã gần giới hạn `96vh` của viewport.
- Vùng list hiện khoảng 240 px.
- Mỗi row khoảng 36–38 px.
- 10 row cần khoảng 360–410 px chưa tính toolbar, header và selected pane.

Tăng CSS đơn thuần dễ làm footer hoặc selected pane bị khuất trên màn hình thấp. Thiết kế đúng là 10 record trong vùng cuộn có chiều cao đáp ứng viewport.

### 7.4 Rủi ro cần xử lý trước phát hành

| Rủi ro | Hậu quả | Biện pháp |
| --- | --- | --- |
| Không tìm được source pane | Aggregate không xuất hiện | Fallback từ native table/status/pager |
| Clone row native | Mất event handler, stale state | Không clone; resolve và click native control |
| Chỉ hỗ trợ add | Không bỏ chọn từ custom list | Xây toggle `+ ↔ −` đối xứng |
| Trùng tên cùng role | Chọn nhầm người | Stable ID/contact/class; ambiguous thì fail closed |
| SPA rerender | Row/control cũ mất kết nối | Resolve lại trước mỗi thao tác |
| Search/filter đổi | Aggregate cũ sai dữ liệu | Reset generation/state |
| Modal thấp | Footer bị khuất | Internal scroll + responsive height |
| Extension chạy hai bản | Inject trùng và event kép | Chỉ bật một bản extension |

### 7.5 Ảnh hưởng tới quy tắc đặt tên

Không ảnh hưởng nếu giữ các ranh giới hiện tại:

- `record.account.name`: tên gốc dùng làm identity.
- `accountDisplayName(record.account)`: chỉ dùng render.
- `record.key`: dùng tìm đúng native row.
- `classGroupNameParts()`: parser nhãn lớp độc lập với số row Group chat.

Không được sửa `studentDisplayName`, `guardianDisplayName`, `staffDisplayName`, `accountDisplayName`, `sameOriginalRecipientName` hoặc identity key chỉ để triển khai 10 row.

## 8. Ma trận mức sẵn sàng

| Khả năng | Trạng thái | Nhận xét |
| --- | --- | --- |
| Name display Student/Guardian/Staff | Automated verified | Cần live reload acceptance cho build hiện tại |
| Native name mode | Automated verified | Fallback an toàn |
| Local student nickname | Automated verified | Same-name legacy limitation nếu chưa có stable ID |
| Direct Quick Message `+`/`−` | Automated + một phần live | Installed fallback build cần retest |
| Multi-schedule class label | Automated verified | Exact 2L3A live pending |
| Newsfeed Help/walkthrough | Automated + bounded live evidence | Post success không được extension xác nhận |
| Unread notification | Automated with mocked Chrome API | Service-worker/browser lifetime cần live matrix |
| Group chat native 5/page | Live verified | PowerSchool behavior hiện tại |
| Group chat aggregate/all pages | Có trong source, live chưa kích hoạt | Chưa đủ điều kiện phát hành |
| Group chat logical 10/page | Khả thi | Cần triển khai và acceptance mới |
| Directory/Calendar/Parent guides | Disabled/pending | Không nên quảng bá là đã có |
| Tương thích mọi tài khoản | Chưa chứng minh | Cần role/account/context matrix |

## 9. Khả năng tương thích nhiều tài khoản

Extension có các đặc điểm hỗ trợ tính linh hoạt:

- Unicode-aware và không giả định tên phương Tây trong identity storage.
- Selector chức năng/semantic được ưu tiên hơn index.
- Không thêm runtime dependency.
- Minimum Chrome 102.
- Host permission chỉ cho VAS PowerSchool.
- Feature có rollback bằng popup/developer flags.
- Malformed/ambiguous input được giữ nguyên hoặc fail closed.

Tuy nhiên không thể tuyên bố “không lỗi với tất cả tài khoản” từ một phiên inspect. Cần ít nhất ma trận:

- Teacher có/không có Group chat.
- Nhiều school context.
- Class ít hơn 5, đúng 5, 6–10, trên 10 và nhiều trang.
- Student/Guardian/Staff/Everyone.
- Tên trùng, Unicode, annotation và name order khác nhau.
- English/Vietnamese locale.
- Desktop rộng, laptop thấp và mobile/narrow modal.
- Mạng chậm, pagination delayed, SPA rerender và reconnect.

## 10. Privacy và security boundary

- Không lưu message body, post body, recipient list, token hoặc credential.
- Walkthrough progress chỉ gồm guide/step/status/timestamp theo tab.
- Nickname lưu local qua `chrome.storage`.
- Notification dùng count, không dùng nội dung nhạy cảm.
- Extension không bypass authentication hoặc giả lập hoạt động để giữ session.
- Walkthrough không có API auto-click/fill/submit/publish.
- Quick Message chỉ kích hoạt native selection sau yêu cầu trực tiếp của người dùng; Send vẫn native.

Artifact inspect là bản tổng hợp đã giảm dữ liệu. Không nên chia sẻ raw DOM, network response hoặc screenshot có tên người dùng nếu chưa làm sạch.

## 11. Các vấn đề frontend đáng chú ý

- Một số ID Newsfeed lặp giữa vùng nền/editor; selector toàn document có thể chọn nhầm.
- Resource link có tooltip target ID lặp.
- PowerBuddy có SVG ID lặp trong shadow root; không dùng SVG ID làm tool identity.
- Directory từng hiển thị `None None None`; chưa xác định nguyên nhân backend.
- Group member popover có cảnh báo Neon về header/ID; chưa chứng minh gây lỗi thao tác.
- Event Weekly có ID `null` ở trạng thái tải trung gian rồi ổn định; phải chờ loaded state.
- Appointment review dùng accessible name “Utility” cho edit/delete; không đủ rõ cho guide nếu không scope thêm.
- `Trying to connect…` là cảnh báo realtime, không phải bằng chứng logout.

## 12. Acceptance bắt buộc trước khi phát hành Group chat 10 tên

1. Reload đúng source `1.9.6` hoặc build mới và thêm version marker chẩn đoán không chứa dữ liệu cá nhân.
2. Xác nhận 10 unique records ở logical page 1, 10 ở page 2 và phần dư ở page cuối.
3. Xác nhận original names/roles/contact metadata không đổi sau render.
4. Chọn đúng một member: `0 selected → 1 selected`, `+ → −`.
5. Bỏ ngay member đó: `1 selected → 0 selected`, `− → +`.
6. Kiểm tra cùng tên khác role và cùng tên cùng role; ambiguous phải không tự chọn.
7. Kiểm tra Students/Guardians/Staff/Everyone, Search và Add all.
8. Kiểm tra selection tồn tại khi đổi logical page và native page.
9. Kiểm tra Cancel, đóng/reopen dialog và SPA navigation không để state/list cũ.
10. Kiểm tra footer/Create chat vẫn nhìn thấy ở viewport thấp; không tạo chat trong acceptance nếu chưa được cho phép riêng.
11. Theo dõi console/page errors trong suốt luồng.
12. Chỉ sau live acceptance mới package và ghi release status.

## 13. Trạng thái working tree

Source Git hiện có thay đổi chưa commit trong nhiều file và một số file mới. Đây là trạng thái đã tồn tại trong workspace trong lúc tổng hợp; báo cáo không tự động coi commit `9c24509` là toàn bộ source hiện tại.

Báo cáo này không sửa source extension. File mới duy nhất của bước tổng hợp là `FINAL_INSPECTION.md`.

## 14. Kết luận cuối

PowerHub Assistant hiện làm tốt nhất ở vai trò **augmentation an toàn**:

- Cải thiện hiển thị tên/lớp mà giữ identity gốc.
- Hỗ trợ Quick Message nhưng dựa vào native confirmation.
- Hướng dẫn Newsfeed mà không tự publish.
- Giữ dữ liệu nhạy cảm ngoài progress/notification.
- Có thể mở rộng Group chat lên 10 tên mà không phá quy tắc đặt tên.

Phần Group chat 10 tên là **khả thi về kỹ thuật nhưng chưa production-ready**. Trước khi phát hành, cần sửa pipeline nhận diện pane, hoàn thiện toggle add/remove, giữ native list làm nguồn sự thật và vượt qua acceptance live có thể đảo ngược.

## 15. Artifact liên quan

- `INSPECTION.md`: bản đồ frontend và selector live ban đầu.
- `CONTINUATION.md`: Event/Appointment và giới hạn cleanup theo lượt.
- `evidence-summary.json`: số đếm/surface/selector đã được chọn lọc.
- `event-appointment-evidence.json`: evidence bổ sung cho Event/Appointment.
- `verify-inspection.cjs`: verifier artifact/fixture.
- `D:\Powerhub_assistant\pilot-v1.9.0\docs\VERIFICATION.md`: verification history của pilot.
- `D:\Powerhub_assistant\pilot-v1.9.0\docs\ARCHITECTURE.md`: ranh giới module và identity.

