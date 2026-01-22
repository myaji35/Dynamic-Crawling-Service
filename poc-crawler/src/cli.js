#!/usr/bin/env node

/**
 * FlexCrawler PoC - CLI Interface
 *
 * 커맨드라인에서 크롤링 작업 실행
 * Usage: node src/cli.js <config-file>
 */

import { Crawler } from './crawler.js'
import { ConfigParser } from './config-parser.js'
import { writeFileSync } from 'fs'
import chalk from 'chalk'

async function main() {
  console.log(chalk.bold.cyan('\n🚀 FlexCrawler PoC\n'))

  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(chalk.yellow('Usage: npm run crawl <config-file.yaml>'))
    console.log(chalk.yellow('   or: node src/cli.js <config-file.yaml>'))
    console.log('\nExample:')
    console.log(chalk.gray('  npm run crawl examples/basic.yaml'))
    process.exit(1)
  }

  const configPath = args[0]

  try {
    // 1. 설정 로드
    console.log(chalk.blue('📋 Loading configuration...'))
    const config = ConfigParser.loadFromFile(configPath)
    console.log(chalk.green(`✅ Config loaded: ${config.job.name}`))
    console.log(
      chalk.gray(`   Description: ${config.job.description || 'N/A'}`)
    )

    // 2. 크롤링 작업 생성
    const job = ConfigParser.toJob(config)

    // 3. 크롤러 초기화
    console.log(chalk.blue('\n🔧 Initializing crawler...'))
    const crawler = new Crawler(job.options)

    // 4. 크롤링 실행
    console.log(chalk.blue('🌐 Starting crawl...'))
    const startTime = Date.now()

    const result = await crawler.crawl(job)

    const duration = Date.now() - startTime

    // 5. 결과 출력
    console.log(chalk.green(`\n✅ Crawl completed in ${duration}ms\n`))

    console.log(chalk.bold('📊 Results:'))
    console.log(chalk.gray('─'.repeat(60)))

    for (const [key, value] of Object.entries(result.data)) {
      const displayValue =
        typeof value === 'object' ? JSON.stringify(value) : value

      console.log(chalk.white(`  ${key}:`), chalk.cyan(displayValue))
    }

    console.log(chalk.gray('─'.repeat(60)))

    // 6. 결과를 JSON 파일로 저장
    const outputPath = `output-${Date.now()}.json`
    writeFileSync(outputPath, JSON.stringify(result, null, 2))
    console.log(chalk.green(`\n💾 Results saved to: ${outputPath}`))

    // 7. 브라우저 종료
    await crawler.close()

    console.log(chalk.green('\n✨ Done!\n'))
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message)
    console.error(chalk.gray(error.stack))
    process.exit(1)
  }
}

// 프로그램 실행
main()
