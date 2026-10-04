(function initCamPrimaryMs1Guidance(root) {
  'use strict';

  const INTERPRETIVE_SOURCE_ID = 'cam-primary-ms1-interpretive';
  const RAW = {};
  RAW["academic"] = {"comparisonEn":"EE surprises the teacher. AE impresses. ME is solid. BE is inconsistent. WB is lost.","comparisonVi":"EE tự làm tốt cả bài lạ. AE thường làm hơn yêu cầu. ME làm được bài đã học. BE lúc được lúc chưa. WB cần được hướng dẫn sát ngay cả với bài quen.","levels":{"EE":["Exceptional understanding; independently applies knowledge to new, unfamiliar contexts.",["Solves problems in ways not explicitly taught.","Connects different topics independently.","Consistently produces work above standard.","Surprises the teacher with depth of understanding.","Can explain concepts to peers without prompting."],"Em hiểu rất chắc và tự dùng kiến thức vào bài chưa gặp. Tự tìm ra cách giải dù cô chưa dạy đúng dạng đó. Tự nối kiến thức ở các bài khác nhau. Bài làm thường có thêm ý đúng và hữu ích ngoài yêu cầu. Giải thích được vì sao, không chỉ đưa đáp án. Tự giải thích lại cho bạn hiểu mà không cần cô gợi ý."],"AE":["Strong understanding; regularly works above the expected level with confidence.",["Completes tasks correctly and often adds extra depth.","Grasps new concepts quickly — rarely needs re-teaching.","Produces work noticeably better than average.","Applies knowledge to slightly unfamiliar situations.","A reliable high performer the teacher can count on."],"Em nắm bài nhanh, thường tự làm tốt hơn mức yêu cầu. Làm đúng và thường giải thích thêm được cách làm. Học nội dung mới nhanh, ít khi phải dạy lại. Bài làm đầy đủ, chắc và có thêm ý phù hợp. Làm được khi đề thay đổi một chút so với bài mẫu. Giữ được mức làm bài tốt qua nhiều tiết."],"ME":["Satisfactory understanding; meets expected standards consistently.",["Completes set tasks correctly at the expected level.","Understands concepts after they are taught in class.","Makes occasional errors but is generally on track.","Can apply knowledge to familiar task types.","Does not need extra support; does not go beyond."],"Em hiểu bài đã học và làm được các yêu cầu chính. Hoàn thành bài đúng mức cần đạt. Sau khi được dạy, em hiểu cách làm. Có lỗi nhỏ nhưng nhìn chung làm đúng hướng. Làm được các dạng bài quen thuộc. Thường không cần cô kèm thêm để hoàn thành bài."],"BE":["Inconsistent understanding; sometimes needs extra support to meet standards.",["Understanding varies — some days good, some days lost.","Needs the concept re-explained before completing work.","Makes frequent errors or leaves gaps in tasks.","Struggles to apply knowledge to new task types.","Teacher needs to check in regularly to keep on track."],"Em làm được một phần nhưng chưa đều; có lúc cần cô giúp thêm. Cùng một dạng bài, hôm làm được, hôm còn lúng túng. Cần nghe giải thích lại rồi mới bắt đầu làm. Bài làm còn lỗi hoặc bỏ sót yêu cầu. Khi đề đổi cách hỏi, em chưa biết áp dụng. Cô cần ghé kiểm tra và gợi ý trong lúc em làm."],"WB":["Frequently limited understanding; requires significant support to complete work.",["Regularly unable to complete tasks without direct help.","Does not retain concepts taught in class.","Work is frequently incomplete, incorrect, or missing.","Cannot yet apply knowledge to even familiar tasks.","Needs one-to-one or small group intervention."],"Em thường chưa theo kịp phần đã học; cần hướng dẫn sát để làm bài. Thường chưa làm xong nếu không có người hướng dẫn trực tiếp. Gặp lại nội dung đã học vẫn cần ôn lại từ đầu. Bài làm thường còn nhiều chỗ trống hoặc chưa đúng. Ngay cả dạng bài quen, em vẫn chưa tự làm được. Cần luyện thêm từng bước, riêng hoặc theo nhóm nhỏ."]}};
  RAW["attitude"] = {"comparisonEn":"EE seeks more. AE embraces challenges. ME completes. BE needs reminders. WB resists.","comparisonVi":"EE tự tìm thêm việc học. AE chủ động thử bài khó. ME làm bài được giao. BE đôi lúc cần nhắc để tiếp tục. WB cần hỗ trợ sát để bắt đầu và duy trì việc học.","levels":{"EE":["Exceptional enthusiasm; seeks challenges and takes initiative well beyond expectations.",["Voluntarily asks for harder tasks or extension work.","Brings extra research or ideas from outside class.","Shows genuine excitement about new topics.","Persists through difficulty without giving up.","Motivates and energises others around them."],"Em rất ham học, tự tìm thêm việc để thử sức. Làm xong việc được giao, em xin thử bài khó hơn. Tự tìm hiểu thêm rồi chia sẻ điều mới với lớp. Chủ động đặt câu hỏi về bài học. Gặp bài khó vẫn thử nhiều cách, không bỏ ngang. Rủ và khích lệ bạn cùng tham gia."],"AE":["Highly positive; readily embraces new challenges and works with clear motivation.",["Raises hand often and participates without being called on.","Welcomes challenging tasks with a positive attitude.","Shows clear intrinsic motivation — not just compliance.","Recovers quickly after making mistakes.","Consistent positive energy visible every lesson."],"Em học rất chủ động, sẵn sàng thử bài khó. Thường giơ tay chia sẻ mà không cần gọi. Nhận bài khó vẫn bắt tay vào thử. Muốn hiểu bài, không chỉ làm cho xong. Làm sai thì sửa và thử lại. Tham gia đều qua các tiết học."],"ME":["Approaches learning positively; participates appropriately and completes tasks.",["Gets on with tasks without complaint.","Participates when called upon or prompted.","Does not resist new topics or challenging activities.","Completes assigned work with a positive attitude.","Consistent but not self-driven or exceptional."],"Em hợp tác học tập, làm bài được giao và tham gia khi được mời. Bắt đầu làm bài mà không cần thúc giục. Trả lời hoặc tham gia khi cô mời. Sẵn sàng thử hoạt động mới. Làm hết phần việc được giao. Chưa thường tự xin thêm thử thách, nhưng học đều."],"BE":["Inconsistent engagement; sometimes needs encouragement or reminders to try.",["Participates only when prompted — not self-initiated.","Shows visible disinterest in certain topics or tasks.","Sometimes complains or delays starting work.","Motivation drops when tasks become difficult.","Needs external encouragement to stay engaged."],"Em tham gia chưa đều; đôi lúc cần nhắc mới bắt đầu hoặc tiếp tục làm. Thường đợi cô gọi mới tham gia. Có bài em bắt tay làm, có bài chờ khá lâu. Đôi khi trì hoãn lúc bắt đầu. Bài khó hơn thì dễ dừng lại. Cần cô động viên để làm tiếp."],"WB":["Frequently disengaged or negative; requires constant encouragement to participate.",["Regularly refuses or avoids tasks.","Shows persistent negative attitude towards learning.","Gives up immediately when tasks become challenging.","Discourages or distracts others around them.","No visible self-motivation — entirely externally dependent."],"Em thường chưa bắt tay vào bài hoặc dừng giữa chừng; cần hỗ trợ sát để tham gia. Nhiều lần chưa bắt đầu dù đã được giao việc. Thường cần cô ngồi cùng để vào bài. Gặp khó khăn là dừng, chưa thử cách khác. Có lúc làm bạn bên cạnh mất tập trung. Cần tìm cách hỗ trợ phù hợp để em tham gia đều hơn."]}};
  // __DATA__

  const AREA_PROMPTS = Object.freeze({
    academic: Object.freeze(['Does the student understand and apply knowledge?']),
    attitude: Object.freeze(['Does the student want to learn and show genuine effort?']),
    behaviour: Object.freeze(['Does the student behave appropriately and manage themselves well?']),
    'classwork-homework': Object.freeze(['Does the student submit complete, on-time, quality work consistently?']),
    communication: Object.freeze(['Can the student express ideas clearly and appropriately?']),
    collaboration: Object.freeze(['Does the student contribute positively in group and partner situations?']),
    'creativity-critical-thinking': Object.freeze(['Does the student think beyond the obvious and generate original ideas?']),
    'equipment-resources': Object.freeze(['Is the student consistently well-prepared with the right materials?']),
  });

  const GUIDANCE = {};
  for (const [areaId, area] of Object.entries(RAW)) {
    GUIDANCE[areaId] = {};
    for (const [levelCode, values] of Object.entries(area.levels)) {
      GUIDANCE[areaId][levelCode] = {
        areaId,
        levelCode,
        sourceId: INTERPRETIVE_SOURCE_ID,
        explanationEn: values[0],
        evidenceEn: values[1],
        supportVi: values[2],
        observationPromptsEn: AREA_PROMPTS[areaId] || [],
        comparisonEn: area.comparisonEn,
        comparisonVi: area.comparisonVi,
      };
    }
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
  }
  deepFreeze(GUIDANCE);

  function getGuidance(areaId, levelCode) {
    return GUIDANCE[areaId] && GUIDANCE[areaId][levelCode] || null;
  }

  const api = Object.freeze({ INTERPRETIVE_SOURCE_ID, GUIDANCE, getGuidance });
  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.teacherSupport = root.PSQM.teacherSupport || {};
    root.PSQM.teacherSupport.camPrimaryMs1 = root.PSQM.teacherSupport.camPrimaryMs1 || {};
    root.PSQM.teacherSupport.camPrimaryMs1.guidance = api;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
