(function initScienceExamples(root) {
  'use strict';
  const SCIENCE_EXAMPLES = Object.freeze({
  "EE": {
    "en": "Plans a fair test independently, identifies a variable to control and explains an unexpected result.",
    "vi": "Em tự lên cách thử, biết yếu tố nào phải giữ nguyên để so sánh cho công bằng, rồi thử giải thích vì sao kết quả khác dự đoán.",
    "sourceId": "cam-primary-ms1-interpretive",
    "illustrativeOnly": true,
    "officialCutoff": false
  },
  "AE": {
    "en": "Carries out a fair test, records results clearly and makes a supported conclusion with little prompting.",
    "vi": "Em làm thí nghiệm đúng cách để so sánh công bằng, ghi kết quả rõ và dựa vào kết quả để kết luận; cô ít phải gợi ý.",
    "sourceId": "cam-primary-ms1-interpretive",
    "illustrativeOnly": true,
    "officialCutoff": false
  },
  "ME": {
    "en": "Follows the taught investigation steps, records observations and states a simple conclusion.",
    "vi": "Em làm theo các bước đã học, ghi lại điều quan sát được và nêu kết luận ngắn gọn.",
    "sourceId": "cam-primary-ms1-interpretive",
    "illustrativeOnly": true,
    "officialCutoff": false
  },
  "BE": {
    "en": "Records some observations but needs prompts to keep the test fair or link results to a conclusion.",
    "vi": "Em ghi được vài điều quan sát thấy, nhưng cần cô nhắc giữ các điều kiện khác như nhau hoặc dựa vào kết quả để kết luận.",
    "sourceId": "cam-primary-ms1-interpretive",
    "illustrativeOnly": true,
    "officialCutoff": false
  },
  "WB": {
    "en": "Needs step-by-step support to make or record observations and describe a result.",
    "vi": "Em cần cô hướng dẫn từng bước mới quan sát, ghi lại và nói được kết quả.",
    "sourceId": "cam-primary-ms1-interpretive",
    "illustrativeOnly": true,
    "officialCutoff": false
  }
});
  if (root) { root.PSQM = root.PSQM || {}; root.PSQM.camPrimaryMs1ScienceExamples = SCIENCE_EXAMPLES; }
  if (typeof module !== 'undefined' && module.exports) module.exports = { SCIENCE_EXAMPLES };
})(typeof globalThis !== 'undefined' ? globalThis : this);
