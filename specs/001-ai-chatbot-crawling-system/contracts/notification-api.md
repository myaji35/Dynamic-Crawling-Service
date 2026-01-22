# API 계약: 알림 (Notification)

**버전**: 1.0.0
**작성일**: 2025-01-18
**기술 스택**: Google Chat Webhooks, Next.js API Routes

---

## 개요

크롤링 완료 및 실패 시 Google Chat을 통해 사용자에게 알림을 전송합니다.

---

## 1. Google Chat 웹훅 설정

### `POST /api/notifications/google-chat/configure`

**설명**: 프로젝트에 Google Chat 웹훅 URL을 설정합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Request Body**:

```json
{
  "projectId": "clx1a2b3c",
  "webhookUrl": "https://chat.googleapis.com/v1/spaces/AAAABBBBCCCC/messages?key=xyz123&token=abc456"
}
```

**Request Validation**:

- `webhookUrl`: `https://chat.googleapis.com/` 도메인만 허용
- 최대 길이: 500자

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "Google Chat 웹훅이 설정되었습니다.",
  "testSent": true
}
```

**Error Responses**:

- **400 Bad Request** - 잘못된 웹훅 URL:

  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_WEBHOOK_URL",
      "message": "올바른 Google Chat 웹훅 URL이 아닙니다.",
      "details": "URL은 https://chat.googleapis.com/으로 시작해야 합니다."
    }
  }
  ```

- **503 Service Unavailable** - 웹훅 테스트 실패:
  ```json
  {
    "success": false,
    "error": {
      "code": "WEBHOOK_TEST_FAILED",
      "message": "웹훅 URL에 테스트 메시지를 전송할 수 없습니다. URL을 확인해주세요.",
      "details": "HTTP 404 Not Found"
    }
  }
  ```

**구현 참고사항**:

- 설정 시 테스트 메시지 자동 전송:
  ```
  ✅ DCS 알림 테스트
  프로젝트: 전국 지자체 데이터 수집
  이 메시지는 웹훅 설정 테스트입니다.
  ```
- PostgreSQL Project 테이블의 `notifyGoogleChat` 필드 업데이트
- 웹훅 URL은 암호화 저장 (AES-256)

---

## 2. Google Chat 웹훅 제거

### `DELETE /api/notifications/google-chat/configure`

**설명**: 프로젝트의 Google Chat 웹훅 설정을 제거합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Request Body**:

```json
{
  "projectId": "clx1a2b3c"
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "Google Chat 웹훅이 제거되었습니다."
}
```

---

## 3. 크롤링 완료 알림 (내부 API)

### `POST /api/notifications/send` (Internal Only)

**설명**: Cloud Run 워커가 크롤링 완료 시 호출하는 내부 API입니다.

**Headers**:

```
Authorization: Bearer {serviceAccountToken} // GCP 서비스 계정 토큰
```

**Request Body**:

```json
{
  "projectId": "clx1a2b3c",
  "runId": "clx5d6e7f",
  "status": "completed", // "completed" | "failed"
  "totalTasks": 256,
  "successTasks": 251,
  "failedTasks": 5,
  "duration": 323 // 초
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "알림이 전송되었습니다.",
  "notificationsSent": 1
}
```

**Error Responses**:

- **404 Not Found**: 프로젝트에 웹훅 설정 없음

  ```json
  {
    "success": false,
    "error": {
      "code": "NO_WEBHOOK_CONFIGURED",
      "message": "이 프로젝트에 설정된 웹훅이 없습니다."
    }
  }
  ```

- **503 Service Unavailable**: 웹훅 전송 실패
  ```json
  {
    "success": false,
    "error": {
      "code": "WEBHOOK_SEND_FAILED",
      "message": "웹훅 전송에 실패했습니다.",
      "details": "HTTP 500 Internal Server Error"
    }
  }
  ```

**구현 참고사항**:

- Project 테이블에서 `notifyGoogleChat` 조회
- 값이 null이면 알림 전송하지 않음 (에러 아님)
- 웹훅 전송 실패 시 로그 기록하지만 크롤링 작업은 성공으로 처리

---

