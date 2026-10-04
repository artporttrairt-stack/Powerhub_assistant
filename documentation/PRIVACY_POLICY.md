# Hub Assistant Privacy Policy

**Publisher / Copyright holder:** A.I MY  
**Product:** Hub assistant  
**Reference build:** 8J-R2 LIVE PASS / manifest version 1.9.7  
**Effective date:** 20 September 2026  
**Privacy contact:** `<TO BE PROVIDED BEFORE STORE SUBMISSION>`  
**Public privacy-policy URL:** `<TO BE PROVIDED BEFORE STORE SUBMISSION>`

> This document describes the current data-handling design of Hub Assistant. It is a product privacy statement, not a legal certification or legal advice. Deployment-specific notice, consent, retention, account-management, and school-policy requirements must be reviewed before rollout.

---

## English

### 1. What Hub Assistant is

Hub Assistant is a teacher-facing browser extension that provides contextual guidance on supported PowerSchool / PowerHub educator pages. It is intended to help teachers understand interface context and complete workflows while keeping final actions under teacher control.

Hub Assistant is independently developed by A.I MY. It is not an official PowerSchool, Microsoft, or Google product and does not claim endorsement by those companies.

The current build is limited to the supported educator site:

`https://vas.educator.powerschool.com/*`

### 2. Intended users

Hub Assistant is designed for teachers and authorized school staff. It is not designed as a student-facing service, social network, advertising service, or student profiling system.

If a future deployment changes the intended audience or makes the extension directly available to children, the privacy and safeguarding design must be reassessed before that deployment.

### 3. Information the extension may access locally

To provide teacher-facing guidance, the extension may read information that is already visible in the supported PowerSchool / PowerHub page, including when relevant:

- names shown by PowerSchool;
- student, guardian, or account role labels;
- class, audience, and relationship context used to identify the correct teacher workflow;
- interface state, buttons, dialogs, tabs, and navigation context;
- information displayed within Messages or Newsfeed surfaces when needed to determine the current guidance state;
- the teacher's assistant-language and display preferences;
- walkthrough, onboarding, and contextual-help progress.

This access is limited to the supported PowerSchool educator origin declared in the extension manifest.

### 4. Information the extension does not intentionally collect

The current build does not intentionally collect or create a database of:

- passwords or credentials;
- authentication cookies or tokens;
- payment or financial information;
- health information;
- precise location;
- browsing history across unrelated websites;
- advertising identifiers;
- student behavioral profiles;
- persistent student nicknames or persistent student-profile records.

Hub Assistant does not use analytics, telemetry, advertising trackers, or behavioral advertising in the current build.

### 5. How personal information is processed

Names and other PowerSchool identity context may be processed transiently in the browser while the supported page is active so the extension can provide the requested teacher-facing guidance.

The current build uses in-memory page/runtime structures for this transient student/guardian identity context. It does not create a persistent student nickname/profile database.

The extension's own processing is local to the browser. The current build does not send student names, guardian names, message content, Newsfeed content, or teacher workflow data to a server controlled by A.I MY or to an analytics provider.

Normal network traffic between the browser and PowerSchool is part of the PowerSchool service itself and is outside Hub Assistant's data transmission behavior.

### 6. Information stored by the extension

The extension uses the browser extension `storage` capability for product settings and progress, such as:

- assistant language/reference choices;
- walkthrough and onboarding progress;
- contextual-help preferences;
- name-display preference;
- other extension state required to continue the teacher-facing experience.

These settings are not intended to store student or guardian profiles.

Earlier development versions used legacy student nickname/profile storage keys. The current build retains an install/update cleanup routine for the following legacy keys:

- `studentNicknames`
- `studentProfiles`
- `psqmStorageVersion`

The purpose of that routine is to remove obsolete nickname/profile data from prior versions when the extension is installed or updated.

### 7. Sharing and external transmission

The current build does not:

