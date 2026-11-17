// Ticket Tailor's documented Event schema, checked 17 november 2026:
// https://developers.tickettailor.com/docs/api/get-all-events/
// Only public event fields leave this process. No order or attendee requests.
import { readFile, writeFile, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const apiOrigin = 'https://api.tickettailor.com';
const normalizedName = (value) => String(value ?? '').trim().toLowerCase();
const truth = (value) => value === true || value === 'true';
const falsity = (value) => value === false || value === 'false';

export function validateSources(config, courses) {
  if (typeof config.enabled !== 'boolean' || !Array.isArray(config.offerings)) throw new Error('Invalid booking source configuration.');
  const known = new Set(courses.map((course) => course.id));
  const seen = new Set();
  for (const source of config.offerings) {
    if (!known.has(source.offering_id) || seen.has(source.offering_id)) throw new Error('Unknown or duplicate booking offering.');
    seen.add(source.offering_id);
    for (const field of ['event_names', 'event_ids', 'event_series_ids']) {
      if (!Array.isArray(source[field]) || source[field].some((item) => typeof item !== 'string' || !item.trim())) throw new Error('Invalid booking source selector.');
    }
  }
}

function brisbaneDate(date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(date.iso)) throw new Error('Event date needs an explicit time zone.');
  const ms = Date.parse(date.iso);
  if (!Number.isFinite(ms) || (date.unix != null && Math.abs(ms / 1000 - date.unix) > 1)) throw new Error('Invalid event date.');
  return new Date(ms + 10 * 60 * 60 * 1000).toISOString().slice(0, 19) + '+10:00';
}

function checkoutUrl(value) {
  const url = new URL(value);
  const trusted = ['tickettailor.com', 'buytickets.at'].some((domain) => url.hostname === domain || url.hostname.endsWith('.' + domain));
  if (url.protocol !== 'https:' || !trusted || url.username || url.password || url.port) throw new Error('Event checkout must use an official HTTPS Ticket Tailor URL.');
  return url.href;
}

function gateTime(value) {
  if (value == null) return null;
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid ticket sale time.');
  return value * 1000;
}

export function normalizeEvents(events, config, courses, now = new Date()) {
  validateSources(config, courses);
  if (!Array.isArray(events) || !Number.isFinite(now.getTime())) throw new Error('Invalid event response.');
  const output = [];
  const seen = new Set();
  for (const event of events) {
    const sources = config.offerings.filter((source) => source.event_ids.includes(event.id)
      || source.event_series_ids.includes(event.event_series_id)
      || source.event_names.some((name) => normalizedName(name) === normalizedName(event.name)));
    if (!sources.length) continue;
    if (sources.length > 1) throw new Error('An event matches more than one offering.');
    if (!['draft', 'published', 'sales_closed'].includes(event.status)) throw new Error('Unknown event status.');
    if (event.status !== 'published') continue;
    // Missing privacy flags fail closed rather than making a draft public.
    if (!falsity(event.hidden) || !falsity(event.private) || event.access_code || !falsity(event.unavailable)) continue;
    if (typeof event.id !== 'string' || !/^ev_[A-Za-z0-9_-]+$/.test(event.id) || seen.has(event.id)) throw new Error('Invalid or duplicate event id.');
    seen.add(event.id);
    const startsAt = brisbaneDate(event.start);
    const endsAt = brisbaneDate(event.end);
    if (Date.parse(endsAt) <= Date.parse(startsAt)) throw new Error('Event must end after it starts.');
    if (Date.parse(endsAt) <= now.getTime()) continue;
    const saleStart = gateTime(event.tickets_available_at);
    const saleEnd = gateTime(event.tickets_unavailable_at);
    const beforeSales = saleStart !== null && now.getTime() < saleStart;
    if (saleEnd !== null && now.getTime() >= saleEnd) continue;
    if (!truth(event.tickets_available) && !falsity(event.tickets_available)) throw new Error('Event availability is unknown.');
    if (!Array.isArray(event.ticket_types)) throw new Error('Ticket types are missing.');
    const publicTypes = event.ticket_types.filter((ticket) => ['on_sale', 'sold_out'].includes(ticket.status) && !ticket.access_code);
    const soldOut = !beforeSales && falsity(event.tickets_available) && publicTypes.length > 0 && publicTypes.every((ticket) => ticket.status === 'sold_out');
    const open = !beforeSales && truth(event.tickets_available) && publicTypes.some((ticket) => ticket.status === 'on_sale');
    const free = publicTypes.length > 0 && publicTypes.every((ticket) => ticket.type === 'free');
    if (open && !free && !event.payment_methods?.some((method) => method.type === 'stripe')) throw new Error('Paid bookings need a connected Stripe payment method.');
    // Prices and fees remain authoritative at checkout, including tax, discounts
    // and per-order charges. Never turn a base ticket price into a false total.
    const price = free ? 'free registration' : 'see booking page for current prices';
    const online = truth(event.online_event);
    if (!online && !falsity(event.online_event)) throw new Error('Event delivery method is unknown.');
    const location = online ? 'online // joining details sent after booking' : normalizedName(event.venue?.name);
    if (!location) throw new Error('Public event location is missing.');
    if (String(event.currency).toLowerCase() !== 'aud') throw new Error('Expected an AUD event.');
    output.push({
      id: event.id,
      offering_id: sources[0].offering_id,
      status: open ? 'open' : soldOut ? 'sold_out' : 'announced',
      starts_at: startsAt,
      ends_at: endsAt,
      location,
      price,
      booking_url: open ? checkoutUrl(event.checkout_url) : '',
      booking_type: free ? 'registration' : 'tickets',
      sales_end_at: saleEnd === null ? '' : new Date(saleEnd).toISOString()
    });
  }
  return output.sort((a, b) => a.starts_at.localeCompare(b.starts_at) || a.id.localeCompare(b.id));
}

