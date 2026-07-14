#!/usr/bin/env node

import { closeServer, listenLocalApi } from './http.js';
import { isMainModule } from './mainModule.js';

export async function startApiProcess(): Promise<void> {
  const port = parsePort(process.env.SCHNGN_API_PORT);
  const listening = await listenLocalApi(port === undefined ? {} : { port });
  process.stderr.write(`SCHNGN local API listening at ${listening.url}\n`);

  const shutdown = async (): Promise<void> => {
    await closeServer(listening.server);
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
}

function parsePort(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  if (!/^\d+$/.test(value)) throw new RangeError('SCHNGN_API_PORT must be an integer');
  return Number(value);
}

if (isMainModule(import.meta.url)) {
  startApiProcess().catch(() => {
    process.stderr.write('Unable to start the SCHNGN local API.\n');
    process.exit(1);
  });
}
