VANTABET — NETLIFY LIVE FIXTURES + ODDS STARTER

WHAT THIS PACKAGE DOES
- Mobile-friendly VantaBet sports match centre.
- Netlify serverless function calls The Odds API from the server.
- Reads fixtures and head-to-head (match winner) odds from the provider.
- Shows only provider-returned data; does not invent sample matches.
- The API key is read from a Netlify environment variable and is never placed in browser JavaScript.

IMPORTANT COVERAGE NOTE
A single provider does not guarantee every competition worldwide for every sport. The Odds API's documented professional coverage includes many football competitions, basketball, tennis, and some rugby-related competitions such as rugby league (NRL). Rugby union and regional league/market coverage must be verified in the live sport catalog before you advertise it. Coverage and available bookmakers vary by sport and region.

SETUP
1. Create an account at https://theoddsapi.com/ and select a plan that includes the sports/markets you need. The current pricing page lists Professional at US$29/month with 20,000 requests/month and US sportsbook coverage; Business is US$99/month and adds international books. Verify current terms and regional bookmaker availability before subscribing.
2. Upload this folder to a Git repository and import it into Netlify, or deploy the folder using Netlify's supported deploy workflow.
3. In Netlify, open Site configuration -> Environment variables (or Project configuration -> Environment variables) and add ONLY this required secret:
   THE_ODDS_API_KEY = your private API key
   The API key must be copied from your own provider account. Never put it in index.html, Git, or this README.
4. Step 4 is preconfigured in the server function: football starts with EPL, Champions League, Europa League, La Liga, Serie A, Bundesliga, Ligue 1, and MLS; basketball starts with NBA, EuroLeague, WNBA, and NCAAB; tennis uses the provider's tennis key; rugby uses NRL (rugby league). You do not need to add sport-key environment variables to get started. Optional override variables are supported if you want to change the defaults:
   VANTABET_FOOTBALL_KEYS
   VANTABET_BASKETBALL_KEYS
   VANTABET_TENNIS_KEYS
   VANTABET_RUGBY_KEYS
   Each override is a comma-separated list of exact keys confirmed in the provider's GET /sports/ catalog. The function supports up to 8 keys per sport to limit accidental request use.
5. Redeploy the site after adding THE_ODDS_API_KEY. Netlify environment variables apply to functions after redeployment.
6. Test these URLs on your deployed site:
   /api/fixtures?sport=football&range=today
   /api/fixtures?sport=basketball&range=week
   /api/fixtures?sport=tennis&range=today
   /api/fixtures?sport=rugby&range=week
   If the endpoint reports a provider error, check the key, plan access, sport key, regions, and quota.

ODDS AND REQUESTS
- This starter requests the h2h market in decimal format and shows the first available bookmaker's prices. It is not a betting engine and does not accept bets, deposits, or payouts.
- It calls each configured sport key when the user refreshes or changes sport/date. Keep key lists modest and add caching/rate limits before public launch to control usage. The function caches responses for 60 seconds at the CDN layer where supported.
- The provider currently documents a tennis key named `tennis`. Confirm it remains available to your account before launch.
- Do not put the API key in index.html, a public Git repository, or client-side JavaScript. Rotate it immediately if exposed.

LEGAL / OPERATIONAL
Displaying odds is different from operating a real-money betting business. Before accepting stakes, deposits, or paying winnings in South Africa, get qualified legal advice and confirm all applicable licensing, compliance, age verification, responsible-gambling, payment, and data-display requirements.

FILES
- index.html: website UI
- netlify/functions/fixtures.mjs: server-side API adapter
- netlify.toml: Netlify build settings and /api/fixtures route
