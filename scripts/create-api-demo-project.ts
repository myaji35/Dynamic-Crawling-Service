import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const userId = process.argv[2] || 'user_35gIq1IqcouqsbZ4nWC60rrVysS'

  console.log(`✅ 사용자 ID: ${userId}`)

  // 공공데이터포털 장기요양시설 API 설정
  const apiConfig = {
    endpoint: 'https://apis.data.go.kr/B550928/getLtcInsttDetailInfoService02',
    authType: 'query-param',
    apiKey:
      'Fp/4WVioB7biOpSNIyVppjLfZCOlNtFTrFzVOm138SVfBs7tf9I3DXabirorOXfhXvTUWKcxPc59xKmtxiuq1Q==',
    method: 'GET',
    params: {
      numOfRows: '10',
      pageNo: '1',
    },
    responseFormat: 'xml',
    dataPath: 'response.body.items.item',
  }

  const apiProject = await prisma.project.upsert({
    where: { id: 'api-demo-project-id' },
    update: {
      name: '공공데이터포털 API 데모',
      description: '장기요양시설 정보 API 연동 데모',
      dataSourceType: 'api',
      apiConfig: apiConfig,
    },
    create: {
      id: 'api-demo-project-id',
      userId: userId,
      name: '공공데이터포털 API 데모',
      description: '장기요양시설 정보 API 연동 데모',
      dataSourceType: 'api',
      urls: [],
      selectors: {},
      apiConfig: apiConfig,
      scheduleType: 'manual',
      status: 'active',
    },
  })

  console.log('✅ API 데모 프로젝트 생성 완료:', apiProject)

  // API 테스트
  console.log('\n🔍 API 테스트 중...')
  const testUrl = new URL(apiConfig.endpoint)
  testUrl.searchParams.set('serviceKey', apiConfig.apiKey)
  testUrl.searchParams.set('numOfRows', '10')
  testUrl.searchParams.set('pageNo', '1')

  try {
    console.log('📡 요청 URL:', testUrl.toString())
    const response = await fetch(testUrl.toString())
    console.log('📊 응답 상태:', response.status, response.statusText)
    console.log('📋 Content-Type:', response.headers.get('content-type'))
    const text = await response.text()
    console.log('✅ API 응답 전체:\n', text)
  } catch (error) {
    console.error('❌ API 테스트 실패:', error)
  }
}

main()
  .catch((error) => {
    console.error('❌ 에러:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
