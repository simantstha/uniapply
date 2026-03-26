import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Step 1: Ask Claude to suggest the best URL for program requirements
async function discoverRequirementsUrl(universityName, program, degreeLevel) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `What is the most likely direct URL for admission requirements for "${program}" (${degreeLevel}) at ${universityName}?

Return ONLY a JSON object with this shape:
{"url": "https://...", "confidence": "high" | "medium" | "low"}

If you are not confident in a specific URL, return {"url": null, "confidence": "low"}.
Do not explain. Just JSON.`,
    }],
  });

  const text = message.content[0].text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { url: null, confidence: 'low' };
  try {
    return JSON.parse(match[0]);
  } catch {
    return { url: null, confidence: 'low' };
  }
}

function isSafeUrl(urlString) {
  try {
    const u = new URL(urlString);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (host === 'localhost') return false;
    // Block private/loopback ranges
    const privatePatterns = [
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
    ];
    if (privatePatterns.some(p => p.test(host))) return false;
    return true;
  } catch {
    return false;
  }
}

// Step 2: Fetch URL and strip HTML to plain text
async function fetchPageText(url) {
  if (!isSafeUrl(url)) return null;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UniApply/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Strip scripts, styles, then HTML tags
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // Return first 6000 chars to stay within token limits
    return stripped.length > 100 ? stripped.slice(0, 6000) : null;
  } catch {
    return null;
  }
}

// Step 3: Extract structured requirements via Claude
async function extractRequirements(universityName, program, degreeLevel, pageText) {
  const context = pageText
    ? `Here is content scraped from ${universityName}'s website:\n\n${pageText}\n\nUsing this content and your knowledge,`
    : `Using your knowledge,`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1800,
    messages: [{
      role: 'user',
      content: `${context} extract the admission requirements for "${program}" (${degreeLevel}) at ${universityName}.

IMPORTANT CONTEXT: The applicant is an INTERNATIONAL STUDENT from South/Southeast Asia (e.g. Nepal, India, Bangladesh). Focus on requirements as they apply to international applicants specifically — not domestic US students. This includes international-specific deadlines, English proficiency as mandatory, credential evaluation, financial documentation, and visa requirements.

Return ONLY valid JSON in this exact shape:
{
  "matched_program": "<exact program name as offered by the university>",
  "program_exists": true | false,
  "gpa": { "minimum": <number or null>, "competitive": <number or null>, "scale": "4.0" },
  "gre": { "required": true | false | "optional", "verbal_range": "<e.g. 155-165 or null>", "quant_range": "<e.g. 160-170 or null>", "writing_min": <number or null> },
  "toefl": { "minimum": <number or null>, "note": "<e.g. required for all international applicants>" },
  "ielts": { "minimum": <number or null> },
  "english_proficiency_waiver": "<conditions under which TOEFL/IELTS may be waived, or null>",
  "application_components": ["<e.g. Statement of Purpose>", "<Letters of Recommendation>", "<Transcript>"],
  "lor_count": <number or null>,
  "application_fee": <number or null>,
  "international_deadline": "<application deadline specific to international students, or null if same as domestic>",
  "credential_evaluation": "<e.g. WES evaluation required for foreign transcripts, or null>",
  "financial_docs": "<e.g. bank statement showing $X for proof of funds, or null>",
  "visa": "<brief F-1 student visa note, e.g. university sponsors F-1 visa after admission, or null>",
  "notes": "<1-2 sentence summary of anything notable for international applicants>",
  "source_note": "<'Based on official website content' or 'Based on AI knowledge — verify on official website'>"
}`,
    }],
  });

  const text = message.content[0].text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Invalid Claude response for requirements extraction');
  try {
    return JSON.parse(match[0]);
  } catch {
    throw new Error('Claude returned malformed JSON for requirements extraction');
  }
}

// Fetch institution-level stats from College Scorecard API
async function fetchScorecardStats(universityName) {
  try {
    const encoded = encodeURIComponent(universityName);
    const url = `https://api.data.gov/ed/collegescorecard/v1/schools.json?school.name=${encoded}&fields=school.name,latest.admissions.admission_rate.overall,latest.admissions.sat_scores.midpoint.critical_reading,latest.admissions.sat_scores.midpoint.math,latest.cost.tuition.in_state,latest.cost.tuition.out_of_state&api_key=DEMO_KEY&per_page=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    const school = data?.results?.[0];
    if (!school) return null;
    return {
      acceptance_rate: school['latest.admissions.admission_rate.overall'],
      sat_reading_midpoint: school['latest.admissions.sat_scores.midpoint.critical_reading'],
      sat_math_midpoint: school['latest.admissions.sat_scores.midpoint.math'],
      tuition_in_state: school['latest.cost.tuition.in_state'],
      tuition_out_of_state: school['latest.cost.tuition.out_of_state'],
    };
  } catch {
    return null;
  }
}

// Main entry point — orchestrates all steps
export async function fetchRequirements(universityName, program, degreeLevel) {
  // Step 1: Discover URL
  const { url, confidence } = await discoverRequirementsUrl(universityName, program, degreeLevel);

  // Step 2: Fetch page text if confidence is high or medium
  let pageText = null;
  let sourceUrl = null;
  let sourceType = 'ai_knowledge';

  if (url && confidence !== 'low') {
    pageText = await fetchPageText(url);
    if (pageText) {
      sourceUrl = url;
      sourceType = 'website';
    }
  }

  // Step 3: Extract requirements
  const requirements = await extractRequirements(universityName, program, degreeLevel, pageText);

  // Step 4: Fetch Scorecard stats (non-blocking — null on failure)
  const scorecard = await fetchScorecardStats(universityName);

  return {
    ...requirements,
    scorecard,
    source_url: sourceUrl,
    source_type: sourceType,
  };
}
