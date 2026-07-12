import { formatLocalizedCount } from './countUi';
import { translateExtended, translateExtendedTemplate } from './extendedLocaleStrings';
import { SUPPORTED_LOCALES, type Locale } from './locales';

type TripCardUiKey = 'timelineLabel' | 'completed' | 'expandAction' | 'collapseAction';

interface TripCardCatalog {
  timelineLabel: string;
  completed: string;
  expandAction: string;
  collapseAction: string;
  historicalOverage: (days: string) => string;
  overage: (days: string) => string;
  expand: (tripLabel: string) => string;
  collapse: (tripLabel: string) => string;
}

const catalogs: Partial<Record<Locale, TripCardCatalog>> & { en: TripCardCatalog } = {
  en: {
    timelineLabel: 'Trip timeline',
    completed: 'Completed',
    expandAction: 'Expand',
    collapseAction: 'Collapse',
    historicalOverage: (days) => `Completed · ${days} over at the time`,
    overage: (days) => `${days} over the limit`,
    expand: (tripLabel) => `Expand ${tripLabel} to edit this trip`,
    collapse: (tripLabel) => `Collapse ${tripLabel} trip editor`
  },
  fr: {
    timelineLabel: 'Chronologie du voyage',
    completed: 'Terminé',
    expandAction: 'Développer',
    collapseAction: 'Réduire',
    historicalOverage: (days) => `Terminé · ${days} au-dessus de la limite à ce moment-là`,
    overage: (days) => `${days} au-dessus de la limite`,
    expand: (tripLabel) => `Développer ${tripLabel} pour modifier ce voyage`,
    collapse: (tripLabel) => `Réduire l’éditeur du voyage ${tripLabel}`
  },
  de: {
    timelineLabel: 'Reise-Zeitleiste',
    completed: 'Abgeschlossen',
    expandAction: 'Aufklappen',
    collapseAction: 'Zuklappen',
    historicalOverage: (days) => `Abgeschlossen · damals ${days} über dem Limit`,
    overage: (days) => `${days} über dem Limit`,
    expand: (tripLabel) => `${tripLabel} aufklappen, um diese Reise zu bearbeiten`,
    collapse: (tripLabel) => `Reiseeditor für ${tripLabel} zuklappen`
  },
  es: {
    timelineLabel: 'Cronología del viaje',
    completed: 'Completado',
    expandAction: 'Expandir',
    collapseAction: 'Contraer',
    historicalOverage: (days) => `Completado · ${days} por encima del límite en ese momento`,
    overage: (days) => `${days} por encima del límite`,
    expand: (tripLabel) => `Expandir ${tripLabel} para editar este viaje`,
    collapse: (tripLabel) => `Contraer el editor del viaje ${tripLabel}`
  },
  it: {
    timelineLabel: 'Cronologia del viaggio',
    completed: 'Completato',
    expandAction: 'Espandi',
    collapseAction: 'Comprimi',
    historicalOverage: (days) => `Completato · ${days} oltre il limite in quel momento`,
    overage: (days) => `${days} oltre il limite`,
    expand: (tripLabel) => `Espandi ${tripLabel} per modificare questo viaggio`,
    collapse: (tripLabel) => `Comprimi l’editor del viaggio ${tripLabel}`
  },
  ru: {
    timelineLabel: 'Хронология поездки',
    completed: 'Завершена',
    expandAction: 'Развернуть',
    collapseAction: 'Свернуть',
    historicalOverage: (days) => `Завершена · превышение на ${days} на тот момент`,
    overage: (days) => `Превышение лимита на ${days}`,
    expand: (tripLabel) => `Развернуть ${tripLabel}, чтобы изменить поездку`,
    collapse: (tripLabel) => `Свернуть редактор поездки ${tripLabel}`
  },
  tr: {
    timelineLabel: 'Seyahat zaman çizelgesi',
    completed: 'Tamamlandı',
    expandAction: 'Genişlet',
    collapseAction: 'Daralt',
    historicalOverage: (days) => `Tamamlandı · o tarihte sınır ${days} aşıldı`,
    overage: (days) => `Sınır ${days} aşıldı`,
    expand: (tripLabel) => `${tripLabel} seyahatini düzenlemek için genişlet`,
    collapse: (tripLabel) => `${tripLabel} seyahat düzenleyicisini daralt`
  },
  he: {
    timelineLabel: 'ציר הזמן של הנסיעה',
    completed: 'הושלמה',
    expandAction: 'הרחבה',
    collapseAction: 'כיווץ',
    historicalOverage: (days) => `הושלמה · חריגה של ${days} באותו זמן`,
    overage: (days) => `${days} מעל למגבלה`,
    expand: (tripLabel) => `הרחבת ${tripLabel} לעריכת הנסיעה`,
    collapse: (tripLabel) => `כיווץ עורך הנסיעה ${tripLabel}`
  },
  ar: {
    timelineLabel: 'المخطط الزمني للرحلة',
    completed: 'مكتملة',
    expandAction: 'توسيع',
    collapseAction: 'طي',
    historicalOverage: (days) => `مكتملة · تجاوز بمقدار ${days} في ذلك الوقت`,
    overage: (days) => `${days} فوق الحد`,
    expand: (tripLabel) => `توسيع ${tripLabel} لتعديل الرحلة`,
    collapse: (tripLabel) => `طي محرر رحلة ${tripLabel}`
  }
};

function catalogFor(locale: Locale): TripCardCatalog {
  return catalogs[locale] ?? {
    timelineLabel: translateExtended(locale, catalogs.en.timelineLabel),
    completed: translateExtended(locale, catalogs.en.completed),
    expandAction: translateExtended(locale, catalogs.en.expandAction),
    collapseAction: translateExtended(locale, catalogs.en.collapseAction),
    historicalOverage: (days) => translateExtendedTemplate(locale, 'Completed · {days} over at the time', { days }),
    overage: (days) => translateExtendedTemplate(locale, '{days} over the limit', { days }),
    expand: (trip) => translateExtendedTemplate(locale, 'Expand {trip} to edit this trip', { trip }),
    collapse: (trip) => translateExtendedTemplate(locale, 'Collapse {trip} trip editor', { trip })
  };
}

export function createTripCardUiTranslator(locale: Locale): (key: TripCardUiKey) => string {
  return (key) => catalogFor(locale)[key];
}

export function formatCompletedTripOverage(locale: Locale, overBy: number): string {
  return catalogFor(locale).historicalOverage(formatLocalizedCount(locale, overBy, 'day').text);
}

export function formatActiveTripOverage(locale: Locale, overBy: number): string {
  return catalogFor(locale).overage(formatLocalizedCount(locale, overBy, 'day').text);
}

export function formatTripCardOverage(locale: Locale, overBy: number, completed: boolean): string {
  if (overBy <= 0) return completed ? catalogFor(locale).completed : '';
  return completed
    ? formatCompletedTripOverage(locale, overBy)
    : formatActiveTripOverage(locale, overBy);
}

export function formatTripCardToggleLabel(locale: Locale, tripLabel: string, expanded: boolean): string {
  return expanded ? catalogFor(locale).collapse(tripLabel) : catalogFor(locale).expand(tripLabel);
}

export function tripCardCatalogLengths(): Record<Locale, number> {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, Object.keys(catalogs.en).length])
  ) as Record<Locale, number>;
}
