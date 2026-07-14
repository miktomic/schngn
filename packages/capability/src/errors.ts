import { z } from 'zod';

const VALIDATION_ISSUE_CODES = [
  'invalid_input',
  'invalid_type',
  'unknown_field',
  'too_many_stays',
  'invalid_date_format',
  'invalid_calendar_date',
  'exit_before_entry'
] as const;

const VALIDATION_ERROR_MESSAGE = 'Capability input is invalid.' as const;

export const ValidationIssueCodeSchema = z.enum(VALIDATION_ISSUE_CODES);
export type ValidationIssueCode = z.output<typeof ValidationIssueCodeSchema>;

export const CapabilityValidationIssueSchema = z.object({
  path: z.string(),
  code: ValidationIssueCodeSchema
}).strict();
export type CapabilityValidationIssue = z.output<typeof CapabilityValidationIssueSchema>;

export const CapabilityValidationErrorPayloadSchema = z.object({
  code: z.literal('invalid_input'),
  message: z.literal(VALIDATION_ERROR_MESSAGE),
  issues: z.array(CapabilityValidationIssueSchema)
}).strict();
export type CapabilityValidationErrorPayload = z.output<typeof CapabilityValidationErrorPayloadSchema>;

interface RawValidationIssue {
  code: string;
  message: string;
  path: readonly PropertyKey[];
}

const SAFE_PATH_SEGMENTS = new Set([
  'stays',
  'referenceDate',
  'includeCountedDays',
  'existingStays',
  'candidateStay',
  'entryDate',
  'exitDate'
]);

export class CapabilityValidationError extends Error {
  readonly code = 'invalid_input' as const;
  readonly issues: readonly CapabilityValidationIssue[];

  constructor(issues: readonly CapabilityValidationIssue[]) {
    super(VALIDATION_ERROR_MESSAGE);
    this.name = 'CapabilityValidationError';
    this.issues = Object.freeze(issues.map((issue) => Object.freeze({ ...issue })));
  }

  toJSON(): CapabilityValidationErrorPayload {
    return {
      code: this.code,
      message: VALIDATION_ERROR_MESSAGE,
      issues: this.issues.map((issue) => ({ ...issue }))
    };
  }
}

export function capabilityValidationError(error: { issues: readonly RawValidationIssue[] }): CapabilityValidationError {
  return new CapabilityValidationError(error.issues.map((issue) => ({
    path: safeIssuePath(issue.path),
    code: safeIssueCode(issue)
  })));
}

function safeIssueCode(issue: RawValidationIssue): ValidationIssueCode {
  if (ValidationIssueCodeSchema.safeParse(issue.message).success) {
    return issue.message as ValidationIssueCode;
  }
  if (issue.code === 'unrecognized_keys') return 'unknown_field';
  if (issue.code === 'invalid_type') return 'invalid_type';
  return 'invalid_input';
}

function safeIssuePath(path: readonly PropertyKey[]): string {
  let safePath = '$';
  for (const segment of path) {
    if (typeof segment === 'number' && Number.isSafeInteger(segment) && segment >= 0) {
      safePath += `[${segment}]`;
      continue;
    }
    if (typeof segment === 'string' && SAFE_PATH_SEGMENTS.has(segment)) {
      safePath += `.${segment}`;
      continue;
    }
    break;
  }
  return safePath;
}
