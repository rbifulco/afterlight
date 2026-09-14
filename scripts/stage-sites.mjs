import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const stage = resolve(root, '.sites-build');
await rm(stage, { recursive: true, force: true });
await mkdir(resolve(stage, 'dist/server'), { recursive: true });
await cp(resolve(root, 'dist'), resolve(stage, 'dist/client'), { recursive: true });
await rm(resolve(stage, 'dist/client/.openai'), { recursive: true, force: true });
await cp(resolve(root, 'worker/index.js'), resolve(stage, 'dist/server/index.js'));
await cp(resolve(root, '.openai'), resolve(stage, '.openai'), { recursive: true });
console.log('Sites artifact staged with Worker and browser assets.');
