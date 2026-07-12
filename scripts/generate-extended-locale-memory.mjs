import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from '../node_modules/.bun/typescript@6.0.3/node_modules/typescript/lib/typescript.js';

const targets = {
  'pt-br': 'pt',
  uk: 'uk',
  sr: 'sr',
  'zh-cn': 'zh-CN',
  sq: 'sq',
  ka: 'ka',
  ja: 'ja',
  ko: 'ko'
};

const sourceFiles = [
  'messages.ts', 'appUi.ts', 'appDeepUi.ts', 'appRuntimeUi.ts', 'countryGuideUi.ts', 'explainerUi.ts',
  'faqUi.ts', 'ongoingStayUi.ts', 'rulesUi.ts', 'signupValueUi.ts', 'singlePageUi.ts',
  'stateUi.ts', 'timelineUi.ts', 'tripCardUi.ts', 'tripOnboardingUi.ts', 'whatIfUi.ts'
].map((name) => resolve('apps/web/src/lib/i18n', name));
sourceFiles.push(resolve('apps/web/src/lib/explanation/explanationState.ts'));

const manualTemplates = [
  'At the limit', 'Over by {days}', 'Fits · {days} spare', 'Within limit · {days}',
  'Completed · {days} over at the time', '{days} over the limit',
  'Expand {trip} to edit this trip', 'Collapse {trip} trip editor',
  'Days start returning', 'First counted day returns on {date}.',
  '{used} counted days in this inclusive 180-day window. {remaining} safe buffer days remain.',
  '{used} counted days in this inclusive 180-day window. {over} days are over the 90-day limit.',
  '{returned} counted days return to the allowance during this {forecast}-day forecast.',
  'No counted days return to the allowance during this {forecast}-day forecast.',
  '{used}/{limit} counted days', '{count} counted day', '{count} counted days',
  '{count} safe buffer day', '{count} safe buffer days',
  '{days} between {start} and {end}.', 'Entered via {country}', 'Left via {country}',
  'The app looks back {windowDays} calendar days from {referenceDate}, including {referenceDate} itself.',
  'That is {daysOver} over the {allowanceDays}-day limit.', 'That leaves {safeBuffer}.',
  '{count} day', '{count} days', '{count} trip', '{count} trips',
  '{count} Schengen day', '{count} Schengen days', '{count} day outside', '{count} days outside',
  'SCHNGN is a planning calculator, not legal advice and not a guarantee of entry. It estimates ordinary short stays under the Schengen 90/180-day rule. It does not account for residence permits, long-stay or national visas, bilateral waiver agreements, nationality-specific exceptions, work/study/asylum status, EES/ETIAS transition issues, or border-officer discretion. Always verify with official sources before booking or travelling.',
  'Planning aid only. Not legal advice or a guarantee of entry. Verify with official sources.',
  'European Commission short-stay calculator', 'Entry/Exit System information', 'ETIAS information',
  'Past trip', 'Trip', 'What-if trip', 'Over the limit', 'Day returned', 'Not counted',
  'Timeline legend', 'Date range'
];

function collectEnglishStrings(sourceText, fileName) {
  const source = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const strings = new Set();

  function collect(node) {
    if (ts.isStringLiteralLike(node)) {
      if (ts.isPropertyAssignment(node.parent) && node.parent.name === node) return;
      if (node.text.trim()) strings.add(node.text);
      return;
    }
    if (ts.isNoSubstitutionTemplateLiteral(node) && node.text.trim()) strings.add(node.text);
    ts.forEachChild(node, collect);
  }

  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'en' && node.initializer) {
      collect(node.initializer);
    }
    if (ts.isPropertyAssignment(node) && propertyName(node.name) === 'en') collect(node.initializer);
    ts.forEachChild(node, visit);
  }

  visit(source);
  return strings;
}

function propertyName(node) {
  return ts.isIdentifier(node) || ts.isStringLiteralLike(node) ? node.text : '';
}

function protectPlaceholders(value) {
  const placeholders = [];
  return {
    value: value.replace(/\{[a-zA-Z0-9_]+\}/g, (placeholder) => {
      const token = `82468024680246${placeholders.length}80`;
      placeholders.push([token, placeholder]);
      return token;
    }),
    placeholders
  };
}

async function translate(value, target) {
  const protectedValue = protectPlaceholders(value);
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'en');
  url.searchParams.set('tl', target);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', protectedValue.value);

  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      let translated = payload[0].map((part) => part[0]).join('');
      for (const [token, placeholder] of protectedValue.placeholders) {
        translated = translated.replaceAll(token, placeholder);
      }
      if (protectedValue.placeholders.some(([, placeholder]) => !translated.includes(placeholder))) {
        throw new Error(`placeholder loss in ${JSON.stringify(value)}`);
      }
      return translated;
    } catch (error) {
      lastError = error;
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 250 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function mapConcurrent(items, concurrency, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }));
  return results;
}

