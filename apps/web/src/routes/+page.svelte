<svelte:head>
  <title>SCHNGN — Schengen 90/180 planner</title>
  <meta
    name="description"
    content="A privacy-first Schengen 90/180-day calculator and trip planner for frequent travelers, second-home owners, and families."
  />
  <link rel="canonical" href="https://schngn.com/" />
  <meta property="og:url" content="https://schngn.com/" />
  <meta property="og:title" content="SCHNGN — Schengen 90/180 planner" />
  <meta
    property="og:description"
    content="A privacy-first Schengen 90/180-day calculator and trip planner."
  />
</svelte:head>

<main class="landing">
  <section class="hero">
    <p class="eyebrow">Local-first · no account · no trip data uploaded</p>
    <h1>Know if your Schengen trip fits before you book it.</h1>
    <p class="lede">
      SCHNGN explains your 90/180-day status in plain English, shows when days come back,
      and keeps your travel history on your device.
    </p>
    <div class="actions">
      <a class="primary" href="/app">Open calculator</a>
      <a class="secondary" href="/app">See how it works</a>
    </div>
  </section>

  <section class="cards" aria-label="Product promises">
    <article>
      <strong>Answer first</strong>
      <span>Safe, close, or over limit — with the date that matters.</span>
    </article>
    <article>
      <strong>Proof second</strong>
      <span>Rolling 180-day window, inclusive entry/exit counting, and days returning.</span>
    </article>
    <article>
      <strong>Private by default</strong>
      <span>Trips live in browser storage. Analytics must never contain travel dates.</span>
    </article>
  </section>
</main>

<style>
  .landing {
    min-height: 100svh;
    padding: 48px 20px;
  }

  .hero,
  .cards {
    max-width: 980px;
    margin: 0 auto;
  }

  .hero {
    padding: 64px 0 40px;
  }

  .eyebrow {
    margin: 0 0 16px;
    color: #25605a;
    font-size: 0.88rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    max-width: 760px;
    margin: 0;
    color: #0b1f35;
    font-size: clamp(2.6rem, 9vw, 5.8rem);
    line-height: 0.93;
    letter-spacing: -0.07em;
  }

  .lede {
    max-width: 620px;
    margin: 24px 0 0;
    color: #41516a;
    font-size: clamp(1.08rem, 2vw, 1.35rem);
    line-height: 1.55;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 32px;
  }

  .actions a {
    min-height: 44px;
    border-radius: 999px;
    padding: 13px 18px;
    text-decoration: none;
    font-weight: 800;
  }

  .primary {
    background: #0f2a4a;
    color: white;
  }

  .secondary {
    border: 1px solid #b9c7d6;
    background: white;
    color: #17304f;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  article {
    border: 1px solid #d7e1ea;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.82);
    padding: 22px;
    box-shadow: 0 18px 50px rgba(26, 48, 73, 0.08);
  }

  article strong,
  article span {
    display: block;
  }

  article strong {
    color: #10243b;
    font-size: 1.05rem;
  }

  article span {
    margin-top: 8px;
    color: #4e5d72;
    line-height: 1.45;
  }

  @media (max-width: 760px) {
    .landing {
      padding-top: 20px;
    }

    .hero {
      padding-top: 38px;
    }

    .cards {
      grid-template-columns: 1fr;
    }
  }
</style>
