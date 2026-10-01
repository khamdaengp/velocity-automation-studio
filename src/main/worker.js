const { chromium, request: playwrightRequest } = require('playwright');
const path = require('path');
const fs = require('fs');
const { executeTc } = require('./tcInterpreter');

function createDbHelper(workspaceDir) {
  const dbConfigPath = path.join(workspaceDir, 'databases.json');
  function getProfiles() {
    try {
      if (fs.existsSync(dbConfigPath)) {
        return JSON.parse(fs.readFileSync(dbConfigPath, 'utf8'));
      }
    } catch {}
    return [];
  }

  return {
    async query(profileNameOrId, sql, params = []) {
      const profiles = getProfiles();
      const profile = profiles.find(p => p.id === profileNameOrId || p.name === profileNameOrId) || {
        type: 'sqlite',
        database: profileNameOrId
      };

      if (profile.type === 'sqlite') {
        const { DatabaseSync } = require('node:sqlite');
        let dbPath = profile.database || ':memory:';
        if (dbPath !== ':memory:' && !path.isAbsolute(dbPath)) {
          dbPath = path.resolve(workspaceDir, dbPath);
        }
        const db = new DatabaseSync(dbPath);
        try {
          const trimmed = sql.trim();
          if (trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('PRAGMA')) {
            const stmt = db.prepare(sql);
            return stmt.all(...params);
          } else {
            db.exec(sql);
            return [];
          }
        } finally {
          db.close();
        }
      }

      if (profile.type === 'postgres') {
        const { Client } = require('pg');
        const client = new Client({
          host: profile.host || 'localhost',
          port: profile.port || 5432,
          user: profile.user || 'postgres',
          password: profile.password || '',
          database: profile.database || 'postgres',
          connectionTimeoutMillis: 5000,
          ssl: profile.ssl ? { rejectUnauthorized: false } : undefined
        });
        await client.connect();
        try {
          const res = await client.query(sql, params);
          return res.rows;
        } finally {
          await client.end();
        }
      }

      if (profile.type === 'mysql') {
        const mysql = require('mysql2/promise');
        const conn = await mysql.createConnection({
          host: profile.host || 'localhost',
          port: profile.port || 3306,
          user: profile.user || 'root',
          password: profile.password || '',
          database: profile.database || undefined,
          connectTimeout: 5000
        });
        try {
          const [result] = await conn.execute(sql, params);
          return Array.isArray(result) ? result : [];
        } finally {
          await conn.end();
        }
      }

      throw new Error(`Unsupported database type: ${profile.type}`);
    },

    async assert(profileNameOrId, sql, predicate) {
      const rows = await this.query(profileNameOrId, sql);
      const passed = predicate(rows);
      if (!passed) {
        throw new Error(`Database assertion failed for query: "${sql}". Returned ${rows.length} rows.`);
      }
      return true;
    }
  };
}

function createEnvHelper(workspaceDir) {
  const envConfigPath = path.join(workspaceDir, 'environments.json');
  function getData() {
    try {
      if (fs.existsSync(envConfigPath)) {
        return JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
      }
    } catch {}
    return { active: 'dev', environments: [] };
  }

  const data = getData();
  const activeEnv = data.environments.find(e => e.id === data.active) || data.environments[0] || { variables: [] };
  const varMap = {};
  for (const v of (activeEnv.variables || [])) {
    if (v.enabled) varMap[v.key] = v.value;
  }

  return {
    active: data.active,
    get(key, defaultValue = '') {
      return varMap[key] !== undefined ? varMap[key] : defaultValue;
    },
    all() {
      return { ...varMap };
    },
    set(key, value) {
      varMap[key] = String(value);
      return value;
    },
    resolve(input) {
      if (!input || typeof input !== 'string') return input;
      let out = input;
      for (const [k, v] of Object.entries(varMap)) {
        out = out.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
      }
      return out;
    }
  };
}

