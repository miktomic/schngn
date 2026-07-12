# Bilateral short-stay agreement research

Status: initial research catalogue, generated and reviewed 2026-07-12.

This catalogue is an informational evidence layer. It does not change the SCHNGN 90/180 calculation, does not calculate bilateral entitlement, and must not be presented as legal advice or a guarantee of entry.

## What is stored

The application-ready data lives in `apps/web/src/lib/bilateral/`:

- `data/eu-2019-notification-candidates.v1.json` is an immutable extraction of the European Commission's 2019 notification. It contains all 380 published rows, including non-ordinary passport categories and the source locator for every row.
- `data/catalog.v1.json` contains the 50-jurisdiction research cohort, source registry, research coverage and manually reviewed current national guidance.
- `data/runtime.v1.json` is the compact browser payload generated from the research catalogue. It contains the passport choices, live national-authority sources and only the fresh `confirmed_current` or `confirmed_with_procedure_gap` pairs that may trigger a notice.
- `catalog.ts` validates both files at runtime and refuses malformed or internally inconsistent data.
- `lookup.ts` performs an information-only lookup by passport issuing jurisdiction, intended host country, passport type and review date.
- `runtime.ts` validates the compact payload and powers the optional in-form notice without loading the historical research archive into the browser.

`scripts/build-bilateral-runtime.mjs` is the only publishing path from the research catalogue to the compact runtime file. It rejects a publishable pair unless its primary source is live current guidance from a national government.

Every result has `calculationSupport: "none"`. The catalogue deliberately has no `extraDays` field.

## Why this is not called the “top 50”

There is no public official EU-wide top-50 visitor dataset by passport or citizenship.

