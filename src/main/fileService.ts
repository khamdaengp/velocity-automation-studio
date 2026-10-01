import * as fs from 'fs'
import * as path from 'path'

export interface FileNode {
  name: string
  path: string
  relativePath: string
  isDir: boolean
  children?: FileNode[]
}

export class FileService {
  private baseDir: string

  constructor(workspaceDir: string) {
    this.baseDir = workspaceDir
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true })
    }
  }

  getBaseDir(): string {
    return this.baseDir
  }

  async getTree(dirPath = this.baseDir): Promise<FileNode[]> {
    try {
      if (!fs.existsSync(dirPath)) return []

      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      const nodes: FileNode[] = []

      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name.endsWith('.png')) continue

        const fullPath = path.join(dirPath, entry.name)
        const relativePath = path.relative(this.baseDir, fullPath).replace(/\\/g, '/')

        if (entry.isDirectory()) {
          const children = await this.getTree(fullPath)
          nodes.push({
            name: entry.name,
            path: fullPath,
            relativePath,
            isDir: true,
            children
          })
        } else {
          nodes.push({
            name: entry.name,
            path: fullPath,
            relativePath,
            isDir: false
          })
        }
      }

      return nodes.sort((a, b) => {
        if (a.isDir && !b.isDir) return -1
        if (!a.isDir && b.isDir) return 1
        return a.name.localeCompare(b.name)
      })
    } catch {
      return []
    }
  }

  async createFolder(relativeFolderPath: string): Promise<boolean> {
    try {
      const fullPath = path.isAbsolute(relativeFolderPath)
        ? relativeFolderPath
        : path.join(this.baseDir, relativeFolderPath)

      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
      }
      return true
    } catch (e: any) {
      throw new Error(`Failed to create project folder: ${e.message}`)
    }
  }

  async createReferenceProject(projectName: string): Promise<boolean> {
    const projDir = path.join(this.baseDir, projectName)
    const testCaseDir = path.join(projDir, 'test-case')
    const testSuiteDir = path.join(projDir, 'test-suite')
    const keywordDir = path.join(projDir, 'keyword')
    const reportDir = path.join(projDir, 'report')

    fs.mkdirSync(testCaseDir, { recursive: true })
    fs.mkdirSync(testSuiteDir, { recursive: true })
    fs.mkdirSync(keywordDir, { recursive: true })
    fs.mkdirSync(reportDir, { recursive: true })

    // Project index config
    fs.writeFileSync(
      path.join(projDir, 'index.json'),
      JSON.stringify(
        {
          name: projectName,
          env: 'test',
          delayCommand: 0,
          timeoutCommand: 10,
          profiles: ['Default', 'Staging', 'Production'],
          reportFolder: 'report'
        },
        null,
        2
      )
    )

    // Sample .tc (Test Case)
    fs.writeFileSync(
      path.join(testCaseDir, 'sample.tc'),
      JSON.stringify(
        {
          id: 'tc-' + Date.now(),
          name: 'Sample Navigation & Assertion Test',
          commands: [
            {
              id: 'cmd-1',
              command: 'open',
              target: 'https://example.com',
              value: ''
            },
            {
              id: 'cmd-2',
              command: 'assertTitle',
              target: 'Example Domain',
              value: ''
            },
            {
              id: 'cmd-3',
              command: 'assertText',
              target: 'h1',
              value: 'Example Domain'
            },
            {
              id: 'cmd-4',
              command: 'screenshot',
              target: 'tests/' + projectName + '/report/screenshot.png',
              value: ''
            }
          ]
        },
        null,
        2
      )
    )

    // Sample .tcs (Test Suite)
    fs.writeFileSync(
      path.join(testSuiteDir, 'sample.tcs'),
      JSON.stringify(
        {
          id: 'suite-' + Date.now(),
          name: 'Full Regression Suite',
          parallel: false,
          persistSession: false,
          timeout: 30000,
          tests: ['../test-case/sample.tc']
        },
        null,
        2
      )
    )

    // Sample custom keyword
    fs.writeFileSync(
      path.join(keywordDir, 'custom-keywords.js'),
      `// Custom Keyword extension
module.exports = {
  customLogin: async (page, username, password) => {
    console.log('Logging in as:', username);
  }
};
`
    )

    return true
  }

  async readFile(filePath: string): Promise<string> {
    try {
      const targetPath = path.isAbsolute(filePath) ? filePath : path.join(this.baseDir, filePath)
      return fs.readFileSync(targetPath, 'utf-8')
    } catch (e: any) {
      throw new Error(`Failed to read file: ${e.message}`)
    }
  }

  async writeFile(filePath: string, content: string): Promise<boolean> {
    try {
      const targetPath = path.isAbsolute(filePath) ? filePath : path.join(this.baseDir, filePath)
      const dir = path.dirname(targetPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(targetPath, content, 'utf-8')
      return true
    } catch (e: any) {
      throw new Error(`Failed to write file: ${e.message}`)
    }
  }

  async deleteItem(itemPath: string): Promise<boolean> {
    try {
      const targetPath = path.isAbsolute(itemPath) ? itemPath : path.join(this.baseDir, itemPath)
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true })
      }
      return true
    } catch (e: any) {
      throw new Error(`Failed to delete: ${e.message}`)
    }
  }

  async renameItem(oldItemPath: string, newName: string): Promise<{ success: boolean; newPath: string }> {
    try {
      const targetOldPath = path.isAbsolute(oldItemPath) ? oldItemPath : path.join(this.baseDir, oldItemPath)
      if (!fs.existsSync(targetOldPath)) {
        throw new Error(`Item does not exist: ${oldItemPath}`)
      }
      const parentDir = path.dirname(targetOldPath)
      const targetNewPath = path.join(parentDir, newName.trim())
      if (fs.existsSync(targetNewPath)) {
        throw new Error(`An item with name "${newName}" already exists.`)
      }
      fs.renameSync(targetOldPath, targetNewPath)
      return { success: true, newPath: targetNewPath }
    } catch (e: any) {
      throw new Error(`Failed to rename: ${e.message}`)
    }
  }

  async importProject(sourceDirPath: string): Promise<{ success: boolean; projectName: string }> {
    try {
      if (!fs.existsSync(sourceDirPath)) {
        throw new Error(`Source directory does not exist: ${sourceDirPath}`)
      }
      const folderName = path.basename(sourceDirPath)
      const destPath = path.join(this.baseDir, folderName)
      fs.cpSync(sourceDirPath, destPath, { recursive: true, force: true })
      return { success: true, projectName: folderName }
    } catch (e: any) {
      throw new Error(`Failed to import project: ${e.message}`)
    }
  }

  async exportProject(relativeProjectPath: string, targetDestDir: string): Promise<{ success: boolean; destPath: string }> {
    try {
      const sourcePath = path.isAbsolute(relativeProjectPath)
        ? relativeProjectPath
        : path.join(this.baseDir, relativeProjectPath)
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source project does not exist: ${relativeProjectPath}`)
      }
      const folderName = path.basename(sourcePath)
      const destPath = path.join(targetDestDir, folderName)
      fs.cpSync(sourcePath, destPath, { recursive: true, force: true })
      return { success: true, destPath }
    } catch (e: any) {
      throw new Error(`Failed to export project: ${e.message}`)
    }
  }
}
