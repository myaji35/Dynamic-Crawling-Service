/**
 * FlexCrawler PoC - Core Crawler Engine
 *
 * 웹 크롤링 핵심 기능을 구현한 엔진
 * - Playwright를 사용한 웹 페이지 로드
 * - CSS/XPath 셀렉터 기반 데이터 추출
 * - 에러 핸들링 및 재시도
 */

import { chromium } from 'playwright'

export class Crawler {
  constructor(config = {}) {
    this.config = {
      headless: config.headless !== false,
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      waitUntil: config.waitUntil || 'networkidle',
      ...config,
    }
    this.browser = null
    this.page = null
  }

  /**
   * 브라우저 초기화
   */
  async initialize() {
    if (!this.browser) {
      console.log('🚀 Launching browser...')
      this.browser = await chromium.launch({
        headless: this.config.headless,
      })
    }
  }

  /**
   * 웹 페이지 크롤링
   * @param {Object} job - 크롤링 작업 설정
   * @returns {Object} - 추출된 데이터
   */
  async crawl(job) {
    await this.initialize()

    const { url, fields, options = {} } = job
    const results = []

    try {
      console.log(`\n📄 Crawling: ${url}`)

      // 새 페이지 생성
      this.page = await this.browser.newPage()

      // 타임아웃 설정
      this.page.setDefaultTimeout(options.timeout || this.config.timeout)

      // 페이지 로드
      const startTime = Date.now()
      await this.page.goto(url, {
        waitUntil: options.waitUntil || this.config.waitUntil,
        timeout: options.timeout || this.config.timeout,
      })
      const loadTime = Date.now() - startTime
      console.log(`✅ Page loaded in ${loadTime}ms`)

      // 데이터 추출
      console.log(`\n🔍 Extracting data...`)
      const data = await this.extractData(fields)

      results.push({
        url,
        data,
        metadata: {
          scrapedAt: new Date().toISOString(),
          loadTime,
          fieldsExtracted: Object.keys(data).length,
        },
      })

      console.log(`✅ Extracted ${Object.keys(data).length} fields`)

      // 페이지 닫기
      await this.page.close()

      return results[0]
    } catch (error) {
      console.error(`❌ Error crawling ${url}:`, error.message)

      if (this.page) {
        await this.page.close()
      }

      throw error
    }
  }

  /**
   * 여러 URL 크롤링 (배치 처리)
   * @param {Array} urls - URL 배열
   * @param {Object} fields - 추출할 필드 정의
   * @returns {Array} - 추출된 데이터 배열
   */
  async crawlMultiple(urls, fields, options = {}) {
    const results = []

    for (const url of urls) {
      try {
        const result = await this.crawl({ url, fields, options })
        results.push(result)
      } catch (error) {
        results.push({
          url,
          error: error.message,
          data: null,
        })
      }
    }

    return results
  }

  /**
   * 데이터 추출
   * @param {Object} fields - 필드 정의 (name: selector)
   * @returns {Object} - 추출된 데이터
   */
  async extractData(fields) {
    const data = {}

    for (const [fieldName, fieldConfig] of Object.entries(fields)) {
      try {
        const value = await this.extractField(fieldConfig)
        data[fieldName] = value
        console.log(`  ✓ ${fieldName}: ${this.truncate(value, 50)}`)
      } catch (error) {
        console.log(`  ✗ ${fieldName}: Failed - ${error.message}`)
        data[fieldName] = null
      }
    }

    return data
  }

  /**
   * 단일 필드 추출
   * @param {Object|String} fieldConfig - 필드 설정
   * @returns {String|Array} - 추출된 값
   */
  async extractField(fieldConfig) {
    // 간단한 형식: "selector" or { selector: "...", ... }
    const config =
      typeof fieldConfig === 'string' ? { selector: fieldConfig } : fieldConfig

    const {
      selector,
      selectorType = 'css',
      attribute = null,
      multiple = false,
      transform = null,
    } = config

    let value

    if (multiple) {
      // 여러 요소 추출
      const elements = await this.page.$$(selector)
      const values = []

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
      const element = await this.page.$(selector)

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
   * @param {String|Array} value - 원본 값
   * @param {String|Function} transform - 변환 함수 또는 이름
   * @returns {*} - 변환된 값
   */
  applyTransform(value, transform) {
    if (typeof transform === 'function') {
      return transform(value)
    }

    // 내장 변환 함수들
    const transforms = {
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

      to_date: (v) => {
        if (typeof v !== 'string') return v
        return new Date(v).toISOString()
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
   * 스크린샷 캡처
   * @param {String} path - 저장 경로
   */
  async screenshot(path) {
    if (this.page) {
      await this.page.screenshot({ path, fullPage: true })
      console.log(`📸 Screenshot saved: ${path}`)
    }
  }

  /**
   * 브라우저 종료
   */
  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      console.log('🔚 Browser closed')
    }
  }

  /**
   * 문자열 자르기 (로그용)
   */
  truncate(str, length) {
    if (!str) return 'null'
    const s = String(str)
    return s.length > length ? s.substring(0, length) + '...' : s
  }
}

export default Crawler
