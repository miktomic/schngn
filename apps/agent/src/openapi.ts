const dateSchema = {
  format: 'date',
  pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  type: 'string'
} as const;

const staySchema = {
  additionalProperties: false,
  properties: {
    entryDate: dateSchema,
    exitDate: dateSchema
  },
  required: ['entryDate', 'exitDate'],
  type: 'object'
} as const;

const stayListSchema = {
  items: staySchema,
  maxItems: 100,
  type: 'array'
} as const;

const semanticStatusSchema = {
  enum: ['within_limit', 'near_limit', 'at_limit', 'over_limit'],
  type: 'string'
} as const;

const advisorySchema = {
  additionalProperties: false,
  properties: {
    code: { const: 'planning_aid_not_legal_advice', type: 'string' },
    message: { type: 'string' },
    officialSourceUrl: {
      const: 'https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en',
      format: 'uri',
      type: 'string'
    }
  },
  required: ['code', 'message', 'officialSourceUrl'],
  type: 'object'
} as const;

const envelopeProperties = {
  advisory: advisorySchema,
  ruleSet: { const: 'ordinary-schengen-90-180/v1', type: 'string' },
  schemaVersion: { const: '1', type: 'string' }
} as const;

const errorResponse = {
  content: {
    'application/json': {
      schema: {
        additionalProperties: false,
        properties: {
          error: {
            additionalProperties: false,
            properties: {
              code: { type: 'string' },
              issues: {
                items: {
                  additionalProperties: false,
                  properties: {
                    code: { type: 'string' },
                    path: { type: 'string' }
                  },
                  required: ['code', 'path'],
                  type: 'object'
                },
                type: 'array'
              }
            },
            required: ['code'],
            type: 'object'
          },
          schemaVersion: { const: '1', type: 'string' }
        },
        required: ['error', 'schemaVersion'],
        type: 'object'
      }
    }
  },
  description: 'Safe error response. Submitted values are not echoed.'
} as const;

export const openApiDocument = {
  openapi: '3.1.0',
  jsonSchemaDialect: 'https://json-schema.org/draft/2020-12/schema',
  info: {
    title: 'SCHNGN local agent API',
    version: '1.0.0',
    description:
      'A loopback-only API for deterministic ordinary Schengen 90/180-day calculations. It does not persist, log, or send trip data off-device. Planning aid only—not legal advice or a guarantee of entry.'
  },
  servers: [{ description: 'Default loopback server', url: 'http://127.0.0.1:37491' }],
  tags: [{ name: 'calculations' }, { name: 'discovery' }],
  paths: {
    '/healthz': {
      get: {
        operationId: 'getHealth',
        responses: { '200': { description: 'The local process is ready.' } },
        tags: ['discovery']
      }
    },
    '/openapi.json': {
      get: {
        operationId: 'getOpenApiDocument',
        responses: { '200': { description: 'This OpenAPI document.' } },
        tags: ['discovery']
      }
    },
    '/v1/calculations/usage': {
      post: {
        operationId: 'calculateSchengenUsage',
        summary: 'Calculate usage on an explicit reference date',
        description:
          'Each stay must represent continuous presence inside Schengen. Entry and exit days both count. Use separate stays around full calendar-day gaps outside Schengen.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                additionalProperties: false,
                properties: {
                  includeCountedDays: { default: false, type: 'boolean' },
                  referenceDate: dateSchema,
                  stays: stayListSchema
                },
                required: ['referenceDate', 'stays'],
                type: 'object'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Deterministic usage result.',
            content: {
              'application/json': {
                schema: {
                  additionalProperties: false,
                  properties: {
                    ...envelopeProperties,
                    result: {
                      additionalProperties: false,
                      properties: {
                        countedDays: { items: dateSchema, maxItems: 180, type: 'array' },
                        daysRemaining: { maximum: 90, minimum: 0, type: 'integer' },
                        daysUsed: { minimum: 0, type: 'integer' },
                        overBy: { minimum: 0, type: 'integer' },
                        overLimit: { type: 'boolean' },
                        referenceDate: dateSchema,
                        status: semanticStatusSchema,
                        windowEnd: dateSchema,
                        windowStart: dateSchema
                      },
                      required: [
                        'referenceDate',
                        'windowStart',
                        'windowEnd',
                        'daysUsed',
                        'daysRemaining',
                        'overLimit',
                        'overBy',
                        'status'
                      ],
                      type: 'object'
                    }
                  },
                  required: ['schemaVersion', 'ruleSet', 'advisory', 'result'],
                  type: 'object'
                }
              }
            }
          },
          '400': errorResponse,
          '413': errorResponse,
          '415': errorResponse
        },
        tags: ['calculations']
      }
    },
    '/v1/calculations/stay-check': {
      post: {
        operationId: 'checkSchengenStay',
        summary: 'Check a candidate stay on every day',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                additionalProperties: false,
                properties: {
                  candidateStay: staySchema,
                  existingStays: stayListSchema
                },
                required: ['existingStays', 'candidateStay'],
                type: 'object'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Candidate-stay result.',
            content: {
              'application/json': {
                schema: {
                  additionalProperties: false,
                  properties: {
                    ...envelopeProperties,
                    result: {
                      additionalProperties: false,
                      properties: {
                        firstOverLimitDate: { anyOf: [dateSchema, { type: 'null' }] },
                        safeThroughDate: { anyOf: [dateSchema, { type: 'null' }] },
                        minimumDaysRemaining: { maximum: 90, minimum: 0, type: 'integer' },
                        overBy: { minimum: 0, type: 'integer' },
                        peakDaysUsed: { minimum: 0, type: 'integer' },
                        safeForEveryDay: { type: 'boolean' },
                        status: semanticStatusSchema
                      },
                      required: [
                        'safeForEveryDay',
                        'status',
                        'firstOverLimitDate',
                        'safeThroughDate',
                        'peakDaysUsed',
                        'minimumDaysRemaining',
                        'overBy'
                      ],
                      type: 'object'
                    }
                  },
                  required: ['schemaVersion', 'ruleSet', 'advisory', 'result'],
                  type: 'object'
                }
              }
            }
          },
          '400': errorResponse,
          '413': errorResponse,
          '415': errorResponse
        },
        tags: ['calculations']
      }
    },
    '/v1/calculations/latest-safe-exit': {
      post: {
        operationId: 'findLatestSafeSchengenExit',
        summary: 'Find the latest safe exit for an entry date',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                additionalProperties: false,
                properties: {
                  entryDate: dateSchema,
                  existingStays: stayListSchema
                },
                required: ['existingStays', 'entryDate'],
                type: 'object'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Latest-safe-exit result.',
            content: {
              'application/json': {
                schema: {
                  additionalProperties: false,
                  properties: {
                    ...envelopeProperties,
                    result: {
                      additionalProperties: false,
                      properties: {
                        entryDate: dateSchema,
                        latestSafeExitDate: { anyOf: [dateSchema, { type: 'null' }] }
                      },
                      required: ['entryDate', 'latestSafeExitDate'],
                      type: 'object'
                    }
                  },
                  required: ['schemaVersion', 'ruleSet', 'advisory', 'result'],
                  type: 'object'
                }
              }
            }
          },
          '400': errorResponse,
          '413': errorResponse,
          '415': errorResponse
        },
        tags: ['calculations']
      }
    }
  },
  'x-schngn-local-only': true
} as const;
