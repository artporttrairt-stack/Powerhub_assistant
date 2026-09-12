# SKILL: PowerHub DOM Inspector

## Mục đích
Skill này cho phép agent tự động **inspect DOM** của trang PowerHub (SharePoint/Viva Connections),
trích xuất cấu trúc giao diện, highlight phần tử bằng hiệu ứng chớp sáng, cuộn đến đúng vị trí,
và tạo báo cáo UI audit — phục vụ hướng dẫn giáo viên dùng PowerHub.

---

## Khi nào dùng skill này
- User hỏi "inspect giao diện PowerHub"
- User muốn "highlight / chỉ chỗ cụ thể trên trang"
- User muốn "cuộn đến phần X của PowerHub"
- User muốn "audit toàn bộ cấu trúc trang"
- User muốn "tìm element theo text / selector"
- User muốn tạo hướng dẫn tương tác tự động cho giáo viên

---

## Files trong skill
| File | Mục đích |
|------|----------|
| `powerhub_inspector.js` | Engine chính: inspect, extract, query DOM |
| `powerhub_highlight.js` | Hiệu ứng flash, spotlight, scroll, tooltip |
| `powerhub_audit.js` | Audit toàn trang, xuất báo cáo JSON/HTML |
| `powerhub_loader.js` | Bookmarklet loader — inject tất cả vào trang |
| `powerhub_tour.js` | Guided tour: dẫn user qua từng bước tự động |

---

## Cách agent sử dụng

### Bước 1 — Inject vào trang PowerHub
```
Agent gọi: injectSkill(url_của_trang_powerhub)
→ Tự load powerhub_loader.js vào browser context
```

### Bước 2 — Chọn action
```
PHInspector.inspect(selector)      // Inspect 1 element
PHInspector.query(selector)        // Query nhiều element
PHInspector.findByText(text)       // Tìm theo nội dung chữ
PHInspector.extractTree(depth)     // Trích cây DOM (depth = 1–5)
PHInspector.audit()                // Audit toàn trang

PHHighlight.flash(selector)        // Chớp sáng element
PHHighlight.spotlight(selector)    // Làm tối xung quanh, sáng element
PHHighlight.scrollTo(selector)     // Cuộn + highlight
PHHighlight.tooltip(selector, msg) // Hiển thị tooltip hướng dẫn
PHHighlight.clear()                // Xóa toàn bộ hiệu ứng

PHTour.run(steps[])                // Chạy guided tour tự động
PHTour.stop()                      // Dừng tour
```

### Bước 3 — Nhận kết quả
Agent nhận kết quả dạng JSON:
```json
{
  "selector": ".sp-webpart-zone",
  "tag": "DIV",
  "text": "Teacher Hub",
  "attributes": { "class": "...", "data-automation-id": "..." },
  "children": 4,
  "visible": true,
  "rect": { "top": 120, "left": 0, "width": 1440, "height": 340 }
}
```

---

## PowerHub Selectors hay dùng
```
[data-automation-id="CanvasZone"]       Vùng nội dung chính
[data-automation-id="webPartTitle"]     Tiêu đề webpart
.ms-webpart-chrome                      Chrome webpart
.sp-page-layout                         Layout trang
.od-TopBar                              Top navigation bar
[role="navigation"]                     Nav menu
.ms-SearchBox                           Ô tìm kiếm
.ControlZone                            Control zone
[data-automation-id="pageHeader"]       Header trang
.ckeditor-sp-rte                        Rich text editor
.ms-FeedCard                            Feed card (news)
[data-sp-feature-tag*="webPart"]        Tất cả webpart
```

---

## Ràng buộc quan trọng
- Chỉ chạy trên domain `*.sharepoint.com` hoặc `*.vas.edu.vn`
- Không lưu trữ hoặc gửi dữ liệu ra ngoài tổ chức
- Không sửa đổi nội dung trang (read-only inspect)
- Cần quyền Teacher trở lên để access PowerHub
- Tắt toàn bộ hiệu ứng sau khi hướng dẫn xong (`PHHighlight.clear()`)
