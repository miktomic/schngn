import type { Locale } from './locales';

// Labels describe the existing calculation checkpoint; they do not change the rule.
const labels: Record<Locale, readonly [string, string]> = {
  en: ['Result for', 'First over the limit on'],
  fr: ['Résultat au', 'Premier dépassement le'],
  de: ['Ergebnis für', 'Erste Überschreitung am'],
  es: ['Resultado para el', 'Primer exceso del límite el'],
  it: ['Risultato al', 'Primo superamento del limite il'],
  'pt-br': ['Resultado em', 'Primeiro excesso do limite em'],
  ru: ['Расчёт на', 'Первое превышение лимита'],
  uk: ['Розрахунок на', 'Перше перевищення ліміту'],
  tr: ['Hesaplama tarihi', 'Limitin ilk aşıldığı tarih'],
  sr: ['Rezultat za', 'Prvo prekoračenje ograničenja'],
  sq: ['Rezultati për', 'Tejkalimi i parë i kufirit më'],
  ka: ['შედეგი თარიღისთვის', 'ლიმიტის პირველი გადაჭარბების თარიღი'],
  'zh-cn': ['计算日期', '首次超出限额日期'],
  ja: ['計算対象日', '初めて上限を超える日'],
  ko: ['계산 기준일', '한도를 처음 초과하는 날'],
  he: ['תוצאה לתאריך', 'החריגה הראשונה מהמכסה בתאריך'],
  ar: ['النتيجة بتاريخ', 'أول تجاوز للحد بتاريخ']
};

export function calculationScopeLabel(locale: Locale, firstConflict: boolean): string {
  return labels[locale][firstConflict ? 1 : 0];
}
