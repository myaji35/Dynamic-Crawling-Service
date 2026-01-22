import { NextResponse } from 'next/server'
import { checkAuthorization } from '@/lib/auth'
import { chromium } from 'playwright'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const { userId, project, error } = await checkAuthorization(projectId)
  if (error) return error

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  try {
    console.time('Sample crawl total time')

    // Get first URL and selectors from project
    const sampleUrl = (project.urls as string[])[0]
    const selectors = project.selectors as Record<string, string>

    console.log(
      `🚀 Sample crawl for ${Object.keys(selectors).length} fields...`
    )
    console.log('Selector map:', selectors)
    console.log('Sample URL:', sampleUrl)

    // Launch browser and crawl
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    try {
      await page.goto(sampleUrl, { waitUntil: 'networkidle', timeout: 30000 })

      // Extract data using selectors
      const results: Record<string, string> = {}

      for (const [fieldName, selector] of Object.entries(selectors)) {
        try {
          const element = await page.$(selector)
          if (element) {
            const text = await element.textContent()
            results[fieldName] = text?.trim() || ''
          } else {
            results[fieldName] = ''
          }
        } catch (error) {
          console.error(`Error extracting field ${fieldName}:`, error)
          results[fieldName] = ''
        }
      }

      await browser.close()

      console.log('=== Sample Crawl Results ===')
      for (const [fieldName, value] of Object.entries(results)) {
        console.log(`${fieldName}: "${value}"`)
      }

      console.timeEnd('Sample crawl total time')

      return NextResponse.json({
        url: sampleUrl,
        data: results,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      await browser.close()
      throw error
    }
  } catch (error) {
    console.error('Sample crawl error:', error)
    return NextResponse.json({ error: 'Failed to crawl data' }, { status: 500 })
  }
}
