(function initCamPrimaryMs1ClassroomEvidence(root) {
  'use strict';

  const ROWS = [
  [
    "academic-achievement",
    "EE",
    [
      "Solves problems in ways not explicitly taught.",
      "Connects different topics independently.",
      "Consistently produces work above standard.",
      "Surprises the teacher with depth of understanding.",
      "Can explain concepts to peers without prompting."
    ]
  ],
  [
    "academic-achievement",
    "AE",
    [
      "Completes tasks correctly and often adds extra depth.",
      "Grasps new concepts quickly — rarely needs re-teaching.",
      "Produces work noticeably better than average.",
      "Applies knowledge to slightly unfamiliar situations.",
      "A reliable high performer the teacher can count on."
    ]
  ],
  [
    "academic-achievement",
    "ME",
    [
      "Completes set tasks correctly at the expected level.",
      "Understands concepts after they are taught in class.",
      "Makes occasional errors but is generally on track.",
      "Can apply knowledge to familiar task types.",
      "Does not need extra support; does not go beyond."
    ]
  ],
  [
    "academic-achievement",
    "BE",
    [
      "Understanding varies — some days good, some days lost.",
      "Needs the concept re-explained before completing work.",
      "Makes frequent errors or leaves gaps in tasks.",
      "Struggles to apply knowledge to new task types.",
      "Teacher needs to check in regularly to keep on track."
    ]
  ],
  [
    "academic-achievement",
    "WB",
    [
      "Regularly unable to complete tasks without direct help.",
      "Does not retain concepts taught in class.",
      "Work is frequently incomplete, incorrect, or missing.",
      "Cannot yet apply knowledge to even familiar tasks.",
      "Needs one-to-one or small group intervention."
    ]
  ],
  [
    "attitude-towards-learning",
    "EE",
    [
      "Voluntarily asks for harder tasks or extension work.",
      "Brings extra research or ideas from outside class.",
      "Shows genuine excitement about new topics.",
      "Persists through difficulty without giving up.",
      "Motivates and energises others around them."
    ]
  ],
  [
    "attitude-towards-learning",
    "AE",
    [
      "Raises hand often and participates without being called on.",
      "Welcomes challenging tasks with a positive attitude.",
      "Shows clear intrinsic motivation — not just compliance.",
      "Recovers quickly after making mistakes.",
      "Consistent positive energy visible every lesson."
    ]
  ],
  [
    "attitude-towards-learning",
    "ME",
    [
      "Gets on with tasks without complaint.",
      "Participates when called upon or prompted.",
      "Does not resist new topics or challenging activities.",
      "Completes assigned work with a positive attitude.",
      "Consistent but not self-driven or exceptional."
    ]
  ],
  [
    "attitude-towards-learning",
    "BE",
    [
      "Participates only when prompted — not self-initiated.",
      "Shows visible disinterest in certain topics or tasks.",
      "Sometimes complains or delays starting work.",
      "Motivation drops when tasks become difficult.",
      "Needs external encouragement to stay engaged."
    ]
  ],
  [
    "attitude-towards-learning",
    "WB",
    [
      "Regularly refuses or avoids tasks.",
      "Shows persistent negative attitude towards learning.",
      "Gives up immediately when tasks become challenging.",
      "Discourages or distracts others around them.",
      "No visible self-motivation — entirely externally dependent."
    ]
  ],
  [
    "behaviour-personal-development",
    "EE",
    [
      "Never needs reminders — self-regulates completely.",
      "Steps in calmly when peer conflict arises.",
      "Shows maturity well beyond their age group.",
      "Actively encourages others to follow the rules.",
      "Teacher can rely on this student in any situation."
    ]
  ],
  [
    "behaviour-personal-development",
    "AE",
    [
      "Always respectful to teachers and peers — no reminders needed.",
      "Takes responsibility for actions without being asked.",
      "Remains calm and composed under pressure.",
      "Handles setbacks or frustrations maturely.",
      "A consistently positive presence in the classroom."
    ]
  ],
  [
    "behaviour-personal-development",
    "ME",
    [
      "Follows school rules consistently.",
      "Respectful to teachers and classmates.",
      "Rarely needs reminders about behaviour.",
      "Handles disagreements calmly most of the time.",
      "Meets expected standard — no concerns."
    ]
  ],
  [
    "behaviour-personal-development",
    "BE",
    [
      "Sometimes disrespectful or disruptive in class.",
      "Occasional conflict with peers that needs adult support.",
      "Reacts emotionally rather than calmly to setbacks.",
      "Needs reminders to follow rules or routines.",
      "Behaviour varies — better on some days than others."
    ]
  ],
  [
    "behaviour-personal-development",
    "WB",
    [
      "Regularly disrupts lessons or other students.",
      "Persistent disrespect towards teacher or peers.",
      "Reacts strongly and often disproportionately.",
      "Has not responded to standard reminders or consequences.",
      "Requires a specific behaviour plan or support structure."
    ]
  ],
  [
    "completion-classwork-homework-secondary",
    "EE",
    [
      "Never misses a deadline — 100% submission record.",
      "Work quality is consistently above what is required.",
      "Adds extra detail, diagrams, or examples unprompted.",
      "Presentation and organisation is excellent.",
      "Takes obvious pride in the quality of their output."
    ]
  ],
  [
    "completion-classwork-homework-secondary",
    "AE",
    [
      "Submits work on time in virtually all cases.",
      "Quality is consistently above the minimum expected.",
      "Work is well-presented and thoroughly completed.",
      "Rarely needs chasing for late submissions.",
      "A reliable and dependable student for submission."
    ]
  ],
  [
    "completion-classwork-homework-secondary",
    "ME",
    [
      "Submits classwork and homework on time in most cases.",
      "Work quality meets but does not exceed expectations.",
      "Occasional minor gaps — not a recurring pattern.",
      "Does not need constant reminders to complete work.",
      "Reliable but not outstanding in submission quality."
    ]
  ],
  [
    "completion-classwork-homework-secondary",
    "BE",
    [
      "Regularly submits work late or incomplete.",
      "Quality is often below the expected standard.",
      "Needs reminders from teacher to start or finish tasks.",
      "Sometimes submits work with little visible effort.",
      "Homework completion is a recurring concern."
    ]
  ],
  [
    "completion-classwork-homework-secondary",
    "WB",
    [
      "Regularly does not submit classwork or homework.",
      "When submitted, work is often incomplete or incorrect.",
      "Does not respond to standard reminders.",
      "Has not developed consistent work habits.",
      "Requires structured support to complete any tasks."
    ]
  ],
  [
    "communication-skills",
    "EE",
    [
      "Adjusts language and tone depending on the audience.",
      "Uses precise, subject-specific vocabulary accurately.",
      "Structures spoken and written responses persuasively.",
      "Actively listens and builds on others ideas.",
      "Communicates complex ideas in simple, clear terms."
    ]
  ],
  [
    "communication-skills",
    "AE",
    [
      "Shares ideas clearly without needing prompts.",
      "Written and spoken work is consistently well-structured.",
      "Uses appropriate vocabulary for the subject and context.",
      "Engages confidently in discussion and debate.",
      "Ideas are easy to follow and logically organised."
    ]
  ],
  [
    "communication-skills",
    "ME",
    [
      "Shares ideas clearly when asked.",
      "Writing and speaking meet expected standards.",
      "Chooses mostly appropriate vocabulary.",
      "Communicates respectfully in group settings.",
      "Occasionally unclear but generally understood."
    ]
  ],
  [
    "communication-skills",
    "BE",
    [
      "Often needs prompting to share ideas in class.",
      "Writing or speaking is sometimes hard to follow.",
      "Vocabulary choices are sometimes incorrect or limited.",
      "Loses track of ideas mid-sentence or mid-paragraph.",
      "Communication style occasionally causes misunderstanding."
    ]
  ],
  [
    "communication-skills",
    "WB",
    [
      "Rarely volunteers ideas; very limited verbal participation.",
      "Writing is very difficult to understand.",
      "Vocabulary is highly restricted or mostly incorrect.",
      "Cannot yet organise thoughts into a coherent response.",
      "Needs significant teacher scaffolding for any communication task."
    ]
  ],
  [
    "working-collaboratively",
    "EE",
    [
      "Naturally leads or organises the group without being asked.",
      "Actively ensures quieter members have a voice.",
      "Mediates calmly when group disagreements arise.",
      "Redistributes tasks if someone is struggling.",
      "The group always performs better with this student."
    ]
  ],
  [
    "working-collaboratively",
    "AE",
    [
      "Takes initiative in group tasks without dominating.",
      "Encourages and supports quieter group members.",
      "Actively listens and responds constructively to others ideas.",
      "Flexible — adapts their role based on group needs.",
      "Groups with this student are noticeably more productive."
    ]
  ],
  [
    "working-collaboratively",
    "ME",
    [
      "Completes their share of group tasks reliably.",
      "Respectful and cooperative with group members.",
      "Does not dominate or withdraw from group work.",
      "Listens to others and accepts feedback.",
      "A dependable group member — not the leader but not a problem."
    ]
  ],
  [
    "working-collaboratively",
    "BE",
    [
      "Occasionally argues with group members or ignores others ideas.",
      "Sometimes lets others do all the work.",
      "Can be inflexible about their own ideas or roles.",
      "Needs reminders to listen and participate fairly.",
      "Group dynamics sometimes suffer with this student present."
    ]
  ],
  [
    "working-collaboratively",
    "WB",
    [
      "Regularly refuses to participate in group tasks.",
      "Creates conflict or hostility within the group.",
      "Dismisses or overrides other students contributions.",
      "Group cannot function effectively with this student current behaviour.",
      "Requires teacher supervision throughout all group activities."
    ]
  ],
  [
    "creativity-critical-thinking",
    "EE",
    [
      "Produces ideas or solutions no one else thought of.",
      "Questions assumptions — asks why and what if instinctively.",
      "Analyses from multiple angles without being prompted.",
      "Takes creative risks and tries unconventional approaches.",
      "Surprises the teacher with the originality of their thinking."
    ]
  ],
  [
    "creativity-critical-thinking",
    "AE",
    [
      "Goes beyond the obvious answer to explore alternatives.",
      "Asks insightful questions that deepen class discussion.",
      "Finds creative angles or approaches not immediately obvious.",
      "Evaluates their own ideas critically before presenting.",
      "Generates fresh ideas consistently across different tasks."
    ]
  ],
  [
    "creativity-critical-thinking",
    "ME",
    [
      "Follows the task creatively but within expected boundaries.",
      "Can identify an obvious problem or improvement when asked.",
      "Offers relevant ideas in brainstorming activities.",
      "Thinks through a problem with some structure.",
      "Creative when supported — not yet independently driven."
    ]
  ],
  [
    "creativity-critical-thinking",
    "BE",
    [
      "Rarely generates ideas independently.",
      "Often copies peers or reproduces teacher examples.",
      "Struggles to think of alternatives when first attempt fails.",
      "Needs significant scaffolding to approach open-ended tasks.",
      "Critical thinking is surface-level — rarely goes deeper."
    ]
  ],
  [
    "creativity-critical-thinking",
    "WB",
    [
      "Cannot start creative or open-ended tasks independently.",
      "Ideas, when produced, are heavily copied or minimal.",
      "Does not yet reflect on or evaluate their own thinking.",
      "Avoids tasks that require original thought.",
      "Requires step-by-step guided support to produce any output."
    ]
  ],
  [
    "equipment-resources",
    "EE",
    [
      "Always has every required item — 100% of the time.",
      "Organises materials in ways that help them work more efficiently.",
      "Brings additional resources independently.",
      "Helps others who have forgotten equipment without being asked.",
      "Equipment is always well-maintained and presentation￾ready."
    ]
  ],
  [
    "equipment-resources",
    "AE",
    [
      "Arrives to every lesson with all required materials.",
      "Equipment is organised and ready to use from the start.",
      "Uses resources carefully and respectfully.",
      "Never needs to borrow from classmates or teacher.",
      "Preparation contributes positively to their learning."
    ]
  ],
  [
    "equipment-resources",
    "ME",
    [
      "Has required materials in most lessons.",
      "Uses equipment appropriately when directed.",
      "Occasional minor forgetfulness — not a pattern.",
      "Takes reasonable care of resources.",
      "Reliable in preparation — nothing to worry about."
    ]
  ],
  [
    "equipment-resources",
    "BE",
    [
      "Regularly forgets key items such as books, pens, or materials.",
      "Often needs to borrow from classmates or teacher.",
      "Forgetting equipment has become a recognisable pattern.",
      "Unpreparedness sometimes delays the start of their work.",
      "Has not yet taken responsibility for their own preparation."
    ]
  ],
  [
    "equipment-resources",
    "WB",
    [
      "Rarely brings required materials — consistently unprepared.",
      "Cannot begin work independently due to missing equipment.",
      "Has not improved despite repeated reminders and conversations.",
      "Relies on teacher or peers to supply materials every lesson.",
      "Lack of preparation significantly impacts learning."
    ]
  ]
];
  const matrix = {};
  for (const [area, level, items] of ROWS) {
    if (!matrix[area]) matrix[area] = {};
    matrix[area][level] = {
      area,
      level,
      derivedFrom: ['cam-primary-ms1-official'],
      interpretiveSourceId: 'cam-primary-ms1-interpretive',
      items: [...items],
    };
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
    return value;
  }

  const CLASSROOM_EVIDENCE = deepFreeze(matrix);
  if (root) { root.PSQM = root.PSQM || {}; root.PSQM.camPrimaryMs1ClassroomEvidence = CLASSROOM_EVIDENCE; }
  if (typeof module !== 'undefined' && module.exports) module.exports = { CLASSROOM_EVIDENCE };
})(typeof globalThis !== 'undefined' ? globalThis : this);