- sell personal information;
- broker personal information;
- share student or guardian information with advertisers;
- transmit student or guardian information to an A.I MY backend;
- use third-party analytics or telemetry services;
- use Microsoft Graph, Google Identity, or another cloud identity service;
- sync a student nickname/profile database to the cloud.

If a future version introduces any external service or materially different data use, this policy and the store disclosures must be updated before that version is released.

### 8. Child safeguarding and educational use

Hub Assistant follows a data-minimization approach for student information:

- student/guardian identity context is used only when necessary for the teacher-facing workflow;
- the current build does not maintain a persistent student nickname/profile database;
- the extension does not build commercial or behavioral profiles of children;
- the extension does not display advertising;
- the extension does not send student information to an external analytics or advertising service;
- the extension does not automatically perform final teacher actions such as Send, Create Group, or Publish.

PowerSchool / PowerHub remains the authoritative source of school data and workflow state.

### 9. Teacher control

Hub Assistant may guide or assist intermediate interface steps, but final consequential actions remain teacher-controlled. In the current build, the extension does not automatically execute the final Send, Create Group, or Publish action on behalf of the teacher.

### 10. Security design

The current manifest uses Manifest V3 and requests only:

- `storage` permission; and
- host access to `https://vas.educator.powerschool.com/*`.

The current audited build does not include remote executable code, external analytics, network-fetch logic for an A.I MY service, `eval`, or `new Function`.

### 11. Retention and deletion

Hub Assistant does not intentionally persist student nickname/profile records in the current build. Transient page/runtime identity context lasts only as needed for the active browser/page workflow.

Extension preferences and progress may remain in browser extension storage until they are changed, cleared through browser/extension administration, or the extension is removed, subject to browser behavior and school device-management policy.

Legacy nickname/profile keys are targeted for removal during install/update as described above.

### 12. School deployment and account model

This privacy policy does not assume that a school will use a particular Edge profile, Chrome profile, managed-browser configuration, or device-sharing model. Deployment controls will be assessed separately before school rollout.

Schools should determine appropriate browser-account, device-sharing, access-control, retention, and user-notice practices for their own deployment environment.

### 13. Changes to this policy

This policy must be reviewed whenever the extension adds a new permission, host, external service, analytics capability, identity provider, persistent student-data feature, or materially different teacher workflow.

### 14. Contact

Privacy questions and requests should be sent to:

`<TO BE PROVIDED BEFORE STORE SUBMISSION>`

---

## Tiếng Việt

### 1. Hub Assistant là gì

Hub Assistant là tiện ích trình duyệt dành cho giáo viên, cung cấp hướng dẫn theo ngữ cảnh trên các trang PowerSchool / PowerHub dành cho giáo viên được hỗ trợ. Mục tiêu là giúp giáo viên hiểu đúng giao diện và hoàn thành quy trình trong khi các hành động cuối cùng vẫn do giáo viên kiểm soát.

Hub Assistant được A.I MY phát triển độc lập. Đây không phải sản phẩm chính thức của PowerSchool, Microsoft hoặc Google và không tuyên bố được các công ty này bảo trợ hay chứng nhận.

Build hiện tại chỉ hoạt động trên trang giáo viên được hỗ trợ:

`https://vas.educator.powerschool.com/*`

### 2. Đối tượng sử dụng

Hub Assistant được thiết kế cho giáo viên và nhân viên trường học được ủy quyền. Tiện ích không được thiết kế như dịch vụ dành trực tiếp cho học sinh, mạng xã hội, dịch vụ quảng cáo hay hệ thống lập hồ sơ học sinh.

Nếu cách triển khai trong tương lai thay đổi đối tượng và cho trẻ em sử dụng trực tiếp, thiết kế quyền riêng tư và safeguarding phải được đánh giá lại trước khi triển khai.

### 3. Thông tin tiện ích có thể đọc cục bộ

Để cung cấp hướng dẫn cho giáo viên, tiện ích có thể đọc thông tin đang hiển thị trên trang PowerSchool / PowerHub được hỗ trợ, bao gồm khi cần thiết:

