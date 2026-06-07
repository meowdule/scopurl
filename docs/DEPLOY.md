# SnapIt SiteScope — 배포

## 로컬

```bash
npm install
npx playwright install chromium
npm run dev
```

## 로컬 분석 (스모크)

```bash
npm run analyze:local -- --report-id=test-smoke --target-url=https://example.com
```

결과: `public/reports/test-smoke/report.json`

## GitHub Pages (`meowdule/scopurl`)

**사이트 URL:** https://meowdule.github.io/scopurl/

1. 코드를 https://github.com/meowdule/scopurl 에 push (`main` 브랜치)
2. Repository **Settings → Pages → Build and deployment**
   - Source: **GitHub Actions** (브랜치 배포 아님)
3. **Settings → Secrets and variables → Actions**
   - Secret **`QUEUE_DISPATCH_TOKEN`** (필수) — Classic PAT, `repo` 권한. Pages 빌드 시 정적 JS에 포함되어 Analyze가 GitHub API로 큐를 등록합니다.
   - Secret `GH_PAT` (권장) — 워크플로가 리포트 파일 커밋할 때 사용
4. Actions 탭에서 **Deploy SiteScope to GitHub Pages** 워크플로 성공 확인

`QUEUE_DISPATCH_TOKEN`이 없으면 Pages 배포가 실패합니다. 사용자에게 GitHub Issue 창을 띄우지 않습니다.

저장소 이름이 `scopurl`이면 CI가 자동으로 `NEXT_PUBLIC_BASE_PATH=/scopurl` 로 빌드합니다.

## 환경 변수 (CI)

| 변수 | 설명 |
|------|------|
| `SITE_SCOPE_DEVICE` | `mobile` \| `desktop` |
| `SITE_SCOPE_MAX_PAGES` | 크롤 상한 (무료 20) |
| `SITE_SCOPE_MAX_DEPTH` | 링크 깊이 |
| `TRACE_MODE` | `failure` \| `all` \| `off` |
| `SITE_SCOPE_FAST` | `1` 시 빠른 모드 |

## 리드 webhook (Phase 8+)

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_LEAD_WEBHOOK` | 이메일 수신 (FormSubmit 등 POST URL) |
| `NEXT_PUBLIC_LEAD_NOTION_WEBHOOK` | (선택) Notion DB 연동용 자동화 webhook |

### 이메일 (기본)

GitHub Actions 기본값: `https://formsubmit.co/ajax/tbell.wr@gmail.com`

- **최초 1회**: FormSubmit이 `tbell.wr@gmail.com` 으로 활성화 메일을 보냅니다. 링크를 눌러야 이후 제출이 수신됩니다.
- 다른 주소로 바꾸려면 repo **Variables** 에 `NEXT_PUBLIC_LEAD_WEBHOOK` 을 설정하세요.

### Notion DB (권장 — GitHub Actions)

정적 사이트에서는 **Notion 토큰을 코드·브라우저에 넣으면 안 됩니다.**  
대신 제출 시 `repository_dispatch` → `.github/workflows/lead-to-notion.yml` 이 Notion API로 DB 행을 만듭니다.

**DB:** [scopurl 리드 DB](https://app.notion.com/p/378c60fde0e48002a4e4d395db0ce125)

| Notion 속성 | 제출 필드 | 값 예시 |
|-------------|-----------|---------|
| 종류 | `mode` | PDF / 문의 / 확장 / 구독 |
| 이름 | `name` (없으면 이메일) | 홍길동 |
| 이메일 | `email` | user@example.com |
| URL | `siteUrl` 또는 리포트 링크 | https://… |
| 회사 | `company` | (선택) |

**연결 절차**

1. [Notion 연동](https://www.notion.so/my-integrations)에서 Internal Integration 생성 → **시크릿 토큰** 복사
2. Notion DB 페이지 우측 상단 `···` → **연결** → 방금 만든 Integration 추가 (필수)
3. GitHub repo `meowdule/scopurl` → **Settings → Secrets and variables → Actions**
   - **Secrets** → `NOTION_TOKEN` = `secret_…` (토큰 값)
   - **Variables** (선택) → `NOTION_DATABASE_ID` = `378c60fde0e48002a4e4d395db0ce125`  
     (기본값이 워크플로에 박혀 있어 생략 가능)
4. `main`에 워크플로·코드 푸시 후, 사이트에서 리드 폼 테스트 제출
5. GitHub **Actions** 탭에서 `Lead to Notion` 워크플로 성공 여부 확인

**수동 테스트:** Actions → `Lead to Notion` → Run workflow

제출 시 **이메일(FormSubmit) + Notion(GitHub Actions)** 이 함께 동작합니다. Notion만 실패해도 이메일은 정상 처리됩니다.

### Notion DB (대안 — Make.com webhook)

`NEXT_PUBLIC_LEAD_NOTION_WEBHOOK` 에 Make/n8n URL을 넣으면 GitHub Actions 없이도 연동할 수 있습니다. 토큰은 Make 쪽에만 둡니다.

## 데이터 보관 (30일)

- 각 `report.json`에 `expiresAt` 기록 (완료 시점 + 30일)
- 로컬 정리: `npm run cleanup:reports` (미리보기: `npm run cleanup:reports -- --dry-run`)
- CI: `.github/workflows/cleanup-reports.yml` — 매일 03:00 UTC cron + 수동 `workflow_dispatch`
- 만료 시 `public/reports/{id}/` 삭제, 연결되지 않은 `public/cards/{cardId}.json` 삭제 (`placeholder.json` 유지)
