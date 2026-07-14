export const MAX_STAYS = 100;

export const SCHEMA_VERSION = '1' as const;
export const RULE_SET = 'ordinary-schengen-90-180/v1' as const;

export const OFFICIAL_SOURCE_URL =
  'https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en' as const;

export const PLANNING_AID_ADVISORY = Object.freeze({
  code: 'planning_aid_not_legal_advice',
  message: 'Planning aid only — not legal advice or a guarantee of entry. Verify with official sources.',
  officialSourceUrl: OFFICIAL_SOURCE_URL
} as const);
