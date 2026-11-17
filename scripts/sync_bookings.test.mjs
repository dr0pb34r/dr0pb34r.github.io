import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fetchEvents, normalizeEvents, syncBookings } from './sync_bookings.mjs';

const now = new Date('2030-01-01T00:00:00Z');
const courses = [{ id: 'provocations' }, { id: 'creative-ai' }];
const config = { enabled: true, offerings: [
  { offering_id: 'provocations', event_names: ['provocations'], event_ids: [], event_series_ids: [] },
  { offering_id: 'creative-ai', event_names: ['creative ai: material, not magic'], event_ids: [], event_series_ids: [] }
] };

// Synthetic fixture in Ticket Tailor's documented Event format. No account data.
function event(overrides = {}) {
  return {
    id: 'ev_1', event_series_id: 'es_1', name: 'provocations', status: 'published',
    hidden: 'false', private: 'false', unavailable: 'false', access_code: null,
    currency: 'aud', online_event: 'false', venue: { name: 'The Studio' },
    start: { iso: '2030-02-01T08:00:00Z' }, end: { iso: '2030-03-22T10:00:00Z' },
    tickets_available: 'true', tickets_available_at: null, tickets_unavailable_at: null,
    ticket_types: [{ id: 'tt_1', status: 'on_sale', type: 'paid', price: 10000, booking_fee: 0 }],
    payment_methods: [{ type: 'stripe' }],
    checkout_url: 'https://www.tickettailor.com/checkout/view-event/id/1/chk/example/',
    ...overrides
  };
}
const normalize = (items, settings = config) => normalizeEvents(items, settings, courses, now);
const page = (items, next = null) => ({ ok: true, json: async () => ({ data: items, links: { next } }) });

test('one full cohort is one event; multiple future cohorts remain separate', () => {
  const result = normalize([event({ id: 'ev_2', start: { iso: '2030-04-01T08:00:00Z' }, end: { iso: '2030-05-20T10:00:00Z' } }), event()]);
  assert.equal(result.length, 2);
  assert.equal(result[0].starts_at, '2030-02-01T18:00:00+10:00');
  assert.equal(result[0].ends_at, '2030-03-22T20:00:00+10:00');
  assert.equal(result[0].status, 'open');
  assert.equal(result[0].price, 'see booking page for current prices');
});

test('unrelated, draft, closed, hidden, private and expired events stay unpublished', () => {
  const hidden = [{ name: 'not a class' }, { status: 'draft' }, { status: 'sales_closed' }, { hidden: true }, { private: 'true' }, { unavailable: true }, { access_code: 'secret' }, { hidden: undefined }, { start: { iso: '2029-01-01T00:00:00Z' }, end: { iso: '2029-02-01T00:00:00Z' } }];
  for (const change of hidden) assert.deepEqual(normalize([event(change)]), []);
});

test('matching uses exact configured names or ids, never partial titles', () => {
  assert.deepEqual(normalize([event({ name: 'provocations private retreat' })]), []);
  assert.equal(normalize([event({ name: ' Provocations ' })]).length, 1);
  const explicit = structuredClone(config);
  explicit.offerings[0].event_ids = ['ev_9'];
  assert.equal(normalize([event({ id: 'ev_9', name: 'semester one' })], explicit).length, 1);
  explicit.offerings[1].event_ids = ['ev_9'];
  assert.throws(() => normalize([event({ id: 'ev_9' })], explicit), /more than one/);
});

test('sold out, future sales, closed sales and unavailable tickets are distinct', () => {
  const sold = event({ tickets_available: false, ticket_types: [{ status: 'sold_out', type: 'paid' }] });
  assert.equal(normalize([sold])[0].status, 'sold_out');
  assert.equal(normalize([event({ tickets_available_at: now.getTime() / 1000 + 60 })])[0].status, 'announced');
  assert.equal(normalize([event({ tickets_available: false, ticket_types: [{ status: 'unavailable', type: 'paid' }] })])[0].status, 'announced');
  assert.deepEqual(normalize([event({ tickets_unavailable_at: now.getTime() / 1000 })]), []);
  assert.throws(() => normalize([event({ tickets_available: null })]), /unknown/);
});

