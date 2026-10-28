export const dynamic = 'force-dynamic';
export async function GET(request) {
  if (!process.env.TICKETMASTER_API_KEY) return Response.json({ error: 'Connect a Ticketmaster API key to search here. You can also enter event details manually.' }, { status: 503 });
  try {
    const query = new URL(request.url).searchParams.get('q') || '';
    if (query.length > 100) return Response.json({ error: 'Search is too long.' }, { status: 400 });
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 86400000);
    const params = new URLSearchParams({
      apikey: process.env.TICKETMASTER_API_KEY, keyword: query, countryCode: 'US', classificationName: 'music', locale: 'en-us', size: '15', sort: 'date,asc',
      startDateTime: start.toISOString().replace(/\.\d{3}Z$/, 'Z'), endDateTime: end.toISOString().replace(/\.\d{3}Z$/, 'Z'), includeTBA: 'no', includeTBD: 'no',
    });
    const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    if (!response.ok) return Response.json({ error: `Event search unavailable (${response.status}). Please try later.` }, { status: 502 });
    const data = await response.json();
    const events = (data._embedded?.events || []).filter(event => event.dates?.status?.code !== 'cancelled').map(event => {
      const venue = event._embedded?.venues?.[0];
      return { id: event.id, artist: event._embedded?.attractions?.[0]?.name || event.name, tour: event.name, date: event.dates?.start?.localDate || '', city: [venue?.city?.name, venue?.state?.stateCode].filter(Boolean).join(', '), url: event.url, venue: venue?.name, status: event.dates?.status?.code };
    });
    return Response.json({ events, checkedAt: new Date().toISOString() });
  } catch { return Response.json({ error: 'Could not reach Ticketmaster. Please try again.' }, { status: 502 }); }
}
