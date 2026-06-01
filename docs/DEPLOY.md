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

`NEXT_PUBLIC_LEAD_WEBHOOK` — Formspree 등 POST URL

## 데이터 보관 (30일)

- 각 `report.json`에 `expiresAt` 기록 (완료 시점 + 30일)
- 로컬 정리: `npm run cleanup:reports` (미리보기: `npm run cleanup:reports -- --dry-run`)
- CI: `.github/workflows/cleanup-reports.yml` — 매일 03:00 UTC cron + 수동 `workflow_dispatch`
- 만료 시 `public/reports/{id}/` 삭제, 연결되지 않은 `public/cards/{cardId}.json` 삭제 (`placeholder.json` 유지)
