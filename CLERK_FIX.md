# Clerk 인증 오류 해결 방법

## 문제 상황

- Clerk API 401 Unauthorized 오류 반복 발생
- "keyless mode"로 실행 중 (서버 로그)
- 프로젝트 생성 시 "인증이 필요합니다" 오류

## 즉시 해결 방법 (1분 소요)

### 1. 브라우저 쿠키 삭제

1. 브라우저 개발자 도구 열기 (F12 또는 Cmd+Option+I)
2. **Application** 탭 클릭
3. 좌측 **Cookies** → `http://localhost:3010` 선택
4. 모든 `__clerk_*` 쿠키 삭제 (우클릭 → Delete)
5. 페이지 새로고침 (Cmd+R 또는 F5)

### 2. 재로그인

1. 로그아웃 (우측 상단 사용자 메뉴)
2. 다시 로그인
3. 프로젝트 생성 시도

## 근본 해결 방법 (5분 소요)

### Clerk API 키 설정

현재 `.env.local` 파일을 확인하고 Clerk 키를 제대로 설정해야 합니다.

필요한 환경 변수:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

키가 없다면:

1. https://dashboard.clerk.com 접속
2. 프로젝트 선택
3. **API Keys** 메뉴에서 복사
4. `.env.local` 파일에 추가
5. 서버 재시작

또는 로그에 나온 URL로 키 등록:
https://dashboard.clerk.com/apps/claim?token=8t4da2ja2s0vd50nu2i31d8w3dnmj7m4fs1hbckb

## 참고

- 서버 로그에서 "keyless mode" 메시지가 보이면 API 키가 설정되지 않은 것입니다
- 개발 중에는 keyless mode로도 작동하지만 세션이 불안정합니다
