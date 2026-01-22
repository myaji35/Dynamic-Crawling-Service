import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * API 트래픽 체크 및 기록
 * @param projectId 프로젝트 ID
 * @param dailyLimit 일일 제한 (기본값 10000)
 * @param limitPercentage 제한 퍼센트 (기본값 80%)
 * @returns { allowed: boolean, usage: { callCount, dailyLimit, percentage } }
 */
export async function checkAndRecordApiUsage(
  projectId: string,
  dailyLimit: number = 10000,
  limitPercentage: number = 80.0
): Promise<{
  allowed: boolean
  usage: {
    callCount: number
    dailyLimit: number
    percentage: number
    remaining: number
  }
  warning?: string
}> {
  // 오늘 날짜 (UTC 기준)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // 오늘의 사용 로그 조회 또는 생성
  let usageLog = await prisma.apiUsageLog.findUnique({
    where: {
      projectId_date: {
        projectId,
        date: today,
      },
    },
  })

  if (!usageLog) {
    // 오늘 첫 호출이면 새로 생성
    usageLog = await prisma.apiUsageLog.create({
      data: {
        projectId,
        date: today,
        callCount: 0,
        dailyLimit,
        limitPercentage,
      },
    })
  }

  // 현재 사용량 계산
  const currentCallCount = usageLog.callCount
  const maxAllowed = Math.floor(dailyLimit * (limitPercentage / 100))
  const percentage = (currentCallCount / dailyLimit) * 100
  const remaining = maxAllowed - currentCallCount

  console.log('[checkAndRecordApiUsage]', {
    projectId,
    currentCallCount,
    maxAllowed,
    percentage: percentage.toFixed(2) + '%',
    remaining,
  })

  // 80% 제한 체크
  if (currentCallCount >= maxAllowed) {
    return {
      allowed: false,
      usage: {
        callCount: currentCallCount,
        dailyLimit,
        percentage,
        remaining: 0,
      },
      warning: `일일 트래픽 제한에 도달했습니다. (${percentage.toFixed(1)}% / ${limitPercentage}% 제한)`,
    }
  }

  // 호출 카운트 증가
  await prisma.apiUsageLog.update({
    where: {
      id: usageLog.id,
    },
    data: {
      callCount: {
        increment: 1,
      },
    },
  })

  // 경고 메시지 (70% 이상 사용 시)
  let warning: string | undefined
  const newPercentage = ((currentCallCount + 1) / dailyLimit) * 100
  if (newPercentage >= 70 && newPercentage < limitPercentage) {
    warning = `일일 트래픽의 ${newPercentage.toFixed(1)}%를 사용했습니다. (${remaining - 1}회 남음)`
  }

  return {
    allowed: true,
    usage: {
      callCount: currentCallCount + 1,
      dailyLimit,
      percentage: newPercentage,
      remaining: remaining - 1,
    },
    warning,
  }
}

/**
 * 오늘의 API 사용 통계 조회
 */
export async function getTodayApiUsage(projectId: string) {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const usageLog = await prisma.apiUsageLog.findUnique({
    where: {
      projectId_date: {
        projectId,
        date: today,
      },
    },
  })

  if (!usageLog) {
    return {
      callCount: 0,
      dailyLimit: 10000,
      percentage: 0,
      remaining: 10000,
    }
  }

  const maxAllowed = Math.floor(
    usageLog.dailyLimit * (usageLog.limitPercentage / 100)
  )
  const percentage = (usageLog.callCount / usageLog.dailyLimit) * 100

  return {
    callCount: usageLog.callCount,
    dailyLimit: usageLog.dailyLimit,
    limitPercentage: usageLog.limitPercentage,
    percentage,
    remaining: maxAllowed - usageLog.callCount,
  }
}
