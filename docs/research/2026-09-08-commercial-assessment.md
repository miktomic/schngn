# SCHNGN commercial assessment — 8 September 2026

**Verdict: SCHNGN has potential as a useful, inexpensive-to-operate travel product and a modest software business. Its current free consumer calculator has a weak direct monetization position. Compared with Domifis, it is simpler to deliver but probably generates much less revenue per customer.**

This assessment reviews current local product/source documents and public primary sources retrieved on 8 September 2026. It does not change the free product policy, authorize paid acquisition, or adopt a new product roadmap. No traffic, retention, paid conversion, revenue, or acquisition-cost dataset was available. An automated request to https://schngn.com returned HTTP 403, so the live user journey was not verified; this is not evidence that ordinary visitors cannot use the site.

**What exists and why it has value**

The local product is a free SvelteKit PWA with anonymous local trip storage, optional consented account sync, a visual trip timeline and what-if adjustments, multilingual explanations, and a deterministic ordinary Schengen 90/180 calculation engine. Seventeen locales include Hebrew and Arabic RTL. There are also MIT-licensed engine/capability/agent packages with TypeScript, CLI, loopback HTTP, and stdio MCP interfaces. There is no approved hosted calculation API.

The paid fake-door experiment and its price buckets were retired. They are not current prices or evidence of sales. The repository's public accuracy work uses rule fixtures and an independent oracle; its instructions expressly prohibit claiming captured European Commission calculator parity without the missing provenance. This assessment does not certify correctness or release readiness.

Local evidence: [canonical instructions](../../CLAUDE.md), [product decisions](../product-decisions.md), [production readiness](../production-readiness.md), [engine](../../packages/engine/src/index.ts), and [package license metadata](../../packages/engine/package.json).

The useful job is planning repeated visits without damaging later plans. A traveler visiting once for a fortnight seldom needs a subscription. A second-home owner, frequent family visitor, or long-stay traveler managing several trips can face a recurring planning problem. Eligibility must remain limited to situations where the ordinary rule applies; nationality, residency, visas, and free-movement exceptions cannot be replaced with a universal day count.

**Market evidence: a real category, with limited pricing power**

The European Commission reports more than 12 million short-stay visa applications in 2025, up 4.3% from 2024. This is a measure of applications, not unique travelers or frequent users; it excludes visa-exempt travelers and includes many people with little recurring need. It must not be treated as SCHNGN's paying market. [European Commission, 28 May 2026](https://home-affairs.ec.europa.eu/news/schengen-short-stay-visa-applications-rise-2025-remain-below-pre-pandemic-levels-2026-05-28_en).

Schengen Simple's UK App Store listing showed approximately 2,500 ratings and a 4.8 score. It advertises a one-week trial followed by an annual subscription, and lists Solo Plan at £14.99 among multiple purchase SKUs. Storefront SKU lists can include older offers; exact current checkout terms require confirmation. Ratings are evidence of meaningful public use, not a subscriber count or audited revenue. Its offer includes future-trip allowance, multi-traveler calendars, and passport-control summaries. [UK App Store listing](https://apps.apple.com/gb/app/schengen-simple/id1637045933).

| Alternative | Observed offer | Implication for SCHNGN |
| --- | --- | --- |
| Schengen Simple | Paid annual product, low-price purchase anchors; forward planning and family/group features | Demand exists, but forward planning is already competitive |
| Days Monitor | Free browser calculator/planner; $19.99/year iOS premium with automatic location tracking, broader country tracking, reports and sync | A roughly €20-equivalent annual budget can buy more than basic counting |
| Official EES tool | Remaining authorised stay and intended-trip queries using travel-document information | Remaining-days information itself is becoming less differentiating |
| SchengenTracker | Fleet product advertises £5/month for each of the first five drivers and £1 for subsequent drivers; ten drivers £30/month | Organizations buy operational workflows, but B2B is not automatically high-priced |

