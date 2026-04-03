import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateDraft(sop, profile, university) {
  const degreeLevel = university.degreeLevel || 'masters';

  const prompt = `You are helping a student write a Statement of Purpose for graduate/undergraduate admission.

Student Profile:
- Field of study: ${profile?.fieldOfStudy || 'Not provided'}
- Career goals: ${profile?.careerGoals || 'Not provided'}
- GPA: ${profile?.gpa != null ? `${profile.gpa} (${profile.gpaScale})` : 'Not provided'}
- Test scores: TOEFL ${profile?.toeflScore || 'Not provided'}, IELTS ${profile?.ieltsScore || 'Not provided'}
- Extracurriculars: ${profile?.extracurriculars || 'Not provided'}
- Research interests: ${profile?.researchInterests || 'Not provided'}

Target University: ${university.name}
Degree level: ${degreeLevel}

Write a compelling, authentic 500-700 word Statement of Purpose for this student applying to ${university.name}.
Structure it with:
1. A strong opening hook (2-3 sentences)
2. Academic background and relevant experience (1-2 paragraphs)
3. Why this specific program/university (1 paragraph)
4. Career goals and how this degree helps (1 paragraph)
5. A memorable closing (2-3 sentences)

Write in first person. Be specific, not generic. Avoid clichés like "from a young age" or "passionate about". Return only the SOP text, no preamble.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content[0].text;
}

export async function suggestUniversities(profile, degreeLevel) {
  // Build GRE string
  const greparts = [];
  if (profile.greVerbal) greparts.push(`Verbal ${profile.greVerbal}`);
  if (profile.greQuant)  greparts.push(`Quant ${profile.greQuant}`);
  if (profile.greWriting) greparts.push(`Writing ${profile.greWriting}`);
  const greString = greparts.length > 0 ? greparts.join(', ') : 'not specified';

  // Build work experience string
  const workString = (profile.workExperience || profile.workExperienceYears)
    ? [
        profile.workExperience || null,
        profile.workExperienceYears ? `${profile.workExperienceYears} years` : null
      ].filter(Boolean).join(', ')
    : 'not specified';

  // NEB score (undergrad only)
  const nebString = (degreeLevel === 'undergraduate' && profile.nebScore)
    ? `${profile.nebScore}%`
    : 'not applicable';

  const prompt = `You are a university admissions advisor specializing in Nepali students applying to US universities for international degree programs. Students require an F-1 student visa and often need partial or full financial support. Recommend US universities where this student has a realistic and worthwhile chance of admission.

STUDENT PROFILE:
- Degree level: ${degreeLevel}
- Home institution: ${profile.undergraduateInstitution || 'not specified'} (Nepali institution — apply standard international credential adjustment when assessing GPA competitiveness; TU/KU/PU grades are often viewed conservatively by US admissions)
- Field of study: ${profile.fieldOfStudy || 'not specified'}
- Career goals: ${profile.careerGoals || 'not specified'}
- GPA: ${profile.gpa ? `${profile.gpa} / ${profile.gpaScale}` : 'not specified'}
- NEB/HSEB score: ${nebString}
- GRE: ${greString}
- TOEFL: ${profile.toeflScore || 'not specified'}
- IELTS: ${profile.ieltsScore || 'not specified'}
- Research interests: ${profile.researchInterests || 'not specified'}
- Work experience: ${workString}
- Extracurriculars: ${profile.extracurriculars || 'not specified'}
- Community service: ${profile.communityService || 'not specified'}

COUNTRY: USA only. All 9 universities must be in the United States.

TIER DEFINITIONS — apply these strictly based on international student admission data:
- dream: Student profile is below the typical admitted international applicant for this program. Estimated acceptance probability under 20% for international students. High upside if accepted.
- target: Profile roughly matches typical admitted international applicants. Estimated acceptance probability 20–50% for international students.
- safety: Profile exceeds typical requirements for international applicants. Acceptance probability above 60%. Must be programs the student would genuinely enroll in.

HARD RULES:
1. Never suggest a program where the student fails a hard minimum requirement (e.g., TOEFL below 80, IELTS below 6.5, GPA below published minimum). If in doubt, exclude it.
2. Use the full specific campus name — "University of California, San Diego" not "University of California".
3. No two entries may share the same university name.
4. If fewer than 4 profile fields are provided, note the limited information in each reason.
5. For PhD programs, note whether the program typically funds international students via TA/RA.

OUTPUT: Return ONLY a valid JSON array — no markdown, no explanation, no code fences. Exactly 9 objects in this order: 3 dream first, then 3 target, then 3 safety.

[{
  "name": "Full university name including campus",
  "program": "Exact program name as listed on the university website",
  "country": "USA",
  "tier": "dream",
  "reason": "2-3 sentences: why this tier given the student's specific profile, and why this program fits their stated goals"
}]`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Invalid response from Claude API');
  return JSON.parse(jsonMatch[0]);
}

export async function generateLorRequestEmail({ studentName, recommenderName, recommenderEmail, relationship, universities, deadline, fieldOfStudy, careerGoals, programLevel }) {
  const prompt = `Write a short email from ${studentName}, a student from Nepal, to their ${relationship} ${recommenderName}, asking for a letter of recommendation.

Context:
- Applying to: ${universities.join(', ') || 'universities abroad'} for ${programLevel || 'graduate'} programs in ${fieldOfStudy || 'their field'}
- Deadline: ${deadline || 'early December'}
- Career goals: ${careerGoals || 'pursuing advanced education abroad'}

Write this as ${studentName} would actually write it — not a template. Use natural, slightly informal language that feels personal. Reference the specific relationship (${relationship}) in a genuine way, not formulaically. Vary sentence length. Avoid corporate phrases like "I hope this email finds you well", "I am reaching out to", "I would be honored", "I wanted to touch base".

The email should feel like it was written by a real person who knows ${recommenderName}, not generated. Include a specific detail about why they're asking this particular person based on the ${relationship} context.

Keep it short — 120-160 words. Start with "Subject:" then a blank line then the body.
Return only the email, no commentary.`;

  const draft = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  const draftText = draft.content[0].text;

  // Second pass — humanize to reduce AI detection patterns
  const humanized = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{ role: 'user', content: `You are rewriting an email to make it pass AI detection. The goal is to make it sound like a real student typed it quickly, not like it was generated.

Specific things to fix:
- Remove ALL em-dashes (—) and replace with a period or comma or just cut the clause
- Break any sentence that has a "The way X — that's Y" or "X, which Y" structure — these are AI patterns
- Replace polished abstract phrases ("shaped how I think", "work ethic", "genuine appreciation") with blunter, more direct wording
- Make 1-2 sentences noticeably shorter or more abrupt than the others
- Add one small informal word or filler that a student would actually use (like "honestly", "really", "also" in an awkward spot)
- Do NOT make it sound unprofessional — just less perfect

Do not change: subject line, names, universities, deadline, overall meaning.
Return only the rewritten email, no explanation.

Email:
${draftText}` }],
  });

  return humanized.content[0].text;
}

export async function generateCritique(sop, profile, university) {
  const degreeLevel = university.degreeLevel || 'masters';
  const isUndergrad = degreeLevel === 'undergraduate';
  const essayType = isUndergrad ? 'Personal Statement' : 'Statement of Purpose';

  const profileSection = profile ? `
STUDENT PROFILE:
- Applying for: ${degreeLevel.charAt(0).toUpperCase() + degreeLevel.slice(1)} level
- GPA: ${profile.gpa != null ? (profile.gpaScale === 'percentage' ? `${profile.gpa}% (percentage scale)` : profile.gpaScale === 'cgpa_10' ? `${profile.gpa}/10 (CGPA)` : `${profile.gpa}/4.0`) : 'Not provided'}
${isUndergrad
  ? `- SAT: ${profile.satScore || 'Not provided'} | ACT: ${profile.actScore || 'Not provided'}`
  : `- GRE: V${profile.greVerbal || '?'} Q${profile.greQuant || '?'} W${profile.greWriting || '?'}`
}
- TOEFL: ${profile.toeflScore || 'Not provided'} | IELTS: ${profile.ieltsScore || 'Not provided'}
- ${isUndergrad ? 'High School / Previous Institution' : 'Undergraduate Institution'}: ${profile.undergraduateInstitution || 'Not provided'}
- ${isUndergrad ? 'Intended Major' : 'Major / Field'}: ${profile.undergraduateMajor || profile.fieldOfStudy || 'Not provided'}
- Career Goals: ${profile.careerGoals || 'Not provided'}
${isUndergrad
  ? `- Extracurricular Activities: ${profile.extracurriculars || 'Not provided'}`
  : `- Work Experience: ${profile.workExperienceYears ? profile.workExperienceYears + ' years' : 'Not provided'}
- Research Interests: ${profile.researchInterests || 'Not provided'}
- Extracurricular Activities / Volunteering: ${profile.extracurriculars || 'Not provided'}`
}
`.trim() : 'STUDENT PROFILE: Not provided';

  const levelContext = isUndergrad
    ? `This is an undergraduate application. Evaluate the essay for: genuine personal story and passion for the subject, intellectual curiosity, extracurricular depth, clear articulation of why this major/school, and authentic voice. Do NOT penalize for lack of professional experience.`
    : `This is a ${degreeLevel} program application. Evaluate for: research focus, professional experience, academic achievements, fit with the program's faculty/labs, and clarity of career trajectory.`;

  const prompt = `You are an expert admissions counselor reviewing a ${essayType} for a ${degreeLevel} program application.

${profileSection}

TARGET UNIVERSITY: ${university.name}
PROGRAM: ${university.program}
DEGREE LEVEL: ${degreeLevel}

${essayType.toUpperCase()}:
${sop.content.replace(/<[^>]*>/g, '')}

${levelContext}

Provide a detailed, honest critique. Be specific — reference actual sentences or phrases from the essay.

Also assess whether this essay appears to be AI-generated or human-written. Look for: overly generic phrases, lack of personal anecdotes, unnaturally perfect structure, absence of specific details, repetitive sentence patterns, and buzzword-heavy language.

Respond ONLY with valid JSON in this exact format:
{
  "overall_assessment": "weak" | "good" | "strong",
  "scores": {
    "authenticity": <1-10>,
    "specificity": <1-10>,
    "clarity": <1-10>,
    "impact": <1-10>
  },
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "weaknesses": ["<specific weakness 1>", "<specific weakness 2>", "<specific weakness 3>"],
  "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<actionable suggestion 3>", "<actionable suggestion 4>", "<actionable suggestion 5>"],
  "ai_likelihood": <0-100>,
  "ai_reasoning": "<1-2 sentence explanation of why it seems human or AI written>"
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response from Claude API');
  return JSON.parse(jsonMatch[0]);
}
