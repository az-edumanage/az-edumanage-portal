#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIR = path.join(ROOT, 'src', 'app', 'features');
const BASELINE_PATH = path.join(ROOT, 'docs', 'ds-style-guard-baseline.json');

const HEX_REGEX = /#[0-9a-fA-F]{3,8}\b/g;
const TOKEN_BYPASS_REGEX = /var\(--(?:brand-\d+|ds-brand-\d+|color-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+)\)/g;
const VAR_FALLBACK_WITH_HEX = /var\([^)]*#[0-9a-fA-F]{3,8}[^)]*\)/g;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (entry.isFile() && fullPath.endsWith('.css')) {
      files.push(fullPath);
    }
  }
  return files;
}

function toPosix(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function scanFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const cleaned = source.replaceAll(VAR_FALLBACK_WITH_HEX, '');
  const findings = [];
  const lines = cleaned.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const line = lines[i];

    const hexMatches = line.matchAll(HEX_REGEX);
    for (const match of hexMatches) {
      findings.push({
        rule: 'no-raw-hex',
        key: `${toPosix(filePath)}:${lineNo}:no-raw-hex:${match[0]}`,
        file: toPosix(filePath),
        line: lineNo,
        value: match[0],
      });
    }

    const tokenMatches = line.matchAll(TOKEN_BYPASS_REGEX);
    for (const match of tokenMatches) {
      findings.push({
        rule: 'no-token-bypass',
        key: `${toPosix(filePath)}:${lineNo}:no-token-bypass:${match[0]}`,
        file: toPosix(filePath),
        line: lineNo,
        value: match[0],
      });
    }
  }

  return findings;
}

function buildReport() {
  const files = walk(TARGET_DIR);
  const findings = files.flatMap(scanFile);
  findings.sort((a, b) => a.key.localeCompare(b.key));
  return findings;
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) {
    return [];
  }
  const parsed = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  return Array.isArray(parsed.findings) ? parsed.findings : [];
}

function writeBaseline(findings) {
  const payload = {
    generatedAt: new Date().toISOString(),
    findings: findings.map((item) => item.key),
  };
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function printFindings(header, findings) {
  if (findings.length === 0) {
    return;
  }
  console.error(header);
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.rule} ${finding.value}`);
  }
}

const shouldUpdateBaseline = process.argv.includes('--update-baseline');
const report = buildReport();

if (shouldUpdateBaseline) {
  writeBaseline(report);
  console.log(`Updated DS style guard baseline with ${report.length} findings.`);
  process.exit(0);
}

const baselineKeys = new Set(loadBaseline());
const newFindings = report.filter((item) => !baselineKeys.has(item.key));

if (newFindings.length > 0) {
  printFindings(
    'DS style guard failed: new style violations introduced beyond baseline.',
    newFindings
  );
  process.exit(1);
}

const byRule = report.reduce(
  (acc, finding) => {
    acc[finding.rule] += 1;
    return acc;
  },
  { 'no-raw-hex': 0, 'no-token-bypass': 0 }
);

console.log(
  `DS style guard passed. Baseline-monitored findings: raw-hex=${byRule['no-raw-hex']}, token-bypass=${byRule['no-token-bypass']}.`
);