Sources: [Schengen Simple](https://schengensimple.com/), [Days Monitor](https://daysmonitor.com/pricing/), [official EES tool](https://travel-europe.europa.eu/en/ees/check-how-long-you-can-stay), [SchengenTracker advertised pricing](https://schengentracker.co.uk/). Currency prices are shown as advertised without exchange-rate conversion. Competitor quality and profitability were not audited. SchengenTracker's direct page returned HTTP 403 during retrieval; its pricing was available in the search engine's indexed first-party page, so treat it as a provisional advertised anchor. I have not adopted its marketing claims about fines or legal outcomes.

**EES is both an awareness driver and a substitute**

The official EES tool accepts travel-document information and intended entry/exit dates, so it does more than show a historical count. On retrieval, its page warns that it omits stays beginning before 10 April 2026 and identifies a transitional single/double-entry visa limitation through 6 October 2026. Those temporary gaps should not be the foundation of a business. [Official EES instructions](https://travel-europe.europa.eu/en/ees/check-how-long-you-can-stay).

The long-term opportunity is a private, convenient workspace for alternative multi-trip plans and household coordination, rather than duplicating the official lookup. SCHNGN's current local approach avoids asking a guest to provide passport details to SCHNGN. It cannot certify entry eligibility or replace the border authority's records.

**Where the product could win**

The first segment I would test is frequent UK travelers with second homes or repeated European visits who already use a spreadsheet or another tracker and need to preserve future bookings. That choice is a distribution and repeated-use hypothesis, supported in part by the incumbent's substantial UK storefront review presence. It is not a measured estimate of segment size. If Michael has stronger access to another qualified traveler community, access should outweigh abstract market ranking.

SCHNGN's useful advantages are instant browser access, retained local history, visual adjustment of an entire plan, optional sync, language availability, and transparent computation. None is an exclusive moat. Schengen Simple already advertises protecting future trips; privacy-first browser calculators also exist. The product must win on how easily a real person completes a planning task and returns to do it again.

A possible future annual upgrade at €15–25 could package genuinely additional convenience: separate family-member histories, scenario comparison, calendar integration, or reminders. These are research hypotheses, not implemented or approved features. Do not charge existing users retroactively for already-free sync or remove free capabilities just to create an upgrade. Avoid collecting GPS or passport information merely to match a competitor, since that conflicts with the current product boundary and increases responsibility.

Native app distribution may help discoverability and notifications but requires its own validation. Being a PWA avoids installation friction while making App Store discovery unavailable. Seventeen translated sites expand potential reach but also bring maintenance and rule-copy review costs. Do not assume translations will rank or convert without distribution.

**The agent engine is useful strategically, but weak as a standalone revenue model**

A deterministic tool can make a travel agent's itinerary calculations more reliable than asking a model to improvise arithmetic. It can also introduce developers to SCHNGN. However, the published MIT packages can be used without payment and run locally; compute usage does not produce metered hosted revenue. npm downloads and MCP installations would not establish willingness to pay.

Potential paid value would be integration work, maintenance/support agreements, or a specialized operator workflow. Those require actual buyers and more responsibility. A hosted API would additionally require an explicit new privacy/authentication decision. Do not assume an API subscription can be introduced within today's local-only architecture or that existing MIT releases can be retroactively made exclusive.

**Economics favor a small product unless distribution is unusually strong**

For an illustrative future €20/year consumer plan, assume 20% VAT solely for modeling, €1 in payment costs and €2 in direct annual serving/support costs. That leaves about €13.67 per subscriber before acquisition, fixed costs, and founder pay. These are placeholders, not an applicable VAT determination or measured operating costs. Free-user support and infrastructure still need funding.

| Full-year subscribers | Gross annual billings | Modeled contribution before acquisition/fixed costs |
| --- | ---: | ---: |
| 500 | €10,000 | €6,833 |
| 2,000 | €40,000 | €27,333 |
| 5,000 | €100,000 | €68,333 |

With €6,000 fixed annual costs, roughly 440 retained subscribers cover that budget, while roughly 4,830 cover the budget plus €60,000 founder compensation, before acquisition and other taxes. At 5,000 subscribers, 75% annual retention would require replacing 1,250 subscribers each year just to stay flat. Retention is unknown; 75% is a sensitivity assumption.

At a hypothetical 2% visitor-to-paid conversion and €8 target CAC, the allowable cost per click is €0.16. A €0.50 click would imply €25 CAC, already exceeding the modeled first-year contribution. These are arithmetic examples, not observed advertising prices. Founder marketing labor and partner commissions belong in CAC too. Broad paid search is difficult to justify without actual retention and conversion evidence.

Organic community referrals, travel publications, second-home associations, and specialist trip-planning partners are therefore more plausible first experiments. Ads or affiliates could generate income from a free product, but no verified traffic or commission evidence supports forecasting them here. Keep commercial referrals clearly separate from the calculation result and do not use private trip data for targeting.

**B2B has potential, but it is a different product**

Fleet, touring-team, and travel-operations buyers may need rosters, delegated access, import pipelines, alerts, audit histories, and support. The observed SchengenTracker offer shows an existing workflow market, but also a low price for small fleets. A basic engine wrapped in an operator screen is not enough evidence for enterprise pricing. Specialized employment/crew and immigration situations must be reviewed rather than automatically treated as ordinary tourist stays.

Interview a handful of operators before building anything. Advance only if multiple unrelated organizations describe the same costly scheduling task and are willing to pilot a specific solution. The current request does not authorize a B2B pivot or centralized trip collection.

**Validation recommendation and portfolio judgment**

Keep the current free product and validate repeated utility first. Recruit 30 qualified frequent travelers with upcoming planning needs. Watch them privately use their own history without collecting it into analytics. Proposed initial signals: 20 can complete a useful plan without assistance, ten voluntarily return to adjust or check a later plan within six to eight weeks, and at least five independently identify the same missing convenience. These are proposed thresholds for a small qualitative pilot, not statistically reliable market estimates.

Use the existing allowlisted aggregate events for broad funnel checks. Measuring repeat usage or cohorts must respect the existing privacy constraints; do not add anonymous identifiers or upload dates merely to measure retention. Consented interviews and user-reported return use are acceptable research alternatives. Low return frequency outside an active travel period should be distinguished from a failed task.

If repeated use is strong, test willingness to pay later through an honestly scoped optional feature or paid pilot, with a separate user decision. Free usage validates usefulness and can identify a niche, but cannot establish subscription revenue.

Compared with Domifis, SCHNGN has a narrower and more reusable calculation core, a broader geographic audience, lower likely serving costs, and less case-by-case document work. It also faces stronger free substitutes, a lower price ceiling, and a clearer incumbent feature overlap. Domifis offers a more plausible high-value completed-service purchase, while requiring more trust and expensive human operations. Neither currently has verified traction in this assessment.

My allocation recommendation is to keep SCHNGN available, reliable, and tightly scoped while spending the next effort on distribution and repeat-use evidence. It is a credible useful product and possible side-income business; a founder-supporting business would need several thousand paying users or a separately validated organizational workflow. Do not build a global visa/tax platform or speculate on AI-agent revenue to avoid the harder distribution test.
