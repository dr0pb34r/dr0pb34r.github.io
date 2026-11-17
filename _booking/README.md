# ticket tailor + stripe

meg selected this setup on 17 november 2026. meg has created the account. four undated draft listings are saved, with no ticket types or public sales. the box office uses the dropbear labs logo, navy/cyan palette and a monospace font, with brisbane time shown for all events. stripe onboarding is deferred at meg’s request. the adapter, page support and deployment template are prepared. live synchronization is disabled in `sources.json`; no paid event or checkout has been created.

## account setup

create the free ticket tailor account as dropbear labs, select australian dollars and the australia/brisbane time zone and use pay-as-you-go. connect stripe through ticket tailor’s payment settings. meg handles account terms, passwords, business verification and payout details. leave optional subscription products and checkout add-ons off.

## reusable listings

use the exact names below when making or duplicating an event. the adapter matches these explicit names, ignoring case and surrounding spaces. it never uses substring or fuzzy matching. this lets a new date appear without editing website code. `sources.json` can also allow specific event ids or recurring-series ids if a listing needs a different title.

| exact event name | format | ticket covers |
| --- | --- | --- |
| how to build (almost) anything with a magic computer | one-day workshop | one selected workshop |
| creative ai: material, not magic | one-day workshop | one selected workshop |
| agent overlord | longer intensive | the full cohort |
| provocations | intensive 8-week artists’ studio | the full cohort |

copy the description and outcomes from the matching entry in `_data/courses.json`. keep the public copy lowercase and omit oxford commas. a course is a single booking with its first session as the event start and final session as the event end. list every meeting date and any breaks in its description and confirmation email. use separately bookable recurring occurrences only for repeat one-day workshops.

each listing still needs real dates, capacity, price, delivery details and cancellation terms. do not invent them. leave listings as drafts until confirmed. private test events stay private and are excluded from the website. online joining links belong in attendee-only communications.

saved draft series: magic computer `es_2536692`, creative ai `es_2536693`, agent overlord `es_2536694` and provocations `es_2536695`. these ids are also mapped in `sources.json`. all four have zero occurrences; each course occurrence must span its full cohort rather than selling individual weekly meetings.

## website sync

`node scripts/sync_bookings.mjs` reads only `GET /v1/events`. credentials come from the `TICKET_TAILOR_API_KEY` environment variable. raw responses stay in memory. the adapter writes only allowlisted public fields to `_data/bookings.json` and never requests orders or attendees. it excludes drafts, private or hidden listings, access-controlled events, closed sales and expired events. paid events must have stripe connected.

website prices direct readers to the booking page, where ticket prices, taxes, discounts and booking fees are authoritative. the site does not invent an all-inclusive total from a base ticket price. no exact remaining-seat counts are published. checkout always enforces capacity.

the adapter processes all event pages before atomically replacing output. HTTP errors, invalid responses and ambiguous mappings abort the refresh without replacing the last good data. the public site is retained if its build fails. the provider remains authoritative if a visitor follows an older booking link.

## connecting the account

1. verify the actual response for the first draft or private test event against the documented schema. do not publish test fixtures to production.
2. ticket tailor requires an emailed verification code before opening its API-key form. meg can complete that step when connecting the integration. create an event-read API key with personal data hidden. verify its roles through ticket tailor’s API key endpoint. do not grant order access or an admin key for a read-only sync. a separate event-write key is only needed for future programmatic event creation.
3. store the read key as the repository action secret `TICKET_TAILOR_API_KEY`, never in source, browser JavaScript, shell arguments or logs. secret creation requires meg’s confirmation of that access.
4. set `enabled` to `true` in `sources.json` and run one local or action refresh. inspect the sanitized output. verify a public test listing only with meg’s authorization.
5. install `pages-workflow.yml` as `.github/workflows/pages.yml`, enable the existing site’s github actions publishing source and run a manual deployment. preserve the custom domain and public audience. do not run legacy and custom deployment sources together.
6. verify the resulting live page before enabling the repository variable `BOOKING_SYNC_ENABLED=true`. the workflow then refreshes twice an hour and also on code pushes or manual runs.

github schedules can be delayed and public-repository scheduled workflows pause after 60 days without repository activity. for intermittent use, re-enable the workflow if needed and run it manually when opening a new cohort and check its latest successful run before sharing tickets. do not rely on the schedule for real-time capacity. ticket tailor’s hosted checkout handles that. a verified webhook-triggered refresh can replace polling later if needed.

## verification

```sh
node --test scripts/sync_bookings.test.mjs
node scripts/sync_bookings.mjs
bundle exec ruby scripts/check_workshops.rb
bundle exec jekyll build --destination .preview
```

the automated adapter tests use synthetic events and cover cohort ranges, multiple dates, exact matching, private-data exclusion, closed sales, sold-out states, free registration, required stripe configuration, bad checkout URLs, pagination and failure recovery. rendering tests cover imported event states and preserve the original manual waitlist fallback.

checkout confirmation, the final-seat race, abandoned checkouts, attendee emails and refunds still need verification in the real account using a supported test flow. no real card is charged without meg’s approval. do refunds in ticket tailor so its ticket records and stripe payment records stay aligned. purchasing never automatically subscribes someone to kit postcards.

## sources

- [ticket tailor event schema](https://developers.tickettailor.com/docs/api/get-all-events/)
- [ticket tailor API authentication](https://developers.tickettailor.com/docs/api/ticket-tailor-api/)
- [github pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [github scheduled workflow limits](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
