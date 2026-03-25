import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateCritique(sop, profile, university) {
  const profileSection = profile ? `
STUDENT PROFILE:
- GPA: ${profile.gpa || 'Not provided'}
- GRE: V${profile.greVerbal || '?'} Q${profile.greQuant || '?'} W${profile.greWriting || '?'}
- TOEFL: ${profile.toeflScore || 'Not provided'} | IELTS: ${profile.ieltsScore || 'Not provided'}
- Institution: ${profile.undergraduateInstitution || 'Not provided'}
- Major: ${profile.undergraduateMajor || 'Not provided'}
- Field of Study: ${profile.fieldOfStudy || 'Not provided'}
- Career Goals: ${profile.careerGoals || 'Not provided'}
- Work Experience: ${profile.workExperienceYears ? profile.workExperienceYears + ' years' : 'Not provided'}
`.trim() : 'STUDENT PROFILE: Not provided';

  const prompt = `You are an expert admissions counselor reviewing a Statement of Purpose for a graduate program application.

${profileSection}

TARGET UNIVERSITY: ${university.name}
PROGRAM: ${university.program}

STATEMENT OF PURPOSE:
${sop.content.replace(/<[^>]*>/g, '')}

Provide a detailed, honest critique. Be specific — reference actual sentences or phrases from the SOP.

Also assess whether this SOP appears to be AI-generated or human-written. Look for: overly generic phrases, lack of personal anecdotes, unnaturally perfect structure, absence of specific details, repetitive sentence patterns, and buzzword-heavy language.

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