- tên do PowerSchool hiển thị;
- vai trò tài khoản như học sinh, phụ huynh/người giám hộ;
- thông tin lớp, audience và quan hệ cần để xác định đúng quy trình;
- trạng thái giao diện, nút, hộp thoại, tab và ngữ cảnh điều hướng;
- thông tin đang hiển thị trong khu vực Messages hoặc Newsfeed khi cần xác định bước hướng dẫn hiện tại;
- lựa chọn ngôn ngữ và chế độ hiển thị của trợ lý;
- tiến độ walkthrough, onboarding và contextual help.

Quyền truy cập này được giới hạn ở origin PowerSchool dành cho giáo viên đã khai báo trong manifest.

### 4. Thông tin tiện ích không chủ động thu thập

Build hiện tại không chủ động thu thập hoặc tạo cơ sở dữ liệu về:

- mật khẩu hoặc credential;
- cookie xác thực hoặc token;
- dữ liệu thanh toán/tài chính;
- dữ liệu sức khỏe;
- vị trí chính xác;
- lịch sử duyệt web trên các website không liên quan;
- advertising identifier;
- hồ sơ hành vi học sinh;
- nickname học sinh lưu lâu dài hoặc hồ sơ học sinh lưu lâu dài.

Build hiện tại không sử dụng analytics, telemetry, quảng cáo theo dõi hoặc quảng cáo hành vi.

### 5. Cách xử lý dữ liệu cá nhân

Tên và ngữ cảnh định danh từ PowerSchool có thể được xử lý tạm thời trong trình duyệt khi trang được hỗ trợ đang hoạt động để cung cấp hướng dẫn cho giáo viên.

Build hiện tại sử dụng cấu trúc dữ liệu trong bộ nhớ của trang/runtime cho ngữ cảnh định danh học sinh/người giám hộ. Tiện ích không tạo cơ sở dữ liệu nickname/hồ sơ học sinh lưu lâu dài.

Việc xử lý của extension diễn ra cục bộ trong trình duyệt. Build hiện tại không gửi tên học sinh, tên người giám hộ, nội dung tin nhắn, nội dung Newsfeed hoặc dữ liệu workflow của giáo viên tới máy chủ do A.I MY kiểm soát hoặc tới nhà cung cấp analytics.

Lưu lượng mạng thông thường giữa trình duyệt và PowerSchool thuộc dịch vụ PowerSchool và không phải là hoạt động truyền dữ liệu của Hub Assistant.

### 6. Dữ liệu extension lưu

Extension sử dụng khả năng `storage` của trình duyệt để lưu cài đặt và tiến độ sản phẩm, ví dụ:

- lựa chọn ngôn ngữ/ngôn ngữ tham chiếu của trợ lý;
- tiến độ walkthrough và onboarding;
- tùy chọn contextual help;
- tùy chọn cách hiển thị tên;
- trạng thái extension cần thiết để tiếp tục trải nghiệm hướng dẫn.

Các setting này không nhằm lưu hồ sơ học sinh hoặc người giám hộ.

Một số phiên bản phát triển cũ từng dùng các key lưu nickname/hồ sơ học sinh. Build hiện tại giữ routine cleanup khi install/update cho các key cũ:

- `studentNicknames`
- `studentProfiles`
- `psqmStorageVersion`

Mục tiêu của routine này là xóa dữ liệu nickname/hồ sơ đã lỗi thời từ phiên bản cũ khi extension được cài hoặc cập nhật.

### 7. Chia sẻ và truyền dữ liệu ra ngoài

Build hiện tại không:

- bán dữ liệu cá nhân;
- môi giới dữ liệu cá nhân;
- chia sẻ dữ liệu học sinh/người giám hộ cho nhà quảng cáo;
- truyền dữ liệu học sinh/người giám hộ tới backend của A.I MY;
- sử dụng dịch vụ analytics hoặc telemetry của bên thứ ba;
- sử dụng Microsoft Graph, Google Identity hoặc dịch vụ cloud identity khác;
- đồng bộ cơ sở dữ liệu nickname/hồ sơ học sinh lên cloud.

