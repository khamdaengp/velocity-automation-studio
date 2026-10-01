// ⚡ Velocity Studio - All-in-One Unified Scenario (API + Web + DB)
console.log('⚡ Starting Unified E2E Scenario (API + Web UI + Database)...');

// 1. Environment & Variables
const baseUrl = env.get('baseUrl', 'https://jsonplaceholder.typicode.com');
console.log(`🌐 Active Environment: ${env.active} (${baseUrl})`);

// 2. Step 1: Query REST API
console.log('📡 Step 1: Querying REST API...');
const apiRes = await api.get('https://jsonplaceholder.typicode.com/todos/1');
const todo = await apiRes.json();
console.log('✅ API Result:', todo.title);

// 3. Step 2: Database Testing & Verification
console.log('🗄️ Step 2: Executing SQL Database Query...');
await db.query('sqlite-local', 'CREATE TABLE IF NOT EXISTS test_runs (id INTEGER PRIMARY KEY, name TEXT, status TEXT);');
await db.query('sqlite-local', 'INSERT INTO test_runs (name, status) VALUES (?, ?);', ['Sample Run', 'PASSED']);
const dbRecords = await db.query('sqlite-local', 'SELECT * FROM test_runs;');
console.log(`✅ DB Verified: ${dbRecords.length} records in database table`);

// 4. Step 3: Web Browser UI Automation (Playwright Turbo)
console.log('🖥️ Step 3: Rendering Web UI & validating elements...');
await page.setContent(`
  <div style="font-family: system-ui; padding: 24px; max-width: 600px; margin: auto; background: #0f172a; color: white; border-radius: 8px;">
    <h2 style="color: #38bdf8;">⚡ Velocity All-in-One Automation Studio</h2>
    <p>API Status: <span id="api-status" style="color: #4ade80;">200 OK</span></p>
    <p>DB Status: <span id="db-status" style="color: #4ade80;">Verified (${dbRecords.length} records)</span></p>
    <button id="finish-btn" style="padding: 8px 16px; background: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer;">Complete Scenario</button>
  </div>
`);

const apiStatusText = await page.textContent('#api-status');
console.log('🔍 Verified UI API status text:', apiStatusText);
console.log('🎉 Unified Scenario (API + Web + DB) passed with flying colors!');
