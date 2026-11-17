# Workshop pages

The public entry point is `/workshops/`. Permanent course pages are:

- `/provocations/`
- `/workshops/creative-ai/`
- `/workshops/build-almost-anything/`

`/updates/` is the newsletter signup. `/mail.html` preserves the old signup URL
and links to the new page. The shared navigation and homepage link to both.

## Mailing list and waitlists

Four inline forms are published in Meg's `dropbear labs` Kit account:

| Audience | Kit form ID | Public form |
| --- | --- | --- |
| General lab updates | 10200831 | https://dropbear-labs.kit.com/266d2fa377 |
| Provocations waitlist | 10200846 | https://dropbear-labs.kit.com/16c07d212a |
| Creative AI waitlist | 10200856 | https://dropbear-labs.kit.com/a3494dc7d4 |
| Build almost anything waitlist | 10200863 | https://dropbear-labs.kit.com/0b04398cb9 |

All have confirmation emails enabled and auto-confirm disabled. Each form has
a descriptive confirmation-email subject. The general updates button says
`Get lab updates`; the course buttons say `Join the waitlist`. Branding is
applied through the form's custom CSS. The sender currently uses Meg's Gmail
address; a domain sender can be set up separately.

The old Brevo form has been removed because ownership of that account is
unknown. No addresses should be sent there.

Use Kit form membership to target the appropriate audience. A course waitlist
signup does not add membership in the general updates form. When sending a
broadcast, select subscribers to the relevant form instead of sending to all
subscribers. No newsletter campaign has been sent by the development agent.

For general updates, `newsletter_form_url` holds the verified Kit share URL
in `_data/workshops.json`. Both `newsletter_embed_url` and
`newsletter_form_uid` come from Kit's generated JavaScript embed. The provider
provider embed handles actual validation and confirmation; the page offers the
hosted form as a fallback. No API secret belongs in this public website.

Verify with your own email that signup reaches the intended audience, the
confirmation arrives, the sender is correct, and unsubscribe works. Account
creation, ownership verification, and sender verification require the owner.

The production lab-updates signup was tested on 17 November 2026 with Meg's
permission. Meg confirmed receipt of the confirmation email and clicked its
confirmation link. No broadcast was sent. Creator Network Recommendations
were turned off to keep the signup flow focused on Dropbear Labs.

Course waitlists are embedded in each course's booking panel. The provider
form handles the submission and confirmation, with a hosted-form fallback.
No locally simulated success state is used. Joining a waitlist does not reserve
a seat or process payment.

The course's `waitlist_form_url`, `waitlist_embed_url`, and `waitlist_form_uid`
live in `_data/courses.json`. If an embed is removed, the hosted-form link is
used. If both are removed, the page falls back to an explicitly manual email
request to the existing site contact address. The visitor must send that email.

General provider settings and contact email are in `_data/workshops.json`.
Do not paste API secrets into public files.

## Announce a session or open bookings

Edit the course's `session` in `_data/courses.json`. All dates must include
the Brisbane offset `+10:00`. Supported statuses are:

- `upcoming`: no confirmed session; keep promoting the course and its waitlist.
- `announced`: show confirmed session details; bookings have not opened.
- `open`: show the booking link and session details.
- `sold_out`: hide the booking link and offer the waitlist.

For any confirmed session, provide `starts_at`, `ends_at`, `location`, and
`price` (a display string; e.g. `Free` or `A$120`). For `open`, also provide
a real HTTPS `booking_url`. Set `booking_type` to `tickets` for "Book tickets"
or `registration` for "Register for this session". The linked provider must
already handle the registration/payment and capacity. The website itself
does not handle payments, set stock, or discover that an event has sold out.

Keep unconfirmed details blank. The committed course data contains no dates,
prices, venues, or booking URLs. Past sessions fall back to the waitlist at
build time; the page also hides expired session details in the browser if an
old static build remains online. Start and end times must be on the same
Brisbane date for the current date display.

Rebuild and publish through the existing GitHub Pages setup after edits.
No new hosting account or Sites project is required for this repository.

## Verify

```sh
bundle exec ruby scripts/check_workshops.rb
bundle exec jekyll build --destination /tmp/dropbear-site
```

Check `/workshops/`, the three course pages, `/updates/`, `/mail.html`, and
`/privacy/` on desktop and mobile. Complete one real opt-in yourself before
sharing a changed signup link. The only test subscription submitted by the
development agent was the production lab-updates test explicitly authorized
by Meg; no other recipients were contacted.

The Provocations grant/application material informed the course copy only.
Historic dates, grant-dependent access commitments, proposed venues, and
collaborator roles were not presented as confirmed offers.
