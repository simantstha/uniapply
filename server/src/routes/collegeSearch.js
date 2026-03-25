import express from 'express';

const router = express.Router();

const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY;
const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools.json';

// Simple in-memory cache: key → { results, expiresAt }
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  if (!API_KEY) {
    return res.status(503).json({ error: 'no_api_key' });
  }

  const cacheKey = q.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.results);
  }

  try {
    const url = new URL(BASE_URL);
    url.searchParams.set('school.name', q);
    url.searchParams.set('fields', 'school.name,school.school_url,school.city,school.state');
    url.searchParams.set('per_page', '10');
    url.searchParams.set('sort', 'school.name:asc');
    url.searchParams.set('api_key', API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(503).json({ error: 'api_error', details: data.error?.message });
    }

    const results = (data.results || []).map(r => ({
      name: r['school.name'],
      website: r['school.school_url'] ? (r['school.school_url'].startsWith('http') ? r['school.school_url'] : `https://${r['school.school_url']}`) : '',
      city: r['school.city'],
      state: r['school.state'],
    }));

    cache.set(cacheKey, { results, expiresAt: Date.now() + CACHE_TTL });
    res.json(results);
  } catch (err) {
    res.status(503).json({ error: 'fetch_failed', details: err.message });
  }
});

export default router;
