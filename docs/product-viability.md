# Product viability: Schengen visit tracker

## Verdict

Worth building only as a **small, fast validation product**, not as a full native-app business on day one.

A generic 90/180 calculator is not worth building. The space is crowded and the baseline feature is commoditized.

A focused product may be worth building if it owns a sharper wedge:

> Explainable, privacy-first Schengen planning that protects future trips and produces a border-ready report.

## Why it might work

Evidence from competitor research:

- Competitors already charge:
  - Schengen Simple: App Store shows Full Access around $7.99–$9.99/year.
  - TrackingDays: App Store copy says $3.99/month.
  - Days Monitor: App Store page shows annual subscriptions around $19.99–$34.99.
  - 180 Days uses a free trial followed by one-time/lifetime purchase.
- Several competitors have meaningful traction:
  - 90 Days Schengen on Android: 100K+ downloads but low rating.
  - QRALL Schengen Calculator: 10K+ Android downloads and 600+ reviews.
  - Schengen Simple: strong iOS rating/review count and clear premium positioning.
- The pain is durable:
  - UK post-Brexit second-home owners.
  - Frequent US/UK/Canada travelers.
  - Digital nomads.
  - Business travelers.
  - Families with mixed residency/visa status.
- ETIAS/EES will keep the topic visible and make people more anxious about being digitally checked.

## Why it might not work

- Low willingness to pay for casual tourists.
- The official EU calculator is free.
- Web calculators are everywhere.
- App-store SEO is crowded.
- A pure consumer app probably caps out as a small side business unless it broadens into residency/tax/compliance.
- Accuracy mistakes are reputationally fatal.

## What new value we can add

### 1. Explanation-first UX

Most calculators return a number. Users often distrust correct numbers because the rolling rule is unintuitive.

We should show:

- Active 180-day window.
- Counted days.
- Ignored/fallen-off days.
- Days that return soon.
- Which future trip creates the constraint.
- Plain-language answer: “Can I go?”, “When must I leave?”, “When can I come back?”

### 2. Future-trip protection

The premium question is not just:

> Is this trip allowed?

It is:

> What is the longest trip I can fit here without breaking trips I already planned?

Schengen Simple owns this idea best today. We can still compete if we make it more transparent and web-first.

### 3. Public official-parity test suite

Build trust by publishing examples:

- EU manual examples.
- Inclusive entry/exit days.
- Overlaps.
- Future commitments.
- Days falling out of window.
- Timezone/DST neutrality.
- Long-stay/residence-permit exclusions.

This becomes both quality assurance and marketing.

### 4. Border-ready report

Generate a clean PDF/share page:

- Traveler name optional.
- Trip list.
- Active 180-day window.
- Calculation summary.
- Disclaimer.
- Source links to EU calculator/rule.

Useful for passport control, personal records, and advisor conversations.

### 5. Privacy-first local mode

No account required. Local browser/device storage. Export/import JSON/CSV.

This differentiates from broader trackers that collect/share location or account data.

### 6. Distribution features

- Shareable trip plan links.
- Embeddable calculator widget for travel blogs, property agents, relocation advisors, visa consultants.
- SEO explainers around concrete questions:
  - “Can I spend summer in Spain after Brexit?”
  - “When can I re-enter Schengen?”
  - “Does ETIAS change 90/180?”
  - “Do entry and exit days both count?”

## Monetization options

### Consumer freemium

Free:

- Manual trip entry.
- Current days left.
- One future trip simulation.
- Local storage.

Paid, likely $9.99–$19.99/year or one-time $14.99–$29.99:

- Unlimited scenarios.
- Future-trip protection optimizer.
- PDF reports.
- Family profiles.
- Calendar reminders.
- Export/import.
- Widgets/native app later.

This is plausible but probably modest.

### B2B widget/API

Sell embeddable calculators to:

- Relocation firms.
- Visa consultants.
- Travel agencies.
- Second-home property agents.
- Expat blogs/newsletters.

Pricing could be $29–$199/month depending on volume/branding/leads.

This may be more interesting than pure app-store revenue.

### Lead generation / referrals

Possible referral lanes:

- Visa/residency lawyers.
- Immigration consultants.
- Travel insurance.
- Tax residency advisors.

Must be handled carefully. This product should not become a dark-pattern ETIAS scam machine. The internet already has enough of those little goblins.

### Broader compliance upsell

Later expansion:

- Schengen residence permit exclusions.
- UK/EU second-home planning.
- 183-day tax residency counters.
- US substantial presence.
- Country-specific visa clocks.

This is how it could become a real business rather than a niche utility.

## Revenue scenarios

Back-of-envelope annual gross revenue:

| Paid users | $9.99/year | $19.99/year | $34.99/year |
|---:|---:|---:|---:|
| 500 | ~$5K | ~$10K | ~$17K |
| 1,000 | ~$10K | ~$20K | ~$35K |
| 5,000 | ~$50K | ~$100K | ~$175K |
| 10,000 | ~$100K | ~$200K | ~$350K |
| 25,000 | ~$250K | ~$500K | ~$875K |

This is not a unicorn. It may be a useful niche product, SEO asset, and stepping stone into broader travel/residency compliance.

## Build/no-build decision

Build if we keep the first version small:

1. Core TypeScript rule engine.
2. Official-parity test suite.
3. Mobile-first PWA.
4. Explanation-first dashboard.
5. Future-trip optimizer.
6. PDF report.
7. SEO landing pages.

Do not build if the plan is immediately:

- Native iPhone + Android + web.
- Accounts, subscriptions, GPS, OCR, sync, and global tax residency.
- A generic calculator with prettier colors.

## Recommended next validation step

Build a **one-week prototype**:

- Calculator engine + tests.
- One mobile web screen.
- One “why this answer?” explanation.
- One future-trip optimizer.
- One PDF/report mock.

Then test with 5–10 target users:

- UK second-home owners.
- Frequent Schengen travelers.
- Digital nomads.
- Immigration/relocation advisors.

Ask only two questions:

1. Would you trust this more than the calculators you already use?
2. Would you pay $10–$20/year or recommend it to clients?

If the answer is not clearly yes, stop or pivot into an embeddable SEO/widget product.
