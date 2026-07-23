import { pathToFileURL } from 'node:url';

export const DEV_REQUIRED = [
  {
    name: 'PUBLIC_CLERK_PUBLISHABLE_KEY',
    valid: (value) => value.startsWith('pk_test_'),
    expected: 'a Clerk Development publishable key'
  },
  {
    name: 'CLERK_SECRET_KEY',
    valid: (value) => value.startsWith('sk_test_'),
    expected: 'a Clerk Development secret key'
  }
];

export const DEV_OPTIONAL = [
  'CLERK_WEBHOOK_SIGNING_SECRET',
  'PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY'
];

export const PROD_REQUIRED = [
  {
    name: 'CLOUDFLARE_API_TOKEN',
    valid: nonEmpty,
    expected: 'a non-empty least-privilege Cloudflare API token'
  },
  {
    name: 'CLOUDFLARE_ACCOUNT_ID',
    valid: nonEmpty,
    expected: 'a non-empty Cloudflare account ID'
  },
  {
    name: 'PUBLIC_CLERK_PUBLISHABLE_KEY',
    valid: (value) => value.startsWith('pk_live_'),
    expected: 'a Clerk Production publishable key'
  },
  {
    name: 'CLERK_SECRET_KEY',
    valid: (value) => value.startsWith('sk_live_'),
    expected: 'a Clerk Production secret key'
  },
  {
    name: 'CLERK_WEBHOOK_SIGNING_SECRET',
    valid: nonEmpty,
    expected: 'a non-empty Clerk webhook signing secret'
  },
  {
    name: 'PUBLIC_TURNSTILE_SITE_KEY',
    valid: nonEmpty,
    expected: 'a non-empty Turnstile site key'
  },
  {
    name: 'TURNSTILE_SECRET_KEY',
    valid: nonEmpty,
    expected: 'a non-empty Turnstile secret key'
  }
];

export const REQUIRED_PRODUCTION_KEYS = Object.freeze(
  PROD_REQUIRED.map(({ name }) => name)
);

function nonEmpty(value) {
  return value.length > 0;
}

function containsControlCharacters(value) {
  return /[\u0000-\u001f\u007f]/.test(value);
}

export function validateInfisicalEnvironment(mode, environment) {
  if (mode !== 'dev' && mode !== 'prod') {
    throw new Error(`Unsupported Infisical environment mode: ${mode}`);
  }

  const required = mode === 'dev' ? DEV_REQUIRED : PROD_REQUIRED;
  const failures = [];

  for (const field of required) {
    const configuredValue = environment[field.name];
    const value = typeof configuredValue === 'string' ? configuredValue : '';

    if (value !== value.trim()) {
      failures.push(`${field.name}: must not contain leading or trailing whitespace`);
      continue;
    }
    if (containsControlCharacters(value)) {
      failures.push(`${field.name}: must not contain control characters`);
      continue;
    }

    if (!field.valid(value)) {
      failures.push(`${field.name}: expected ${field.expected}`);
    }
  }

  return { failures, required, optional: mode === 'dev' ? DEV_OPTIONAL : [] };
}

function runCli() {
  const mode = process.argv[2];

  if (mode !== 'dev' && mode !== 'prod') {
    console.error('Usage: node scripts/validate-infisical-env.mjs <dev|prod>');
    process.exitCode = 2;
    return;
  }

  const result = validateInfisicalEnvironment(mode, process.env);
  if (result.failures.length > 0) {
    console.error(`Infisical ${mode} configuration is incomplete or invalid:`);
    for (const failure of result.failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
  } else {
    const optionalCount = result.optional.filter((name) => nonEmpty(process.env[name]?.trim() ?? '')).length;
    const optionalSummary = result.optional.length > 0
      ? `; ${optionalCount}/${result.optional.length} optional local values present`
      : '';
    console.log(
      `Infisical ${mode} configuration is valid (${result.required.length} required values${optionalSummary}).`
    );
  }
}

const isDirectExecution =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  runCli();
}
