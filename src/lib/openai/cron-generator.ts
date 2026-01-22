import { openai } from './client'

export interface CronResult {
  cron: string
  description: string
  nextRun: string
  scheduleType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual'
}

/**
 * Generate Cron expression from natural language using OpenAI GPT-4
 */
export async function generateCronExpression(
  naturalLanguage: string
): Promise<CronResult> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `당신은 Cron 표현식 전문가입니다. 자연어 스케줄을 Cron 표현식으로 변환해주세요.`,
      },
      {
        role: 'user',
        content: `다음 자연어 스케줄을 Cron 표현식으로 변환해주세요: "${naturalLanguage}"

다음 JSON 형식으로 반환해주세요:
{
  "cron": "Cron 표현식 (예: 0 3 * * *)",
  "description": "한국어 설명 (예: 매일 오전 3시)",
  "scheduleType": "hourly, daily, weekly, monthly 중 하나"
}

예시:
- "매일 오전 3시" → { "cron": "0 3 * * *", "description": "매일 오전 3시", "scheduleType": "daily" }
- "매주 월요일 오전 9시" → { "cron": "0 9 * * 1", "description": "매주 월요일 오전 9시", "scheduleType": "weekly" }
- "매달 1일 새벽 2시" → { "cron": "0 2 1 * *", "description": "매달 1일 새벽 2시", "scheduleType": "monthly" }
- "매시간" → { "cron": "0 * * * *", "description": "매시간 정각", "scheduleType": "hourly" }`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 300,
    temperature: 0.2,
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}')

  // Calculate next run time
  const now = new Date()
  const nextRun = calculateNextRun(result.cron, now)

  return {
    ...result,
    nextRun: nextRun.toISOString(),
  }
}

/**
 * Simple next run calculator (can be replaced with a proper cron library)
 */
function calculateNextRun(cronExpression: string, from: Date): Date {
  // This is a simplified implementation
  // In production, use a library like 'cron-parser'
  const parts = cronExpression.split(' ')
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts.map((p) =>
    p === '*' ? null : parseInt(p)
  )

  const next = new Date(from)

  // Simple logic for common patterns
  if (minute !== null) next.setMinutes(minute)
  if (hour !== null) next.setHours(hour)

  // If time has passed today, move to tomorrow
  if (next <= from) {
    next.setDate(next.getDate() + 1)
  }

  return next
}
