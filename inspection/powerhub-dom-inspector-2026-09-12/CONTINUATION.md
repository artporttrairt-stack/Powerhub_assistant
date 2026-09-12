# Bổ sung inspect — Event và Appointment sign-ups

Ngày 12/09/2026. Đây là phần tiếp nối `INSPECTION.md`, không thay thế bằng chứng lần đầu.

## Trạng thái hiện tại

**Chưa hoàn thành toàn bộ mục tiêu.** Đã thêm 8 capture cấu trúc cho Event/Appointment. Kết nối điều khiển trình duyệt ngắt trước khi xác minh xong việc đóng bài thử. Lần đọc thành công cuối: bài soạn mới trống vẫn mở và đang hiện xác nhận **Discard**. Không nhấn Save draft, Save and continue hay Publish; không mở bản nháp có sẵn.

Đã yêu cầu người dùng kết nối lại tab PowerHub. Ưu tiên tiếp theo là xác minh/đóng đúng bài thử này trước khi đi sang Groups hoặc Directory. Không tự reload vì có thể mất trạng thái đang cần kiểm tra.

## Event: cấu trúc và chuyển trạng thái

`New post → Event → #calendar-event-view-layout → Repeat event → dialog recurrence`

Event có Location, Date, Start time, End time, All day và Repeat event. Date/start/end mang trạng thái required. Chưa kiểm tra validation bằng Save.

| Recurrence | Cấu trúc đã đọc |
|---|---|
| Daily | Start date, Every, End date |
| Weekly | Start date, Every, End date, 7 checkbox Sun–Sat |
| Monthly | Start date, Every, End date, radio ngày trong tháng hoặc thứ theo thứ tự |
| Yearly | Start date, End date, radio ngày hoặc thứ theo thứ tự |

Đã chọn các chế độ để đọc form, không lưu recurrence. Cancel đóng dialog và trả Repeat event về unchecked. Discard đóng Event, quay lại bài soạn.

Khi vừa chuyển Weekly, hai date field từng có ID `input-field-null` và hai nút calendar có `null-button`. Capture sau khi tải xong có các ID `...weekly-start-date` / `...weekly-end-date` rõ ràng. **Không coi ID trùng trong trạng thái trung gian này là lỗi ổn định.** Đây cũng là lý do không dùng snapshot ngay sau click làm bằng chứng form đã sẵn sàng.

## Appointment sign-ups: cấu trúc và hành vi thực tế

`New post → Appointment sign-ups → Add dates → hàng ngày/giờ → liên kết số slots → preview → Edit title`

- Form có title bắt buộc, available spots, duration giờ/phút, break giờ/phút, location, avoid conflicts và Add dates.
- **Add dates thêm một hàng trực tiếp trong form chưa lưu**, không mở dialog. Hàng có date/start/end, add/delete; preview ở lần này có hai slot. Số slot là kết quả của giá trị mặc định lúc kiểm tra, không phải giới hạn của sản phẩm.
- Liên kết số slot mở bảng “Review appointment time slots”. Mỗi row có edit/delete. Cả hai nút được expose tên accessible “Utility”; cần cải thiện hoặc kiểm tra ngữ cảnh khi xây hướng dẫn.
- **Edit mở ô Title inline, không phải editor thời gian**. Đã đọc rồi Cancel, không nhập title hay nhấn Save/Delete.
- Sau Add dates, card Appointment xuất hiện trong bài chưa lưu và nút Event bị disabled. Chỉ xác minh trạng thái UI này; chưa suy ra quy tắc backend rằng hai loại nội dung luôn loại trừ nhau.
- Save and continue bị disabled khi title trống, kể cả sau khi Add dates.
- Discard trong form Appointment cần xác nhận. Đã xác nhận, sau đó kiểm tra `appointmentOpen=false`, `localAppointmentCard=false`, `postEditorOpen=true`.

Việc Add dates/đổi recurrence là thay đổi trạng thái UI chưa lưu, vì vậy không mô tả lượt này là hoàn toàn không có DOM mutation. Không có thao tác lưu/gửi được thực hiện; chưa capture Network để chứng minh tuyệt đối không có request phụ hoặc autosave.

## Kết quả cleanup phải phân biệt theo lượt

| Kiểm tra | Kết quả được quan sát |
|---|---|
| Cancel recurrence | Dialog đóng; Repeat unchecked |
| Discard Event | Event đóng |
| Discard Appointment và xác nhận | Form đóng; card appointment biến mất |
| Discard bài mới | Hiện xác nhận Discard |
| Xác nhận cuối để đóng bài | Không xác minh được sau timeout và mất debugger |

`restoredState` trong `evidence-summary.json` là kết quả của lượt đầu đã kết thúc trước đó. Không được dùng nó để khẳng định tab đã sạch sau lượt Event/Appointment này.

## Phần vẫn cần tiếp tục

1. Kết nối lại tab và xác minh cleanup trước.
2. Groups: new-group form/các menu được phép xem, không lưu hoặc đổi thành viên.
3. Directory: role/filter/search loading, empty/result markup với dữ liệu tối thiểu; không mở rộng danh sách cá nhân không cần thiết.
4. Các công cụ PowerBuddy còn lại: nhóm theo form structure, không Generate/upload.
5. Responsive, focus/overlay/iframe boundaries và ma trận account/role vẫn chưa kiểm tra.
6. Luồng Save/Publish/Send/Generate, dữ liệu server và các account khác cần phạm vi kiểm thử/phiên phù hợp; không được suy ra từ DOM một tài khoản.

`event-appointment-evidence.json` lưu selector, transitions và trạng thái cuối theo bằng chứng. Không lưu tên người, giá trị form, nội dung tin nhắn/bài viết hoặc record ID.

## Rà soát chất lượng bằng chứng

Đã có một lượt review độc lập, chỉ đọc các artifact. Verifier cũ chạy thành công nhưng chỉ xác nhận fixture/JSON nhất quán, không phải kiểm chứng các thao tác live. Báo cáo gốc được làm rõ về 2 snapshot đang tải/chưa đủ phạm vi, phần ghép module–Neon chưa lưu inventory chi tiết và giới hạn che dữ liệu/truncation của adapter.

Các capture bổ sung có số control được đối chiếu lại với dữ liệu còn giữ trong phiên browser tool: 21, 28, 23, 22, 12, 20, 25, 26. Snapshot Weekly đầu là trạng thái trung gian; chỉ dùng snapshot `event-repeat-weekly-loaded` để lấy selector sau tải.
