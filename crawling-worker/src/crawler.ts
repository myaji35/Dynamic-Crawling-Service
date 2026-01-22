/**
 * Playwright Crawler Logic
 */

import { chromium, Browser, Page } from 'playwright'
import { CrawlingTask, CrawlingResult } from './types.js'

let browserInstance: Browser | null = null

/**
 * Get or create browser instance (reuse for performance)
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log('🌐 Launching new browser instance...')
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })
  }
  return browserInstance
}

/**
 * Crawl a single URL
 */
export async function crawlPage(task: CrawlingTask): Promise<CrawlingResult> {
  const { taskId, url, selectors } = task
  const startTime = Date.now()

  console.log(`🚀 Starting crawl for task ${taskId}`)
  console.log(`   URL: ${url}`)
  console.log(`   Fields: ${Object.keys(selectors).length}`)

  let page: Page | null = null

  try {
    const browser = await getBrowser()
    page = await browser.newPage()

    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    console.log(`✓ Page loaded: ${url}`)

    // Extract data using selectors
    const results: Record<string, string> = {}

    for (const [fieldName, selector] of Object.entries(selectors)) {
      try {
        const element = await page.$(selector)
        if (element) {
          const text = await element.textContent()
          results[fieldName] = text?.trim() || ''
        } else {
          console.warn(
            `⚠️  Field "${fieldName}": selector not found - ${selector}`
          )
          results[fieldName] = ''
        }
      } catch (error) {
        console.error(`❌ Error extracting field "${fieldName}":`, error)
        results[fieldName] = ''
      }
    }

    await page.close()

    const duration = Date.now() - startTime
    console.log(`✅ Crawl completed in ${duration}ms`)

    return {
      taskId,
      url,
      data: results,
      timestamp: new Date().toISOString(),
      status: 'success',
    }
  } catch (error) {
    if (page) {
      await page.close().catch(() => {})
    }

    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error(`❌ Crawl failed after ${duration}ms:`, errorMessage)

    return {
      taskId,
      url,
      data: {},
      timestamp: new Date().toISOString(),
      status: 'failed',
      errorMessage,
    }
  }
}

/**
 * Cleanup browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
    console.log('🛑 Browser closed')
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('📴 SIGTERM received, closing browser...')
  await closeBrowser()
  process.exit(0)
})
