const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const OFFICIAL_PATH = path.resolve(__dirname, '../../../../../extension/modules/teacher-support/packs/cam-primary/ms1/content/official.js');

const EXPECTED = {
  'academic': {
    title: 'Academic Achievement',
    EE: 'Demonstrates exceptional understanding of concepts and consistently applies knowledge and skills accurately, independently, and in unfamiliar contexts.',
    AE: 'Demonstrates a strong understanding of concepts and regularly applies knowledge and skills effectively and independently.',
    ME: 'Demonstrates satisfactory understanding of concepts and applies knowledge and skills appropriately to meet expected standards.',
    BE: 'Understanding and application of knowledge are inconsistent and additional support is sometimes required to meet expected standards.',
    WB: 'Frequently demonstrates limited understanding of concepts and requires significant support to apply knowledge and skills effectively.',
  },
  'attitude': {
    title: 'Attitude Towards Learning',
    EE: 'Demonstrates exceptional enthusiasm for learning, consistently seeks challenges, and takes initiative beyond expectations.',
    AE: 'Shows a highly positive attitude towards learning and regularly engages with new challenges.',
    ME: 'Approaches learning positively and participates appropriately in classroom activities.',
    BE: 'Engagement with learning is inconsistent and greater effort or motivation is sometimes required.',
    WB: 'Frequently demonstrates a negative attitude towards learning and requires significant encouragement to engage.',
  },
  'behaviour': {
    title: 'Behaviour and Personal Development',
    EE: 'Consistently demonstrates exemplary behaviour, maturity, self-discipline, and respect for others.',
    AE: 'Demonstrates positive behaviour, responsibility, and respect for others at all times.',
    ME: 'Behaves appropriately and demonstrates respect for others and the school environment.',
    BE: 'Behaviour is sometimes inconsistent and reminders are occasionally required to meet expectations.',
    WB: 'Frequently demonstrates inappropriate behaviour or poor choices and requires substantial support to meet expectations.',
  },
  'classwork-homework': {
    title: 'Completion of classwork/Homework (Secondary)',
    EE: 'Consistently completes all classwork/homework to a high standard and often exceeds expected requirements.',
    AE: 'Completes classwork reliably and produces classwork/homework of a consistently good standard.',
    ME: 'Completes most assigned classwork/homework and meets expected requirements.',
    BE: 'Does not always complete assigned classwork/homework or may require reminders and support to stay on task.',
    WB: 'Frequently leaves classwork/homework incomplete and requires significant support to complete tasks.',
  },
  'communication': {
    title: 'Communication Skills',
    EE: 'Communicates ideas clearly, confidently, and thoughtfully, adapting appropriately to different audiences and situations.',
    AE: 'Communicates effectively and confidently, sharing ideas clearly in a range of situations.',
    ME: 'Communicates appropriately and shares ideas effectively in most situations.',
    BE: 'Sometimes experiences difficulty communicating ideas clearly or appropriately.',
    WB: 'Frequently struggles to communicate ideas effectively and requires substantial support.',
  },
  'collaboration': {
    title: 'Working Collaboratively',
    EE: 'Consistently collaborates exceptionally well with others, supports peers, and contributes positively to group success.',
    AE: 'Works effectively with others, contributes positively, and demonstrates strong cooperation skills.',
    ME: 'Works appropriately with others and participates constructively in group activities.',
    BE: 'Sometimes experiences difficulty working collaboratively or contributing effectively to group tasks.',
    WB: 'Frequently struggles to work cooperatively with others and requires substantial support during group activities.',
  },
  'creativity-critical-thinking': {
    title: 'Creativity and Critical thinking',
    EE: 'Consistently demonstrates exceptional creativity, originality, and critical thinking, applying ideas thoughtfully to solve complex problems.',
    AE: 'Demonstrates strong creativity and critical thinking, regularly developing thoughtful ideas and effective solutions.',
    ME: 'Demonstrates appropriate creativity and critical thinking when developing ideas and solving problems.',
    BE: 'Sometimes finds it difficult to think creatively or critically and may require support to develop ideas or solutions.',
    WB: 'Frequently struggles to think creatively or critically and requires substantial support to generate ideas or solve problems.',
  },
  'equipment-resources': {
    title: 'Equipment and Resources',
    EE: 'Is consistently well-prepared, organised, and makes excellent use of all required equipment and resources.',
    AE: 'Is well-prepared and uses equipment and resources responsibly and effectively.',
    ME: 'Usually brings required equipment and uses resources appropriately.',
    BE: 'Is occasionally unprepared or does not always use equipment and resources appropriately.',
    WB: 'Frequently arrives unprepared and requires regular reminders regarding equipment and resources.',
  },
};

test('official module contains exactly 8 categories x 5 levels with canonical provenance', () => {
  const { LEVEL_CODES, OFFICIAL_AREAS, OFFICIAL_MATRIX, OFFICIAL_SOURCE_ID } = require(OFFICIAL_PATH);
  assert.deepEqual(LEVEL_CODES, ['EE', 'AE', 'ME', 'BE', 'WB']);
  assert.equal(OFFICIAL_AREAS.length, 8);
  assert.equal(Object.keys(OFFICIAL_MATRIX).length, 8);
  assert.equal(OFFICIAL_SOURCE_ID, 'cam-primary-ms1-official');

  let cells = 0;
  for (const area of OFFICIAL_AREAS) {
    const expected = EXPECTED[area.id];
    assert.ok(expected, area.id);
    assert.equal(area.title, expected.title);
    for (const code of LEVEL_CODES) {
      const cell = OFFICIAL_MATRIX[area.id][code];
      cells += 1;
      assert.equal(cell.areaId, area.id);
      assert.equal(cell.levelCode, code);
      assert.equal(cell.officialTitle, expected.title);
      assert.equal(cell.criterion, expected[code]);
      assert.equal(cell.sourceId, 'cam-primary-ms1-official');
    }
  }
  assert.equal(cells, 40);
});

test('official content has no invented score thresholds, formulas, or recommendation fields', () => {
  const { OFFICIAL_MATRIX } = require(OFFICIAL_PATH);
  const serialized = JSON.stringify(OFFICIAL_MATRIX);
  for (const token of ['percentage', 'threshold', 'recommendedGrade', 'confidence', 'formula']) {
    assert.equal(serialized.includes(token), false, token);
  }
});