function serbianLatin(value) {
  const pairs = [
    ['Љ', 'Lj'], ['љ', 'lj'], ['Њ', 'Nj'], ['њ', 'nj'], ['Џ', 'Dž'], ['џ', 'dž'],
    ['А', 'A'], ['а', 'a'], ['Б', 'B'], ['б', 'b'], ['В', 'V'], ['в', 'v'],
    ['Г', 'G'], ['г', 'g'], ['Д', 'D'], ['д', 'd'], ['Ђ', 'Đ'], ['ђ', 'đ'],
    ['Е', 'E'], ['е', 'e'], ['Ж', 'Ž'], ['ж', 'ž'], ['З', 'Z'], ['з', 'z'],
    ['И', 'I'], ['и', 'i'], ['Ј', 'J'], ['ј', 'j'], ['К', 'K'], ['к', 'k'],
    ['Л', 'L'], ['л', 'l'], ['М', 'M'], ['м', 'm'], ['Н', 'N'], ['н', 'n'],
    ['О', 'O'], ['о', 'o'], ['П', 'P'], ['п', 'p'], ['Р', 'R'], ['р', 'r'],
    ['С', 'S'], ['с', 's'], ['Т', 'T'], ['т', 't'], ['Ћ', 'Ć'], ['ћ', 'ć'],
    ['У', 'U'], ['у', 'u'], ['Ф', 'F'], ['ф', 'f'], ['Х', 'H'], ['х', 'h'],
    ['Ц', 'C'], ['ц', 'c'], ['Ч', 'Č'], ['ч', 'č'], ['Ш', 'Š'], ['ш', 'š']
  ];
  return pairs.reduce((translated, [from, to]) => translated.replaceAll(from, to), value);
}

const strings = new Set(manualTemplates);
for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8');
  for (const value of collectEnglishStrings(source, file)) strings.add(value);
}

const english = [...strings].filter((value) => value.trim() && !/^[-+\d\s./:]+$/u.test(value)).sort();
if (process.argv.includes('--count')) {
  process.stdout.write(`${english.length}\n`);
  process.exit(0);
}

const dictionaries = {};
for (const [locale, target] of Object.entries(targets)) {
  process.stdout.write(`Translating ${english.length} strings for ${locale}…\n`);
  const translations = await mapConcurrent(english, 16, (value) => translate(value, target));
  dictionaries[locale] = Object.fromEntries(english.map((value, index) => [value, translations[index]]));
}

// Google returns Serbian in Cyrillic for the generic `sr` target. The product locale is
// deliberately Serbian Latin, so transliterate the fixed catalog before writing it.
for (const [source, translation] of Object.entries(dictionaries.sr)) {
  dictionaries.sr[source] = serbianLatin(translation);
}

// Ukrainian scope wording is deliberately explicit because temporary-protection and residence
// status can change which days count; the calculator models ordinary short stays only.
const ukrainianPermit = 'Time authorized by a Schengen residence permit or D-type long-stay visa is not entered as an ordinary short stay in the EU calculator. Travel in other Schengen countries may still have a separate 90/180 limit, so check the issuing authority’s rules.';
if (dictionaries.uk[ukrainianPermit]) {
  dictionaries.uk[ukrainianPermit] += ' Тимчасовий захист або інший статус проживання також може змінити, які дні враховуються; SCHNGN розраховує лише звичайні короткострокові перебування.';
}

const translationLists = Object.fromEntries(Object.entries(dictionaries).map(([locale, dictionary]) => [locale, english.map((value) => dictionary[value])]));
const output = `// Generated from the canonical English UI catalog. Keep this static so localization works offline.\n` +
`// Rule and legal copy should receive native-speaker review before paid acquisition in a new market.\n` +
`const english = ${JSON.stringify(english, null, 2)} as const;\n` +
`const translations = ${JSON.stringify(translationLists, null, 2)} as const;\n` +
`const positions = new Map<string, number>(english.map((value, index) => [value, index]));\n\n` +
`export function isExtendedLocale(locale: string): locale is keyof typeof translations {\n` +
`  return Object.prototype.hasOwnProperty.call(translations, locale);\n` +
`}\n\n` +
`export function translateExtended(locale: string, value: string): string {\n` +
`  if (!isExtendedLocale(locale)) return value;\n` +
`  const position = positions.get(value);\n` +
`  return position === undefined ? value : translations[locale][position] ?? value;\n` +
`}\n\n` +
`export function translateExtendedTemplate(locale: string, template: string, values: Record<string, string | number>): string {\n` +
`  return translateExtended(locale, template).replace(/\\{([a-zA-Z0-9_]+)\\}/g, (match, name: string) => String(values[name] ?? match));\n` +
`}\n\n` +
`export function deepTranslateExtended<T>(locale: string, value: T, parentKey = ''): T {\n` +
`  if (!isExtendedLocale(locale)) return value;\n` +
`  if (typeof value === 'string') return (['id', 'source'].includes(parentKey) ? value : translateExtended(locale, value)) as T;\n` +
`  if (Array.isArray(value)) return value.map((item) => deepTranslateExtended(locale, item, parentKey)) as T;\n` +
`  if (value && typeof value === 'object') {\n` +
`    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deepTranslateExtended(locale, item, key)])) as T;\n` +
`  }\n` +
`  return value;\n` +
`}\n`;

await writeFile(resolve('apps/web/src/lib/i18n/extendedLocaleStrings.ts'), output);
