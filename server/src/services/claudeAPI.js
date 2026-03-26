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
