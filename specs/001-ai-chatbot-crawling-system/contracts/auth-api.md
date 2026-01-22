# API 계약: 인증 (Authentication)

**버전**: 1.0.0
**작성일**: 2025-01-18
**기술 스택**: NextAuth.js v5, Prisma, PostgreSQL

---

## 개요

사용자 회원가입, 로그인, 세션 관리를 위한 API 엔드포인트입니다. NextAuth.js를 통해 구현되며, 이메일/비밀번호 기반 인증을 제공합니다.

---

## 1. 회원가입

### `POST /api/auth/signup`

**설명**: 새로운 사용자 계정을 생성합니다.

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "홍길동" // optional
}
```

**Request Validation**:

- `email`: 유효한 이메일 형식, 최대 255자
- `password`: 최소 8자, 대문자/소문자/숫자 포함
- `name`: 최대 100자 (선택사항)

**Success Response** (201 Created):

```json
{
  "success": true,
  "user": {
    "id": "clx1a2b3c",
    "email": "user@example.com",
    "name": "홍길동",
    "createdAt": "2025-01-18T10:00:00Z"
  }
}
```

**Error Responses**:

- **400 Bad Request** - 입력 검증 실패:

  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "비밀번호는 최소 8자 이상이어야 합니다.",
      "fields": {
        "password": "비밀번호는 최소 8자 이상이어야 합니다."
      }
    }
  }
  ```

- **409 Conflict** - 이미 존재하는 이메일:
  ```json
  {
    "success": false,
    "error": {
      "code": "EMAIL_EXISTS",
      "message": "이미 사용 중인 이메일입니다."
    }
  }
  ```

**구현 참고사항**:

- 비밀번호는 bcrypt로 해싱 (salt rounds: 12)
- User 레코드 생성 후 자동 로그인하지 않음 (명시적 로그인 필요)
- 이메일 중복 체크는 DB unique constraint 활용

---

## 2. 로그인

### `POST /api/auth/signin`

**설명**: 이메일과 비밀번호로 로그인하여 세션을 생성합니다.

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "user": {
    "id": "clx1a2b3c",
    "email": "user@example.com",
    "name": "홍길동"
  },
  "session": {
    "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires": "2025-01-25T10:00:00Z" // 7일 후
  }
}
```

**Error Responses**:

- **401 Unauthorized** - 잘못된 인증 정보:

  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_CREDENTIALS",
      "message": "이메일 또는 비밀번호가 올바르지 않습니다."
    }
  }
  ```

- **429 Too Many Requests** - 로그인 시도 제한 (5회/5분):
  ```json
  {
    "success": false,
    "error": {
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "너무 많은 로그인 시도가 있었습니다. 5분 후 다시 시도해주세요.",
      "retryAfter": 300 // 초
    }
  }
  ```

**구현 참고사항**:

- NextAuth.js Credentials Provider 사용
- Session은 JWT 기반 (서버리스 환경 최적화)
- 세션 만료: 7일 (헌법 요구사항)
- Rate limiting: IP 기반, Redis 캐시 활용 (옵션)

---

## 3. 로그아웃

### `POST /api/auth/signout`

**설명**: 현재 세션을 종료합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

**Error Responses**:

- **401 Unauthorized** - 세션 없음:
  ```json
  {
    "success": false,
    "error": {
      "code": "UNAUTHORIZED",
      "message": "로그인이 필요합니다."
    }
  }
  ```

**구현 참고사항**:

- Session 레코드 삭제 (PostgreSQL)
- NextAuth.js `signOut()` 함수 호출

---

## 4. 세션 확인

### `GET /api/auth/session`

**설명**: 현재 로그인된 사용자 정보를 반환합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "user": {
    "id": "clx1a2b3c",
    "email": "user@example.com",
    "name": "홍길동"
  },
  "sessionExpires": "2025-01-25T10:00:00Z"
}
```

**Error Responses**:

- **401 Unauthorized** - 세션 만료 또는 없음:
  ```json
  {
    "success": false,
    "error": {
      "code": "SESSION_EXPIRED",
      "message": "세션이 만료되었습니다. 다시 로그인해주세요."
    }
  }
  ```

**구현 참고사항**:

- NextAuth.js `getServerSession()` 사용
- 프론트엔드에서 페이지 로드 시 호출하여 인증 상태 확인

---

## 5. 비밀번호 변경

### `POST /api/auth/change-password`

**설명**: 로그인된 사용자의 비밀번호를 변경합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Request Body**:

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "비밀번호가 변경되었습니다."
}
```

**Error Responses**:

- **401 Unauthorized** - 현재 비밀번호 불일치:

  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_PASSWORD",
      "message": "현재 비밀번호가 올바르지 않습니다."
    }
  }
  ```

- **400 Bad Request** - 새 비밀번호 검증 실패:
  ```json
  {
    "success": false,
    "error": {
      "code": "WEAK_PASSWORD",
      "message": "새 비밀번호는 최소 8자 이상, 대문자/소문자/숫자를 포함해야 합니다."
    }
  }
  ```

**구현 참고사항**:

- 현재 비밀번호 검증 후 새 비밀번호로 업데이트
- 변경 후 기존 세션은 유지 (재로그인 불필요)

---

## 보안 고려사항

### 1. 비밀번호 정책

- 최소 8자 이상
- 대문자, 소문자, 숫자 각 1개 이상 포함
- 특수문자 권장 (필수 아님)
- bcrypt salt rounds: 12

### 2. Rate Limiting

- 로그인 시도: 5회/5분 (IP 기반)
- 회원가입: 3회/시간 (IP 기반)
- 비밀번호 변경: 3회/10분 (사용자 기반)

### 3. 세션 보안

- JWT Secret: 환경 변수 (`NEXTAUTH_SECRET`)
- HTTPS 필수 (프로덕션)
- SameSite=Strict 쿠키 설정
- CSRF 토큰 자동 검증 (NextAuth.js 기본)

### 4. 에러 메시지

- 로그인 실패 시 "이메일 또는 비밀번호가 올바르지 않습니다" (어느 쪽이 틀렸는지 노출 금지)
- 비밀번호 검증 실패 시 구체적 가이드 제공 (회원가입/변경 시)

---

## NextAuth.js 설정 예시

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcrypt'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('이메일과 비밀번호를 입력해주세요.')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.passwordHash) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isValid) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7일
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

---

## 헌법 준수

| 원칙                    | 준수 여부 | 설명                                 |
| ----------------------- | --------- | ------------------------------------ |
| 보안 (기술 제약사항)    | ✅        | bcrypt 해싱, JWT 세션, Rate limiting |
| 사용자 경험 (품질 기준) | ✅        | 명확한 에러 메시지, 7일 세션 유지    |

**최종 검증**: ✅ 모든 헌법 원칙 충족
