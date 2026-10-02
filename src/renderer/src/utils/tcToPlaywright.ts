import { TestCaseData, TcCommand } from '../types'

/**
 * Converts a declarative Velocity No-Code Test Case (.tc) into pure Playwright JavaScript code.
 */
export function convertTcToPlaywright(tcData: TestCaseData | string): string {
  let data: TestCaseData
  if (typeof tcData === 'string') {
    try {
      data = JSON.parse(tcData)
    } catch {
      // If it's already code or not JSON, return as is
      return tcData
    }
  } else {
    data = tcData
  }

  const lines: string[] = []

  lines.push('/**')
  lines.push(` * Test Case: ${data.name || 'Visual Test Case'}`)
  if (data.description) {
    lines.push(` * Description: ${data.description}`)
  }
  lines.push(' * Converted from Velocity No-Code Test (.tc) to Native Playwright Code')
  lines.push(' */')
  lines.push('')
  lines.push(`console.log('⚡ Running test: ${data.name || 'Visual Test'}');`)
  lines.push('')

  const commands: TcCommand[] = Array.isArray(data.commands) ? data.commands : []

  commands.forEach((cmd, idx) => {
    const stepNum = idx + 1
    const command = (cmd.command || '').toLowerCase().trim()
    const target = (cmd.target || '').trim()
    const value = (cmd.value || '').trim()
    const desc = cmd.description ? ` - ${cmd.description}` : ''

    lines.push(`// Step ${stepNum}: [${command.toUpperCase()}] ${target || ''}${desc}`)

    switch (command) {
      case 'open':
      case 'goto':
      case 'navigate': {
        lines.push(`await page.goto('${escapeString(target)}', { waitUntil: 'load', timeout: 15000 });`)
        break
      }

      case 'click': {
        lines.push(`await page.click('${escapeString(target)}');`)
        break
      }

      case 'dblclick':
      case 'doubleclick': {
        lines.push(`await page.dblclick('${escapeString(target)}');`)
        break
      }

      case 'type':
      case 'fill':
      case 'sendkeys': {
        lines.push(`await page.fill('${escapeString(target)}', '${escapeString(value)}');`)
        break
      }

      case 'press':
      case 'key': {
        lines.push(`await page.press('${escapeString(target || 'body')}', '${escapeString(value || 'Enter')}');`)
        break
      }

      case 'check': {
        lines.push(`await page.check('${escapeString(target)}');`)
        break
      }

      case 'uncheck': {
        lines.push(`await page.uncheck('${escapeString(target)}');`)
        break
      }

      case 'hover': {
        lines.push(`await page.hover('${escapeString(target)}');`)
        break
      }

      case 'select':
      case 'selectoption': {
        lines.push(`await page.selectOption('${escapeString(target)}', '${escapeString(value)}');`)
        break
      }

      case 'asserttext':
      case 'verifytext': {
        lines.push(`const text_${stepNum} = await page.locator('${escapeString(target)}').first().textContent();`)
        lines.push(`if (!text_${stepNum} || !text_${stepNum}.includes('${escapeString(value)}')) {`)
        lines.push(`  throw new Error('Assertion failed: Expected "${escapeString(value)}" in "${escapeString(target)}", but found: ' + text_${stepNum}?.trim());`)
        lines.push(`}`)
        break
      }

      case 'assertvisible':
      case 'verifyvisible': {
        lines.push(`await page.locator('${escapeString(target)}').first().waitFor({ state: 'visible', timeout: 7000 });`)
        break
      }

      case 'assertnotvisible':
      case 'verifyhidden': {
        lines.push(`await page.locator('${escapeString(target)}').first().waitFor({ state: 'hidden', timeout: 7000 });`)
        break
      }

      case 'asserttitle':
      case 'verifytitle': {
        lines.push(`const title_${stepNum} = await page.title();`)
        lines.push(`if (!title_${stepNum}.includes('${escapeString(value || target)}')) {`)
        lines.push(`  throw new Error('Title assertion failed: Expected "${escapeString(value || target)}", got: ' + title_${stepNum});`)
        lines.push(`}`)
        break
      }

      case 'waitforelement':
      case 'waitforvisible': {
        lines.push(`await page.waitForSelector('${escapeString(target)}', { state: 'visible', timeout: 10000 });`)
        break
      }

      case 'screenshot': {
        const pathVal = target || value || `screenshot-${Date.now()}.png`
        lines.push(`await page.screenshot({ path: '${escapeString(pathVal)}' });`)
        break
      }

      case 'pause':
      case 'sleep':
      case 'wait': {
        const ms = parseInt(target || value || '1000', 10) || 1000
        lines.push(`await new Promise((resolve) => setTimeout(resolve, ${ms}));`)
        break
      }

      case 'scroll':
      case 'scrollto': {
        lines.push(`await page.locator('${escapeString(target)}').scrollIntoViewIfNeeded();`)
        break
      }

      case 'apiget': {
        lines.push(`const apiRes_${stepNum} = await api.get('${escapeString(target)}');`)
        lines.push(`console.log('📡 API GET Response:', apiRes_${stepNum}.status);`)
        break
      }

      case 'apipost': {
        const payload = value ? value : '{}'
        lines.push(`const apiRes_${stepNum} = await api.post('${escapeString(target)}', ${payload});`)
        lines.push(`console.log('📡 API POST Response:', apiRes_${stepNum}.status);`)
        break
      }

      case 'extractui': {
        const cleanVar = sanitizeVarName(value || `extractedText_${stepNum}`)
        lines.push(`const ${cleanVar} = (await page.locator('${escapeString(target)}').first().textContent())?.trim();`)
        lines.push(`console.log('📥 Extracted UI text for ${cleanVar}:', ${cleanVar});`)
        break
      }

      case 'setvar': {
        const cleanVar = sanitizeVarName(target || `myVar_${stepNum}`)
        lines.push(`const ${cleanVar} = '${escapeString(value)}';`)
        break
      }

      case 'dbquery': {
        lines.push(`const dbData_${stepNum} = await db.query('${escapeString(target)}', '${escapeString(value)}');`)
        lines.push(`console.log('🗄️ Database query result:', dbData_${stepNum});`)
        break
      }

      default: {
        lines.push(`// Custom action: ${command}`)
        if (target) lines.push(`// target: ${target}`)
        if (value) lines.push(`// value: ${value}`)
        break
      }
    }
    lines.push('')
  })

  lines.push(`console.log('✅ Test finished successfully!');`)
  return lines.join('\n')
}

