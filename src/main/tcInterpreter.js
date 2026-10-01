/**
 * Velocity Automation Studio - Declarative Test Case & Test Suite Interpreter
 * Translates declarative .tc (command table) and .tcs (test suite) files into native Playwright calls.
 */
const fs = require('fs')
const path = require('path')

async function executeTc(tcData, page, context, browser, options = {}) {
  const { delay = 0, timeout = 7000, db, env, api } = options
  const results = []

  const resolveVal = (val) => {
    if (!val || typeof val !== 'string') return val
    if (env && typeof env.resolve === 'function') {
      return env.resolve(val)
    }
    return val
  }

  console.log(`[Interpreter] 📋 Executing Test Case: "${tcData.name || tcData.id}" (${tcData.commands?.length || 0} steps)`)

  let lastApiResponse = null

  for (let i = 0; i < (tcData.commands || []).length; i++) {
    const cmd = tcData.commands[i]
    const stepStart = Date.now()
    const rawCommand = cmd.command || ''
    const target = resolveVal(cmd.target || '')
    const value = resolveVal(cmd.value || '')
    const desc = cmd.description ? ` (${cmd.description})` : ''

    console.log(`  [Step ${i + 1}] ▶️ ${rawCommand.toUpperCase()}${desc} | target: "${target}" | value: "${value}"`)

    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay))
    }

    try {
      switch (rawCommand.toLowerCase()) {
        case 'open':
        case 'goto':
        case 'navigate': {
          await page.goto(target, { timeout: 15000, waitUntil: 'load' })
          break
        }

        case 'click': {
          await page.click(target, { timeout })
          break
        }

        case 'dblclick':
        case 'doubleclick': {
          await page.dblclick(target, { timeout })
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

        case 'check': {
          await page.check(target, { timeout })
          break
        }

        case 'uncheck': {
          await page.uncheck(target, { timeout })
          break
        }

        case 'hover': {
          await page.hover(target, { timeout })
          break
        }

        case 'select':
        case 'selectoption': {
          await page.selectOption(target, value, { timeout })
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

        case 'assertvisible':
        case 'verifyvisible': {
          const el = page.locator(target).first()
          await el.waitFor({ state: 'visible', timeout })
          break
        }

        case 'assertnotvisible':
        case 'verifyhidden': {
          const el = page.locator(target).first()
          await el.waitFor({ state: 'hidden', timeout })
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
        case 'sleep':
        case 'wait': {
          const ms = parseInt(target || value || '1000', 10)
          await new Promise((r) => setTimeout(r, ms))
          break
        }

        case 'scroll':
        case 'scrollto': {
          await page.locator(target).scrollIntoViewIfNeeded({ timeout })
          break
        }

        case 'apiget': {
          if (!api) throw new Error('API Client is not available in runner context')
          const res = await api.get(target)
          console.log(`    📡 API GET ${target} -> Status: ${res.status}`)
          try {
            lastApiResponse = await res.json()
          } catch {
            lastApiResponse = await res.text().catch(() => null)
          }
          if (value && res.status !== parseInt(value, 10)) {
            throw new Error(`API Status Assertion failed: Expected ${value}, got ${res.status}`)
          }
          break
        }

        case 'apipost': {
          if (!api) throw new Error('API Client is not available in runner context')
          let payload = {}
          try {
            if (value) payload = JSON.parse(value)
          } catch {}
          const res = await api.post(target, payload)
          console.log(`    📡 API POST ${target} -> Status: ${res.status}`)
          try {
            lastApiResponse = await res.json()
          } catch {
            lastApiResponse = await res.text().catch(() => null)
          }
          break
        }

        case 'setvar':
        case 'setvariable': {
          if (env && env.set) {
            env.set(target, value)
            console.log(`    💾 Stored variable: {{${target}}} = "${value}"`)
          }
          break
        }

        case 'extractapi': {
          if (!lastApiResponse) throw new Error('No API response available to extract from. Call apiget or apipost first.')
          let extracted = lastApiResponse
          if (target && typeof lastApiResponse === 'object') {
            const parts = target.split('.')
            for (const p of parts) {
              if (extracted !== undefined && extracted !== null) {
                extracted = extracted[p]
              }
            }
          }
          const varName = value || target
          if (env && env.set) {
            env.set(varName, extracted !== undefined ? extracted : '')
            console.log(`    💾 Extracted API [${target}] -> {{${varName}}} = "${extracted}"`)
          }
          break
        }

        case 'extractui': {
          const el = page.locator(target).first()
          const text = (await el.textContent({ timeout })) || ''
          const trimmed = text.trim()
          if (env && env.set) {
            env.set(value, trimmed)
            console.log(`    💾 Extracted UI [${target}] -> {{${value}}} = "${trimmed}"`)
          }
          break
        }

        case 'extractdb': {
          if (!db) throw new Error('Database Engine is not available in runner context')
          const rows = await db.query('sqlite-local', target)
          let extracted = ''
          if (rows && rows.length > 0) {
            const firstRow = rows[0]
            const firstKey = Object.keys(firstRow)[0]
            extracted = firstRow[firstKey]
          }
          if (env && env.set) {
            env.set(value, extracted)
            console.log(`    💾 Extracted DB [${target}] -> {{${value}}} = "${extracted}"`)
          }
          break
        }

        case 'dbquery': {
          if (!db) throw new Error('Database Engine is not available in runner context')
          const profileId = value || 'sqlite-local'
          const rows = await db.query(profileId, target)
          console.log(`    🗄️ Executed DB Query on [${profileId}]: ${rows.length} rows returned`)
          break
        }

        default: {
          console.log(`  ⚠️ Unhandled keyword: "${rawCommand}"`)
        }
      }

      const stepTime = Date.now() - stepStart
      console.log(`    ✅ Step ${i + 1} passed in ${stepTime}ms`)
      results.push({ step: i + 1, command: rawCommand, target, status: 'passed', timeMs: stepTime })
    } catch (err) {
      const stepTime = Date.now() - stepStart
      console.error(`    ❌ Step ${i + 1} failed: ${err.message}`)
      results.push({ step: i + 1, command: rawCommand, target, status: 'failed', error: err.message, timeMs: stepTime })
      throw err
    }
  }

  return results
}

module.exports = { executeTc }
