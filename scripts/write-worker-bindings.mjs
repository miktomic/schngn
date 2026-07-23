import {
  closeSync,
  constants,
  openSync,
  writeFileSync
} from 'node:fs';
import { pathToFileURL } from 'node:url';

export const WORKER_BINDING_KEYS = Object.freeze([
  'PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'CLERK_WEBHOOK_SIGNING_SECRET',
  'PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY'
]);

function validateBinding(name, value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${name} is missing`);
  }
  if (value !== value.trim()) {
    throw new Error(`${name} must not contain leading or trailing whitespace`);
  }
  if (/[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`${name} must not contain control characters`);
  }
  if (name === 'PUBLIC_CLERK_PUBLISHABLE_KEY' && !value.startsWith('pk_live_')) {
    throw new Error(`${name} must be a Clerk Production publishable key`);
  }
  if (name === 'CLERK_SECRET_KEY' && !value.startsWith('sk_live_')) {
    throw new Error(`${name} must be a Clerk Production secret key`);
  }
}

export function writeWorkerBindings(targetPath, environment) {
  if (typeof targetPath !== 'string' || targetPath.length === 0) {
    throw new Error('A Worker bindings output path is required');
  }

  const bindings = {};
  for (const name of WORKER_BINDING_KEYS) {
    const value = environment[name];
    validateBinding(name, value);
    bindings[name] = value;
  }

  const descriptor = openSync(
    targetPath,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL,
    0o600
  );
  try {
    writeFileSync(descriptor, JSON.stringify(bindings), 'utf8');
  } finally {
    closeSync(descriptor);
  }
}

function runCli() {
  try {
    writeWorkerBindings(process.argv[2], process.env);
    console.log(`Prepared ${WORKER_BINDING_KEYS.length} production Worker bindings.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown failure';
    console.error(`Worker binding preparation failed: ${message}`);
    process.exitCode = 1;
  }
}

const isDirectExecution =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  runCli();
}
