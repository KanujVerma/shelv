import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

export async function buildCandidate({ advisor = true, outdir = path.join(root, 'dist') } = {}) {
  const bundle = async (entry, output) => {
    await mkdir(path.dirname(output), { recursive: true });
    await build({ absWorkingDir: root, entryPoints: [entry], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', outfile: output, external: ['cloudflare:workers'], legalComments: 'none' });
  };
  await bundle('server/client-gateway.ts', path.join(outdir, 'pages/_worker.js'));
  await bundle('workers/session-vault/index.ts', path.join(outdir, 'vault/index.js'));
  if (advisor) {
    await bundle('server/advisor-candidate-gateway.ts', path.join(outdir, 'advisor-pages/_worker.js'));
    await writeFile(path.join(outdir, 'advisor-pages/_routes.json'), JSON.stringify({ version: 1, include: ['/api/client/*', '/api/advisor/*'], exclude: [] }) + '\n');
  }
  await writeFile(path.join(outdir, 'pages/_routes.json'), JSON.stringify({ version: 1, include: ['/api/client/*'], exclude: [] }) + '\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildCandidate();