## 4. Google Chat 메시지 형식

### 크롤링 완료 메시지

```json
{
  "text": "✅ 크롤링 완료",
  "cards": [
    {
      "header": {
        "title": "전국 지자체 데이터 수집",
        "subtitle": "크롤링이 성공적으로 완료되었습니다."
      },
      "sections": [
        {
          "widgets": [
            {
              "keyValue": {
                "topLabel": "실행 시간",
                "content": "2025-01-18 10:00:00"
              }
            },
            {
              "keyValue": {
                "topLabel": "소요 시간",
                "content": "5분 23초"
              }
            },
            {
              "keyValue": {
                "topLabel": "성공",
                "content": "251 / 256 (98.05%)",
                "contentMultiline": false,
                "icon": "STAR"
              }
            },
            {
              "keyValue": {
                "topLabel": "실패",
                "content": "5 / 256 (1.95%)",
                "contentMultiline": false,
                "icon": "DESCRIPTION"
              }
            }
          ]
        },
        {
          "widgets": [
            {
              "buttons": [
                {
                  "textButton": {
                    "text": "데이터 확인",
                    "onClick": {
                      "openLink": {
                        "url": "https://dcs.example.com/projects/clx1a2b3c"
                      }
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**화면 표시 예시**:

```
✅ 크롤링 완료

전국 지자체 데이터 수집
크롤링이 성공적으로 완료되었습니다.

실행 시간: 2025-01-18 10:00:00
소요 시간: 5분 23초
⭐ 성공: 251 / 256 (98.05%)
📄 실패: 5 / 256 (1.95%)

