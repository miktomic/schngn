import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const inputPath = resolve('apps/web/src/lib/bilateral/data/catalog.v1.json');
const outputPath = resolve('apps/web/src/lib/bilateral/data/runtime.v1.json');
const catalog = JSON.parse(await readFile(inputPath, 'utf8'));
const publishableStatuses = new Set(['confirmed_current', 'confirmed_with_procedure_gap']);

const verifications = catalog.currentVerifications
  .filter((verification) => publishableStatuses.has(verification.evidenceStatus))
  .filter((verification) => ['ordinary', 'all'].includes(verification.passportType))
  .map((verification) => {
    if (!verification.primaryUserSourceId) {
      throw new Error(`Publishable verification ${verification.id} has no primary user source`);
    }
    return {
      passportCountryCode: verification.travellerCountryCode,
      hostCountryCode: verification.hostCountryCode,
      passportType: verification.passportType,
      evidenceStatus: verification.evidenceStatus,
      primaryUserSourceId: verification.primaryUserSourceId,
      reviewedOn: verification.reviewedOn,
      reviewDueOn: verification.reviewDueOn
    };
  });

const sourceIds = new Set(verifications.map((verification) => verification.primaryUserSourceId));
const sources = catalog.sources
  .filter((source) => sourceIds.has(source.id))
  .map((source) => {
    if (
      source.authorityClass !== 'national_government' ||
      source.sourceType !== 'current_national_guidance' ||
      source.sourceState !== 'live'
    ) {
      throw new Error(`Runtime source ${source.id} is not live current national guidance`);
    }
    return {
      id: source.id,
      title: source.title,
      issuer: source.issuer,
      url: source.url,
      language: source.language,
      accessedOn: source.accessedOn
    };
  });

if (sources.length !== sourceIds.size) throw new Error('A runtime verification references a missing source');

const runtime = {
  schemaVersion: 1,
  catalogVersion: catalog.catalogVersion,
  generatedOn: catalog.generatedOn,
  calculationSupport: 'none',
  passports: catalog.markets.map((market) => ({
    countryCode: market.countryCode,
    countryName: market.countryName
  })),
  sources,
  verifications
};

await writeFile(outputPath, `${JSON.stringify(runtime, null, 2)}\n`);
process.stdout.write(`Wrote ${outputPath}\n`);
