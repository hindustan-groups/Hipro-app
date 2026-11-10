const express = require('express');
const router = express.Router();
const axios = require('axios');
const prisma = require('../prisma');

// ==========================================
// DYNAMIC ALL-INDIA LOCATIONS API
// Fetches Indian states and cities dynamically from public location API
// Zero hardcoding — live API with high-performance in-memory caching
// ==========================================

const API_STATES_URL = 'https://countriesnow.space/api/v0.1/countries/states';
const API_CITIES_URL = 'https://countriesnow.space/api/v0.1/countries/state/cities';

// In-memory cache to ensure instant responses & prevent API rate limits
const cache = {
  states: null,
  statesLastFetched: 0,
  citiesByState: new Map(), // stateName.toLowerCase() -> { data, timestamp }
  TTL: 1000 * 60 * 60 * 24 // 24 hours
};

// Helper to get active operational hubs from DB
async function getOperationalCityNames() {
  try {
    const active = await prisma.city.findMany({
      where: { isActive: true },
      select: { name: true }
    });
    return new Set(active.map(c => c.name.toLowerCase().trim()));
  } catch (e) {
    return new Set();
  }
}

// 1. GET /api/v1/locations/india/states - Fetch all Indian States & UTs dynamically from API
router.get('/india/states', async (req, res) => {
  try {
    const now = Date.now();
    if (cache.states && (now - cache.statesLastFetched < cache.TTL)) {
      return res.json({
        success: true,
        source: 'cache',
        total: cache.states.length,
        states: cache.states
      });
    }

    const response = await axios.post(
      API_STATES_URL,
      { country: 'India' },
      { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
    );

    const statesData = response.data?.data?.states || [];
    const formattedStates = statesData.map(s => ({
      name: s.name,
      stateCode: s.state_code || ''
    })).sort((a, b) => a.name.localeCompare(b.name));

    cache.states = formattedStates;
    cache.statesLastFetched = now;

    res.json({
      success: true,
      source: 'live_api',
      total: formattedStates.length,
      states: formattedStates
    });
  } catch (error) {
    console.error('Error fetching states from API:', error.message);
    if (cache.states) {
      return res.json({
        success: true,
        source: 'stale_cache',
        total: cache.states.length,
        states: cache.states
      });
    }
    res.status(502).json({
      success: false,
      message: 'Failed to fetch Indian states from location API: ' + error.message
    });
  }
});

// 2. GET /api/v1/locations/india/cities - Fetch all cities for a specific Indian State dynamically from API
router.get('/india/cities', async (req, res) => {
  try {
    const { state, q } = req.query;

    if (!state || !state.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "state" is required (e.g. /api/v1/locations/india/cities?state=Rajasthan)'
      });
    }

    const stateKey = state.trim();
    const cacheKey = stateKey.toLowerCase();
    const now = Date.now();

    let rawCities = [];

    // Check cache
    const cachedEntry = cache.citiesByState.get(cacheKey);
    if (cachedEntry && (now - cachedEntry.timestamp < cache.TTL)) {
      rawCities = cachedEntry.data;
    } else {
      // Fetch live from API
      const response = await axios.post(
        API_CITIES_URL,
        { country: 'India', state: stateKey },
        { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
      );

      rawCities = response.data?.data || [];
      if (Array.isArray(rawCities) && rawCities.length > 0) {
        cache.citiesByState.set(cacheKey, { data: rawCities, timestamp: now });
      }
    }

    const operationalSet = await getOperationalCityNames();

    let filtered = rawCities;
    if (q && q.trim()) {
      const query = q.trim().toLowerCase();
      filtered = filtered.filter(c => c && c.toLowerCase().includes(query));
    }

    // Sort alphabetically and format
    const formattedCities = filtered
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map(cityName => ({
        name: cityName,
        state: stateKey,
        isOperationalHub: operationalSet.has(cityName.toLowerCase())
      }));

    res.json({
      success: true,
      source: cachedEntry ? 'cache' : 'live_api',
      state: stateKey,
      total: formattedCities.length,
      cities: formattedCities
    });
  } catch (error) {
    console.error('Error fetching cities for state:', req.query.state, error.message);
    const cachedEntry = cache.citiesByState.get((req.query.state || '').toLowerCase());
    if (cachedEntry) {
      const operationalSet = await getOperationalCityNames();
      return res.json({
        success: true,
        source: 'stale_cache',
        state: req.query.state,
        total: cachedEntry.data.length,
        cities: cachedEntry.data.map(name => ({
          name,
          state: req.query.state,
          isOperationalHub: operationalSet.has(name.toLowerCase())
        }))
      });
    }
    res.status(502).json({
      success: false,
      message: `Failed to fetch cities for state "${req.query.state}" from location API: ${error.message}`
    });
  }
});

module.exports = router;
