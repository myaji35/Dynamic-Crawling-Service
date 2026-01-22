'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'

export interface PreAction {
  type: 'click' | 'input' | 'wait' | 'scroll'
  selector?: string
  value?: string
  waitAfter?: number
}

interface PreActionsEditorProps {
  actions: PreAction[]
  onChange: (actions: PreAction[]) => void
}

export function PreActionsEditor({ actions, onChange }: PreActionsEditorProps) {
  const [enabled, setEnabled] = useState(actions.length > 0)

  const handleAddAction = () => {
    onChange([...actions, { type: 'click', selector: '', waitAfter: 2000 }])
  }

  const handleRemoveAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index)
    onChange(newActions)
    if (newActions.length === 0) {
      setEnabled(false)
    }
  }

  const handleUpdateAction = (index: number, updates: Partial<PreAction>) => {
    const newActions = [...actions]
    newActions[index] = { ...newActions[index], ...updates }
    onChange(newActions)
  }

  const handleToggle = (checked: boolean) => {
    setEnabled(checked)
    if (!checked) {
      onChange([])
    } else if (actions.length === 0) {
      onChange([{ type: 'click', selector: 'text=목록검색', waitAfter: 2000 }])
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">🎬 사전 액션</h3>
            <p className="text-sm text-gray-500">
              크롤링 전에 실행할 액션을 설정합니다
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleToggle(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">사전 액션 사용</span>
          </label>
        </div>

        {enabled && (
          <div className="space-y-4">
            {actions.map((action, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">액션 {index + 1}</Label>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveAction(index)}
                  >
                    삭제
                  </Button>
                </div>

                <div className="grid gap-3">
                  <div>
                    <Label htmlFor={`action-type-${index}`}>액션 타입</Label>
                    <Select
                      value={action.type}
                      onValueChange={(value) =>
                        handleUpdateAction(index, {
                          type: value as PreAction['type'],
                        })
                      }
                    >
                      <SelectTrigger id={`action-type-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="click">클릭</SelectItem>
                        <SelectItem value="input">입력</SelectItem>
                        <SelectItem value="wait">대기</SelectItem>
                        <SelectItem value="scroll">스크롤</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(action.type === 'click' || action.type === 'input') && (
                    <div>
                      <Label htmlFor={`action-selector-${index}`}>
                        Selector
                      </Label>
                      <Input
                        id={`action-selector-${index}`}
                        value={action.selector || ''}
                        onChange={(e) =>
                          handleUpdateAction(index, {
                            selector: e.target.value,
                          })
                        }
                        placeholder="text=목록검색 또는 .class-name"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        예: text=목록검색, #id, .class, button
                      </p>
                    </div>
                  )}

                  {action.type === 'input' && (
                    <div>
                      <Label htmlFor={`action-value-${index}`}>입력 값</Label>
                      <Input
                        id={`action-value-${index}`}
                        value={action.value || ''}
                        onChange={(e) =>
                          handleUpdateAction(index, { value: e.target.value })
                        }
                        placeholder="입력할 텍스트"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor={`action-wait-${index}`}>
                      {action.type === 'wait'
                        ? '대기 시간'
                        : '액션 후 대기 시간'}{' '}
                      (ms)
                    </Label>
                    <Input
                      id={`action-wait-${index}`}
                      type="number"
                      value={action.waitAfter || 0}
                      onChange={(e) =>
                        handleUpdateAction(index, {
                          waitAfter: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="2000"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddAction}
              className="w-full"
            >
              + 액션 추가
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
