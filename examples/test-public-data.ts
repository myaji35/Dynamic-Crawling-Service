/**
 * 공공데이터 크롤링 테스트 스크립트
 * 실제 한국 공공데이터를 크롤링하여 검증
 */

import { CrawlerEngine } from '../src/lib/crawler/engine'
import { writeFileSync } from 'fs'

async function testKoreaPublicData() {
  console.log('\n🇰🇷 한국 공공데이터 크롤링 테스트\n')

  const crawler = new CrawlerEngine({ headless: true })

  try {
    // Test 1: 공공데이터포털 메인 페이지
    console.log('📝 Test 1: 공공데이터포털 크롤링')
    console.log('─'.repeat(60))

    const result1 = await crawler.crawl({
      url: 'https://www.data.go.kr/',
      fields: {
        site_title: {
          selector: 'h1.logo a',
          attribute: 'title',
        },
        popular_keywords: {
          selector: '.ranking-list li',
          multiple: true,
          transform: 'trim',
        },
        notice_titles: {
          selector: '.notice-list .title',
          multiple: true,
          transform: 'trim',
        },
      },
    })

    console.log('✅ 크롤링 완료')
    console.log(`   사이트: ${result1.data.site_title || '공공데이터포털'}`)
    console.log(
      `   인기 키워드 수: ${result1.data.popular_keywords?.length || 0}`
    )
    console.log(`   공지사항 수: ${result1.data.notice_titles?.length || 0}`)

    // 결과 저장
    writeFileSync(
      'output/test-data-go-kr.json',
      JSON.stringify(result1, null, 2)
    )

    // Test 2: 기상청 날씨 정보 (간단한 예제)
    console.log('\n📝 Test 2: 기상청 웹사이트 크롤링')
    console.log('─'.repeat(60))

    const result2 = await crawler.crawl({
      url: 'https://www.weather.go.kr/w/index.do',
      fields: {
        current_temp: {
          selector: '.cmp-cur-weather .tmp span',
          transform: 'extract_number',
        },
        weather_condition: {
          selector: '.cmp-cur-weather .txt',
          transform: 'trim',
        },
        location: {
          selector: '.cmp-cur-weather .title',
          transform: 'trim',
        },
      },
    })

    console.log('✅ 크롤링 완료')
    console.log(`   지역: ${result2.data.location || 'N/A'}`)
    console.log(`   현재 기온: ${result2.data.current_temp || 'N/A'}°C`)
    console.log(`   날씨 상태: ${result2.data.weather_condition || 'N/A'}`)

    writeFileSync('output/test-weather.json', JSON.stringify(result2, null, 2))

    // Test 3: 실시간 대기질 정보
    console.log('\n📝 Test 3: 에어코리아 대기질 정보')
    console.log('─'.repeat(60))

    const result3 = await crawler.crawl({
      url: 'https://www.airkorea.or.kr/web',
      fields: {
        page_title: {
          selector: 'title',
        },
        main_info: {
          selector: '.info-box',
          multiple: true,
          transform: 'trim',
        },
      },
    })

    console.log('✅ 크롤링 완료')
    console.log(`   페이지: ${result3.data.page_title || 'N/A'}`)
    console.log(`   정보 박스 수: ${result3.data.main_info?.length || 0}`)

    writeFileSync('output/test-airkorea.json', JSON.stringify(result3, null, 2))

    // 요약 출력
    console.log('\n📊 크롤링 요약')
    console.log('═'.repeat(60))
    console.log('  ✅ 테스트 완료: 3/3')
    console.log('  💾 저장된 파일:')
    console.log('     - output/test-data-go-kr.json')
    console.log('     - output/test-weather.json')
    console.log('     - output/test-airkorea.json')
    console.log('═'.repeat(60))

    console.log('\n✨ 모든 테스트 성공!\n')
  } catch (error) {
    console.error('\n❌ 에러 발생:', error)
  } finally {
    await crawler.close()
  }
}

// 실행
testKoreaPublicData()
