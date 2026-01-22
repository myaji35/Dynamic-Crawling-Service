/**
 * FlexCrawler MVP - Crawler Engine
 * PoC에서 검증된 크롤링 엔진을 TypeScript로 마이그레이션
 */

import { chromium, Browser, Page } from 'playwright'

export interface CrawlerConfig {
  headless?: boolean
  timeout?: number
  retries?: number
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'
}

export interface FieldConfig {
  selector: string
  selectorType?: 'css' | 'xpath'
  attribute?: string
  multiple?: boolean
  transform?: string | ((value: any) => any)
}

export interface CrawlJob {
  url: string
  fields: Record<string, FieldConfig | string>
  options?: CrawlerConfig
}

export interface CrawlResult {
  url: string
  data: Record<string, any>
  metadata: {
    scrapedAt: string
    loadTime: number
    fieldsExtracted: number
  }
  error?: string
}

export class CrawlerEngine {
  private browser: Browser | null = null
  private config: CrawlerConfig

  constructor(config: CrawlerConfig = {}) {
    this.config = {
      headless: config.headless !== false,
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      waitUntil: config.waitUntil || 'networkidle',
    }
  }

  /**
   * 브라우저 초기화
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.config.headless,
      })
    }
  }

  /**
   * 웹 페이지 크롤링
   */
  async crawl(job: CrawlJob): Promise<CrawlResult> {
    await this.initialize()

    const { url, fields, options = {} } = job
    let page: Page | null = null

    try {
      page = await this.browser!.newPage()
      page.setDefaultTimeout(options.timeout || this.config.timeout)

      // 페이지 로드
      const startTime = Date.now()
      await page.goto(url, {
        waitUntil: options.waitUntil || this.config.waitUntil,
        timeout: options.timeout || this.config.timeout,
      })
      const loadTime = Date.now() - startTime

      // 데이터 추출
      const data = await this.extractData(page, fields)

      await page.close()

      return {
        url,
        data,
        metadata: {
          scrapedAt: new Date().toISOString(),
          loadTime,
          fieldsExtracted: Object.keys(data).length,
        },
      }
    } catch (error) {
      if (page) await page.close()

      return {
        url,
        data: {},
        metadata: {
          scrapedAt: new Date().toISOString(),
          loadTime: 0,
          fieldsExtracted: 0,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 데이터 추출
   */
  private async extractData(
    page: Page,
    fields: Record<string, FieldConfig | string>
  ): Promise<Record<string, any>> {
    const data: Record<string, any> = {}

    for (const [fieldName, fieldConfig] of Object.entries(fields)) {
      try {
        const value = await this.extractField(page, fieldConfig)
        data[fieldName] = value
      } catch (error) {
        data[fieldName] = null
      }
    }

    return data
  }

  /**
   * 단일 필드 추출
   */
  private async extractField(
    page: Page,
    fieldConfig: FieldConfig | string
  ): Promise<any> {
    const config =
      typeof fieldConfig === 'string' ? { selector: fieldConfig } : fieldConfig

    const {
      selector,
      attribute = null,
      multiple = false,
      transform = null,
    } = config

    let value: any

    if (multiple) {
      // 여러 요소 추출
      const elements = await page.$$(selector)
      const values: any[] = []

      for (const element of elements) {
        let text
        if (attribute) {
          text = await element.getAttribute(attribute)
        } else {
          text = await element.textContent()
        }
        values.push(text?.trim())
      }

      value = values
    } else {
      // 단일 요소 추출
      const element = await page.$(selector)

      if (!element) {
        throw new Error(`Element not found: ${selector}`)
      }

      if (attribute) {
        value = await element.getAttribute(attribute)
      } else {
        value = await element.textContent()
      }

      value = value?.trim()
    }

    // Transform 적용
    if (transform) {
      value = this.applyTransform(value, transform)
    }

    return value
  }

  /**
   * 데이터 변환 적용
   */
  private applyTransform(
    value: any,
    transform: string | ((value: any) => any)
  ): any {
    if (typeof transform === 'function') {
      return transform(value)
    }

    // 내장 변환 함수들
    const transforms: Record<string, (v: any) => any> = {
      trim: (v) => (typeof v === 'string' ? v.trim() : v),
      lowercase: (v) => (typeof v === 'string' ? v.toLowerCase() : v),
      uppercase: (v) => (typeof v === 'string' ? v.toUpperCase() : v),
      extract_number: (v) => {
        if (typeof v !== 'string') return v
        const match = v.match(/[\d,\.]+/)
        return match ? parseFloat(match[0].replace(/,/g, '')) : null
      },
      extract_price: (v) => {
        if (typeof v !== 'string') return v
        const match = v.match(/[\d,\.]+/)
        if (!match) return null
        return {
          raw: v,
          value: parseFloat(match[0].replace(/,/g, '')),
          currency: v.match(/[$€£¥₩]/)?.[0] || 'USD',
        }
      },
      remove_whitespace: (v) => {
        if (typeof v !== 'string') return v
        return v.replace(/\s+/g, ' ').trim()
      },
    }

    if (transforms[transform]) {
      return transforms[transform](value)
    }

    console.warn(`Unknown transform: ${transform}`)
    return value
  }

  /**
   * 브라우저 종료
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

export default CrawlerEngine