Nếu phiên bản tương lai thêm dịch vụ bên ngoài hoặc thay đổi đáng kể cách dùng dữ liệu, policy và store disclosure phải được cập nhật trước khi phát hành phiên bản đó.

### 8. Safeguarding trẻ em và sử dụng trong giáo dục

Hub Assistant áp dụng nguyên tắc giảm thiểu dữ liệu học sinh:

- chỉ sử dụng ngữ cảnh định danh học sinh/người giám hộ khi cần cho workflow của giáo viên;
- build hiện tại không duy trì cơ sở dữ liệu nickname/hồ sơ học sinh lâu dài;
- không lập hồ sơ thương mại hoặc hành vi của trẻ em;
- không hiển thị quảng cáo;
- không gửi dữ liệu học sinh tới dịch vụ analytics hoặc quảng cáo bên ngoài;
- không tự động thực hiện hành động cuối cùng của giáo viên như Send, Create Group hoặc Publish.

PowerSchool / PowerHub vẫn là nguồn dữ liệu và trạng thái chính thức.

### 9. Quyền kiểm soát của giáo viên

Hub Assistant có thể hướng dẫn hoặc hỗ trợ một số bước trung gian trên giao diện, nhưng các hành động có hậu quả cuối cùng vẫn do giáo viên kiểm soát. Trong build hiện tại, extension không tự động bấm Send, Create Group hoặc Publish thay cho giáo viên.

### 10. Thiết kế bảo mật

Manifest hiện tại dùng Manifest V3 và chỉ yêu cầu:

- permission `storage`; và
- host access `https://vas.educator.powerschool.com/*`.

Build đã audit hiện tại không chứa remote executable code, external analytics, network-fetch logic tới dịch vụ A.I MY, `eval` hoặc `new Function`.

### 11. Lưu giữ và xóa dữ liệu

Hub Assistant không chủ động lưu lâu dài nickname/hồ sơ học sinh trong build hiện tại. Ngữ cảnh định danh tạm thời trong page/runtime chỉ tồn tại khi cần cho workflow của trang đang hoạt động.

Setting và tiến độ của extension có thể tiếp tục tồn tại trong extension storage cho đến khi được thay đổi, bị xóa qua quản trị trình duyệt/extension hoặc extension bị gỡ, tùy theo hành vi của trình duyệt và chính sách quản lý thiết bị của trường.

Các key nickname/hồ sơ cũ được nhắm tới để xóa trong quá trình install/update như mô tả ở trên.

### 12. Cách trường triển khai

Policy này không giả định trường sẽ dùng một kiểu Edge profile, Chrome profile, managed browser hay mô hình chia sẻ thiết bị cụ thể. Các kiểm soát triển khai sẽ được đánh giá riêng trước khi rollout.

Trường cần tự xác định mô hình browser account, device sharing, access control, retention và user notice phù hợp với môi trường của mình.

### 13. Thay đổi policy

Policy phải được review khi extension thêm permission, host, dịch vụ bên ngoài, analytics, identity provider, tính năng lưu dữ liệu học sinh hoặc workflow giáo viên mới có thay đổi đáng kể.

### 14. Liên hệ

Câu hỏi và yêu cầu về quyền riêng tư gửi tới:

`<TO BE PROVIDED BEFORE STORE SUBMISSION>`

---

## Publishing references

- Chrome Web Store publishing prerequisites: https://developer.chrome.com/docs/webstore/using-api
- Chrome extension storage API: https://developer.chrome.com/docs/extensions/reference/api/storage
- Chrome extension permissions: https://developer.chrome.com/docs/extensions/reference/permissions-list
- Microsoft Edge Add-ons developer policies: https://learn.microsoft.com/en-us/legal/microsoft-edge/extensions/developer-policies
- Microsoft Edge extension publishing / Privacy page: https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension
