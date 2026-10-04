(function initCamPrimaryMs1Official(root) {
  'use strict';

  const OFFICIAL_SOURCE_ID = 'cam-primary-ms1-official';
  const LEVEL_CODES = Object.freeze(['EE', 'AE', 'ME', 'BE', 'WB']);
  const LEVEL_NAMES = Object.freeze({
    EE: 'Exceeding Expectations',
    AE: 'Above Expectations',
    ME: 'Meeting Expectations',
    BE: 'Below Expectations',
    WB: 'Well Below Expectations',
  });

  const RAW = Object.freeze({
    academic: Object.freeze({
      title: 'Academic Achievement',
      criteria: Object.freeze({
        EE: 'Demonstrates exceptional understanding of concepts and consistently applies knowledge and skills accurately, independently, and in unfamiliar contexts.',
        AE: 'Demonstrates a strong understanding of concepts and regularly applies knowledge and skills effectively and independently.',
        ME: 'Demonstrates satisfactory understanding of concepts and applies knowledge and skills appropriately to meet expected standards.',
        BE: 'Understanding and application of knowledge are inconsistent and additional support is sometimes required to meet expected standards.',
        WB: 'Frequently demonstrates limited understanding of concepts and requires significant support to apply knowledge and skills effectively.',
      }),
    }),
    attitude: Object.freeze({
      title: 'Attitude Towards Learning',
      criteria: Object.freeze({
        EE: 'Demonstrates exceptional enthusiasm for learning, consistently seeks challenges, and takes initiative beyond expectations.',
        AE: 'Shows a highly positive attitude towards learning and regularly engages with new challenges.',
        ME: 'Approaches learning positively and participates appropriately in classroom activities.',
        BE: 'Engagement with learning is inconsistent and greater effort or motivation is sometimes required.',
        WB: 'Frequently demonstrates a negative attitude towards learning and requires significant encouragement to engage.',
      }),
    }),
    behaviour: Object.freeze({
      title: 'Behaviour and Personal Development',
      criteria: Object.freeze({
        EE: 'Consistently demonstrates exemplary behaviour, maturity, self-discipline, and respect for others.',
        AE: 'Demonstrates positive behaviour, responsibility, and respect for others at all times.',
        ME: 'Behaves appropriately and demonstrates respect for others and the school environment.',
        BE: 'Behaviour is sometimes inconsistent and reminders are occasionally required to meet expectations.',
        WB: 'Frequently demonstrates inappropriate behaviour or poor choices and requires substantial support to meet expectations.',
      }),
    }),
    'classwork-homework': Object.freeze({
      title: 'Completion of classwork/Homework (Secondary)',
      criteria: Object.freeze({
        EE: 'Consistently completes all classwork/homework to a high standard and often exceeds expected requirements.',
        AE: 'Completes classwork reliably and produces classwork/homework of a consistently good standard.',
        ME: 'Completes most assigned classwork/homework and meets expected requirements.',
        BE: 'Does not always complete assigned classwork/homework or may require reminders and support to stay on task.',
        WB: 'Frequently leaves classwork/homework incomplete and requires significant support to complete tasks.',
      }),
    }),
    communication: Object.freeze({
      title: 'Communication Skills',
      criteria: Object.freeze({
        EE: 'Communicates ideas clearly, confidently, and thoughtfully, adapting appropriately to different audiences and situations.',
        AE: 'Communicates effectively and confidently, sharing ideas clearly in a range of situations.',
        ME: 'Communicates appropriately and shares ideas effectively in most situations.',
        BE: 'Sometimes experiences difficulty communicating ideas clearly or appropriately.',
        WB: 'Frequently struggles to communicate ideas effectively and requires substantial support.',
      }),
    }),
    collaboration: Object.freeze({
      title: 'Working Collaboratively',
      criteria: Object.freeze({
        EE: 'Consistently collaborates exceptionally well with others, supports peers, and contributes positively to group success.',
        AE: 'Works effectively with others, contributes positively, and demonstrates strong cooperation skills.',
        ME: 'Works appropriately with others and participates constructively in group activities.',
        BE: 'Sometimes experiences difficulty working collaboratively or contributing effectively to group tasks.',
        WB: 'Frequently struggles to work cooperatively with others and requires substantial support during group activities.',
      }),
    }),
    'creativity-critical-thinking': Object.freeze({
      title: 'Creativity and Critical thinking',
      criteria: Object.freeze({
        EE: 'Consistently demonstrates exceptional creativity, originality, and critical thinking, applying ideas thoughtfully to solve complex problems.',
        AE: 'Demonstrates strong creativity and critical thinking, regularly developing thoughtful ideas and effective solutions.',
        ME: 'Demonstrates appropriate creativity and critical thinking when developing ideas and solving problems.',
        BE: 'Sometimes finds it difficult to think creatively or critically and may require support to develop ideas or solutions.',
        WB: 'Frequently struggles to think creatively or critically and requires substantial support to generate ideas or solve problems.',
      }),
    }),
    'equipment-resources': Object.freeze({
      title: 'Equipment and Resources',
      criteria: Object.freeze({
        EE: 'Is consistently well-prepared, organised, and makes excellent use of all required equipment and resources.',
        AE: 'Is well-prepared and uses equipment and resources responsibly and effectively.',
        ME: 'Usually brings required equipment and uses resources appropriately.',
        BE: 'Is occasionally unprepared or does not always use equipment and resources appropriately.',
        WB: 'Frequently arrives unprepared and requires regular reminders regarding equipment and resources.',
      }),
    }),
  });

  const OFFICIAL_AREAS = Object.freeze(Object.entries(RAW).map(([id, value]) =>
    Object.freeze({ id, title: value.title })
  ));

  const OFFICIAL_MATRIX = {};
  for (const [areaId, area] of Object.entries(RAW)) {
    OFFICIAL_MATRIX[areaId] = {};
    for (const code of LEVEL_CODES) {
      OFFICIAL_MATRIX[areaId][code] = Object.freeze({
        areaId,
        levelCode: code,
        levelName: LEVEL_NAMES[code],
        officialTitle: area.title,
        criterion: area.criteria[code],
        sourceId: OFFICIAL_SOURCE_ID,
      });
    }
    Object.freeze(OFFICIAL_MATRIX[areaId]);
  }
  Object.freeze(OFFICIAL_MATRIX);

  function getOfficialCriterion(areaId, levelCode) {
    return OFFICIAL_MATRIX[areaId] && OFFICIAL_MATRIX[areaId][levelCode] || null;
  }

  const api = Object.freeze({
    OFFICIAL_SOURCE_ID,
    LEVEL_CODES,
    LEVEL_NAMES,
    OFFICIAL_AREAS,
    OFFICIAL_MATRIX,
    getOfficialCriterion,
  });

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.teacherSupport = root.PSQM.teacherSupport || {};
    root.PSQM.teacherSupport.camPrimaryMs1 = root.PSQM.teacherSupport.camPrimaryMs1 || {};
    root.PSQM.teacherSupport.camPrimaryMs1.official = api;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
