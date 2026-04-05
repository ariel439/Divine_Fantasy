#!/usr/bin/env node

import { execSync } from 'node:child_process';

function parseArgs(argv) {
  const args = { base: '', head: 'HEAD' };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--base' && argv[i + 1]) {
      args.base = argv[i + 1];
      i += 1;
    } else if (token === '--head' && argv[i + 1]) {
      args.head = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function getChangedFiles(base, head) {
  try {
    const trackedCmd = base
      ? `git diff --name-only --diff-filter=ACMRT ${base} ${head}`
      : 'git diff --name-only --diff-filter=ACMRT HEAD';
    const tracked = execSync(trackedCmd, { encoding: 'utf8' }).trim();
    const untracked = execSync('git ls-files --others --exclude-standard', { encoding: 'utf8' }).trim();
    const list = [tracked, untracked]
      .filter(Boolean)
      .join('\n')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    return Array.from(new Set(list));
  } catch (err) {
    console.error('[docs-gate] Failed to read git diff.', err.message);
    process.exit(2);
  }
}

function isGameplayChange(path) {
  return (
    path.startsWith('src/') ||
    path.startsWith('public/') ||
    path.startsWith('scripts/') ||
    path === 'package.json' ||
    path === 'package-lock.json' ||
    path === 'tsconfig.json' ||
    path === 'vite.config.ts'
  );
}

function isDocumentationChange(path) {
  return (
    path.startsWith('docs/') ||
    path.startsWith('docs/gdd/') ||
    path.endsWith('/README.md') ||
    path === 'README.md' ||
    path === 'AGENTS.md' ||
    path === 'TECHNICAL_ARCHITECTURE_REVIEW.md'
  );
}

function main() {
  const { base, head } = parseArgs(process.argv.slice(2));
  const files = getChangedFiles(base, head);

  if (files.length === 0) {
    console.log('[docs-gate] No changed files found. Skipping.');
    process.exit(0);
  }

  const gameplayChanged = files.filter(isGameplayChange);
  const docsChanged = files.filter(isDocumentationChange);

  if (gameplayChanged.length === 0) {
    console.log('[docs-gate] No gameplay/code changes detected. Skipping.');
    process.exit(0);
  }

  if (docsChanged.length === 0) {
    console.error('[docs-gate] Documentation update is required when gameplay/code changes are present.');
    console.error('[docs-gate] Gameplay/code changed files:');
    for (const file of gameplayChanged) {
      console.error(`- ${file}`);
    }
    console.error('[docs-gate] Add docs changes under docs/, folder README.md, docs/gdd/, AGENTS.md, or root README.');
    process.exit(1);
  }

  console.log('[docs-gate] PASS');
  console.log(`[docs-gate] Gameplay/code changes: ${gameplayChanged.length}`);
  console.log(`[docs-gate] Docs changes: ${docsChanged.length}`);
}

main();
