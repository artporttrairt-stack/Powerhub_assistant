(function initCamPrimaryMs1CopyVi(root) {
  'use strict';
  const COPY_VI = Object.freeze({
    officialCriterion: 'TIÊU CHÍ CHÍNH THỨC',
    interpretiveExample: 'VÍ DỤ GIÚP THẦY CÔ DIỄN GIẢI',
    classroomEvidence: 'Minh chứng trên lớp để đối chiếu',
    observationChecklist: 'Câu hỏi quan sát',
    compareWith: 'So sánh với mức liền kề',
    subjectExample: 'Ví dụ theo môn',
    back: 'Quay lại',
    quickReference: 'Tham khảo nhanh',
    teacherDecision: 'Đối chiếu minh chứng giữa các mức; giáo viên đưa ra quyết định cuối cùng.',
  });
  if (root) { root.PSQM = root.PSQM || {}; root.PSQM.camPrimaryMs1CopyVi = COPY_VI; }
  if (typeof module !== 'undefined' && module.exports) module.exports = { COPY_VI };
})(typeof globalThis !== 'undefined' ? globalThis : this);
