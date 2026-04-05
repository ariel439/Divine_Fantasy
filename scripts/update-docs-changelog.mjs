#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
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
    console.error('[docs-changelog] Failed to read git diff.', err.message);
    process.exit(2);
  }
}

function topLevel(filePath) {
  const parts = filePath.split('/');
  if (parts.length <= 1) return '(root)';
  return parts[0];
}

function appendEntry(changelogPath, files) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const grouped = new Map();

  for (const file of files) {
    const key = topLevel(file);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(file);
  }

  const lines = [];
  lines.push(`## ${date}`);
  lines.push('');
  lines.push('### Changed Files');
  for (const [group, groupFiles] of grouped.entries()) {
    lines.push(`- ${group}: ${groupFiles.length} file(s)`);
    const preview = groupFiles.slice(0, 8);
    for (const p of preview) {
      lines.push(`  - ${p}`);
    }
    if (groupFiles.length > preview.length) {
      lines.push(`  - ... (${groupFiles.length - preview.length} more)`);
    }
  }
  lines.push('');
  lines.push('### Documentation Updates');
  lines.push('- [ ] Updated nearest folder README.md');
  lines.push('- [ ] Updated docs/guidelines if standards changed');
  lines.push('- [ ] Added/updated ADR if architecture changed');
  lines.push('');

  fs.appendFileSync(changelogPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const { base, head } = parseArgs(process.argv.slice(2));
  const files = getChangedFiles(base, head);
  if (files.length === 0) {
    console.log('[docs-changelog] No changed files detected. Nothing appended.');
    process.exit(0);
  }

  const changelogPath = path.resolve('docs', 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    console.error(`[docs-changelog] Missing ${changelogPath}`);
    process.exit(2);
  }

  appendEntry(changelogPath, files);
  console.log('[docs-changelog] Appended entry to docs/CHANGELOG.md');
}

main();
