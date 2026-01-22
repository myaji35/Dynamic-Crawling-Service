'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Home() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (isSignedIn) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <CardTitle className="text-3xl font-bold">
            Dynamic Crawling Service
          </CardTitle>
          <CardDescription className="text-base">
            AI 챗봇으로 누구나 쉽게 웹 데이터를 수집하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">주요 기능</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ AI 챗봇 기반 프로젝트 생성</li>
              <li>✓ 자동 CSS Selector 추천</li>
              <li>✓ 스케줄링 자동 실행</li>
              <li>✓ 프로젝트별 맞춤 데이터 구조</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push('/sign-in')}
            >
              로그인
            </Button>
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => router.push('/sign-up')}
            >
              회원가입
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
