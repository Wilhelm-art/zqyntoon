#!/usr/bin/env node
/**
 * ZynqToon - Automated Google PageSpeed Insights Auditor
 * Uses Google PageSpeed Insights API v5 to verify Core Web Vitals & Performance.
 */

import fs from 'node:fs';
import path from 'node:path';

// Helper to read .env.local if not already in process.env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const API_KEY = process.env.PAGESPEED_API_KEY;
const TARGET_URL = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || 'https://zynqtoon.vercel.app';

if (!API_KEY) {
  console.error('\x1b[31m[ERROR]\x1b[0m PAGESPEED_API_KEY not found in .env.local or environment.');
  process.exit(1);
}

async function runAudit(strategy) {
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', TARGET_URL);
  endpoint.searchParams.set('key', API_KEY);
  endpoint.searchParams.set('strategy', strategy);
  endpoint.searchParams.set('category', 'performance');

  console.log(`\x1b[36m[AUDIT]\x1b[0m Testing ${strategy.toUpperCase()} for ${TARGET_URL}...`);
  const response = await fetch(endpoint.toString());

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PageSpeed API failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const lighthouse = data.lighthouseResult;
  const categories = lighthouse?.categories;
  const audits = lighthouse?.audits;

  const score = Math.round((categories?.performance?.score || 0) * 100);

  return {
    strategy,
    score,
    fcp: audits?.['first-contentful-paint']?.displayValue || 'N/A',
    lcp: audits?.['largest-contentful-paint']?.displayValue || 'N/A',
    tbt: audits?.['total-blocking-time']?.displayValue || 'N/A',
    cls: audits?.['cumulative-layout-shift']?.displayValue || 'N/A',
    speedIndex: audits?.['speed-index']?.displayValue || 'N/A',
  };
}

function colorScore(score) {
  if (score >= 90) return `\x1b[32m${score}/100 (GOOD)\x1b[0m`;
  if (score >= 50) return `\x1b[33m${score}/100 (NEEDS WORK)\x1b[0m`;
  return `\x1b[31m${score}/100 (POOR)\x1b[0m`;
}

async function main() {
  console.log('='.repeat(60));
  console.log('  ZYNQTOON - GOOGLE PAGESPEED INSIGHTS AUDIT');
  console.log(`  Target: ${TARGET_URL}`);
  console.log('='.repeat(60));

  try {
    const [mobile, desktop] = await Promise.all([
      runAudit('mobile'),
      runAudit('desktop'),
    ]);

    console.log('\n--- HASIL AUDIT PERFORMANCE ---');
    console.log(`Mobile Score : ${colorScore(mobile.score)}`);
    console.log(`  - FCP      : ${mobile.fcp}`);
    console.log(`  - LCP      : ${mobile.lcp}`);
    console.log(`  - TBT      : ${mobile.tbt}`);
    console.log(`  - CLS      : ${mobile.cls}`);
    console.log(`  - Speed Idx: ${mobile.speedIndex}`);

    console.log(`\nDesktop Score: ${colorScore(desktop.score)}`);
    console.log(`  - FCP      : ${desktop.fcp}`);
    console.log(`  - LCP      : ${desktop.lcp}`);
    console.log(`  - TBT      : ${desktop.tbt}`);
    console.log(`  - CLS      : ${desktop.cls}`);
    console.log(`  - Speed Idx: ${desktop.speedIndex}`);
    console.log('='.repeat(60));
  } catch (err) {
    console.error(`\x1b[31m[FAILED]\x1b[0m ${err.message}`);
    process.exit(1);
  }
}

main();
