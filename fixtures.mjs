const API_BASE = 'https://api.theoddsapi.com';
const SPORT_KEYS = {
  football: { env: 'VANTABET_FOOTBALL_KEYS', defaults: [
    'soccer_epl',
    'soccer_uefa_champs_league',
    'soccer_uefa_europa_league',
    'soccer_spain_la_liga',
    'soccer_italy_serie_a',
    'soccer_germany_bundesliga',
    'soccer_france_ligue_one',
    'soccer_usa_mls'
  ] },
  basketball: { env: 'VANTABET_BASKETBALL_KEYS', defaults: [
    'basketball_nba', 'basketball_euroleague', 'basketball_wnba', 'basketball_ncaab'
  ] },
  tennis: { env: 'VANTABET_TENNIS_KEYS', defaults: ['tennis'] },
  // Provider coverage currently identifies NRL rugby league, not worldwide rugby union.
  rugby: { env: 'VANTABET_RUGBY_KEYS', defaults: ['rugbyleague_nrl'] }
};

const json = (body, statusCode = 200) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=60, s-maxage=60',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify(body)
});

function getKeys(sport) {
  const config = SPORT_KEYS[sport];
  if (!config) return [];
  const override = String(process.env[config.env] || '').trim();
  const keys = override ? override.split(',').map(x => x.trim()).filter(Boolean) : config.defaults;
  return [...new Set(keys)].slice(0, 8);
}

export const handler = async (event) => {
  const params = event.queryStringParameters || {};
  const sport = (params.sport || 'football').toLowerCase();
  const range = (params.range || 'today').toLowerCase();
  const apiKey = process.env.THE_ODDS_API_KEY;

  if (!['football', 'rugby', 'basketball', 'tennis'].includes(sport)) {
    return json({ error: 'Unsupported sport.' }, 400);
  }
  if (!apiKey) return json({ error: 'The server is missing THE_ODDS_API_KEY.' }, 503);
  const keys = getKeys(sport);
  if (!keys.length) return json({ error: `No provider sport keys configured for ${sport}. Set ${SPORT_KEYS[sport].env} in Netlify environment variables.` }, 503);

  const now = new Date();
  const from = new Date(now);
  const to = new Date(now);
  if (range === 'tomorrow') {
    from.setUTCDate(from.getUTCDate() + 1); from.setUTCHours(0, 0, 0, 0);
    to.setTime(from.getTime()); to.setUTCHours(23, 59, 59, 999);
  } else if (range === 'week') {
    from.setTime(now.getTime());
    to.setUTCDate(to.getUTCDate() + 7);
  } else {
    from.setTime(now.getTime());
    from.setUTCHours(0, 0, 0, 0);
    to.setTime(from.getTime()); to.setUTCDate(to.getUTCDate() + 1);
  }

  try {
    const responses = await Promise.all(keys.map(async (key) => {
      const endpoint = new URL('/odds/', API_BASE);
      endpoint.searchParams.set('sport_key', key);
      endpoint.searchParams.set('markets', 'h2h');
      endpoint.searchParams.set('oddsFormat', 'decimal');
      endpoint.searchParams.set('regions', process.env.THE_ODDS_API_REGIONS || 'us');
      endpoint.searchParams.set('commenceTimeFrom', from.toISOString());
      endpoint.searchParams.set('commenceTimeTo', to.toISOString());
      const res = await fetch(endpoint, { headers: { 'x-api-key': apiKey, 'Accept': 'application/json' } });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Provider request failed for ${key} (HTTP ${res.status}): ${detail.slice(0, 180)}`);
      }
      const data = await res.json();
      return (Array.isArray(data) ? data : []).map(event => {
        const books = event.bookmakers || [];
        const firstMarket = books.flatMap(book => (book.markets || []).map(market => ({ book, market })))
          .find(x => x.market.key === 'h2h');
        const odds = firstMarket ? firstMarket.market.outcomes.map(outcome => ({
          label: outcome.name,
          price: outcome.price,
          bookmaker: firstMarket.book.title,
          market: 'Match winner'
        })) : [];
        return {
          id: event.id,
          sportKey: event.sport_key || key,
          league: event.sport_title || key,
          home: event.home_team,
          away: event.away_team,
          startTime: event.commence_time,
          odds,
          oddsBookmaker: firstMarket?.book?.title || null,
          oddsUpdatedAt: firstMarket?.market?.last_update || firstMarket?.book?.last_update || null
        };
      });
    }));
    const fixtures = responses.flat().sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    return json({ provider: 'The Odds API', sport, range, fetchedAt: new Date().toISOString(), fixtures });
  } catch (err) {
    return json({ error: 'Could not retrieve live fixtures and odds.', detail: err.message }, 502);
  }
};
