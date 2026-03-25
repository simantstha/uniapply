import express from 'express';

const router = express.Router();

const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY;
const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools.json';

// In-memory store — loaded once at startup, searched locally forever
let schoolsCache = null;
let loadError = null;

async function loadAllSchools() {
  if (!API_KEY) return;
  console.log('[college-search] Loading all US schools from College Scorecard...');

  const allSchools = [];
  let page = 0;
  const perPage = 100;

  try {
    while (true) {
      const url = new URL(BASE_URL);
      url.searchParams.set('fields', 'school.name,school.school_url,school.city,school.state');
      url.searchParams.set('per_page', String(perPage));
      url.searchParams.set('page', String(page));
      // Only 4-year / graduate schools (excludes pure trade/cosmetology schools)
      url.searchParams.set('school.degrees_awarded.predominant__range', '3..4');
      url.searchParams.set('api_key', API_KEY);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || `HTTP ${res.status}`);
      }

      const batch = (data.results || []).map(r => ({
        name: r['school.name'],
        website: r['school.school_url']
          ? (r['school.school_url'].startsWith('http') ? r['school.school_url'] : `https://${r['school.school_url']}`)
          : '',
        city: r['school.city'] || '',
        state: r['school.state'] || '',
      }));

      allSchools.push(...batch);

      const total = data.metadata?.total ?? 0;
      if (allSchools.length >= total || batch.length < perPage) break;
      page++;
    }

    // Sort alphabetically for consistent results
    allSchools.sort((a, b) => a.name.localeCompare(b.name));
    schoolsCache = allSchools;
    console.log(`[college-search] Loaded ${schoolsCache.length} schools.`);
  } catch (err) {
    loadError = err.message;
    console.error('[college-search] Failed to load schools:', err.message);
  }
}

// Start loading in background when module is imported (non-blocking)
loadAllSchools();

// Search endpoint — pure local filter, no API call per request
router.get('/', (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  if (!schoolsCache) {
    // Still loading or no API key — let client fall back to static list
    return res.json([]);
  }

  const query = q.toLowerCase();
  const results = schoolsCache
    .filter(s => s.name.toLowerCase().includes(query))
    .slice(0, 10);

  res.json(results);
});

// Status endpoint so we can check load progress
router.get('/status', (req, res) => {
  res.json({
    loaded: !!schoolsCache,
    count: schoolsCache?.length ?? 0,
    error: loadError,
  });
});

export default router;
