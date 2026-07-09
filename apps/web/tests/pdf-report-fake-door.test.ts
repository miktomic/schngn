import { describe, expect, test } from 'bun:test';
import {
  PDF_REPORT_PRICE_BUCKET,
  PDF_REPORT_PRICE_LABEL,
  buildPdfBuyIntentEvent,
  buildPdfReportFakeDoorState
} from '../src/lib/fake-door/pdfReportFakeDoor';

describe('border-ready PDF fake-door', () => {
  test('uses the approved fixed MVP price without enabling payment capture', () => {
    expect(PDF_REPORT_PRICE_BUCKET).toBe('eur_9');
    expect(PDF_REPORT_PRICE_LABEL).toBe('€9');

    expect(buildPdfReportFakeDoorState(false)).toEqual({
      buttonLabel: 'Generate border-ready PDF — €9',
      helperCopy: 'PDF export is an early-access fake door. Clicking records interest only; no payment is taken.',
      messageTitle: 'PDF export is not live yet',
      messageCopy: 'You can join the early-access list. SCHNGN records intent only and does not charge you.',
      showIntentMessage: false
    });

    expect(buildPdfReportFakeDoorState(true).showIntentMessage).toBe(true);
  });

  test('builds only the aggregate pdf_buy_intent analytics payload', () => {
    const event = buildPdfBuyIntentEvent();

    expect(event).toEqual({
      name: 'pdf_buy_intent',
      props: {
        source: 'report',
        price_bucket: 'eur_9'
      }
    });
    expect(JSON.stringify(event)).not.toContain('2026-');
    expect(JSON.stringify(event)).not.toContain('Italy');
    expect(JSON.stringify(event)).not.toContain('@');
  });
});