test('public output never contains online joining links, access details or financial records', () => {
  const result = normalize([event({ online_event: true, online_link: 'https://private.example/meeting-secret', description: 'do not publish', revenue: 9000, total_orders: 5, payment_methods: [{ type: 'stripe', external_id: 'private@example.test' }] })]);
  assert.equal(result[0].location, 'online // joining details sent after booking');
  for (const forbidden of ['online_link', 'meeting-secret', 'do not publish', 'revenue', 'total_orders', 'external_id', 'private@example.test']) assert.ok(!JSON.stringify(result).includes(forbidden));
});

test('free registrations need no payment account; paid bookings need stripe', () => {
  assert.equal(normalize([event({ payment_methods: [], ticket_types: [{ status: 'on_sale', type: 'free' }] })])[0].booking_type, 'registration');
  assert.throws(() => normalize([event({ payment_methods: [{ type: 'offline' }] })]), /Stripe/);
});

test('bad dates, currencies, duplicates and checkout destinations abort normalization', () => {
  for (const change of [{ start: { iso: '2030-02-01 18:00' } }, { end: { iso: '2029-01-01T00:00:00Z' } }, { currency: 'usd' }, { checkout_url: 'https://tickettailor.com.attacker.test/pay' }, { checkout_url: 'javascript:alert(1)' }, { checkout_url: 'https://user:pass@buytickets.at/pay' }]) assert.throws(() => normalize([event(change)]));
  assert.throws(() => normalize([event(), event()]), /duplicate/);
});

test('all pages are read using the event-only endpoint and basic authentication', async () => {
  const calls = [];
  const result = await fetchEvents('test-key', now, async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1 ? page([event()], '/v1/events?starting_after=ev_1') : page([event({ id: 'ev_2' })]);
  });
  assert.equal(result.length, 2);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.headers.Authorization, 'Basic ' + Buffer.from('test-key:').toString('base64'));
  assert.equal(calls[0].options.redirect, 'error');
  assert.ok(calls.every(({ url }) => new URL(url).pathname === '/v1/events'));
});

test('hostile, repeated or incomplete pagination cannot leak the key or wipe data', async () => {
  for (const next of ['https://attacker.test/steal', '/v1/orders']) {
    let calls = 0;
    await assert.rejects(fetchEvents('test-key', now, async () => { calls++; return page([], next); }), /Unsafe/);
    assert.equal(calls, 1);
  }
  await assert.rejects(fetchEvents('test-key', now, async () => page([], '/v1/events?starting_after=ev_1')), /did not finish/);
  await assert.rejects(fetchEvents('test-key', now, async () => ({ ok: true, json: async () => ({ data: [] }) })), /Incomplete/);
});

test('failed sync keeps the last good file; successful cancellation removes a previous event', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'dropbear-booking-test-'));
  const target = join(folder, 'bookings.json');
  try {
    await writeFile(target, 'last-good-data');
    await assert.rejects(syncBookings({ config, courses, target, now, apiKey: 'test-key', request: async () => ({ ok: false, status: 503 }) }));
    assert.equal(await readFile(target, 'utf8'), 'last-good-data');
    const result = await syncBookings({ config, courses, target, now, apiKey: 'test-key', request: async () => page([event({ status: 'sales_closed' })]) });
    assert.equal(result.count, 0);
    assert.deepEqual(JSON.parse(await readFile(target, 'utf8')).events, []);
    const disabled = await syncBookings({ config: { ...config, enabled: false }, courses, target, now, request: () => { throw new Error('must not fetch'); } });
    assert.equal(disabled.skipped, true);
  } finally {
    await rm(target, { force: true });
    await rmdir(folder);
  }
});
