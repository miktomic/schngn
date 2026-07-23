import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import {
  REQUIRED_PRODUCTION_KEYS as VALIDATED_PRODUCTION_KEYS,
  validateInfisicalEnvironment
} from './validate-infisical-env.mjs';

export const INFISICAL_API_BASE_URL = 'https://app.infisical.com/api';
export const REQUIRED_PRODUCTION_KEYS = VALIDATED_PRODUCTION_KEYS;

const INFISICAL_ENVIRONMENT = 'prod';
const INFISICAL_SECRET_PATH = '/apps/web';
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
const CHILD_ENVIRONMENT_ALLOWLIST = new Set([
  'BUN_INSTALL',
  'CI',
  'GITHUB_ACTIONS',
  'GITHUB_JOB',
  'GITHUB_REF',
  'GITHUB_REF_NAME',
  'GITHUB_REPOSITORY',
  'GITHUB_RUN_ID',
  'GITHUB_RUN_NUMBER',
  'GITHUB_SERVER_URL',
  'GITHUB_SHA',
  'GITHUB_WORKFLOW',
  'GITHUB_WORKSPACE',
  'HOME',
  'LANG',
  'LC_ALL',
  'LOGNAME',
  'NODE_OPTIONS',
  'PATH',
  'RUNNER_TEMP',
  'SHELL',
  'TEMP',
  'TERM',
  'TMP',
  'TMPDIR',
  'USER',
  'XDG_CACHE_HOME',
  'XDG_CONFIG_HOME'
]);

function requireNonEmptyString(value, name) {
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    throw new Error(`${name} is missing or invalid`);
  }
  return value;
}

function trustedGitHubOidcUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('GitHub OIDC request URL is not trusted');
  }

  const trustedHostname =
    url.hostname === 'actions.githubusercontent.com' ||
    url.hostname.endsWith('.actions.githubusercontent.com');

  if (
    url.protocol !== 'https:' ||
    !trustedHostname ||
    url.username !== '' ||
    url.password !== '' ||
    url.port !== ''
  ) {
    throw new Error('GitHub OIDC request URL is not trusted');
  }

  return url;
}

