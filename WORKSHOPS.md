# workshops, courses, and postcards

public pages:

- `/workshops/`: the catalogue, split into short workshops and longer courses
- `/workshops/build-almost-anything/`: how to build (almost) anything with a magic computer
- `/workshops/creative-ai/`: creative ai
- `/provocations/`: the intensive 8-week studio for artists
- `/courses/agent-overlord/`: agent overlord
- `/updates/`: postcards
- `/mail.html`: a preserved link to the postcard signup

## kit forms

these forms are published in meg's dropbear labs kit account. all have email
confirmation enabled and auto-confirm disabled. no broadcast has been sent.

| audience | kit form id | share url |
| --- | --- | --- |
| postcards | 10200831 | https://dropbear-labs.kit.com/266d2fa377 |
| magic computer waitlist | 10200863 | https://dropbear-labs.kit.com/0b04398cb9 |
| creative ai waitlist | 10200856 | https://dropbear-labs.kit.com/a3494dc7d4 |
| provocations studio waitlist | 10200846 | https://dropbear-labs.kit.com/16c07d212a |
| agent overlord waitlist | 10201027 | https://dropbear-labs.kit.com/9900d8bbec |

form share urls, embed urls, and uids are in `_data/courses.json` and
`_data/workshops.json`. keep those identifiers exactly as returned by kit.
no api secret belongs in this public repository.

the sender currently uses meg's gmail address. domain email can be configured
separately. creator network recommendations are turned off. the old mailing
provider connection has been removed because account ownership was unknown.

## postcard interests

the postcard form has two independent checkbox choices:

- `workshops and courses` — kit tag `25977608`
- `other transmissions` — kit tag `25977618`

readers can select either or both. the website requires at least one choice.
when sending in kit, select the corresponding tag, rather than all subscribers.
select both audiences when a message is relevant to both. existing subscribers
without an interest tag should choose their interests before targeted sends;
do not infer their choice.

## waitlist preferences

each waitlist has two optional custom fields: preferred delivery and preferred
day. the website offers suggestions for in person, online, weekdays, or no
preference. readers can also enter a more specific preference.

kit stores separate fields for each offering, so a choice on one waitlist does
not overwrite another:

- magic computer delivery / magic computer day
- creative ai delivery / creative ai day
- provocations delivery / provocations day
- agent overlord delivery / agent overlord day

send waitlist news to subscribers to that specific kit form. waitlist membership
does not mean someone opted into postcards. a waitlist does not reserve a seat
or process payment.

## sessions and bookings

edit the offering's `session` in `_data/courses.json`:

- `upcoming`: waitlist open; no dates or availability claims
- `announced`: show confirmed details while bookings are closed
- `open`: show the real external booking or registration link
- `sold_out`: show filled-session or filled-cohort wording and the waitlist

for a confirmed session provide `starts_at`, `ends_at`, `location`, and `price`.
use iso dates with the brisbane offset `+10:00`. multi-day and multi-week
courses show both start and end dates. for `open`, add a real https `booking_url`.
`booking_type` is `tickets` or `registration`. the booking provider handles
payments and capacity; update the status manually when a session fills.

keep unconfirmed details blank. none of the current offerings has dates, prices,
venues, or booking links. expired sessions return to waitlist wording. no claim
that cohorts are filled is shown unless the offering is marked `sold_out`.

## verification and publishing

```sh
bundle exec ruby scripts/check_workshops.rb
bundle exec jekyll build --destination .preview
```

check the catalogue, each offering, and postcards on desktop and mobile. test
both postcard interest choices and confirm that waitlist preferences remain
optional. source is published through the existing github pages repository.

the original production newsletter signup was tested on 17 november 2026 with
meg's explicit permission; meg received and confirmed the email. no other
recipients were contacted. later form edits have not sent test emails.
