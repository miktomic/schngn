import { formatLocalizedCount } from './countUi';
import type { Locale } from './locales';

type TripCardUiKey = 'timelineLabel' | 'completed';

interface TripCardCatalog {
  timelineLabel: string;
  completed: string;
  historicalOverage: (days: string) => string;
  overage: (days: string) => string;
  expand: (tripLabel: string) => string;
  collapse: (tripLabel: string) => string;
}

const catalogs: Record<Locale, TripCardCatalog> = {
  en: {
    timelineLabel: 'Trip timeline',
    completed: 'Completed',
    historicalOverage: (days) => `Completed · ${days} over at the time`,
    overage: (days) => `${days} over the limit`,
    expand: (tripLabel) => `Expand ${tripLabel} to edit this trip`,
    collapse: (tripLabel) => `Collapse ${tripLabel} trip editor`
  },
  fr: {
    timelineLabel: 'Chronologie du voyage',
    completed: 'Terminé',
    historicalOverage: (days) => `Terminé · ${days} au-dessus de la limite à ce moment-là`,
    overage: (days) => `${days} au-dessus de la limite`,
    expand: (tripLabel) => `Développer ${tripLabel} pour modifier ce voyage`,
    collapse: (tripLabel) => `Réduire l’éditeur du voyage ${tripLabel}`
  },
  de: {
    timelineLabel: 'Reise-Zeitleiste',
    completed: 'Abgeschlossen',
    historicalOverage: (days) => `Abgeschlossen · damals ${days} über dem Limit`,
    overage: (days) => `${days} über dem Limit`,
    expand: (tripLabel) => `${tripLabel} aufklappen, um diese Reise zu bearbeiten`,
    collapse: (tripLabel) => `Reiseeditor für ${tripLabel} zuklappen`
  },
  es: {
    timelineLabel: 'Cronología del viaje',
    completed: 'Completado',
    historicalOverage: (days) => `Completado · ${days} por encima del límite en ese momento`,
    overage: (days) => `${days} por encima del límite`,
    expand: (tripLabel) => `Expandir ${tripLabel} para editar este viaje`,
    collapse: (tripLabel) => `Contraer el editor del viaje ${tripLabel}`
  },
  it: {
    timelineLabel: 'Cronologia del viaggio',
    completed: 'Completato',
    historicalOverage: (days) => `Completato · ${days} oltre il limite in quel momento`,
    overage: (days) => `${days} oltre il limite`,
    expand: (tripLabel) => `Espandi ${tripLabel} per modificare questo viaggio`,
    collapse: (tripLabel) => `Comprimi l’editor del viaggio ${tripLabel}`
  },
  ru: {
    timelineLabel: 'Хронология поездки',
    completed: 'Завершена',
    historicalOverage: (days) => `Завершена · превышение на ${days} на тот момент`,
    overage: (days) => `Превышение лимита на ${days}`,
    expand: (tripLabel) => `Развернуть ${tripLabel}, чтобы изменить поездку`,
    collapse: (tripLabel) => `Свернуть редактор поездки ${tripLabel}`
  },
  tr: {
    timelineLabel: 'Seyahat zaman çizelgesi',
    completed: 'Tamamlandı',
    historicalOverage: (days) => `Tamamlandı · o tarihte sınır ${days} aşıldı`,
    overage: (days) => `Sınır ${days} aşıldı`,
    expand: (tripLabel) => `${tripLabel} seyahatini düzenlemek için genişlet`,
    collapse: (tripLabel) => `${tripLabel} seyahat düzenleyicisini daralt`
  },
  he: {
    timelineLabel: 'ציר הזמן של הנסיעה',
    completed: 'הושלמה',
    historicalOverage: (days) => `הושלמה · חריגה של ${days} באותו זמן`,
    overage: (days) => `${days} מעל למגבלה`,
    expand: (tripLabel) => `הרחבת ${tripLabel} לעריכת הנסיעה`,
    collapse: (tripLabel) => `כיווץ עורך הנסיעה ${tripLabel}`
  },
  ar: {
    timelineLabel: 'المخطط الزمني للرحلة',
    completed: 'مكتملة',
    historicalOverage: (days) => `مكتملة · تجاوز بمقدار ${days} في ذلك الوقت`,
    overage: (days) => `${days} فوق الحد`,
    expand: (tripLabel) => `توسيع ${tripLabel} لتعديل الرحلة`,
    collapse: (tripLabel) => `طي محرر رحلة ${tripLabel}`
  }
};

export function createTripCardUiTranslator(locale: Locale): (key: TripCardUiKey) => string {
  return (key) => catalogs[locale][key];
}

export function formatCompletedTripOverage(locale: Locale, overBy: number): string {
  return catalogs[locale].historicalOverage(formatLocalizedCount(locale, overBy, 'day').text);
}

export function formatActiveTripOverage(locale: Locale, overBy: number): string {
  return catalogs[locale].overage(formatLocalizedCount(locale, overBy, 'day').text);
}

export function formatTripCardOverage(locale: Locale, overBy: number, completed: boolean): string {
  if (overBy <= 0) return completed ? catalogs[locale].completed : '';
  return completed
    ? formatCompletedTripOverage(locale, overBy)
    : formatActiveTripOverage(locale, overBy);
}

export function formatTripCardToggleLabel(locale: Locale, tripLabel: string, expanded: boolean): string {
  return expanded ? catalogs[locale].collapse(tripLabel) : catalogs[locale].expand(tripLabel);
}

export function tripCardCatalogLengths(): Record<Locale, number> {
  return Object.fromEntries(
    Object.entries(catalogs).map(([locale, catalog]) => [locale, Object.keys(catalog).length])
  ) as Record<Locale, number>;
}
