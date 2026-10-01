/**
 * Velocity Automation Studio - Declarative Test Case & Test Suite Interpreter
 * Translates declarative .tc (command table) and .tcs (test suite) files into native Playwright calls.
 */
const fs = require('fs')
const path = require('path')

async function executeTc(tcData, page, context, browser, options = {}) {
  const { delay = 0, timeout = 5000 } = options
  const results = []

  console.log(`[Interpreter] 📋 Executing Test Case: "${tcData.name || tcData.id}" (${tcData.commands?.length || 0} steps)`)

  for (let i = 0; i < (tcData.commands || []).length; i++) {
    const cmd = tcData.commands[i]
    const stepStart = Date.now()
    const { command, target, value } = cmd

    console.log(`  [Step ${i + 1}] ▶️ ${command.toUpperCase()} | target: "${target}" | value: "${value}"`)

    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay))
    }

    try {
      switch (command.toLowerCase()) {
        case 'open':
        case 'goto':
        case 'navigate': {
          await page.goto(target, { timeout: 10000, waitUntil: 'load' })
          break
        }

        case 'click': {
          await page.click(target, { timeout })
          break
        }

        case 'type':
        case 'fill':
        case 'sendkeys': {
          await page.fill(target, value || '', { timeout })
          break
        }

        case 'press':
        case 'key': {
          await page.press(target || 'body', value || 'Enter', { timeout })
          break
        }

        case 'asserttext':
        case 'verifytext': {
          const el = page.locator(target).first()
          const text = await el.textContent({ timeout })
          if (!text || !text.includes(value)) {
            throw new Error(`Assertion failed: Expected "${value}" inside "${target}", found "${text?.trim()}"`)
          }
          break
        }

        case 'asserttitle':
        case 'verifytitle': {
          const title = await page.title()
          if (!title.includes(value || target)) {
            throw new Error(`Title assertion failed: Expected "${value || target}", got "${title}"`)
          }
          break
        }

        case 'waitforelement':
        case 'waitforvisible': {
          await page.waitForSelector(target, { timeout, state: 'visible' })
          break
        }

        case 'screenshot': {
          const savePath = target || value || `tests/screenshot-${Date.now()}.png`
          const dir = path.dirname(path.resolve(savePath))
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
          await page.screenshot({ path: savePath })
          console.log(`    📸 Saved screenshot: ${savePath}`)
          break
        }

        case 'pause':
        case 'sleep': {
          const ms = parseInt(target || value || '1000', 10)
          await new Promise((r) => setTimeout(r, ms))
          break
        }

        default: {
          console.log(`  ⚠️ Keyword: "${command}"`)
        }
      }

      const stepTime = Date.now() - stepStart
      console.log(`    ✅ Step ${i + 1} passed in ${stepTime}ms`)
      results.push({ step: i + 1, command, target, status: 'passed', timeMs: stepTime })
    } catch (err) {
      const stepTime = Date.now() - stepStart
      console.error(`    ❌ Step ${i + 1} failed: ${err.message}`)
      results.push({ step: i + 1, command, target, status: 'failed', error: err.message, timeMs: stepTime })
      throw err
    }
  }

  return results
}

module.exports = { executeTc }
