'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ActivityData {
  date: string
  success: number
  failed: number
  running: number
}

interface ActivityChartProps {
  data: ActivityData[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const maxValue = Math.max(
    ...data.map((d) => d.success + d.failed + d.running),
    1
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 7일 활동</CardTitle>
        <CardDescription>크롤링 실행 기록</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const total = item.success + item.failed + item.running
            const successPercent =
              total > 0 ? (item.success / maxValue) * 100 : 0
            const failedPercent = total > 0 ? (item.failed / maxValue) * 100 : 0
            const runningPercent =
              total > 0 ? (item.running / maxValue) * 100 : 0

            return (
              <div key={index} className="flex items-center gap-3">
                <div className="w-16 text-xs text-muted-foreground">
                  {formatDate(item.date)}
                </div>
                <div className="flex-1 h-8 bg-secondary rounded-md overflow-hidden flex">
                  {item.success > 0 && (
                    <div
                      className="bg-green-500 hover:bg-green-600 transition-colors"
                      style={{ width: `${successPercent}%` }}
                      title={`성공: ${item.success}개`}
                    />
                  )}
                  {item.failed > 0 && (
                    <div
                      className="bg-red-500 hover:bg-red-600 transition-colors"
                      style={{ width: `${failedPercent}%` }}
                      title={`실패: ${item.failed}개`}
                    />
                  )}
                  {item.running > 0 && (
                    <div
                      className="bg-blue-500 hover:bg-blue-600 transition-colors"
                      style={{ width: `${runningPercent}%` }}
                      title={`실행 중: ${item.running}개`}
                    />
                  )}
                </div>
                <div className="w-12 text-xs text-muted-foreground text-right">
                  {total}개
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-6 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-muted-foreground">성공</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-muted-foreground">실패</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-muted-foreground">실행 중</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