async function main() {
  const testFile = process.argv[2] || process.env.TEST_FILE;
  const isHeadless = process.env.HEADLESS === 'true';
  const workspaceDir = process.env.WORKSPACE_DIR || process.cwd();

  if (!testFile) {
    console.error('[Runner] Error: No test file specified.');
    process.exit(1);
  }

  console.log(`[Runner] 🚀 Starting Velocity Unified Automation Engine (Headless: ${isHeadless})`);
  console.log(`[Runner] 📁 Test file: ${path.basename(testFile)}`);

  const db = createDbHelper(workspaceDir);
  const env = createEnvHelper(workspaceDir);

  let browser = null;
  let apiContext = null;
  const startTime = Date.now();

  try {
    const fullPath = path.resolve(testFile);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Test file not found: ${fullPath}`);
    }

    const fileExt = path.extname(fullPath).toLowerCase();
    const fileContent = fs.readFileSync(fullPath, 'utf8');

    let storageState = undefined;
    const authStateName = process.env.AUTH_STATE;
    if (authStateName) {
      const authPath = path.join(workspaceDir, '.auth', `${authStateName}.json`);
      if (fs.existsSync(authPath)) {
        console.log(`[Runner] 🔑 Attaching Authenticated Session Profile: ${authStateName}`);
        storageState = authPath;
      }
    } else if (fileExt === '.tc') {
      try {
        const parsed = JSON.parse(fileContent);
        if (parsed.authState) {
          const authPath = path.join(workspaceDir, '.auth', `${parsed.authState}.json`);
          if (fs.existsSync(authPath)) {
            console.log(`[Runner] 🔑 Attaching Authenticated Session Profile: ${parsed.authState}`);
            storageState = authPath;
          }
        }
      } catch {}
    }

    // Launch Chromium
    browser = await chromium.launch({
      headless: isHeadless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      storageState,
      recordVideo: undefined
    });
    const page = await context.newPage();

    page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    // Create Playwright API request context
    apiContext = await playwrightRequest.newContext();

    const api = {
      async get(url, options = {}) {
        const res = await apiContext.get(env.resolve(url), options);
        return {
          status: res.status(),
          ok: res.ok(),
          headers: res.headers(),
          json: async () => res.json(),
          text: async () => res.text()
        };
      },
      async post(url, data, options = {}) {
        const res = await apiContext.post(env.resolve(url), { data, ...options });
        return {
          status: res.status(),
          ok: res.ok(),
          headers: res.headers(),
          json: async () => res.json(),
          text: async () => res.text()
        };
      },
      async put(url, data, options = {}) {
        const res = await apiContext.put(env.resolve(url), { data, ...options });
        return {
          status: res.status(),
          ok: res.ok(),
          headers: res.headers(),
          json: async () => res.json(),
          text: async () => res.text()
        };
      },
      async delete(url, options = {}) {
        const res = await apiContext.delete(env.resolve(url), options);
        return {
          status: res.status(),
          ok: res.ok(),
          headers: res.headers(),
          json: async () => res.json(),
          text: async () => res.text()
        };
      }
    };

    console.log(`[Runner] ⏱️ Engine ready in ${Date.now() - startTime}ms (Web + API + DB + Env)`);

    if (fileExt === '.tc') {
      console.log(`[Runner] 📋 Executing Test Case format (.tc)...`);
      const tcData = JSON.parse(fileContent);
      await executeTc(tcData, page, context, browser, { db, env, api });
    } else if (fileExt === '.tcs') {
      console.log(`[Runner] 📦 Executing Test Suite (.tcs)...`);
      const suiteData = JSON.parse(fileContent);
      const testDir = path.dirname(fullPath);
      for (const tcRel of (suiteData.tests || [])) {
        let tcPath = path.resolve(testDir, tcRel);
        if (!fs.existsSync(tcPath)) {
          tcPath = path.resolve(testDir, '..', tcRel);
        }
        if (fs.existsSync(tcPath)) {
          console.log(`\n--- Running Suite Item: ${path.basename(tcPath)} ---`);
          const tcData = JSON.parse(fs.readFileSync(tcPath, 'utf8'));
          await executeTc(tcData, page, context, browser, { db, env, api });
        } else {
          console.warn(`[Runner] ⚠️ Suite test not found: ${tcRel}`);
        }
      }
    } else {
      console.log(`[Runner] ▶️ Executing unified script code...`);
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const customTestFn = new AsyncFunction('page', 'browser', 'context', 'chromium', 'request', 'api', 'db', 'env', fileContent);
      const stepStart = Date.now();
      await customTestFn(page, browser, context, chromium, apiContext, api, db, env);
      console.log(`[Runner] ✅ Script steps passed in ${Date.now() - stepStart}ms!`);
    }

    console.log(`[Runner] 🎉 Test execution passed successfully!`);
  } catch (err) {
    console.error(`[Runner] ❌ Test Failed: ${err.message}`);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exitCode = 1;
  } finally {
    if (apiContext) {
      await apiContext.dispose().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    const totalDuration = Date.now() - startTime;
    console.log(`[Runner] 🏁 Total runtime: ${totalDuration}ms`);
  }
}

main().catch(err => {
  console.error('[Runner Fatal Error]', err);
  process.exit(1);
});
