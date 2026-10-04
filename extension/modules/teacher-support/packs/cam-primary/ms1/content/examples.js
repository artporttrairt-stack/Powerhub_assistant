(function initCamPrimaryMs1Examples(root) {
  'use strict';

  const SOURCE_ID = 'cam-primary-ms1-interpretive';

  function example(textEn, textVi) {
    return Object.freeze({ sourceId: SOURCE_ID, textEn, textVi, officialCutoff: false });
  }

  const SUBJECT_EXAMPLES = Object.freeze({
    english: Object.freeze({
      EE: example(
        'Independently infers an unstated idea from a short text and supports it with two clues.',
        'Đọc bài ngắn, em tự hiểu được ý tác giả không nói thẳng và chỉ ra hai chi tiết trong bài để giải thích.'
      ),
      AE: example(
        'Answers inference questions accurately and usually supports answers with relevant details without prompting.',
        'Em trả lời đúng câu hỏi cần suy luận và thường tự chỉ ra chi tiết trong bài để giải thích, không cần cô nhắc.'
      ),
      ME: example(
        'Finds the main idea and answers familiar comprehension questions using the taught strategy.',
        'Em tìm được ý chính và trả lời câu hỏi đọc hiểu quen thuộc bằng cách cô đã hướng dẫn.'
      ),
      BE: example(
        'Finds some explicit information but needs prompts to identify the main idea or explain an answer.',
        'Em tìm được vài thông tin có sẵn trong bài, nhưng cần cô gợi ý mới nêu được ý chính hoặc giải thích câu trả lời.'
      ),
      WB: example(
        'Even with the usual classroom support, has difficulty locating explicit information and needs guided practice in a small group.',
        'Dù đã có cách hỗ trợ thường dùng trong lớp, em vẫn khó tìm thông tin được viết rõ trong bài; cần cô hướng dẫn thêm theo nhóm nhỏ.'
      ),
    }),
    maths: Object.freeze({
      EE: example(
        'Solves a new multi-step problem, explains why the method works and checks it another way.',
        'Gặp bài toán nhiều bước chưa luyện đúng dạng, em tự tìm cách giải, nói được vì sao làm vậy và kiểm tra lại bằng cách khác.'
      ),
      AE: example(
        'Solves taught multi-step problems independently and explains a reasonable strategy.',
        'Với bài toán nhiều bước đã học, em tự giải và nói rõ mình chọn cách làm đó vì sao.'
      ),
      ME: example(
        'Solves the taught problem type and shows the main steps correctly.',
        'Em giải được dạng toán đã học và ghi đúng các bước chính.'
      ),
      BE: example(
        'Solves some familiar steps but needs reminders to choose the operation or check the answer.',
        'Em làm được một vài bước quen, nhưng còn cần nhắc để chọn phép tính và kiểm tra lại đáp án.'
      ),
      WB: example(
        'Even with a worked example, cannot yet complete the familiar problem without step-by-step support.',
        'Có bài mẫu bên cạnh, em vẫn chưa tự làm xong dạng toán quen; cần được chỉ từng bước.'
      ),
    }),
    science: Object.freeze({
      EE: example(
        'Plans a fair test independently, identifies a variable to control and explains an unexpected result.',
        'Em tự lên cách thử, biết yếu tố nào phải giữ nguyên để so sánh cho công bằng, rồi thử giải thích vì sao kết quả khác dự đoán.'
      ),
      AE: example(
        'Carries out a fair test, records results clearly and makes a supported conclusion with little prompting.',
        'Em làm thí nghiệm đúng cách để so sánh công bằng, ghi kết quả rõ và dựa vào kết quả để kết luận; cô ít phải gợi ý.'
      ),
      ME: example(
        'Follows the taught investigation steps, records observations and states a simple conclusion.',
        'Em làm theo các bước đã học, ghi lại điều quan sát được và nêu kết luận ngắn gọn.'
      ),
      BE: example(
        'Records some observations but needs prompts to keep the test fair or link results to a conclusion.',
        'Em ghi được vài điều quan sát thấy, nhưng cần cô nhắc giữ các điều kiện khác như nhau hoặc dựa vào kết quả để kết luận.'
      ),
      WB: example(
        'Needs step-by-step support to make or record observations and describe a result.',
        'Em cần cô hướng dẫn từng bước mới quan sát, ghi lại và nói được kết quả.'
      ),
    }),
  });

  function normalizeSubject(subject) {
    const value = String(subject || '').trim().toLowerCase();
    if (value === 'english' || value === 'tiếng anh' || value === 'tieng anh') return 'english';
    if (value === 'maths' || value === 'math' || value === 'mathematics' || value === 'toán' || value === 'toan') return 'maths';
    if (value === 'science' || value === 'khoa học' || value === 'khoa hoc') return 'science';
    return null;
  }

  function getSubjectExample(subject, levelCode) {
    const key = normalizeSubject(subject);
    if (!key || !SUBJECT_EXAMPLES[key]) return null;
    return SUBJECT_EXAMPLES[key][levelCode] || null;
  }

  const api = Object.freeze({ SUBJECT_EXAMPLES, normalizeSubject, getSubjectExample });
  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.teacherSupport = root.PSQM.teacherSupport || {};
    root.PSQM.teacherSupport.camPrimaryMs1 = root.PSQM.teacherSupport.camPrimaryMs1 || {};
    root.PSQM.teacherSupport.camPrimaryMs1.examples = api;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
