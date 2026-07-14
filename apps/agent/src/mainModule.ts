import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function isMainModule(moduleUrl: string, entryPath = process.argv[1]): boolean {
  if (!entryPath) return false;

  try {
    return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(resolve(entryPath));
  } catch {
    return moduleUrl === pathToFileURL(resolve(entryPath)).href;
  }
}
