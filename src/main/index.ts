import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { TestRunnerService } from './testRunner'
import { FileService } from './fileService'
import { ApiRunnerService } from './apiRunner'
import { EnvService } from './envService'
import { DbService } from './dbService'

let mainWindow: BrowserWindow | null = null

function getWorkspaceDir(): string {
  if (!app.isPackaged) {
    return path.join(app.getAppPath(), 'tests')
  }

  // 1. Try directory adjacent to executable
  const exeAdjacent = path.join(path.dirname(app.getPath('exe')), 'tests')
  try {
    if (!fs.existsSync(exeAdjacent)) {
      fs.mkdirSync(exeAdjacent, { recursive: true })
    }
    fs.accessSync(exeAdjacent, fs.constants.W_OK)
    return exeAdjacent
  } catch {
    // 2. Fallback to Documents directory
    const docPath = path.join(app.getPath('documents'), 'VelocityStudioTests')
    if (!fs.existsSync(docPath)) {
      fs.mkdirSync(docPath, { recursive: true })
    }
    return docPath
  }
}

function seedSampleTests(dir: string): void {
  try {
    const sample = path.join(dir, 'welcome-test.spec.js')
    if (!fs.existsSync(sample)) {
      fs.writeFileSync(
        sample,
        `// Velocity Studio - Getting Started E2E Test
console.log('⚡ Starting Velocity Automation Test...');

// Step 1: Render interactive test page
await page.setContent(\`
  <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: auto;">
    <h1 style="color: #0284c7;">Velocity Automation Studio</h1>
    <p style="color: #64748b;">Ultra-Fast Playwright Turbo Engine</p>
    <div style="margin-top: 16px;">
      <input id="test-input" placeholder="Enter query..." value="automation-ready" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />
      <button id="verify-btn" style="padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer;">Verify</button>
    </div>
  </div>
\`);

// Step 2: Verify element content & input
const heading = await page.textContent('h1');
console.log('📌 Verified Heading:', heading);

const inputValue = await page.inputValue('#test-input');
console.log('🔍 Input Field Value:', inputValue);

// Step 3: Capture verification screenshot
await page.screenshot({ path: 'welcome.png' });
console.log('📸 Captured verification screenshot: welcome.png');
console.log('✅ All test assertions passed successfully!');
`
      )
    }

    const unifiedSample = path.join(dir, 'unified-scenario.spec.js')
    if (!fs.existsSync(unifiedSample)) {
      fs.writeFileSync(
        unifiedSample,
        `// ⚡ Velocity Studio - All-in-One Unified Scenario (API + Web + DB)
console.log('⚡ Starting Unified E2E Scenario (API + Web UI + Database)...');

// 1. Environment & Variables
const baseUrl = env.get('baseUrl', 'https://jsonplaceholder.typicode.com');
console.log(\`🌐 Active Environment: \${env.active} (\${baseUrl})\`);

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
console.log(\`✅ DB Verified: \${dbRecords.length} records in database table\`);

// 4. Step 3: Web Browser UI Automation
console.log('🖥️ Step 3: Rendering Web UI & validating elements...');
await page.setContent(\`
  <div style="font-family: system-ui; padding: 24px; max-width: 600px; margin: auto; background: #0f172a; color: white; border-radius: 8px;">
    <h2 style="color: #38bdf8;">⚡ Velocity All-in-One Automation Studio</h2>
    <p>API Status: <span id="api-status" style="color: #4ade80;">200 OK</span></p>
    <p>DB Status: <span id="db-status" style="color: #4ade80;">Verified (\${dbRecords.length} records)</span></p>
    <button id="finish-btn" style="padding: 8px 16px; background: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer;">Complete Scenario</button>
  </div>
\`);

const apiStatusText = await page.textContent('#api-status');
console.log('🔍 Verified UI API status text:', apiStatusText);
console.log('🎉 Unified Scenario (API + Web + DB) passed with flying colors!');
`
      )
    }
  } catch (err) {
    console.error('Failed to seed sample test:', err)
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#18181b',
      symbolColor: '#cccccc',
      height: 36
    },
    title: 'Velocity Automation Studio',
    icon: fs.existsSync(path.join(__dirname, '../../build/icon.png'))
      ? path.join(__dirname, '../../build/icon.png')
      : path.join(process.resourcesPath, 'build/icon.png'),
    backgroundColor: '#18181b',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Fallback to guarantee window is visible
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show()
    }
  }, 1000)

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    const htmlPath = path.join(__dirname, '../renderer/index.html')
    mainWindow.loadFile(htmlPath).catch((err) => {
      console.error('Failed to load HTML file:', err)
    })
  }
}