[데이터 확인]
```

---

### 크롤링 실패 메시지

```json
{
  "text": "❌ 크롤링 실패",
  "cards": [
    {
      "header": {
        "title": "전국 지자체 데이터 수집",
        "subtitle": "크롤링 중 오류가 발생했습니다."
      },
      "sections": [
        {
          "widgets": [
            {
              "keyValue": {
                "topLabel": "실행 시간",
                "content": "2025-01-18 10:00:00"
              }
            },
            {
              "keyValue": {
                "topLabel": "에러 메시지",
                "content": "Pub/Sub 메시지 발행 실패",
                "contentMultiline": true
              }
            }
          ]
        },
        {
          "widgets": [
            {
              "buttons": [
                {
                  "textButton": {
                    "text": "재시도",
                    "onClick": {
                      "openLink": {
                        "url": "https://dcs.example.com/projects/clx1a2b3c/retry"
                      }
                    }
                  }
                },
                {
                  "textButton": {
                    "text": "로그 확인",
                    "onClick": {
                      "openLink": {
                        "url": "https://dcs.example.com/projects/clx1a2b3c/logs"
                      }
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**화면 표시 예시**:

```
❌ 크롤링 실패

전국 지자체 데이터 수집
크롤링 중 오류가 발생했습니다.

실행 시간: 2025-01-18 10:00:00
에러 메시지: Pub/Sub 메시지 발행 실패

[재시도] [로그 확인]
```

---

### 일부 실패 메시지 (부분 성공)

```json
{
  "text": "⚠️ 크롤링 완료 (일부 실패)",
  "cards": [
    {
      "header": {
        "title": "전국 지자체 데이터 수집",
        "subtitle": "크롤링이 완료되었으나 일부 작업이 실패했습니다."
      },
      "sections": [
        {
          "widgets": [
            {
              "keyValue": {
                "topLabel": "실행 시간",
                "content": "2025-01-18 10:00:00"
              }
            },
            {
              "keyValue": {
                "topLabel": "소요 시간",
                "content": "5분 23초"
              }
            },
            {
              "keyValue": {
                "topLabel": "성공",
                "content": "251 / 256 (98.05%)",
                "icon": "STAR"
              }
            },
            {
              "keyValue": {
                "topLabel": "실패",
                "content": "5 / 256 (1.95%)",
                "icon": "DESCRIPTION"
              }
            },
            {
              "textParagraph": {
                "text": "<b>실패 원인:</b><br>- Timeout: 3건<br>- Selector not found: 2건"
              }
            }
          ]
        },
        {
          "widgets": [
            {
              "buttons": [
                {
                  "textButton": {
                    "text": "실패 작업 재시도",
                    "onClick": {
                      "openLink": {
                        "url": "https://dcs.example.com/projects/clx1a2b3c/retry"
                      }
                    }
                  }
                },
                {
                  "textButton": {
                    "text": "데이터 확인",
                    "onClick": {
                      "openLink": {
                        "url": "https://dcs.example.com/projects/clx1a2b3c"
                      }
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 5. 알림 설정 조회

### `GET /api/notifications/settings`

**설명**: 프로젝트의 알림 설정을 조회합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Query Parameters**:

- `projectId` (required): 프로젝트 ID

**Success Response** (200 OK):

```json
{
  "success": true,
  "settings": {
    "projectId": "clx1a2b3c",
    "googleChat": {
      "enabled": true,
      "webhookUrl": "https://chat.googleapis.com/v1/spaces/***MASKED***/messages?key=***&token=***",
      "lastTestedAt": "2025-01-18T09:00:00Z",
      "testStatus": "success"
    }
  }
}
```

**No Webhook Configured**:

```json
{
  "success": true,
  "settings": {
    "projectId": "clx1a2b3c",
    "googleChat": {
      "enabled": false,
      "webhookUrl": null
    }
  }
}
```

**구현 참고사항**:

- 웹훅 URL은 마스킹하여 반환 (보안)
- 전체 URL은 노출하지 않음

---

## 보안 고려사항

### 1. 웹훅 URL 보호

- 데이터베이스에 암호화 저장 (AES-256)
- API 응답 시 마스킹 처리
- 환경 변수로 암호화 키 관리 (`WEBHOOK_ENCRYPTION_KEY`)

### 2. 내부 API 인증

- `/api/notifications/send`는 GCP 서비스 계정만 호출 가능
- Vercel 환경 변수에 서비스 계정 키 저장
- 요청 시 JWT 토큰 검증

### 3. Rate Limiting

- 웹훅 전송: 프로젝트당 100회/시간 (Google Chat API 제한 고려)
- 테스트 메시지: 프로젝트당 5회/시간

### 4. 에러 처리

- 웹훅 전송 실패 시 로그 기록
- 3회 연속 실패 시 웹훅 자동 비활성화 (사용자에게 이메일 알림 - 향후 기능)
- 크롤링 작업 자체는 영향받지 않음 (알림 실패 ≠ 크롤링 실패)

---

## Google Chat 웹훅 설정 가이드

**사용자 매뉴얼** (프론트엔드에 표시):

1. Google Chat 앱 또는 웹에서 알림을 받을 채팅방으로 이동
2. 채팅방 상단의 ⋮ 메뉴 클릭
3. "앱 및 통합" → "웹훅 추가" 선택
4. 웹훅 이름 입력 (예: "DCS 크롤링 알림")
5. 생성된 웹훅 URL 복사
6. DCS 프로젝트 설정 페이지에 URL 붙여넣기
7. "테스트 전송" 버튼 클릭하여 확인

**웹훅 URL 예시**:

```
https://chat.googleapis.com/v1/spaces/AAAABBBBcccc/messages?key=AIzaSy...&token=abc123...
```

---

## 헌법 준수

| 원칙                 | 준수 여부 | 설명                                         |
| -------------------- | --------- | -------------------------------------------- |
| V. 관찰 가능성       | ✅        | Google Chat 알림으로 크롤링 상태 실시간 파악 |
| 보안 (기술 제약사항) | ✅        | 웹훅 URL 암호화 저장, 서비스 계정 인증       |

**최종 검증**: ✅ 모든 헌법 원칙 충족

---

## 향후 확장 가능성

- **이메일 알림**: SendGrid/AWS SES 통합 (명세서 Clarification Q2에서 제외됨)
- **Slack 알림**: Slack Incoming Webhooks 지원
- **Discord 알림**: Discord Webhooks 지원
- **알림 필터링**: 실패 시에만 알림, 성공률 < 90% 시에만 알림 등
- **커스텀 메시지 템플릿**: 사용자가 메시지 형식 커스터마이징
