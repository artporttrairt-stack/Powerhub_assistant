(function initCamPrimaryMs1OfficialCriteria(root) {
  'use strict';

  const SOURCE_ID = 'cam-primary-ms1-official';
  function cell(criterion) {
    return Object.freeze({ criterion, sourceId: SOURCE_ID, sourceAuthority: 'official', supported: true });
  }
  function area(definition) {
    return Object.freeze(definition);
  }

  const OFFICIAL_CRITERIA = Object.freeze({
    'academic-achievement': area({
      EE: cell('Demonstrates exceptional understanding of concepts and consistently applies knowledge and skills accurately, independently, and in unfamiliar contexts.'),
      AE: cell('Demonstrates a strong understanding of concepts and regularly applies knowledge and skills effectively and independently.'),
      ME: cell('Demonstrates satisfactory understanding of concepts and applies knowledge and skills appropriately to meet expected standards.'),
      BE: cell('Understanding and application of knowledge are inconsistent and additional support is sometimes required to meet expected standards.'),
      WB: cell('Frequently demonstrates limited understanding of concepts and requires significant support to apply knowledge and skills effectively.'),
    }),
    'attitude-towards-learning': area({
      EE: cell('Demonstrates exceptional enthusiasm for learning, consistently seeks challenges, and takes initiative beyond expectations.'),
      AE: cell('Shows a highly positive attitude towards learning and regularly engages with new challenges.'),
      ME: cell('Approaches learning positively and participates appropriately in classroom activities.'),
      BE: cell('Engagement with learning is inconsistent and greater effort or motivation is sometimes required.'),
      WB: cell('Frequently demonstrates a negative attitude towards learning and requires significant encouragement to engage.'),
    }),
    'behaviour-personal-development': area({
      EE: cell('Consistently demonstrates exemplary behaviour, maturity, self-discipline, and respect for others.'),
      AE: cell('Demonstrates positive behaviour, responsibility, and respect for others at all times.'),
      ME: cell('Behaves appropriately and demonstrates respect for others and the school environment.'),
      BE: cell('Behaviour is sometimes inconsistent and reminders are occasionally required to meet expectations.'),
      WB: cell('Frequently demonstrates inappropriate behaviour or poor choices and requires substantial support to meet expectations.'),
    }),
    'completion-classwork-homework-secondary': area({
      EE: cell('Consistently completes all classwork/homework to a high standard and often exceeds expected requirements.'),
      AE: cell('Completes classwork reliably and produces classwork/homework of a consistently good standard.'),
      ME: cell('Completes most assigned classwork/homework and meets expected requirements.'),
      BE: cell('Does not always complete assigned classwork/homework or may require reminders and support to stay on task.'),
      WB: cell('Frequently leaves classwork/homework incomplete and requires significant support to complete tasks.'),
    }),
    'communication-skills': area({
      EE: cell('Communicates ideas clearly, confidently, and thoughtfully, adapting appropriately to different audiences and situations.'),
      AE: cell('Communicates effectively and confidently, sharing ideas clearly in a range of situations.'),
      ME: cell('Communicates appropriately and shares ideas effectively in most situations.'),
      BE: cell('Sometimes experiences difficulty communicating ideas clearly or appropriately.'),
      WB: cell('Frequently struggles to communicate ideas effectively and requires substantial support.'),
    }),
    'working-collaboratively': area({
      EE: cell('Consistently collaborates exceptionally well with others, supports peers, and contributes positively to group success.'),
      AE: cell('Works effectively with others, contributes positively, and demonstrates strong cooperation skills.'),
      ME: cell('Works appropriately with others and participates constructively in group activities.'),
      BE: cell('Sometimes experiences difficulty working collaboratively or contributing effectively to group tasks.'),
      WB: cell('Frequently struggles to work cooperatively with others and requires substantial support during group activities.'),
    }),
    'creativity-critical-thinking': area({
      EE: cell('Consistently demonstrates exceptional creativity, originality, and critical thinking, applying ideas thoughtfully to solve complex problems.'),
      AE: cell('Demonstrates strong creativity and critical thinking, regularly developing thoughtful ideas and effective solutions.'),
      ME: cell('Demonstrates appropriate creativity and critical thinking when developing ideas and solving problems.'),
      BE: cell('Sometimes finds it difficult to think creatively or critically and may require support to develop ideas or solutions.'),
      WB: cell('Frequently struggles to think creatively or critically and requires substantial support to generate ideas or solve problems.'),
    }),
    'equipment-resources': area({
      EE: cell('Is consistently well-prepared, organised, and makes excellent use of all required equipment and resources.'),
      AE: cell('Is well-prepared and uses equipment and resources responsibly and effectively.'),
      ME: cell('Usually brings required equipment and uses resources appropriately.'),
      BE: cell('Is occasionally unprepared or does not always use equipment and resources appropriately.'),
      WB: cell('Frequently arrives unprepared and requires regular reminders regarding equipment and resources.'),
    }),
  });

  if (root) {
    root.PSQM = root.PSQM || {};
    root.PSQM.camPrimaryMs1OfficialCriteria = OFFICIAL_CRITERIA;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { OFFICIAL_CRITERIA, SOURCE_ID };
})(typeof globalThis !== 'undefined' ? globalThis : this);
