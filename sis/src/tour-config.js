(function (root) {
  'use strict';

  const steps = [
    {
      id: 'navigation',
      anchor: { kind: 'navigation' },
      en: { title: 'Navigation Menu', lines: [] },
      vi: { title: 'Menu Điều hướng', lines: [] },
    },
    {
      id: 'exp',
      anchor: { kind: 'header', cellIndex: 0 },
      en: {
        title: 'Exp: Period and day',
        lines: [
          'A1, A2: Attendance Period for Kindy and Primary',
          'P1 – P10: Period 1,...,Period 10',
          'Example:',
          'P1-P2(Mon): Period 1 and 2 of Monday',
        ],
      },
      vi: {
        title: 'Exp: Tiết học và ngày',
        lines: [
          'A1, A2: Tiết điểm danh cho Mầm non và Tiểu học',
          'P1 – P10: Tiết 1,...,Tiết 10',
          'Ví dụ:',
          'P1-P2(T2): Tiết 1 và 2 của Thứ Hai',
        ],
      },
    },
    {
      id: 'course',
      anchor: { kind: 'header', cellIndex: 1 },
      en: {
        title: 'Course: Teaching Class',
        lines: [
          'Class name',
          'PowerTeacher Pro: manage gradebook, comments, student progress, student report...',
        ],
      },
      vi: {
        title: 'Môn học: Lớp giảng dạy',
        lines: [
          'Tên lớp',
          'PowerTeacher Pro: quản lý sổ điểm, nhận xét, tiến độ học sinh, báo cáo học sinh...',
        ],
      },
    },
    {
      id: 'section',
      anchor: { kind: 'header', cellIndex: 2 },
      en: { title: 'Sec#: Section Number', lines: ['Homeroom', 'A1,A2: Attendance section'] },
      vi: { title: 'Sec#: Mã môn học', lines: ['Lớp chủ nhiệm', 'A1,A2: Lớp điểm danh'] },
    },
    {
      id: 'attendance-status',
      anchor: { kind: 'header', cellIndex: 3 },
      en: {
        title: 'Attendance Status',
        lines: [
          'Blank: Attendance not yet taken',
          'Yellow: Attendance partially taken',
          'Green: Attendance fully take',
        ],
      },
      vi: {
        title: 'Trạng thái Điểm danh',
        lines: [
          'Trống: Chưa điểm danh',
          'Vàng: Điểm danh một phần',
          'Xanh lá: Đã điểm danh đầy đủ',
        ],
      },
    },
    {
      id: 'take-attendance',
      anchor: { kind: 'action-column', cellIndex: 4 },
      en: { title: 'Take Attendance', lines: [] },
      vi: { title: 'Điểm danh', lines: [] },
    },
    {
      id: 'seating-chart',
      anchor: { kind: 'action-column', cellIndex: 6 },
      en: { title: 'Create Seating Chart', lines: [] },
      vi: { title: 'Tạo Sơ đồ Chỗ ngồi', lines: [] },
    },
    {
      id: 'student-information',
      anchor: { kind: 'action-column', cellIndex: 8 },
      en: { title: 'Student Information', lines: [] },
      vi: { title: 'Thông tin Học sinh', lines: [] },
    },
  ];

  const config = Object.freeze({
    startPagePath: '/teachers/home.html',
    tableId: 'teacherSectionTable',
    expectedHeaderCount: 10,
    steps: Object.freeze(steps),
  });

  root.SIS_START_PAGE_TOUR_CONFIG = config;
  if (typeof module !== 'undefined' && module.exports) module.exports = config;
})(typeof globalThis !== 'undefined' ? globalThis : this);