async function fetchJson(fetchImpl, input, init, stage, timeoutMs) {
  let response;
  try {
    response = await fetchImpl(input, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    throw new Error(`${stage} request failed`);
  }

  if (!response.ok) {
    throw new Error(`${stage} failed with HTTP ${response.status}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`${stage} returned invalid JSON`);
  }
}

export function parseCommandArguments(args) {
  if (args[0] !== '--keys' || typeof args[1] !== 'string' || args[2] !== '--') {
    throw new Error(
      'Usage: node scripts/run-with-infisical-oidc.mjs --keys KEY[,KEY...] -- command [args...]'
    );
  }

  const keys = args[1].split(',').filter(Boolean);
  if (keys.length === 0) {
    throw new Error('At least one Infisical key is required');
  }

  const uniqueKeys = new Set();
  for (const key of keys) {
    if (!REQUIRED_PRODUCTION_KEYS.includes(key)) {
      throw new Error(`Unsupported Infisical key: ${key}`);
    }
    if (uniqueKeys.has(key)) {
      throw new Error(`Duplicate Infisical key: ${key}`);
    }
    uniqueKeys.add(key);
  }

  const command = args.slice(3);
  if (command.length === 0 || command[0].length === 0) {
    throw new Error('A child command is required');
  }

  return { keys, command };
}

export async function loadProductionSecrets(config, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch is unavailable');
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error('Request timeout is invalid');
  }

  const identityId = requireNonEmptyString(config.identityId, 'INFISICAL_IDENTITY_ID');
  const projectId = requireNonEmptyString(config.projectId, 'INFISICAL_PROJECT_ID');
  const audience = requireNonEmptyString(config.audience, 'INFISICAL_OIDC_AUDIENCE');
  const oidcRequestToken = requireNonEmptyString(
    config.oidcRequestToken,
    'ACTIONS_ID_TOKEN_REQUEST_TOKEN'
  );
  const oidcRequestUrl = trustedGitHubOidcUrl(
    requireNonEmptyString(config.oidcRequestUrl, 'ACTIONS_ID_TOKEN_REQUEST_URL')
  );
  oidcRequestUrl.searchParams.set('audience', audience);

  const githubTokenPayload = await fetchJson(
    fetchImpl,
    oidcRequestUrl,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${oidcRequestToken}`
      },
      redirect: 'error'
    },
    'GitHub OIDC token request',
    timeoutMs
  );
  const githubJwt = requireNonEmptyString(githubTokenPayload?.value, 'GitHub OIDC token');

  const oidcLoginPayload = await fetchJson(
    fetchImpl,
    `${INFISICAL_API_BASE_URL}/v1/auth/oidc-auth/login`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ identityId, jwt: githubJwt }),
      redirect: 'error'
    },
    'Infisical OIDC login',
    timeoutMs
  );
  const accessToken = requireNonEmptyString(
    oidcLoginPayload?.accessToken,
    'Infisical access token'
  );

  const secretsUrl = new URL(`${INFISICAL_API_BASE_URL}/v4/secrets`);
  secretsUrl.searchParams.set('projectId', projectId);
  secretsUrl.searchParams.set('environment', INFISICAL_ENVIRONMENT);
  secretsUrl.searchParams.set('secretPath', INFISICAL_SECRET_PATH);
  secretsUrl.searchParams.set('viewSecretValue', 'true');
  secretsUrl.searchParams.set('expandSecretReferences', 'false');
  secretsUrl.searchParams.set('recursive', 'false');
  secretsUrl.searchParams.set('includePersonalOverrides', 'false');
  secretsUrl.searchParams.set('includeImports', 'false');

  const secretsPayload = await fetchJson(
    fetchImpl,
    secretsUrl,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      redirect: 'error'
    },
    'Infisical secret fetch',
    timeoutMs
  );

  if (!Array.isArray(secretsPayload?.secrets)) {
    throw new Error('Infisical secret fetch returned an invalid secret list');
  }

  const secrets = {};
  for (const secret of secretsPayload.secrets) {
    const key = secret?.secretKey;
    if (!REQUIRED_PRODUCTION_KEYS.includes(key)) {
      continue;
    }
    if (Object.hasOwn(secrets, key)) {
      throw new Error(`Infisical returned duplicate key: ${key}`);
    }
    secrets[key] = typeof secret.secretValue === 'string' ? secret.secretValue : '';
  }

  const validation = validateInfisicalEnvironment('prod', secrets);
  if (validation.failures.length > 0) {
    throw new Error(
      `Infisical production configuration is invalid: ${validation.failures.join('; ')}`
    );
  }

  return secrets;
}

export function buildChildEnvironment(parentEnvironment, secrets, requestedKeys) {
  const childEnvironment = {};

  for (const [key, value] of Object.entries(parentEnvironment)) {
    if (CHILD_ENVIRONMENT_ALLOWLIST.has(key) && typeof value === 'string') {
      childEnvironment[key] = value;
    }
  }

  for (const key of requestedKeys) {
    childEnvironment[key] = secrets[key];
  }

  return childEnvironment;
}

export function maskForGitHub(value) {
  return value.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
}

export function runChildCommand(command, environment) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(command[0], command.slice(1), {
        env: environment,
        stdio: 'inherit'
      });
    } catch {
      reject(new Error('Child command could not be started'));
      return;
    }

    child.once('error', () => {
      reject(new Error('Child command could not be started'));
    });
    child.once('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`Child command terminated by signal ${signal}`));
        return;
      }
      resolve(code ?? 1);
    });
  });
}

async function runCli() {
  try {
    const { keys, command } = parseCommandArguments(process.argv.slice(2));
    const secrets = await loadProductionSecrets({
      identityId: process.env.INFISICAL_IDENTITY_ID,
      projectId: process.env.INFISICAL_PROJECT_ID,
      audience: process.env.INFISICAL_OIDC_AUDIENCE,
      oidcRequestUrl: process.env.ACTIONS_ID_TOKEN_REQUEST_URL,
      oidcRequestToken: process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN
    });

    if (process.env.GITHUB_ACTIONS === 'true') {
      for (const value of Object.values(secrets)) {
        console.log(`::add-mask::${maskForGitHub(value)}`);
      }
    }

    const exitCode = await runChildCommand(
      command,
      buildChildEnvironment(process.env, secrets, keys)
    );
    process.exitCode = exitCode;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown failure';
    console.error(`Infisical OIDC command failed: ${message}`);
    process.exitCode = 1;
  }
}

const isDirectExecution =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  await runCli();
}
