const API_KEY = process.env.PAGESPEED_API_KEY;
const TARGET_URL = process.env.TARGET_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://zynqtoon.web.id";

if (!API_KEY) {
  console.error("Error: PAGESPEED_API_KEY environment variable is required to run audit.");
  console.error("Usage: PAGESPEED_API_KEY=your_key node scripts/audit-pagespeed.mjs");
  process.exit(1);
}

async function runAudit(strategy = "mobile") {
  console.log(`\n🔍 Memulai Google PageSpeed Insights Audit untuk strategy: [${strategy.toUpperCase()}]`);
  console.log(`   Target URL: ${TARGET_URL}`);

  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", TARGET_URL);
  endpoint.searchParams.set("key", API_KEY);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.append("category", "performance");
  endpoint.searchParams.append("category", "accessibility");
  endpoint.searchParams.append("category", "best-practices");
  endpoint.searchParams.append("category", "seo");

  try {
    const res = await fetch(endpoint.toString());
    if (!res.ok) {
      throw new Error(`API responded with ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const lighthouse = data.lighthouseResult;
    const categories = lighthouse.categories;

    const perfScore = Math.round((categories.performance?.score || 0) * 100);
    const a11yScore = Math.round((categories.accessibility?.score || 0) * 100);
    const bpScore = Math.round((categories["best-practices"]?.score || 0) * 100);
    const seoScore = Math.round((categories.seo?.score || 0) * 100);

    const audits = lighthouse.audits;
    const fcp = audits["first-contentful-paint"]?.displayValue;
    const lcp = audits["largest-contentful-paint"]?.displayValue;
    const cls = audits["cumulative-layout-shift"]?.displayValue;
    const tbt = audits["total-blocking-time"]?.displayValue;
    const speedIndex = audits["speed-index"]?.displayValue;

    console.log(`\n========================================`);
    console.log(`📊 HASIL AUDIT GOOGLE PAGESPEED [${strategy.toUpperCase()}]:`);
    console.log(`   - Performance:     ${perfScore}/100 ${perfScore >= 90 ? '✅ (PASS)' : '⚠️'}`);
    console.log(`   - Accessibility:   ${a11yScore}/100 ${a11yScore >= 90 ? '✅' : ''}`);
    console.log(`   - Best Practices:  ${bpScore}/100 ${bpScore >= 90 ? '✅' : ''}`);
    console.log(`   - SEO:             ${seoScore}/100 ${seoScore >= 90 ? '✅' : ''}`);
    console.log(`----------------------------------------`);
    console.log(`⚡ CORE WEB VITALS:`);
    console.log(`   - FCP (First Contentful Paint):    ${fcp}`);
    console.log(`   - LCP (Largest Contentful Paint):  ${lcp}`);
    console.log(`   - CLS (Cumulative Layout Shift):   ${cls}`);
    console.log(`   - TBT (Total Blocking Time):       ${tbt}`);
    console.log(`   - Speed Index:                     ${speedIndex}`);
    console.log(`========================================\n`);

    return { perfScore, a11yScore, bpScore, seoScore };
  } catch (err) {
    console.error(`✗ Gagal menjalankan PageSpeed audit (${strategy}):`, err.message);
    return null;
  }
}

async function main() {
  await runAudit("mobile");
  await runAudit("desktop");
}

main();
