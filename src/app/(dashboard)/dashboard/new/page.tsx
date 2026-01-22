'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
  role: 'bot' | 'user'
  content: string
}

interface Field {
  name: string
  selector: string
  sampleValue?: string
  confidence?: number
}

type Step = 'project_name' | 'target_url' | 'field_name' | 'schedule'

// localStorage 키
const STORAGE_KEY = 'project-wizard-state'

// 초기 상태
const initialMessages: Message[] = [
  {
    role: 'bot',
    content:
      '안녕하세요! 새로운 크롤링 프로젝트를 만들어볼까요? 먼저 프로젝트 이름을 알려주세요.',
  },
]

const initialProjectData = {
  name: '',
  urls: [] as string[],
  fields: [] as Field[],
  scheduleType: 'manual' as
    | 'manual'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly',
  scheduleCron: undefined as string | undefined,
}

export default function NewProjectPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [step, setStep] = useState<Step>('project_name')
  const [loading, setLoading] = useState(false)
  const [isRestoringState, setIsRestoringState] = useState(true)

  const [projectData, setProjectData] = useState(initialProjectData)

  // 컴포넌트 마운트 시 localStorage에서 상태 복원
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY)
      if (savedState) {
        const parsed = JSON.parse(savedState)

        // 저장된 상태가 유효한지 확인
        if (parsed.messages && Array.isArray(parsed.messages)) {
          setMessages(parsed.messages)
        }
        if (parsed.step) {
          setStep(parsed.step)
        }
        if (parsed.projectData) {
          setProjectData(parsed.projectData)
        }

        console.log('✅ 이전 대화 내용을 복원했습니다.')
      }
    } catch (error) {
      console.error('❌ localStorage에서 상태 복원 실패:', error)
      // 오류 발생 시 초기 상태 유지
    } finally {
      setIsRestoringState(false)
    }
  }, [])

  // 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    // 초기 복원 중에는 저장하지 않음
    if (isRestoringState) return

    try {
      const stateToSave = {
        messages,
        step,
        projectData,
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
    } catch (error) {
      console.error('❌ localStorage 저장 실패:', error)
      // QuotaExceededError 등의 오류 처리
      if (
        error instanceof DOMException &&
        error.name === 'QuotaExceededError'
      ) {
        console.warn('⚠️ localStorage 용량 초과. 이전 데이터를 삭제합니다.')
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [messages, step, projectData, isRestoringState])

  // 메시지 처리 완료 후 자동으로 입력창에 포커스
  useEffect(() => {
    if (!loading && inputRef.current) {
      // 짧은 딜레이 후 포커스 (UI 업데이트 후)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [loading, messages])

  const addMessage = (role: 'bot' | 'user', content: string) => {
    setMessages((prev) => [...prev, { role, content }])
  }

  // 대화 초기화 (처음부터 다시 시작)
  const resetConversation = () => {
    if (
      confirm(
        '대화 내용을 초기화하고 처음부터 다시 시작하시겠습니까?\n\n진행 중인 내용이 모두 삭제됩니다.'
      )
    ) {
      setMessages(initialMessages)
      setStep('project_name')
      setProjectData(initialProjectData)
      setInput('')
      try {
        localStorage.removeItem(STORAGE_KEY)
        console.log('✅ 대화 내용을 초기화했습니다.')
      } catch (error) {
        console.error('❌ localStorage 정리 실패:', error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userInput = input.trim()
    addMessage('user', userInput)
    setInput('')
    setLoading(true)

    try {
      await processInput(userInput)
    } catch (error) {
      addMessage('bot', '오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const processInput = async (userInput: string) => {
    switch (step) {
      case 'project_name':
        setProjectData((prev) => ({ ...prev, name: userInput }))
        addMessage(
          'bot',
          `프로젝트 이름을 "${userInput}"로 설정했습니다. 이제 데이터를 수집할 대상 URL을 알려주세요.`
        )
        setStep('target_url')
        break

      case 'target_url':
        // URL 검증
        try {
          const url = new URL(userInput)

          // HTTP/HTTPS 프로토콜만 허용
          if (!['http:', 'https:'].includes(url.protocol)) {
            addMessage(
              'bot',
              '❌ URL은 http:// 또는 https://로 시작해야 합니다.\n\n예시:\n- https://example.com\n- https://www.naver.com\n\n다시 입력해주세요.'
            )
            return
          }

          // 도메인이 있는지 확인
          if (!url.hostname || url.hostname === 'localhost') {
            addMessage(
              'bot',
              '❌ 유효한 도메인이 필요합니다. localhost는 사용할 수 없습니다.\n\n예시:\n- https://example.com\n- https://www.naver.com/news\n\n다시 입력해주세요.'
            )
            return
          }

          setProjectData((prev) => ({ ...prev, urls: [userInput] }))
          addMessage(
            'bot',
            `✅ 대상 URL을 "${userInput}"로 설정했습니다.\n\n이제 수집할 데이터 필드를 추가해볼까요?\n첫 번째 필드의 이름을 알려주세요.\n\n예시: 제목, 가격, 설명, 작성자 등`
          )
          setStep('field_name')
        } catch (error) {
          addMessage(
            'bot',
            '❌ 올바른 URL 형식이 아닙니다.\n\nURL은 다음 형식이어야 합니다:\n- https://example.com\n- https://www.naver.com/news\n- http://example.com/page\n\n올바른 URL을 다시 입력해주세요.'
          )
        }
        break

      case 'field_name':
        if (userInput.toLowerCase() === '완료' || userInput === '끝') {
          if (projectData.fields.length === 0) {
            addMessage(
              'bot',
              '최소 1개 이상의 필드를 추가해야 합니다. 필드 이름을 알려주세요.'
            )
            return
          }
          addMessage(
            'bot',
            '필드 추가가 완료되었습니다. 이제 스케줄을 설정하겠습니다. 크롤링 주기를 선택해주세요:\n\n1. 매일 오전 9시\n2. 매주 월요일 오전 9시\n3. 매월 1일 오전 9시\n4. 직접 입력 (Cron 표현식)\n\n번호를 입력하거나 Cron 표현식을 직접 입력해주세요.'
          )
          setStep('schedule')
        } else {
          // AI로 selector 추천받기
          // 일단 수동으로 필드 추가 (AI 추천은 나중에)
          const newField: Field = {
            name: userInput,
            selector: '',
          }

          setProjectData((prev) => ({
            ...prev,
            fields: [...prev.fields, newField],
          }))

          addMessage(
            'bot',
            `"${userInput}" 필드를 추가했습니다.\n\n💡 CSS Selector는 프로젝트 생성 후 상세 페이지에서 AI 도움을 받아 쉽게 설정할 수 있습니다.\n\n다음 필드를 추가하시겠어요? 필드 이름을 입력하거나 "완료"를 입력하세요.`
          )
        }
        break

      case 'schedule':
        let scheduleType: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly' =
          'manual'
        let scheduleCron: string | undefined

        switch (userInput) {
          case '1':
            scheduleType = 'daily'
            scheduleCron = '0 9 * * *'
            addMessage('bot', '매일 오전 9시로 설정되었습니다.')
            break
          case '2':
            scheduleType = 'weekly'
            scheduleCron = '0 9 * * 1'
            addMessage('bot', '매주 월요일 오전 9시로 설정되었습니다.')
            break
          case '3':
            scheduleType = 'monthly'
            scheduleCron = '0 9 1 * *'
            addMessage('bot', '매월 1일 오전 9시로 설정되었습니다.')
            break
          default:
            scheduleCron = userInput
            addMessage('bot', `스케줄을 "${userInput}"로 설정했습니다.`)
        }

        setProjectData((prev) => ({ ...prev, scheduleType, scheduleCron }))
        addMessage('bot', '프로젝트를 생성하겠습니다!')
        await createProject()
        break
    }
  }

  const createProject = async () => {
    try {
      const selectors: Record<string, string> = {}
      projectData.fields.forEach((field) => {
        selectors[field.name] = field.selector || ''
      })

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectData.name,
          urls: projectData.urls,
          selectors,
          scheduleType: projectData.scheduleType,
          scheduleCron: projectData.scheduleCron,
        }),
      })

      if (!response.ok) {
        const error = await response.json()

        // 인증 오류인 경우 로그인 페이지로 리다이렉트
        if (response.status === 401) {
          addMessage(
            'bot',
            '❌ 세션이 만료되었습니다.\n\n로그인 페이지로 이동합니다...'
          )

          // localStorage 정리
          try {
            localStorage.removeItem(STORAGE_KEY)
          } catch (e) {
            console.error('localStorage 정리 실패:', e)
          }

          setTimeout(() => {
            router.push('/sign-in')
          }, 2000)
          return
        }

        throw new Error(error.error || '프로젝트 생성 실패')
      }

      const { project } = await response.json()

      addMessage(
        'bot',
        '✅ 프로젝트가 성공적으로 생성되었습니다!\n\n프로젝트 상세 페이지에서 CSS Selector를 설정하고 샘플 크롤링을 실행할 수 있습니다.\n\n잠시 후 프로젝트 페이지로 이동합니다...'
      )

      // 프로젝트 생성 성공 시 localStorage 정리
      try {
        localStorage.removeItem(STORAGE_KEY)
        console.log('✅ 프로젝트 생성 완료 - 대화 기록을 정리했습니다.')
      } catch (error) {
        console.error('❌ localStorage 정리 실패:', error)
      }

      setTimeout(() => {
        router.push(`/dashboard/projects/${project.id}`)
      }, 2000)
    } catch (error: any) {
      addMessage(
        'bot',
        `프로젝트 생성에 실패했습니다: ${error.message}\n\n다시 시도해주세요.`
      )
      console.error(error)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <Card className="h-[calc(100vh-120px)] flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>AI 프로젝트 생성 마법사</CardTitle>
              <CardDescription>
                챗봇과 대화하면서 크롤링 프로젝트를 만들어보세요
              </CardDescription>
            </div>
            {messages.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetConversation}
                className="shrink-0"
              >
                🔄 처음부터 다시 시작
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-6">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="mb-1">
                      <Badge
                        variant={
                          message.role === 'user' ? 'secondary' : 'outline'
                        }
                      >
                        {message.role === 'user' ? '사용자' : '챗봇'}
                      </Badge>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg bg-muted p-4">
                    <Badge variant="outline">챗봇</Badge>
                    <p className="mt-2 text-sm">입력을 처리하고 있습니다...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
              disabled={loading}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              전송
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
