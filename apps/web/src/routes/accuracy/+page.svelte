<script lang="ts">
  import { SchngnLogo } from '$lib/design';

  const officialCalculatorUrl = 'https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en';
  const cases = [
    {
      title: 'Inclusive entry and exit days',
      detail: 'A same-day Schengen stay counts as one physical day. A 10-calendar-day stay counts 10 days, not 9 nights.'
    },
    {
      title: 'Rolling 180-day window',
      detail: 'The calculation looks back 180 calendar days including the reference date, then counts only Schengen short-stay days inside that window.'
    },
    {
      title: 'Overlapping trips are de-duplicated',
      detail: 'Two imported or edited trips that cover the same physical day do not double-count that day.'
    },
    {
      title: 'Non-Schengen days excluded',
      detail: 'Ireland, Cyprus, the UK, and the US are excluded from Schengen short-stay counting, while non-EU Schengen states are included.'
    }
  ];
</script>

<svelte:head>
  <title>Accuracy evidence for the Schengen 90/180 calculator | SCHNGN</title>
  <meta
    name="description"
    content="How SCHNGN tests Schengen 90/180-day calculations with deterministic rule fixtures, boundary cases, and an independent day-set oracle."
  />
  <link rel="canonical" href="https://schngn.com/accuracy" />
  <meta property="og:url" content="https://schngn.com/accuracy" />
  <meta property="og:title" content="Accuracy evidence for the Schengen 90/180 calculator | SCHNGN" />
  <meta property="og:description" content="Official-source framing and curated edge cases for SCHNGN's 90/180-day calculator." />
  <meta property="og:image" content="https://schngn.com/brand/schngn-social.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="SCHNGN" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://schngn.com/brand/schngn-social.png" />
  <meta name="twitter:image:alt" content="SCHNGN" />
</svelte:head>

<main class="accuracy-page">
  <header class="topbar" aria-label="SCHNGN accuracy header">
    <a class="brand" href="/" aria-label="SCHNGN home">
      <SchngnLogo alt="" />
    </a>
    <a class="toplink" href="/app">Open calculator</a>
  </header>

  <section class="hero" aria-labelledby="accuracy-title">
    <p class="kicker">Transparent calculation tests</p>
    <h1 id="accuracy-title">Accuracy evidence</h1>
    <p class="lede">Tested with 50 deterministic rule fixtures, boundary cases, and an independent day-set oracle for the published Schengen 90/180-day calculation method.</p>
    <div class="actions">
      <a class="primary" href={officialCalculatorUrl} target="_blank" rel="noreferrer">European Commission short-stay calculator</a>
      <a class="secondary" href="/app">Open calculator</a>
    </div>
  </section>

  <section class="notice" aria-label="Scope and limitations">
    <strong>SCHNGN is not certified, approved, or guaranteed by the EU</strong>
    <p>The European Commission calculator is linked for independent comparison. SCHNGN's checked-in suite currently verifies published rule semantics; it does not claim captured output parity with the official calculator. It is not legal advice and does not guarantee entry.</p>
  </section>

  <section class="case-grid" aria-label="Curated accuracy cases">
    {#each cases as testCase}
      <article>
        <h2>{testCase.title}</h2>
        <p>{testCase.detail}</p>
      </article>
    {/each}
  </section>
</main>

<style>
  .accuracy-page {
    min-height: 100svh;
    padding: 20px clamp(16px, 4vw, 48px) 64px;
  }

  .topbar,
  .hero,
  .notice,
  .case-grid {
    max-width: 1120px;
    margin: 0 auto;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 64px;
    gap: 16px;
  }

  .brand,
  .toplink,
  .actions a {
    text-decoration: none;
  }

  .brand {
    display: inline-flex;
    align-items: center;
  }

  .toplink,
  .primary,
  .secondary {
    border-radius: 10px;
    font-weight: 750;
  }

  .toplink,
  .secondary {
    border: 1px solid var(--ink);
    background: var(--surface);
    color: var(--ink);
  }

  .toplink {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 10px 14px;
    white-space: nowrap;
  }

  .hero {
    padding: clamp(44px, 9vw, 88px) 0 34px;
  }

  .kicker {
    margin: 0 0 14px;
    color: var(--safe);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.83rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  h1 {
    max-width: 760px;
    margin: 0;
    color: var(--ink);
    font-size: clamp(2.7rem, 8vw, 5.3rem);
    line-height: 0.98;
    letter-spacing: -0.035em;
  }

  .lede {
    max-width: 680px;
    margin: 24px 0 0;
    color: var(--muted);
    font-size: clamp(1.08rem, 2vw, 1.25rem);
    line-height: 1.52;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 30px;
  }

  .actions a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    padding: 13px 18px;
  }

  .primary {
    background: var(--ink);
    color: var(--surface);
  }

  .notice,
  .case-grid article {
    border: 1px solid var(--line);
    background: var(--surface);
  }

  .notice {
    border-radius: 16px;
    padding: 18px 20px;
  }

  .notice strong {
    display: block;
    color: var(--ink);
    font-size: 1.05rem;
  }

  .notice p {
    margin: 8px 0 0;
    color: var(--muted);
    line-height: 1.48;
  }

  .case-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-top: 18px;
  }

  .case-grid article {
    border-radius: 14px;
    padding: 18px;
  }

  .case-grid h2 {
    margin: 0;
    color: var(--ink);
    font-size: 1.1rem;
  }

  .case-grid p {
    margin: 8px 0 0;
    color: var(--muted);
    line-height: 1.5;
  }

  @media (max-width: 760px) {
    .case-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
