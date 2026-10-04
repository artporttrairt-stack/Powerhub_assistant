(function initCamPrimaryMs1PlainExplanations(root) {
  'use strict';

  const ROWS = [
  ["academic-achievement","EE","Exceptional understanding; independently applies knowledge to new, unfamiliar contexts.","Em hiểu rất chắc và tự dùng kiến thức vào bài chưa gặp."],
  ["academic-achievement","AE","Strong understanding; regularly works above the expected level with confidence.","Em nắm bài nhanh, thường tự làm tốt hơn mức yêu cầu."],
  ["academic-achievement","ME","Satisfactory understanding; meets expected standards consistently.","Em hiểu bài đã học và làm được các yêu cầu chính."],
  ["academic-achievement","BE","Inconsistent understanding; sometimes needs extra support to meet standards.","Em làm được một phần nhưng chưa đều; có lúc cần cô giúp thêm."],
  ["academic-achievement","WB","Frequently limited understanding; requires significant support to complete work.","Em thường chưa theo kịp phần đã học; cần hướng dẫn sát để làm bài."],
  ["attitude-towards-learning","EE","Exceptional enthusiasm; seeks challenges and takes initiative well beyond expectations.","Em rất ham học, tự tìm thêm việc để thử sức."],
  ["attitude-towards-learning","AE","Highly positive; readily embraces new challenges and works with clear motivation.","Em học rất chủ động, sẵn sàng thử bài khó."],
  ["attitude-towards-learning","ME","Approaches learning positively; participates appropriately and completes tasks.","Em hợp tác học tập, làm bài được giao và tham gia khi được mời."],
  ["attitude-towards-learning","BE","Inconsistent engagement; sometimes needs encouragement or reminders to try.","Em tham gia chưa đều; đôi lúc cần nhắc mới bắt đầu hoặc tiếp tục làm."],
  ["attitude-towards-learning","WB","Frequently disengaged or negative; requires constant encouragement to participate.","Em thường chưa bắt tay vào bài hoặc dừng giữa chừng; cần hỗ trợ sát để tham gia."],
  ["behaviour-personal-development","EE","Exemplary behaviour; consistently mature, self￾disciplined, and a genuine role model.","Em rất tự giác, còn giúp lớp giữ nề nếp."],
  ["behaviour-personal-development","AE","Consistently positive behaviour; responsible and respectful at all times.","Em cư xử tốt và ổn định, ít khi cần cô nhắc."],
  ["behaviour-personal-development","ME","Behaves appropriately; respects others and the school environment.","Em theo nề nếp lớp và cư xử phù hợp."],
  ["behaviour-personal-development","BE","Inconsistent behaviour; occasionally needs reminders or teacher intervention.","Em có lúc chưa theo nề nếp; cần cô nhắc hoặc hỗ trợ xử lý tình huống."],
  ["behaviour-personal-development","WB","Frequently inappropriate behaviour; negatively affects the class and requires constant intervention.","Em thường cần cô hỗ trợ để giữ nề nếp; việc học của em và bạn đôi lúc bị ảnh hưởng."],
  ["completion-classwork-homework-secondary","EE","Consistently completes all work to a high standard; often exceeds requirements.","Em luôn hoàn thành đúng hạn; bài làm kỹ và thường có thêm phần hữu ích."],
  ["completion-classwork-homework-secondary","AE","Reliably completes classwork and homework to a consistently good standard.","Em làm bài đều, đúng hạn và thường làm kỹ hơn yêu cầu cơ bản."],
  ["completion-classwork-homework-secondary","ME","Completes most assigned work on time; meets expected requirements.","Em làm và nộp hầu hết bài đúng hạn, đủ phần chính."],
  ["completion-classwork-homework-secondary","BE","Does not always complete work; needs frequent reminders and support.","Em có bài chưa làm xong hoặc nộp chậm; cần cô nhắc khá thường xuyên."],
  ["completion-classwork-homework-secondary","WB","Frequently fails to complete or submit work; significant support required.","Em thường chưa làm xong hoặc chưa nộp bài; cần cách hỗ trợ rõ ràng, đều đặn."],
  ["communication-skills","EE","Exceptional communicator; adapts confidently to any audience or context.","Em diễn đạt rất rõ, biết đổi cách nói cho phù hợp người nghe."],
  ["communication-skills","AE","Communicates effectively and confidently in a wide range of situations.","Em nói và viết rõ, tự tin chia sẻ trong nhiều hoạt động."],
  ["communication-skills","ME","Communicates ideas appropriately and effectively in most situations.","Em nói hoặc viết đủ rõ để người khác hiểu ý trong phần lớn hoạt động."],
  ["communication-skills","BE","Sometimes unclear; struggles to express ideas accurately or appropriately.","Em có ý muốn nói nhưng đôi lúc diễn đạt chưa rõ; cần câu hỏi gợi mở."],
  ["communication-skills","WB","Frequently struggles to communicate; needs substantial support to convey basic ideas.","Em thường cần hỗ trợ nhiều mới nói hoặc viết được ý cơ bản."],
  ["working-collaboratively","EE","Exceptional collaborator; leads, supports peers, and drives group success.","Em giúp nhóm làm việc tốt hơn, không chỉ làm xong phần mình."],
  ["working-collaboratively","AE","Strong team player; contributes enthusiastically and supports the group consistently.","Em hợp tác tốt, chủ động góp sức và hỗ trợ bạn."],
  ["working-collaboratively","ME","Works appropriately with others; contributes constructively in group activities.","Em làm được phần việc của mình và hợp tác với bạn."],
  ["working-collaboratively","BE","Sometimes struggles to collaborate; may need teacher support during group activities.","Em có tham gia nhóm nhưng đôi lúc cần cô giúp cách phối hợp."],
  ["working-collaboratively","WB","Frequently uncooperative or disruptive; group work is significantly affected.","Em thường cần cô theo sát mới cùng nhóm hoàn thành việc."],
  ["creativity-critical-thinking","EE","Consistently exceptional; generates original ideas and approaches problems with sophisticated thinking.","Em tự nghĩ ra cách làm mới và biết giải thích vì sao chọn cách đó."],
  ["creativity-critical-thinking","AE","Strong creative and critical thinker; regularly develops thoughtful and original ideas.","Em thường nghĩ thêm cách khác và đưa ra ý có lý."],
  ["creativity-critical-thinking","ME","Demonstrates appropriate creativity and critical thinking when completing tasks.","Em có ý tưởng phù hợp và biết làm theo các bước đã học."],
  ["creativity-critical-thinking","BE","Sometimes struggles; tends to rely on copying peers or waiting for prompts.","Em có thể nghĩ ra ý khi được gợi, nhưng còn khó bắt đầu một mình."],
  ["creativity-critical-thinking","WB","Frequently unable to generate or apply ideas; needs substantial support for any creative task.","Với bài cần tự nghĩ cách làm, em thường cần cô làm mẫu và hướng dẫn từng bước."],
  ["equipment-resources","EE","Consistently excellent preparation; organised in a way that maximises their own learning.","Em luôn mang đủ đồ và sắp sẵn để vào bài ngay."],
  ["equipment-resources","AE","Always well-prepared; uses equipment responsibly and effectively.","Em chuẩn bị đủ đồ, gọn gàng và biết giữ gìn khi dùng."],
  ["equipment-resources","ME","Usually brings required equipment and uses resources appropriately.","Em thường mang đủ đồ để học và dùng đúng cách."],
  ["equipment-resources","BE","Occasionally unprepared; frequently needs reminders about equipment.","Em hay quên một vài món cần cho tiết học; cô còn phải nhắc chuẩn bị."],
  ["equipment-resources","WB","Frequently arrives without required equipment; teacher must regularly intervene.","Em thường thiếu đồ cần dùng; cần cùng gia đình tìm cách chuẩn bị ổn định hơn."]
];
  const matrix = {};
  for (const [area, level, en, vi] of ROWS) {
    if (!matrix[area]) matrix[area] = {};
    matrix[area][level] = {
      area,
      level,
      derivedFrom: ['cam-primary-ms1-official'],
      interpretiveSourceId: 'cam-primary-ms1-interpretive',
      text: { en, vi },
      recommendsLevel: false,
    };
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
    return value;
  }

  const PLAIN_EXPLANATIONS = deepFreeze(matrix);
  if (root) { root.PSQM = root.PSQM || {}; root.PSQM.camPrimaryMs1PlainExplanations = PLAIN_EXPLANATIONS; }
  if (typeof module !== 'undefined' && module.exports) module.exports = { PLAIN_EXPLANATIONS };
})(typeof globalThis !== 'undefined' ? globalThis : this);
