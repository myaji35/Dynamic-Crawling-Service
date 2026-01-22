/**
 * FlexCrawler PoC - Test Script
 *
 * 크롤링 엔진의 핵심 기능을 테스트
 */

import { Crawler } from './crawler.js'
import chalk from 'chalk'

async function runTests() {
  console.log(chalk.bold.cyan('\n🧪 FlexCrawler PoC - Test Suite\n'))

  let passedTests = 0
  let failedTests = 0

  /**
   * Test 1: Basic Web Crawling
   */
  console.log(chalk.bold('\n📝 Test 1: Basic Web Crawling'))
  console.log(chalk.gray('─'.repeat(60)))

  try {
    const crawler = new Crawler({ headless: true })

    const job = {
      url: 'https://example.com',
      fields: {
        title: {
          selector: 'h1',
          transform: 'trim',
        },
        description: {
          selector: 'p',
          transform: 'remove_whitespace',
        },
      },
    }

    const result = await crawler.crawl(job)

    console.log(chalk.green('✅ Data extracted successfully'))
    console.log(
      chalk.gray(`   Title: ${result.data.title?.substring(0, 50)}...`)
    )
    console.log(chalk.gray(`   Fields: ${Object.keys(result.data).length}`))

    await crawler.close()
    passedTests++
  } catch (error) {
    console.log(chalk.red('❌ Test failed:'), error.message)
    failedTests++
  }

  /**
   * Test 2: Multiple Elements Extraction
   */
  console.log(chalk.bold('\n📝 Test 2: Multiple Elements Extraction'))
  console.log(chalk.gray('─'.repeat(60)))

  try {
    const crawler = new Crawler({ headless: true })

    const job = {
      url: 'https://example.com',
      fields: {
        all_links: {
          selector: 'a',
          attribute: 'href',
          multiple: true,
        },
      },
    }

    const result = await crawler.crawl(job)

    if (
      Array.isArray(result.data.all_links) &&
      result.data.all_links.length > 0
    ) {
      console.log(chalk.green('✅ Multiple elements extracted successfully'))
      console.log(chalk.gray(`   Links found: ${result.data.all_links.length}`))
      passedTests++
    } else {
      throw new Error('No links found')
    }

    await crawler.close()
  } catch (error) {
    console.log(chalk.red('❌ Test failed:'), error.message)
    failedTests++
  }

  /**
   * Test 3: Data Transformation
   */
  console.log(chalk.bold('\n📝 Test 3: Data Transformation'))
  console.log(chalk.gray('─'.repeat(60)))

  try {
    const crawler = new Crawler()

    // Test price extraction
    const priceText = '$1,234.56'
    const transformed = crawler.applyTransform(priceText, 'extract_price')

    if (
      transformed &&
      transformed.value === 1234.56 &&
      transformed.currency === '$'
    ) {
      console.log(chalk.green('✅ Price transformation works'))
      console.log(chalk.gray(`   Input: ${priceText}`))
      console.log(chalk.gray(`   Output: ${JSON.stringify(transformed)}`))
      passedTests++
    } else {
      throw new Error('Price transformation failed')
    }

    await crawler.close()
  } catch (error) {
    console.log(chalk.red('❌ Test failed:'), error.message)
    failedTests++
  }

  /**
   * Test 4: Real Ecommerce Site (books.toscrape.com)
   */
  console.log(chalk.bold('\n📝 Test 4: Real Ecommerce Site Crawling'))
  console.log(chalk.gray('─'.repeat(60)))

  try {
    const crawler = new Crawler({ headless: true })

    const job = {
      url: 'https://books.toscrape.com',
      fields: {
        book_titles: {
          selector: 'article.product_pod h3 a',
          attribute: 'title',
          multiple: true,
        },
        prices: {
          selector: 'article.product_pod .price_color',
          multiple: true,
          transform: 'extract_number',
        },
      },
    }

    const result = await crawler.crawl(job)

    if (result.data.book_titles && result.data.book_titles.length > 0) {
      console.log(chalk.green('✅ Ecommerce site crawled successfully'))
      console.log(
        chalk.gray(`   Books found: ${result.data.book_titles.length}`)
      )
      console.log(chalk.gray(`   First book: ${result.data.book_titles[0]}`))
      console.log(chalk.gray(`   First price: £${result.data.prices[0]}`))
      passedTests++
    } else {
      throw new Error('No books found')
    }

    await crawler.close()
  } catch (error) {
    console.log(chalk.red('❌ Test failed:'), error.message)
    failedTests++
  }

  /**
   * Test 5: Error Handling
   */
  console.log(chalk.bold('\n📝 Test 5: Error Handling'))
  console.log(chalk.gray('─'.repeat(60)))

  try {
    const crawler = new Crawler({ headless: true })

    const job = {
      url: 'https://example.com',
      fields: {
        non_existent: {
          selector: '.this-does-not-exist-12345',
        },
      },
    }

    const result = await crawler.crawl(job)

    // Should handle error gracefully
    if (result.data.non_existent === null) {
      console.log(chalk.green('✅ Error handled gracefully'))
      console.log(chalk.gray('   Non-existent element returned null'))
      passedTests++
    } else {
      throw new Error('Error not handled correctly')
    }

    await crawler.close()
  } catch (error) {
    console.log(chalk.red('❌ Test failed:'), error.message)
    failedTests++
  }

  /**
   * Test Summary
   */
  console.log(chalk.bold.cyan('\n📊 Test Summary'))
  console.log(chalk.gray('═'.repeat(60)))
  console.log(chalk.green(`  ✅ Passed: ${passedTests}`))
  console.log(chalk.red(`  ❌ Failed: ${failedTests}`))
  console.log(chalk.gray(`  Total: ${passedTests + failedTests}`))
  console.log(chalk.gray('═'.repeat(60)))

  const successRate = (
    (passedTests / (passedTests + failedTests)) *
    100
  ).toFixed(1)
  console.log(chalk.cyan(`\n  Success Rate: ${successRate}%\n`))

  if (failedTests === 0) {
    console.log(chalk.bold.green('🎉 All tests passed!\n'))
  } else {
    console.log(chalk.bold.yellow('⚠️  Some tests failed. Please review.\n'))
  }
}

// Run tests
runTests().catch((error) => {
  console.error(chalk.red('\n💥 Fatal error:'), error)
  process.exit(1)
})
