import { parseISODate } from '@schngn/engine';
import { z } from 'zod';
import {
  MAX_STAYS,
  OFFICIAL_SOURCE_URL,
  PLANNING_AID_ADVISORY,
  RULE_SET,
  SCHEMA_VERSION
} from './constants.js';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

export const ISODateSchema = z.string().superRefine((value, context) => {
  if (!ISO_DATE_PATTERN.test(value)) {
    context.addIssue({ code: 'custom', message: 'invalid_date_format' });
    return;
  }
  if (!isActualCalendarDate(value)) {
    context.addIssue({ code: 'custom', message: 'invalid_calendar_date' });
  }
});
export type ISODate = z.output<typeof ISODateSchema>;

export const SchengenStaySchema = z.object({
  entryDate: ISODateSchema,
  exitDate: ISODateSchema
}).strict().superRefine((stay, context) => {
  if (
    isActualCalendarDate(stay.entryDate) &&
    isActualCalendarDate(stay.exitDate) &&
    stay.exitDate < stay.entryDate
  ) {
    context.addIssue({
      code: 'custom',
      message: 'exit_before_entry',
      path: ['exitDate']
    });
  }
});
export type SchengenStay = z.output<typeof SchengenStaySchema>;

export const SchengenStayListSchema = z.array(SchengenStaySchema).max(MAX_STAYS, {
  error: 'too_many_stays'
});

export const SemanticStatusSchema = z.enum([
  'within_limit',
  'near_limit',
  'at_limit',
  'over_limit'
]);
export type SemanticStatus = z.output<typeof SemanticStatusSchema>;

export const CapabilityAdvisorySchema = z.object({
  code: z.literal(PLANNING_AID_ADVISORY.code),
  message: z.literal(PLANNING_AID_ADVISORY.message),
  officialSourceUrl: z.literal(OFFICIAL_SOURCE_URL)
}).strict();
export type CapabilityAdvisory = z.output<typeof CapabilityAdvisorySchema>;

const capabilityMetadataShape = {
  schemaVersion: z.literal(SCHEMA_VERSION),
  ruleSet: z.literal(RULE_SET),
  advisory: CapabilityAdvisorySchema
} as const;

export const CalculateUsageInputSchema = z.object({
  stays: SchengenStayListSchema,
  referenceDate: ISODateSchema,
  includeCountedDays: z.boolean().default(false)
}).strict();
export type CalculateUsageInput = z.input<typeof CalculateUsageInputSchema>;
export type NormalizedCalculateUsageInput = z.output<typeof CalculateUsageInputSchema>;
export type CalculateUsageRequest = CalculateUsageInput;

export const CalculateUsageOutputSchema = z.object({
  ...capabilityMetadataShape,
  result: z.object({
    referenceDate: ISODateSchema,
    windowStart: ISODateSchema,
    windowEnd: ISODateSchema,
    daysUsed: z.number().int().min(0),
    daysRemaining: z.number().int().min(0),
    overLimit: z.boolean(),
    overBy: z.number().int().min(0),
    status: SemanticStatusSchema,
    countedDays: z.array(ISODateSchema).optional()
  }).strict()
}).strict();
export type CalculateUsageOutput = z.output<typeof CalculateUsageOutputSchema>;

export const CheckStayInputSchema = z.object({
  existingStays: SchengenStayListSchema,
  candidateStay: SchengenStaySchema
}).strict();
export type CheckStayInput = z.input<typeof CheckStayInputSchema>;
export type CheckStayRequest = CheckStayInput;

export const CheckStayOutputSchema = z.object({
  ...capabilityMetadataShape,
  result: z.object({
    safeForEveryDay: z.boolean(),
    status: SemanticStatusSchema,
    firstOverLimitDate: ISODateSchema.nullable(),
    safeThroughDate: ISODateSchema.nullable(),
    peakDaysUsed: z.number().int().min(0),
    minimumDaysRemaining: z.number().int().min(0),
    overBy: z.number().int().min(0)
  }).strict()
}).strict();
export type CheckStayOutput = z.output<typeof CheckStayOutputSchema>;

export const LatestSafeExitInputSchema = z.object({
  existingStays: SchengenStayListSchema,
  entryDate: ISODateSchema
}).strict();
export type LatestSafeExitInput = z.input<typeof LatestSafeExitInputSchema>;
export type LatestSafeExitRequest = LatestSafeExitInput;

export const LatestSafeExitOutputSchema = z.object({
  ...capabilityMetadataShape,
  result: z.object({
    entryDate: ISODateSchema,
    latestSafeExitDate: ISODateSchema.nullable()
  }).strict()
}).strict();
export type LatestSafeExitOutput = z.output<typeof LatestSafeExitOutputSchema>;

function isActualCalendarDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  try {
    parseISODate(value);
    return true;
  } catch {
    return false;
  }
}