export async function fetchEvents(apiKey, now = new Date(), request = fetch) {
  if (!apiKey?.trim()) throw new Error('TICKET_TAILOR_API_KEY is required.');
  let next = new URL('/v1/events', apiOrigin);
  next.searchParams.set('limit', '100');
  next.searchParams.set('end_at.gt', String(Math.floor(now.getTime() / 1000)));
  const visited = new Set();
  const events = [];
  while (next) {
    if (next.origin !== apiOrigin || next.pathname !== '/v1/events' || next.username || next.password) throw new Error('Unsafe event pagination URL.');
    if (visited.has(next.href) || visited.size >= 50) throw new Error('Event pagination did not finish.');
    visited.add(next.href);
    const response = await request(next.href, {
      headers: { Accept: 'application/json', Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64') },
      redirect: 'error', signal: AbortSignal.timeout(30000)
    });
    // Never log provider bodies, authentication headers or raw network errors.
    if (!response.ok) throw new Error(`Ticket Tailor event request failed (HTTP ${response.status}).`);
    const body = await response.json();
    if (!Array.isArray(body.data) || !body.links || !Object.hasOwn(body.links, 'next')) throw new Error('Incomplete Ticket Tailor event response.');
    events.push(...body.data);
    next = body.links.next ? new URL(body.links.next, apiOrigin) : null;
  }
  return events;
}

export async function syncBookings({ config, courses, target, apiKey, now = new Date(), request = fetch }) {
  validateSources(config, courses);
  if (!config.enabled) return { skipped: true, count: 0 };
  const rawEvents = await fetchEvents(apiKey, now, request);
  const events = normalizeEvents(rawEvents, config, courses, now);
  const temporary = target + '.' + randomUUID() + '.pending';
  try {
    await writeFile(temporary, JSON.stringify({ provider: 'ticket_tailor', synced_at: now.toISOString(), events }, null, 2) + '\n', { flag: 'wx' });
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
  return { skipped: false, count: events.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const config = JSON.parse(await readFile(resolve(root, '_booking/sources.json'), 'utf8'));
    const courses = JSON.parse(await readFile(resolve(root, '_data/courses.json'), 'utf8'));
    const result = await syncBookings({ config, courses, target: resolve(root, '_data/bookings.json'), apiKey: process.env.TICKET_TAILOR_API_KEY });
    console.log(result.skipped ? 'booking sync is disabled; existing waitlists are unchanged.' : `synced ${result.count} public booking events.`);
  } catch {
    console.error('booking sync failed; existing booking data was kept. check the event-only key, source mapping and event setup.');
    process.exitCode = 1;
  }
}
