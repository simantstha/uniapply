import express from 'express';

const router = express.Router();

// College Scorecard API — US Dept of Education
// ~6,800 accredited US institutions. DEMO_KEY = 30 req/hour free, no signup.
// Set COLLEGE_SCORECARD_API_KEY in .env for higher limits (free at api.data.gov/signup)
const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY || 'DEMO_KEY';
const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools.json';

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  try {
    const url = new URL(BASE_URL);
    url.searchParams.set('school.name', q);
    url.searchParams.set('fields', 'school.name,school.school_url,school.city,school.state');
    url.searchParams.set('per_page', '10');
    url.searchParams.set('sort', 'school.name:asc');
    url.searchParams.set('api_key', API_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`API error ${response.status}`);

    const data = await response.json();
    const results = (data.results || []).map(r => ({
      name: r['school.name'],
      website: r['school.school_url'] ? `https://${r['school.school_url']}` : '',
      city: r['school.city'],
      state: r['school.state'],
    }));

    res.json(results);
  } catch (err) {
    res.status(502).json({ error: 'Search unavailable', details: err.message });
  }
});

export default router;
