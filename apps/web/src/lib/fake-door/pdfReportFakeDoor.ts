import { buildAnalyticsEvent, type AnalyticsEvent, type PriceBucket } from '../analytics/privacyAnalytics';

export const PDF_REPORT_PRICE_BUCKET: PriceBucket = 'eur_9';
export const PDF_REPORT_PRICE_LABEL = '€9';

export interface PdfReportFakeDoorState {
  buttonLabel: string;
  helperCopy: string;
  messageCopy: string;
  messageTitle: string;
  showIntentMessage: boolean;
}

export function buildPdfReportFakeDoorState(showIntentMessage: boolean): PdfReportFakeDoorState {
  return {
    buttonLabel: `Generate border-ready PDF — ${PDF_REPORT_PRICE_LABEL}`,
    helperCopy: 'PDF export is an early-access fake door. Clicking records interest only; no payment is taken.',
    messageTitle: 'PDF export is not live yet',
    messageCopy: 'You can join the early-access list. SCHNGN records intent only and does not charge you.',
    showIntentMessage
  };
}

export function buildPdfBuyIntentEvent(): AnalyticsEvent {
  return buildAnalyticsEvent('pdf_buy_intent', {
    source: 'report',
    price_bucket: PDF_REPORT_PRICE_BUCKET
  });
}
