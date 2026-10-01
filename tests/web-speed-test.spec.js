// Velocity Automation Studio - High-Speed Web Test
console.log('⚡ Starting high-speed in-memory DOM simulation...');

const t0 = Date.now();
await page.setContent(`
  <!DOCTYPE html>
  <html>
    <head><title>Velocity Test Runner</title></head>
    <body style="font-family: sans-serif; padding: 20px;">
      <h1 id="title">Velocity Automation Studio</h1>
      <p id="desc">High performance Playwright automation test suite.</p>
      <button id="btn" style="padding: 10px 20px; font-size: 16px;">Run Action</button>
      <div id="result" style="margin-top: 10px; font-weight: bold;">Status: Waiting</div>
      <script>
        document.getElementById('btn').addEventListener('click', () => {
          document.getElementById('result').textContent = 'Status: SUCCESS!';
        });
      </script>
    </body>
  </html>
`);
console.log(`⏱️ DOM initialized in ${Date.now() - t0}ms`);

// Query Heading
const heading = await page.textContent('#title');
console.log('📌 Page Heading:', heading);

// Simulate User Click with sub-millisecond precision
console.log('🖱️ Clicking action button (#btn)...');
await page.click('#btn');

// Verify assertion
const resultText = await page.textContent('#result');
console.log('🎯 Assertion result:', resultText);

if (resultText.includes('SUCCESS')) {
  console.log('✅ Assertion PASSED: Element updated as expected!');
} else {
  throw new Error(`Assertion FAILED: Expected "SUCCESS", got "${resultText}"`);
}

// Capture screenshot
await page.screenshot({ path: 'tests/speed-test.png' });
console.log('📸 Screenshot captured and saved to tests/speed-test.png');