The best harmonised source, [Eurostat's 2024 tourist-accommodation nights dataset](https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/tour_occ_ninraw?lang=en&time=2024&geo=EU27_2020&unit=NR&nace_r2=I551-I553), classifies visitors by **country of residence**, not passport. Its [methodology](https://ec.europa.eu/eurostat/cache/metadata/en/tour_occ_esms.htm) confirms that distinction. The public EU aggregate exposes only a limited set of individual non-EU origins and groups the rest into regional residuals. Those residuals cannot be safely disaggregated or ranked.

The initial cohort is therefore an explicitly unranked union of:

1. all 41 passport jurisdictions or territories appearing anywhere in the [Commission's 2019 Article 20(2)(b) notification](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A52019XC0408%2802%29);
2. five individually named Eurostat residence markets absent from that notification: United Kingdom, China, Türkiye, Russia and South Africa; and
3. four high-demand consulate-location controls from the Commission's [2025 Schengen visa statistics](https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/short-stay-visas-issued-schengen-countries_en): India, Morocco, Saudi Arabia and Algeria.

Country of residence and consulate location are prioritisation evidence only. Neither may be inferred to be the traveller's citizenship or passport.

## Evidence model

The catalogue keeps three questions separate:

1. **Was an agreement notified in 2019?** A row in the Commission notification is a discovery candidate only.
2. **Does a current host-country authority still describe it as operational?** Only live national-government guidance can support a `confirmed_current` result.
3. **Are the current procedure and constraints clear?** Missing EES instructions, contradictory government pages or stale review dates force a caution or conflict result.

Current evidence states are:

- `notified_unconfirmed`: historical Commission notification only;
- `confirmed_current`: live host-country guidance plus sufficiently clear current procedure;
- `confirmed_with_procedure_gap`: live host-country guidance confirms the arrangement, but an operational detail still needs confirmation;
- `conflicting_current_guidance`: current official sources conflict with each other or with the 2019 notification;
- `needs_reverification`: formerly supporting material is no longer live or no longer contains the relevant text;
- `inactive_or_superseded`: a current authoritative source confirms that the arrangement is no longer operational.

Expired reviews are downgraded by the lookup helper. A historical notification can never become a current confirmation automatically.

## Initial current-source pilot: Israeli ordinary passport

The pilot verifies a small, useful slice before scaling the same review process to the whole matrix.

| Intended host | Stored status | Current finding | Primary official source |
|---|---|---|---|
| Austria | Confirmed current | Three calendar months; treaty excludes employment. Austria also publishes the EES request, recording and direct-exit procedure. | [Austrian Federal Ministry of the Interior](https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html) |
| France | Confirmed current | 90 days in metropolitan France, after the ordinary Schengen allowance; the traveller must identify themselves at the French border for manual EES adjustment. | [France Diplomatie](https://www.diplomatie.gouv.fr/de/aufenthalt-in-frankreich/reisen-in-frankreich/einreise-in-den-schengen-raum-einfuehrung-der-systeme-ees-und-etias) |
| Latvia | Confirmed with procedure gap | Up to another 90 days in Latvia after the ordinary allowance. The national page does not explain the EES request mechanics. | [Latvian Ministry of Foreign Affairs](https://www.mfa.gov.lv/en/entry-requirements-citizens-countries-whom-latvia-has-signed-bilateral-visa-waiver-agremeent) |
| Denmark | Confirmed with procedure gap | Three calendar months, not a flat 90 days. Previous time in Denmark or another Nordic country in the preceding six months is deducted. The national material does not state the EES request mechanics. | [Danish Immigration Service PDF](https://nyidanmark.dk/-/media/Files/US/Visum/Diverse-filer/Overview-of-travel-documents-visa-requirements-and-border-crossing-points130426.pdf) |
| Belgium | Conflicting current guidance | The 2019 notification contains a candidate, but current Belgian embassy and Immigration Office pages publish only the ordinary 90/180 limit. The application must not promise extra days. | [Belgian Embassy in Israel](https://israel.diplomatie.belgium.be/fr/venir-en-belgique/visa-pour-la-belgique) |
| Poland | Conflicting current guidance | Current Polish government sources conflict, and a July 2026 Border Guard report describes refusal of an Israeli traveller who had exhausted visa-free stay. The application must not present a benefit. | [Polish Office for Foreigners](https://www.mos.cudzoziemcy.gov.pl/en/categories-information/visas-movement-free/extension-of-the-period-of-permitted-visa-free-stay/) |

This pilot demonstrates why “additional 90 days” cannot be a generic data field. Calendar months, rolling deductions, geographical scope, order of use and administrative procedure vary by host.

## EU procedure overlay

[Regulation (EU) 2017/2226, Article 60](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32017R2226) inserted Article 20(2a)-(2d) into the Schengen Convention. In outline, invoking a bilateral stay under that procedure requires a request on entry or during the stay no later than the last working day of the ordinary permitted period, recording by the host state in EES, remaining in the host state's territory and direct departure through that host state's external border.

National guidance may add details and may use a different duration basis. The application must link the user to the host authority and must not translate the rule into a date until all necessary facts and procedures have been legally reviewed.

The Commission's [2026 visa-policy strategy](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A52026DC0043) proposes reviewing and gradually phasing out legacy bilateral agreements. This is policy intent, not a blanket repeal, but it makes source freshness a hard publishing requirement.

## Safe application use

The implemented trip-form surface is deliberately narrow:

1. The existing optional exit-country control must be chosen explicitly. When the trip form reversibly mirrors a blank exit from the entry country, the traveller must first confirm “I plan to leave Schengen through this country.” The mirrored value alone does not reveal the passport question.
2. The form then asks, “Which ordinary passport will you use?” The answer exists only in the mounted component's memory and resets when the form closes.
3. The selected exit country is only a prompt for a potential match. It is not treated as proof that the traveller stayed in that country or qualifies under an agreement.
4. The ordinary-passport prompt can publish only records reviewed for `ordinary` or `all` passport categories. Diplomatic, service, special and other passport records are excluded by the runtime generator.
5. A notice appears only for a current or future trip when the passport/exit-country pair has fresh `confirmed_current` or `confirmed_with_procedure_gap` national guidance and a direct authoritative link. Current guidance is never projected backwards onto a past trip.

Display behavior:

- `confirmed_current`: show a sourced informational notice and a direct national-authority link, while leaving the ordinary 90/180 result unchanged;
- `confirmed_with_procedure_gap`: show the source and an explicit authority/procedure caution;
- `notified_unconfirmed`, `conflicting_current_guidance`, stale, `needs_reverification`, `inactive_or_superseded` or no row: show no positive bilateral notice.

Every displayed notice states that the traveller would need to remain in the named host, complete any required authority procedure and leave Schengen directly through that host's external border. It also warns that other eligibility, duration and procedural conditions may apply and must be confirmed with the competent authority. Finally, it states that SCHNGN has added no days and has not changed the ordinary 90/180 result.

The runtime passport menu currently contains the full 50-jurisdiction research cohort. The current-source pilot can display notices only for an Israeli ordinary passport with Austria, France, Latvia or Denmark as the explicitly selected exit country. Belgium and Poland remain suppressed because the stored current evidence conflicts.

Example information-only lookup:

```ts
import { findBilateralResearch } from '$lib/bilateral';

const result = findBilateralResearch({
  passportCountryCode: 'IL',
  hostCountryCode: 'BE',
  passportType: 'ordinary',
  asOf: '2026-07-12'
});

// result.state === 'current_guidance_conflicts'
// result.calculationSupport === 'none'
// result.primaryUserSource?.url points directly to the Belgian authority
```

The passport answer is not a preference and is not persisted even locally. It remains separate from trip records, browser storage, backups, account sync, URLs, analytics and logs.

## Research expansion plan

1. Complete national-source verification for the eight first-priority notified markets: Australia, Brazil, Canada, Japan, South Korea, Ukraine, United States and Israel.
2. Work host-by-host so one national procedure page can verify multiple passport markets consistently.
3. For every passport-host pair, capture the passport category, exact duration wording, territorial scope, ordering rule, permitted purposes, EES authority/procedure, external-exit rule, source language, page update date and next review date.
4. Require two-person human review before a record becomes `confirmed_current`.
5. Recheck confirmed records every 90 days and immediately after an EU or national policy change. A failed link or overdue review must downgrade the result automatically.
6. Add a localized resource page only after the fixed warning copy and source-link behavior are reviewed in every supported locale.

Source acceptance order:

1. current host-country immigration, interior ministry, foreign ministry or border authority guidance;
2. current national legislation or official treaty text;
3. EU legislation and Commission notifications for framework and discovery;
4. embassy guidance from the competent host state.

Search snippets, travel blogs, commercial visa services and uncited secondary summaries must never support a current confirmation.
