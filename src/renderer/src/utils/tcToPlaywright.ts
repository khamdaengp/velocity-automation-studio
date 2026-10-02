import { TestCaseData, TcCommand } from '../types'

/**
 * Converts a declarative Velocity No-Code Test Case (.tc) into pure Playwright JavaScript code.
 */
export function convertTcToPlaywright(tcData: TestCaseData | string): string {
  let data: TestCaseData
  if (typeof tcData === 'string') {
    try {
      data = JSON.parse(tcData)
    } catch (e: any) {
      throw new Error('Invalid JSON format: ' + e.message)
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

function escapeString(str: string): string {
  if (!str) return ''
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
}

function sanitizeVarName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, '_')
  return /^[a-zA-Z_]/.test(cleaned) ? cleaned : '_' + cleaned
}
