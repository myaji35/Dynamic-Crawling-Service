/**
 * FlexCrawler PoC - YAML Config Parser
 *
 * YAML 형식의 크롤링 설정을 파싱하고 검증
 */

import yaml from 'js-yaml'
import { readFileSync } from 'fs'

export class ConfigParser {
  /**
   * YAML 파일 로드 및 파싱
   * @param {String} filePath - YAML 파일 경로
   * @returns {Object} - 파싱된 설정
   */
  static loadFromFile(filePath) {
    try {
      const fileContents = readFileSync(filePath, 'utf8')
      const config = yaml.load(fileContents)
      return this.parse(config)
    } catch (error) {
      throw new Error(
        `Failed to load config from ${filePath}: ${error.message}`
      )
    }
  }

  /**
   * YAML 문자열 파싱
   * @param {String} yamlString - YAML 문자열
   * @returns {Object} - 파싱된 설정
   */
  static loadFromString(yamlString) {
    try {
      const config = yaml.load(yamlString)
      return this.parse(config)
    } catch (error) {
      throw new Error(`Failed to parse YAML: ${error.message}`)
    }
  }

  /**
   * 설정 파싱 및 검증
   * @param {Object} config - 원시 설정 객체
   * @returns {Object} - 검증된 설정
   */
  static parse(config) {
    // 버전 확인
    if (!config.version) {
      throw new Error('Config version is required')
    }

    // Job 설정 확인
    if (!config.job) {
      throw new Error('Job configuration is required')
    }

    const job = config.job

    // 이름 확인
    if (!job.name) {
      throw new Error('Job name is required')
    }

    // Pipeline 확인
    if (!job.pipeline || !Array.isArray(job.pipeline)) {
      throw new Error('Job pipeline must be an array')
    }

    // 각 step 검증
    for (const [index, step] of job.pipeline.entries()) {
      this.validateStep(step, index)
    }

    return {
      version: config.version,
      job: {
        name: job.name,
        description: job.description || '',
        pipeline: job.pipeline,
        schedule: job.schedule || null,
        notifications: job.notifications || null,
      },
    }
  }

  /**
   * Pipeline step 검증
   * @param {Object} step - 파이프라인 스텝
   * @param {Number} index - 스텝 인덱스
   */
  static validateStep(step, index) {
    if (!step.step) {
      throw new Error(`Step ${index}: 'step' field is required`)
    }

    const stepType = step.step

    switch (stepType) {
      case 'crawl':
        this.validateCrawlStep(step, index)
        break

      case 'transform':
        this.validateTransformStep(step, index)
        break

      case 'load':
        this.validateLoadStep(step, index)
        break

      default:
        throw new Error(`Step ${index}: Unknown step type '${stepType}'`)
    }
  }

  /**
   * Crawl step 검증
   */
  static validateCrawlStep(step, index) {
    if (!step.source) {
      throw new Error(`Step ${index}: 'source' is required for crawl step`)
    }

    const { type, url, fields } = step.source

    if (!type) {
      throw new Error(`Step ${index}: source 'type' is required`)
    }

    if (type === 'web') {
      if (!url) {
        throw new Error(`Step ${index}: 'url' is required for web source`)
      }

      if (!fields || typeof fields !== 'object') {
        throw new Error(`Step ${index}: 'fields' must be an object`)
      }
    } else if (type === 'api') {
      if (!step.source.endpoint) {
        throw new Error(`Step ${index}: 'endpoint' is required for API source`)
      }
    } else {
      throw new Error(`Step ${index}: Unknown source type '${type}'`)
    }
  }

  /**
   * Transform step 검증
   */
  static validateTransformStep(step, index) {
    if (!step.rules || !Array.isArray(step.rules)) {
      throw new Error(
        `Step ${index}: 'rules' must be an array for transform step`
      )
    }
  }

  /**
   * Load step 검증
   */
  static validateLoadStep(step, index) {
    if (!step.destination) {
      throw new Error(`Step ${index}: 'destination' is required for load step`)
    }

    if (!step.destination.type) {
      throw new Error(`Step ${index}: destination 'type' is required`)
    }
  }

  /**
   * 설정을 크롤링 작업으로 변환
   * @param {Object} config - 파싱된 설정
   * @returns {Object} - 크롤링 작업 객체
   */
  static toJob(config) {
    const pipeline = config.job.pipeline
    const crawlStep = pipeline.find((s) => s.step === 'crawl')

    if (!crawlStep) {
      throw new Error('No crawl step found in pipeline')
    }

    const { source } = crawlStep

    // Web crawling 작업으로 변환
    if (source.type === 'web') {
      return {
        name: config.job.name,
        description: config.job.description,
        url: source.url,
        fields: source.fields,
        options: {
          timeout: source.timeout,
          waitUntil: source.wait_for,
          retries: crawlStep.retry?.max_attempts,
        },
      }
    }

    throw new Error(`Source type '${source.type}' not yet supported in PoC`)
  }
}

export default ConfigParser
