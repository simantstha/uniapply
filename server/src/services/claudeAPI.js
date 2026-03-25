import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateCritique(sop, profile, university) {
  const degreeLevel = university.degreeLevel || 'masters';
  const isUndergrad = degreeLevel === 'undergraduate';
  const essayType = isUndergrad ? 'Personal Statement' : 'Statement of Purpose';

  const profileSection = profile ? `
STUDENT PROFILE:
- Applying for: ${degreeLevel.charAt(0).toUpperCase() + degreeLevel.slice(1)} level
- GPA: ${profile.gpa || 'Not provided'}
${isUndergrad
  ? `- SAT: ${profile.satScore || 'Not provided'} | ACT: ${profile.actScore || 'Not provided'}`
  : `- GRE: V${profile.greVerbal || '?'} Q${profile.greQuant || '?'} W${profile.greWriting || '?'}`
}
- TOEFL: ${profile.toeflScore || 'Not provided'} | IELTS: ${profile.ieltsScore || 'Not provided'}
- ${isUndergrad ? 'High School / Previous Institution' : 'Undergraduate Institution'}: ${profile.undergraduateInstitution || 'Not provided'}
- ${isUndergrad ? 'Intended Major' : 'Major / Field'}: ${profile.undergraduateMajor || profile.fieldOfStudy || 'Not provided'}
- Career Goals: ${profile.careerGoals || 'Not provided'}
${!isUndergrad ? `- Work Experience: ${profile.workExperienceYears ? profile.workExperienceYears + ' years' : 'Not provided'}` : ''}
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
