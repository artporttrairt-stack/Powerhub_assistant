(function initEnglishExamples(root) {
  'use strict';
  const ENGLISH_EXAMPLES = Object.freeze({
  "EE": {
    "en": "Independently infers an unstated idea from a short text and supports it with two clues.",
    "vi": "Đọc bài ngắn, em tự hiểu được ý tác giả không nói thẳng và chỉ ra hai chi tiết trong bài để giải thích.",
    "sourceId": "cam-primary-ms1-interpretive",
    "illustrativeOnly": true,
    "officialCutoff": false
  },
  "AE": {
    "en": "Answers inference questions accurately and usually supports answers with relevant details without prompting.",
    "vi": "Em trả lời đúng câu hỏi cần suy luận và thường tự chỉ ra chi tiết trong bài để giải thích, không cần cô nhắc.",
    "sourceId": "cam-primary-ms1-interpretive",
    "illustrativeOnly": true,
    "officialCutoff": false
  },
  "ME": {
    "en": "Finds the main idea and answers familiar comprehension questions using the taught strategy.",
    "vi": "Em tìm được ý chính và trả lời câu hỏi đọc hiểu quen thuộc bằng cách cô đã hướng dẫn.",
    "sourceId": "cam-primary-ms1-interpretive",
    "illustrativeOnly": true,
    "officialCutoff": false
  },
  "BE": {
    "en": "Finds some explicit information but needs prompts to identify the main idea or explain an answer.",
    "vi": "Em tìm được vài thông tin có sẵn trong bài, nhưng cần cô gợi ý mới nêu được ý chính hoặc giải thích câu trả lời.",
    "sourceId": "cam-primary-ms1-interpretive",
    "illustrativeOnly": true,
    "officialCutoff": false
  },
  "WB": {
    "en": "Even with the usual classroom support, has difficulty locating explicit information and needs guided practice in a small group.",
    "vi": "Dù đã có cách hỗ trợ thường dùng trong lớp, em vẫn khó tìm thông tin được viết rõ trong bài; cần cô hướng dẫn thêm theo nhóm nhỏ.",
    "sourceId": "cam-primary-ms1-interpretive",
    "illustrativeOnly": true,
    "officialCutoff": false
  }
});
  if (root) { root.PSQM = root.PSQM || {}; root.PSQM.camPrimaryMs1EnglishExamples = ENGLISH_EXAMPLES; }
  if (typeof module !== 'undefined' && module.exports) module.exports = { ENGLISH_EXAMPLES };
})(typeof globalThis !== 'undefined' ? globalThis : this);
