import { spawn, ChildProcess } from 'child_process'
import { WebContents } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

export class TestRunnerService {
  private activeProcess: ChildProcess | null = null

  constructor(
    private getSender: () => WebContents | null,
    private workspaceDir: string = process.cwd()
  ) {}

  private send(type: 'stdout' | 'stderr' | 'status' | 'result', text: string, data?: any) {
    const sender = this.getSender()
    if (sender && !sender.isDestroyed()) {
      sender.send('test:output', { type, text, data })
    }
  }

  private findTestFiles(dir: string): string[] {
    let results: string[] = []
    const list = fs.readdirSync(dir)
    for (const file of list) {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        results = results.concat(this.findTestFiles(fullPath))
      } else if (file.endsWith('.spec.js') || file.endsWith('.spec.ts') || file.endsWith('.test.js')) {
        results.push(fullPath)
      }
    }
    return results
  }

  async runTest(options: { filePath: string; headless: boolean }): Promise<{ success: boolean; message?: string }> {
    if (this.activeProcess) {
      return { success: false, message: 'A test is already running!' }
    }

    const { filePath, headless } = options

    if (!fs.existsSync(filePath)) {
      this.send('stderr', `Error: Path not found: ${filePath}`)
      return { success: false, message: 'File or folder not found' }
    }

    const stat = fs.statSync(filePath)
    let runnerScript = path.resolve(__dirname, 'worker.js')
    if (runnerScript.includes('app.asar')) {
      runnerScript = runnerScript.replace('app.asar', 'app.asar.unpacked')
    }

    if (stat.isDirectory()) {
      // Run entire Project or Sub-Project suite!
      const testFiles = this.findTestFiles(filePath)
      if (testFiles.length === 0) {
        this.send('status', `No test files (.spec.js / .test.js) found in project folder: ${path.basename(filePath)}`)
        return { success: false, message: 'No tests found in folder' }
      }

      this.send('status', `🚀 Running Project Suite [${path.basename(filePath)}]: Found ${testFiles.length} test files...`)
      return this.runBatch(testFiles, headless, runnerScript)
    }

    // Run Single Test File
    this.send('status', `Initializing test runner for: ${path.basename(filePath)}...`)
    const env = {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      HEADLESS: headless ? 'true' : 'false',
      TEST_FILE: filePath,
      WORKSPACE_DIR: this.workspaceDir
    }

    const start = Date.now()
    this.send('status', `Execution mode: ${headless ? 'Headless (Fast)' : 'Headed (Visual)'}`)

    try {
      this.activeProcess = spawn(process.execPath, [runnerScript, filePath], {
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      })

      this.activeProcess.stdout?.on('data', (data) => {
        this.send('stdout', data.toString())
      })

      this.activeProcess.stderr?.on('data', (data) => {
        this.send('stderr', data.toString())
      })

      this.activeProcess.on('close', (code) => {
        const duration = Date.now() - start
        this.activeProcess = null
        if (code === 0) {
          this.send('result', `Test completed successfully in ${duration}ms!`, { code, duration, status: 'passed' })
        } else {
          this.send('result', `Test finished with exit code ${code} (${duration}ms)`, { code, duration, status: 'failed' })
        }
      })

      return { success: true }
    } catch (err: any) {
      this.activeProcess = null
      this.send('stderr', `Execution failed: ${err.message}`)
      return { success: false, message: err.message }
    }
  }

  private async runBatch(files: string[], headless: boolean, runnerScript: string): Promise<{ success: boolean }> {
    const totalStart = Date.now()
    let passedCount = 0
    let failedCount = 0

    const runNext = (index: number) => {
      if (index >= files.length) {
        const totalDuration = Date.now() - totalStart
        const status = failedCount === 0 ? 'passed' : 'failed'
        this.send(
          'result',
          `🏁 Suite Completed: ${passedCount} Passed, ${failedCount} Failed (${totalDuration}ms)`,
          { code: failedCount === 0 ? 0 : 1, duration: totalDuration, status }
        )
        this.activeProcess = null
        return
      }

      const file = files[index]
      this.send('status', `\n▶️ [${index + 1}/${files.length}] Running: ${path.basename(file)}`)

      this.activeProcess = spawn(process.execPath, [runnerScript, file], {
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1',
          HEADLESS: headless ? 'true' : 'false',
          TEST_FILE: file,
          WORKSPACE_DIR: this.workspaceDir
        },
        stdio: ['pipe', 'pipe', 'pipe']
      })

      this.activeProcess.stdout?.on('data', (data) => this.send('stdout', data.toString()))
      this.activeProcess.stderr?.on('data', (data) => this.send('stderr', data.toString()))

      this.activeProcess.on('close', (code) => {
        if (code === 0) passedCount++
        else failedCount++
        runNext(index + 1)
      })
    }

    runNext(0)
    return { success: true }
  }

  async stopTest(): Promise<void> {
    if (this.activeProcess) {
      this.send('status', 'Terminating test process...')
      this.activeProcess.kill('SIGINT')
      this.activeProcess = null
    }
  }

  async recordTest(url = 'https://example.com'): Promise<{ success: boolean; message?: string }> {
    this.send('status', `Starting Playwright Interactive Visual Recorder at: ${url}`)
    try {
      const isWin = process.platform === 'win32'
      const npxCmd = isWin ? 'npx.cmd' : 'npx'

      const recordProcess = spawn(npxCmd, ['playwright', 'codegen', url], {
        stdio: 'inherit',
        shell: true
      })

      recordProcess.on('close', (code) => {
        this.send('status', `Recorder closed (code: ${code})`)
      })

      return { success: true }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }
}
