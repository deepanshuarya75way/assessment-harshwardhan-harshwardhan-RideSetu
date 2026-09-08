async function runVisualQA() {
  const routes = [
    '/',
    '/vehicles',
    '/compare',
    '/dashboard',
    '/vendor',
    '/admin',
    '/terms',
    '/privacy',
    '/cancellation-policy',
    '/refund-policy',
    '/rental-policy',
    '/safety',
    '/contact',
    '/destinations/rishikesh',
    '/destinations/mussoorie',
    '/destinations/dehradun',
    '/destinations/nainital',
    '/destinations/haridwar',
    '/destinations/haldwani',
    '/manifest.webmanifest',
    '/api/health',
    '/api/ready',
  ];

  console.log('====================================================');
  console.log('  RideSetu Visual QA, PWA, Health & Readiness Test');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  for (const r of routes) {
    const start = Date.now();
    try {
      const res = await fetch(`http://localhost:3000${r}`);
      const duration = Date.now() - start;
      if (res.status === 200) {
        console.log(`✅ [200 OK] ${r.padEnd(30)} (${duration}ms)`);
        passed++;
      } else {
        console.log(`❌ [FAIL ${res.status}] ${r.padEnd(30)} (${duration}ms)`);
        failed++;
      }
    } catch (err: any) {
      console.log(`❌ [ERROR] ${r.padEnd(30)} : ${err.message}`);
      failed++;
    }
  }

  console.log('\n====================================================');
  console.log(`  Routes Tested: ${passed}/${routes.length} OK (${failed === 0 ? '100% PASS' : 'FAIL'})`);
  console.log('====================================================');
}

runVisualQA();
