<script lang="ts">
  import { formatDate, type Locale } from '$lib/i18n';
  import type { LegalPageCopy } from '$lib/i18n/legalUi';

  interface Props {
    locale: Locale;
    copy: LegalPageCopy;
  }

  let { locale, copy }: Props = $props();

  let updatedDate = $derived(formatDate(locale, copy.updatedDate, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }));
</script>

<main class="legal-page">
  <article class="legal-document" aria-labelledby="legal-title">
    <header class="legal-hero">
      <p class="document-label">{copy.navLabel}</p>
      <h1 id="legal-title">{copy.title}</h1>
      <p class="intro">{copy.intro}</p>
      <p class="updated">{copy.updatedLabel} <time datetime={copy.updatedDate}>{updatedDate}</time></p>
    </header>

    <div class="legal-layout">
      <nav class="section-navigation" aria-label={copy.navLabel}>
        <ol>
          <li><a href="#legal-summary">{copy.summaryTitle}</a></li>
          {#each copy.sections as section}
            <li><a href={`#${section.id}`}>{section.title}</a></li>
          {/each}
          {#if copy.providerLinksTitle && copy.providerLinks?.length}
            <li><a href="#legal-providers">{copy.providerLinksTitle}</a></li>
          {/if}
          <li><a href="#legal-contact">{copy.contactTitle}</a></li>
        </ol>
      </nav>

      <div class="legal-content">
        <section id="legal-summary" class="summary" aria-labelledby="legal-summary-title">
          <h2 id="legal-summary-title">{copy.summaryTitle}</h2>
          <ul>
            {#each copy.summaryItems as item}<li>{item}</li>{/each}
          </ul>
        </section>

        {#each copy.sections as section}
          <section id={section.id} class="policy-section" aria-labelledby={`${section.id}-title`}>
            <h2 id={`${section.id}-title`}>{section.title}</h2>
            {#each section.paragraphs as paragraph}<p>{paragraph}</p>{/each}
            {#if section.items?.length}
              <ul>
                {#each section.items as item}<li>{item}</li>{/each}
              </ul>
            {/if}
          </section>
        {/each}

        {#if copy.providerLinksTitle && copy.providerLinks?.length}
          <section id="legal-providers" class="providers" aria-labelledby="legal-providers-title">
            <h2 id="legal-providers-title">{copy.providerLinksTitle}</h2>
            <ul>
              {#each copy.providerLinks as provider}
                <li><a href={provider.url} target="_blank" rel="noreferrer">{provider.label}</a></li>
              {/each}
            </ul>
          </section>
        {/if}

        <section id="legal-contact" class="contact" aria-labelledby="legal-contact-title">
          <h2 id="legal-contact-title">{copy.contactTitle}</h2>
          <p>{copy.contactBody}</p>
          <a href="mailto:support@schngn.com"><bdi>{copy.contactLinkLabel}</bdi></a>
        </section>
      </div>
    </div>
  </article>
</main>

<style>
  .legal-page {
    min-height: 100svh;
    padding: 0 clamp(16px, 4vw, 48px) 72px;
  }

  .legal-document {
    width: min(1120px, 100%);
    margin: 0 auto;
  }

  .legal-hero {
    max-width: 850px;
    padding: clamp(48px, 8vw, 88px) 0 clamp(36px, 6vw, 58px);
  }

  .document-label {
    margin: 0 0 14px;
    color: var(--safe);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.84rem;
    font-weight: 720;
  }

  h1 {
    margin: 0;
    color: var(--ink);
    font-size: clamp(2.6rem, 7vw, 4.7rem);
    line-height: 0.98;
    letter-spacing: -0.035em;
    overflow-wrap: anywhere;
    text-wrap: balance;
  }

  .intro {
    max-width: 72ch;
    margin: 24px 0 0;
    color: var(--muted);
    font-size: clamp(1.06rem, 2vw, 1.2rem);
    line-height: 1.62;
    text-wrap: pretty;
  }

  .updated {
    margin: 18px 0 0;
    color: var(--ink);
    font-size: 0.92rem;
    font-weight: 680;
  }

  .legal-layout {
    display: grid;
    grid-template-columns: minmax(190px, 0.3fr) minmax(0, 1fr);
    align-items: start;
    gap: clamp(32px, 7vw, 84px);
    border-top: 1px solid var(--line);
    padding-top: clamp(28px, 5vw, 44px);
  }

  .section-navigation {
    position: sticky;
    top: 24px;
  }

  .section-navigation ol {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .section-navigation a {
    display: flex;
    min-height: 44px;
    align-items: center;
    border-bottom: 1px solid color-mix(in srgb, var(--line), transparent 24%);
    color: var(--muted);
    font-size: 0.9rem;
    font-weight: 680;
    line-height: 1.3;
    overflow-wrap: anywhere;
    text-decoration: none;
  }

  .section-navigation a:hover {
    color: var(--safe);
  }

  .legal-content {
    min-width: 0;
    max-width: 76ch;
  }

  .summary,
  .policy-section,
  .providers,
  .contact {
    scroll-margin-top: 24px;
  }

  .summary {
    border-block: 1px solid var(--line);
    background: var(--surface);
    padding: clamp(22px, 4vw, 32px);
  }

  h2 {
    margin: 0;
    color: var(--ink);
    font-size: clamp(1.35rem, 2.5vw, 1.8rem);
    line-height: 1.2;
    letter-spacing: -0.015em;
    overflow-wrap: anywhere;
    text-wrap: balance;
  }

  :global([dir='rtl']) h1,
  :global([dir='rtl']) h2 {
    letter-spacing: normal;
  }

  .summary ul,
  .policy-section ul,
  .providers ul {
    margin: 16px 0 0;
    padding-inline-start: 1.25rem;
  }

  li,
  .policy-section p,
  .contact p {
    color: var(--ink);
    font-size: 1rem;
    line-height: 1.68;
    text-wrap: pretty;
  }

  li + li {
    margin-top: 8px;
  }

  .policy-section {
    border-bottom: 1px solid var(--line);
    padding: clamp(30px, 5vw, 46px) 0;
  }

  .providers {
    border-bottom: 1px solid var(--line);
    padding: clamp(30px, 5vw, 46px) 0;
  }

  .providers a {
    color: var(--safe);
    font-weight: 720;
    overflow-wrap: anywhere;
    text-decoration-thickness: 1px;
    text-underline-offset: 4px;
  }

  .policy-section p,
  .contact p {
    margin: 14px 0 0;
  }

  .contact {
    padding: clamp(30px, 5vw, 46px) 0 0;
  }

  .contact a {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    margin-top: 14px;
    color: var(--safe);
    font-weight: 740;
    overflow-wrap: anywhere;
    text-decoration-thickness: 1px;
    text-underline-offset: 4px;
  }

  @media (max-width: 760px) {
    .legal-hero {
      padding-top: 42px;
    }

    .legal-layout {
      grid-template-columns: 1fr;
      gap: 32px;
    }

    .section-navigation {
      position: static;
    }

    .legal-content {
      max-width: none;
    }
  }
</style>