/**
 * Parses Playwright / JavaScript code into visual TestCaseData (.tc format)
 */
export function convertPlaywrightToTc(jsCode: string, filePath?: string): TestCaseData {
  if (!jsCode || !jsCode.trim()) {
    return {
      id: 'tc-' + Date.now(),
      name: filePath ? filePath.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || 'New Test' : 'New Test',
      description: 'Declarative No-Code Automation Flow',
      commands: [{ command: 'open', target: 'https://example.com', value: '', description: 'Initial navigation' }]
    }
  }

  // If already valid JSON tc format:
  try {
    const parsed = JSON.parse(jsCode)
    if (parsed && Array.isArray(parsed.commands)) {
      return parsed
    }
  } catch {}

  const commands: TcCommand[] = []
  const lines = jsCode.split('\n')
  let lastDescription = ''

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('*/')) {
      continue
    }

    // Step comments like: // Step 1: Click login button
    if (trimmed.startsWith('//')) {
      const commentText = trimmed.replace(/^\/\/\s*(Step\s*\d+:?\s*)?/, '').trim()
      if (commentText && !commentText.startsWith('[') && !commentText.includes('Test finished')) {
        lastDescription = commentText
      }
      continue
    }

    const desc = lastDescription
    lastDescription = ''

    // 1. page.goto('url')
    let match = trimmed.match(/page\.goto\s*\(\s*['"`]([^'"`]+)['"`]/)
    if (match) {
      commands.push({ command: 'open', target: match[1], value: '', description: desc || 'Open URL' })
      continue
    }

    // 2. page.fill('selector', 'value') or page.type
    match = trimmed.match(/page\.(?:fill|type|sendKeys)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]*)['"`]/)
    if (match) {
      commands.push({ command: 'type', target: match[1], value: match[2], description: desc || 'Type text' })
      continue
    }

    // 3. page.click('selector')
    match = trimmed.match(/page\.click\s*\(\s*['"`]([^'"`]+)['"`]/)
    if (match) {
      commands.push({ command: 'click', target: match[1], value: '', description: desc || 'Click element' })
      continue
    }

    // 4. page.dblclick('selector')
    match = trimmed.match(/page\.(?:dblclick|doubleClick)\s*\(\s*['"`]([^'"`]+)['"`]/)
    if (match) {
      commands.push({ command: 'dblclick', target: match[1], value: '', description: desc || 'Double click' })
      continue
    }

    // 5. page.press('selector', 'key')
    match = trimmed.match(/page\.press\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]*)['"`]/)
    if (match) {
      commands.push({ command: 'press', target: match[1], value: match[2], description: desc || 'Press key' })
      continue
    }

    // 6. page.check('selector')
    match = trimmed.match(/page\.check\s*\(\s*['"`]([^'"`]+)['"`]/)
    if (match) {
      commands.push({ command: 'check', target: match[1], value: '', description: desc || 'Check checkbox' })
      continue
    }

    // 7. page.uncheck('selector')
    match = trimmed.match(/page\.uncheck\s*\(\s*['"`]([^'"`]+)['"`]/)
    if (match) {
      commands.push({ command: 'uncheck', target: match[1], value: '', description: desc || 'Uncheck checkbox' })
      continue
    }

    // 8. page.hover('selector')
    match = trimmed.match(/page\.hover\s*\(\s*['"`]([^'"`]+)['"`]/)
    if (match) {
      commands.push({ command: 'hover', target: match[1], value: '', description: desc || 'Hover element' })
      continue
    }

    // 9. page.selectOption('selector', 'value')
    match = trimmed.match(/page\.(?:selectOption|select)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]*)['"`]/)
    if (match) {
      commands.push({ command: 'select', target: match[1], value: match[2], description: desc || 'Select option' })
      continue
    }

    // 10. page.screenshot({ path: '...' })
    match = trimmed.match(/page\.screenshot\s*\(\s*\{[^}]*path:\s*['"`]([^'"`]+)['"`]/)
    if (match) {
      commands.push({ command: 'screenshot', target: match[1], value: '', description: desc || 'Take screenshot' })
      continue
    }

    // 11. locator('selector').waitFor({ state: 'visible' | 'hidden' })
    match = trimmed.match(/(?:page\.locator|locator)\s*\(\s*['"`]([^'"`]+)['"`]\)[^;]*waitFor\s*\(\s*\{[^}]*state:\s*['"`](visible|hidden)['"`]/)
    if (match) {
      const isVisible = match[2] === 'visible'
      commands.push({
        command: isVisible ? 'assertvisible' : 'assertnotvisible',
        target: match[1],
        value: '',
        description: desc || (isVisible ? 'Verify visible' : 'Verify hidden')
      })
      continue
    }

    // 12. page.waitForSelector('selector')
    match = trimmed.match(/page\.waitForSelector\s*\(\s*['"`]([^'"`]+)['"`]/)
    if (match) {
      commands.push({ command: 'assertvisible', target: match[1], value: '', description: desc || 'Wait for element' })
      continue
    }

    // 13. waitForTimeout(ms) or setTimeout(..., ms)
    match = trimmed.match(/(?:waitForTimeout|setTimeout\s*\([^,]+,\s*)(\d+)/)
    if (match) {
      commands.push({ command: 'pause', target: match[1], value: '', description: desc || `Wait ${match[1]}ms` })
      continue
    }

    // 14. api.get('url')
    match = trimmed.match(/api\.get\s*\(\s*['"`]([^'"`]+)['"`]/)
    if (match) {
      commands.push({ command: 'apiget', target: match[1], value: '', description: desc || 'API GET request' })
      continue
    }

    // 15. api.post('url', ...)
    match = trimmed.match(/api\.post\s*\(\s*['"`]([^'"`]+)['"`]/)
    if (match) {
      commands.push({ command: 'apipost', target: match[1], value: '', description: desc || 'API POST request' })
      continue
    }

    // 16. db.query('target', 'sql')
    match = trimmed.match(/db\.query\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]*)['"`]/)
    if (match) {
      commands.push({ command: 'dbquery', target: match[1], value: match[2], description: desc || 'Database Query' })
      continue
    }

    // 17. asserttext (textContent / toContainText / includes)
    if (trimmed.includes('includes(') || trimmed.includes('toContainText(')) {
      const selMatch = trimmed.match(/['"`]([#.][^'"`]+)['"`]/)
      const valMatch = trimmed.match(/(?:includes|toContainText)\s*\(\s*['"`]([^'"`]+)['"`]\)/)
      if (selMatch && valMatch) {
        commands.push({
          command: 'asserttext',
          target: selMatch[1],
          value: valMatch[1],
          description: desc || 'Assert text contains'
        })
        continue
      }
    }

    // 18. console.log statements
    if (trimmed.startsWith('console.log(')) {
      continue
    }
  }

  const baseName = filePath ? filePath.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || 'Test Case' : 'Test Case'
  return {
    id: 'tc-' + Date.now(),
    name: baseName,
    description: 'Imported from script code',
    commands: commands.length > 0 ? commands : [
      { command: 'open', target: 'https://example.com', value: '', description: 'Initial navigation' }
    ]
  }
}

function escapeString(str: string): string {
  if (!str) return ''
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
}

function sanitizeVarName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, '_')
  return /^[a-zA-Z_]/.test(cleaned) ? cleaned : '_' + cleaned
}