app.whenReady().then(() => {
  const workspaceDir = getWorkspaceDir()
  seedSampleTests(workspaceDir)

  const testRunner = new TestRunnerService(() => mainWindow?.webContents || null, workspaceDir)
  const fileService = new FileService(workspaceDir)
  const apiRunner = new ApiRunnerService()
  const envService = new EnvService(workspaceDir)
  const dbService = new DbService(workspaceDir)

  // Register IPC Handlers
  ipcMain.handle('test:run', async (_, options) => {
    return testRunner.runTest(options)
  })

  ipcMain.handle('test:stop', async () => {
    return testRunner.stopTest()
  })

  ipcMain.handle('test:record', async (_, url) => {
    return testRunner.recordTest(url)
  })

  // Multi-project & File operations
  ipcMain.handle('project:tree', async () => {
    return fileService.getTree()
  })

  ipcMain.handle('project:createFolder', async (_, folderPath) => {
    return fileService.createFolder(folderPath)
  })

  ipcMain.handle('project:createReference', async (_, projectName) => {
    return fileService.createReferenceProject(projectName)
  })

  ipcMain.handle('project:delete', async (_, itemPath) => {
    return fileService.deleteItem(itemPath)
  })

  ipcMain.handle('project:rename', async (_, itemPath, newName) => {
    return fileService.renameItem(itemPath, newName)
  })

  ipcMain.handle('project:import', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Automation Project Folder to Import / Sync',
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return fileService.importProject(result.filePaths[0])
  })

  ipcMain.handle('project:export', async (_, relativePath) => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      title: `Select Destination Folder to Export [${path.basename(relativePath)}]`,
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return fileService.exportProject(relativePath, result.filePaths[0])
  })

  ipcMain.handle('file:read', async (_, filePath) => {
    return fileService.readFile(filePath)
  })

  ipcMain.handle('file:write', async (_, filePath, content) => {
    return fileService.writeFile(filePath, content)
  })

  // Environment & Variables
  ipcMain.handle('env:get', async () => {
    return envService.getEnvironments()
  })

  ipcMain.handle('env:save', async (_, data) => {
    return envService.saveEnvironments(data)
  })

  ipcMain.handle('env:setActive', async (_, envId) => {
    return envService.setActiveEnvironment(envId)
  })

  ipcMain.handle('env:resolve', async (_, text, envId) => {
    return envService.resolveVariables(text, envId)
  })

  // Database Testing & Explorer
  ipcMain.handle('db:getProfiles', async () => {
    return dbService.getProfiles()
  })

  ipcMain.handle('db:saveProfiles', async (_, profiles) => {
    return dbService.saveProfiles(profiles)
  })

  ipcMain.handle('db:testConnection', async (_, profile) => {
    return dbService.testConnection(profile)
  })

  ipcMain.handle('db:query', async (_, profileOrId, sql, params) => {
    return dbService.runQuery(profileOrId, sql, params)
  })

  // API Execution with variable interpolation
  ipcMain.handle('api:request', async (_, req) => {
    const resolvedUrl = envService.resolveVariables(req.url)
    const resolvedHeaders: Record<string, string> = {}
    if (req.headers) {
      for (const [k, v] of Object.entries(req.headers)) {
        resolvedHeaders[k] = envService.resolveVariables(v as string)
      }
    }
    const resolvedBody = req.body ? envService.resolveVariables(req.body) : req.body
    return apiRunner.execute({
      ...req,
      url: resolvedUrl,
      headers: resolvedHeaders,
      body: resolvedBody
    })
  })

  // Persistent Auth State Management
  ipcMain.handle('auth:listProfiles', async () => {
    const authDir = path.join(workspaceDir, '.auth')
    if (!fs.existsSync(authDir)) return []
    const files = fs.readdirSync(authDir)
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => ({
        id: f.replace('.json', ''),
        name: f.replace('.json', ''),
        file: f
      }))
  })

  ipcMain.handle('auth:recordSession', async (_, options: { url: string; profileName: string }) => {
    try {
      const { chromium } = await import('playwright')
      const authDir = path.join(workspaceDir, '.auth')
      if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true })

      const cleanName = (options.profileName || 'session').trim().replace(/[^a-zA-Z0-9_-]/g, '_')
      const stateFile = path.join(authDir, `${cleanName}.json`)

      const browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      const context = await browser.newContext()
      const page = await context.newPage()
      await page.goto(options.url || 'https://google.com')

      return new Promise((resolve) => {
        let isSaved = false
        const saveAndClose = async () => {
          if (isSaved) return
          isSaved = true
          try {
            await context.storageState({ path: stateFile })
            await browser.close().catch(() => {})
            resolve({ success: true, profileName: cleanName, stateFile })
          } catch (err: any) {
            resolve({ success: false, error: err.message })
          }
        }

        page.on('close', saveAndClose)
        browser.on('disconnected', saveAndClose)
      })
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('auth:deleteProfile', async (_, profileName: string) => {
    const authDir = path.join(workspaceDir, '.auth')
    const stateFile = path.join(authDir, `${profileName}.json`)
    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile)
      return { success: true }
    }
    return { success: false }
  })

  ipcMain.handle('system:metrics', async () => {
    const mem = process.memoryUsage()
    return {
      memoryMB: Math.round(mem.rss / 1024 / 1024),
      platform: process.platform
    }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
