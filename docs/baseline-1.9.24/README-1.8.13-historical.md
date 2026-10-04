# PowerSchool Quick Message

Version 1.8.13 keeps PowerSchool's existing layout and adds these focused behaviors:

- Display-only student nicknames that never replace the original PowerSchool identity used for search and messaging.
- Chrome notifications when the unread message count increases.
- Compact standalone class names across PowerSchool, ordered as class code, subject, then period.
- Native `Direct messages` rows always open their existing conversation history.
- A compact `+` control on each `Direct messages` row adds that account to a new or already-open composer without changing the name into a hyperlink.
- Account names in `Group Information > Members` retain the Version 1.8 quick-message behavior.
- Account names are displayed by PowerSchool role while the untouched original web name is retained for recipient search.
- Student rows in `Group Information` and matching `Direct messages` rows show only the compact class detail, for example `Student - 2L7I`. After a class is selected, opening that class's `Create group chat` dialog teaches the extension its roster and immediately updates matching left-side titles, even when the Group Information roster is closed.
- The native `Create group chat` dialog uses more of the viewport and combines fixed five-result pages into one compact scrollable list.
- Names in the native `Create group chat` result rows use the same Student, Guardian, and Staff display rules while retaining the untouched native account name for selection.

## Install or update

1. For preview, load the source folder containing `manifest.json`; create or extract a ZIP only for a packaged release.
2. Open `chrome://extensions` in Chrome.
3. Enable `Developer mode`.
4. Remove any earlier version of PowerSchool Quick Message.
5. Select `Load unpacked` and choose the extracted folder containing `manifest.json`.
6. Reload PowerSchool with `Ctrl+R` on Windows or `Command+R` on macOS.

## Direct messages and quick recipients

1. Select a row under `Direct messages` normally to open its existing conversation and message history.
2. Select the `+` control on a row to add that account to New message. If a composer is already open, the recipient is added there; otherwise PowerSchool opens one. The control briefly shows `…` while the recipient is being prepared, then changes to `−` after the account is selected.
3. After a recipient is added, the empty `To` field receives focus. Select additional `+` controls or type another name to build the recipient group in the same composer.
4. Select a `−` control to remove that recipient from the current New message group.
5. Or open a class and select an underlined account name in `Group Information > Members`, as in Version 1.8.

The extension uses PowerSchool's existing composer. Clear available results are selected automatically; duplicates are skipped; unavailable or ambiguous accounts remain in the recipient search for manual review. It never sends a message automatically.

## Student nicknames

1. Select the `✎` button beside a Student in `Direct messages`, `Group Information > Members`, or `Create group chat`.
2. Enter a nickname and select OK. Leave the field blank to remove the saved nickname.
3. The nickname is shown on the extension-enhanced account lists. Hover over the edit button to see the original PowerSchool name.
4. Select the nickname or its adjacent `+` control normally. The extension still writes and resolves the untouched original PowerSchool name in the recipient search.

Nickname mappings are saved only in `chrome.storage.local` for this browser profile. They are not synchronized by the extension or sent to another service. If two students have exactly the same original PowerSchool name, they share one nickname mapping; leave those records unchanged unless PowerSchool exposes a stable identifier that can distinguish them.

## Role-aware account name display

The extension keeps separate values for the visible label and the original PowerSchool account name. A saved Student nickname takes precedence over the role-aware display order. Every recipient search and selection still uses the original web name, never the nickname or reordered display label.

- `Student`: PowerSchool puts the given name first and the family name last. Display uses family name, middle names, then given name: `Minh Văn Nhật Nguyễn` displays as `Nguyễn Văn Nhật Minh`.
- `Guardian` and `Student contact`: move the last word to the front and keep the remaining words in order: `Thị Diễm Hương Huỳnh` displays as `Huỳnh Thị Diễm Hương`.
- `Staff`, Teacher, Admin, and every other role: treat the second name word as the family name, then display the remaining middle names followed by the first given-name word. `Linh Le Thi My` displays as `Le Thi My Linh`; `Phuong Nguyen Mai` displays as `Nguyen Mai Phuong`.
- Staff spelling, accents, capitalization, and annotations are copied exactly as PowerSchool provides them. `Phuong (TA) Nguyen Mai` displays as `Nguyen Mai Phuong (TA)`.
- Recipient search still uses the untouched original web name for every role.
- Student nicknames affect display text only; Guardian and Staff names are not editable.
- Accounts from different roles remain distinct even when their names contain the same words in a different order.

## Group Information and Create group chat

- In `Group Information`, Student detail text is shortened to `Student - <class code>`, such as `Student - 2L7I`. Matching Student rows under `Direct messages` receive the same detail. The class letter is retained.
- Only names confirmed from a class roster or the selected class's `Create group chat` results are changed in `Direct messages`; the class mapping is retained for the current page session. Unrelated or ambiguous students are not assigned the wrong class code.
- Staff, Guardian, and other role details are left unchanged.
- The original Student detail remains stored internally and is restored when the row is no longer in the active Group Information view.
- The `Create group chat` dialog expands responsively up to almost the full browser viewport. The available-member area uses about 70% of the width and the selected-member area uses about 30%.
- Member rows are compact so at least 10 accounts are visible at once at the supported desktop modal size. The list scrolls independently, while the native action footer remains visible.
- Native result-row names are display-only transformations. Pagination and each original PowerSchool `+` control remain native and use the original account identity.
- If PowerSchool exposes a clearly labelled native results-per-page selector, the extension selects its largest safe value.
- When PowerSchool fixes the list at five results per page, the extension reads the native pages and presents the collected accounts in one compact scrolling list. Native page controls are detected even when PowerSchool renders them as custom spans or icon-only elements. Each collected `+` control activates the original PowerSchool control on the correct native page; if collection cannot finish safely, the original pagination remains available.

## Class display order

The extension changes standalone class labels in class lists, group headings, directories, and dynamically opened content. The original label remains in the tooltip, and the original PowerSchool click behavior is preserved. Composite text such as Newsfeed author metadata or a line containing multiple classes remains unchanged.

The normalized display format is `<class code> - <subject> - <period>`. Program letters at the end of the class code are preserved and recognized explicitly:

- `A` = CAP, for example `2L3A`.
- `I` = CAPI, for example `2L7I`.
- `E` = CEP, for example `2L3E`.

The parser accepts ordinary hyphens, en dashes, and em dashes, then normalizes the visible separators to ` - `. It also tolerates a program label beside the code, such as `(2L3A - CAP)`, without adding the program word to the compact display.

- `English (Tiếng Anh) - P6-P7(Mon-Tue,Fri) - Ellen Galvin (2L7I)` displays as `2L7I - English - P6-P7`.
- `Science (Khoa học) - P8-P9(Wed-Thu) - Ellen Galvin (2L8I)` displays as `2L8I - Science - P8-P9`.
- `English (Tiếng Anh) – P6–P7(Mon-Tue,Fri) – Teacher Name (2L3A - CAP)` displays as `2L3A - English - P6-P7`.

## Notifications

Select the extension icon to turn `New message notifications` on or off. A notification is shown only when PowerSchool's unread count increases after the page establishes its initial count. Selecting the notification focuses the existing PowerSchool tab.

## Scope

- No extra member panel is injected into PowerSchool.
- No inactive-member notice is added.
- No class panel is opened automatically.
- No Word export is included.
- No second PowerSchool window is opened.
- `Direct messages` name and row clicks remain native; only the dedicated `+` controls are intercepted.
- Original PowerSchool account names remain unchanged for recipient search.

