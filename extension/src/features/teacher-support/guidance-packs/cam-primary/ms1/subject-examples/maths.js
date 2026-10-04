(function initMathsExamples(root) {
  'use strict';
  const MATHS_EXAMPLES = Object.freeze({
  "EE": {
    "en": "Solves a new multi-step problem, explains why the method works and checks it another way.",
    "vi": "Gặp bài toán nhiều bước chưa luyện đúng dạng, em tự tìm cách giải, nói được vì sao làm vậy và kiểm tra lại bằng cách khác.",
    "sourceId": "cam-primary-ms1-interpretive",
    "illustrativeOnly": true,
    "officialCutoff": false
  },
  "AE": {
    "en": "Solves taught multi-step problems independently and explains a reasonable strategy.",
    "vi": "Với bài toán nhiều bước đã học, em tự giải và nói rõ mình chọn cách làm đó vì sao.",
    "sourceId": "cam-primary-ms1-interpretive",
    "illustrativeOnly": true,
    "officialCutoff": false
  },
  "ME": {
    "en": "Solves the taught problem type and shows the main steps correctly.",
    "vi": "Em giải được dạng toán đã học và ghi đúng các bước chính.",
    "sourceId": "cam-primary-ms1-interpretive",
    "illustrativeOnly": true,
    "officialCutoff": false
  },
  "BE": {
    "en": "Solves some familiar steps but needs reminders to choose the operation or check the answer.",
    "vi": "Em làm được một vài bước quen, nhưng còn cần nhắc để chọn phép tính và kiểm tra lại đáp án.",
    "sourceId": "cam-primary-ms1-interpretive",
    "illustrativeOnly": true,
    "officialCutoff": false
  },
  "WB": {
    "en": "Even with a worked example, cannot yet complete the familiar problem without step-by-step support.",
    "vi": "Có bài mẫu bên cạnh, em vẫn chưa tự làm xong dạng toán quen; cần được chỉ từng bước.",
    "sourceId": "cam-primary-ms1-interpretive",
    "illustrativeOnly": true,
    "officialCutoff": false
  }
});
  if (root) { root.PSQM = root.PSQM || {}; root.PSQM.camPrimaryMs1MathsExamples = MATHS_EXAMPLES; }
  if (typeof module !== 'undefined' && module.exports) module.exports = { MATHS_EXAMPLES };
})(typeof globalThis !== 'undefined' ? globalThis : this);
