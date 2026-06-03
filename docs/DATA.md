# scopurl 크롤링·분석 데이터 사전

분석 파이프라인이 생성하는 JSON 필드와, UI에서 **추가로 계산**하는 값을 정리합니다.  
UI 섹션을 지시할 때는 **`id` / `data-report-section`** 값을 사용하세요 (`lib/reportSections.ts`).

---

## 1. 리포트 UI 섹션 네이밍

| ID | 한글 이름 | 설명 |
|----|-----------|------|
| `report-header` | 리포트 헤더 | URL, PDF 다운로드, 디바이스 배지 |
| `report-hero-share-card` | 공유 인증 카드 | 1200×630 점수·7축 레이더·최소 메타. **PNG 다운로드 대상** (TOP3·상세 없음) |
| `report-axis-cards` | 영역별 진단 | 7축 점수 + 등급 배지 (4열 그리드) |
| `report-priority-top3` | 우선 개선 TOP3 | 가로 3카드, 클릭 시 상세 펼침 |
| `report-extended-cta` | 확장 분석 CTA | 100페이지·흐름·폼·SEO 상세 |
| `report-analysis-overview` | 분석 개요 | 페이지·이슈·시간·환경 (점수 없음) |
| `report-issues-detail` | 발견 이슈 상세 | 심각도별 이슈 카드 |
| `report-seo-analysis` | SEO 분석 | 체크리스트 형태 |
| `report-analysis-scope` | 분석 범위 | 크롤·기술 메타 (하단) |
| `report-detail-accordion` | (미사용) | 이전 7축 아코디언 |
| `report-pages-table` | 분석 페이지 | 페이지별 URL·상태·성능·접근성 |
| `report-broken-links` | 깨진 링크 | from → to 목록 |
| `report-analysis-process` | 분석 과정 | KPI + (접힘) 타임라인·기술 상세 |

---

## 2. 파일 위치

| 파일 | 경로 | 용도 |
|------|------|------|
| 상태 | `public/reports/{reportId}/status.json` | 분석 진행 중 폴링 |
| 리포트 | `public/reports/{reportId}/report.json` | 완료 후 전체 결과 |
| HTML | `public/reports/{reportId}/index.html` | 정적 HTML 리포트 |
| 점수 카드 | `public/cards/{cardId}.json` | 공유용 경량 JSON (URL 없음) |
| 스크린샷 | `public/reports/{reportId}/screenshots/*` | 페이지·퀵 스캔 캡처 |

---

## 3. `status.json` (분석 중)

```json
{
  "reportId": "uuid",
  "targetUrl": "https://example.com",
  "phase": "queued | quick | crawling | analyzing | complete | failed",
  "updatedAt": "ISO8601",
  "quick": { /* QuickCheckResult, 아래 참조 */ },
  "error": "string?",
  "errorCode": "dns_fail | timeout | http_403 | cloudflare | service_unconfigured | unknown",
  "estimatedWaitLabel": "string?",
  "expiresAt": "ISO8601?"
}
```

### `quick` (QuickCheckResult)

| 필드 | 타입 | 설명 |
|------|------|------|
| `validUrl` | boolean | URL 형식 유효 |
| `dnsOk` | boolean | DNS 해석 성공 |
| `dnsMessage` | string? | DNS 상세 메시지 |
| `httpStatus` | number? | HTTP 응답 코드 |
| `httpOk` | boolean | HTTP 접속 성공 |
| `finalUrl` | string? | 리다이렉트 후 최종 URL |
| `redirectChain` | string[]? | 리다이렉트 경로 |
| `sslOk` | boolean | HTTPS 사용 |
| `sslMessage` | string? | TLS 메시지 |
| `responseTimeMs` | number? | 첫 응답 시간(ms) |
| `internalLinkCount` | number? | 홈에서 발견한 내부 링크 수 |
| `screenshotRelativePath` | string? | 퀵 스캔 스크린샷 경로 |
| `error` | string? | 오류 메시지 |
| `errorCode` | string? | 오류 코드 |

---

## 4. `report.json` (완료 리포트)

### 4.1 루트

| 필드 | 타입 | 설명 |
|------|------|------|
| `reportId` | string | 리포트 UUID |
| `targetUrl` | string | 분석 대상 URL |
| `deviceProfile` | `"mobile" \| "desktop"`? | 뷰포트 프로필 |
| `createdAt` | string | 분석 시작 시각 (ISO) |
| `completedAt` | string? | 완료 시각 |
| `expiresAt` | string? | 보관 만료 (~30일) |
| `cardId` | string? | 공유 카드 ID |
| `quick` | QuickCheckResult | 빠른 연결 점검 |
| `pages` | PageReport[] | 페이지별 상세 |
| `brokenLinks` | BrokenLink[] | 깨진 링크 (최대 200) |
| `summary` | Summary | 종합 점수·카테고리 |
| `crawlMeta` | CrawlMeta? | 크롤·상호작용 메타 |
| `timing` | TimingReport? | 단계별 소요 시간 |
| `crawlLimits` | CrawlLimits? | 요청/적용 크롤 한도 |

### 4.2 `summary`

| 필드 | 타입 | 설명 |
|------|------|------|
| `healthScore` | number | **종합 점수** (0–100) |
| `statusLabel` | `"Good" \| "Warning" \| "Critical"`? | UI 상태 배지 |
| `avgLighthousePerformance` | number \| null | Lighthouse 성능 평균 |
| `avgAxeIssuesPerPage` | number | 페이지당 axe 이슈 평균 |
| `totalConsoleErrors` | number | 전체 console.error 수 |
| `totalFailedRequests` | number | 실패한 네트워크 요청 수 |
| `mobileWarnings` | string[] | 모바일 관련 경고 문구 |
| `categoryScores` | CategoryScores? | 4대 카테고리 원점수 |
| `healthBreakdown` | HealthBreakdown? | 가중치·감점 설명 |
| `topImprovements` | string[]? | 개선 포인트 TOP3 (문장) |

#### `categoryScores`

| 필드 | 타입 | 가중치 | 설명 |
|------|------|--------|------|
| `performance` | number \| null | 30% | Lighthouse 성능 평균 |
| `accessibility` | number \| null | 25% | Lighthouse a11y + axe 혼합 |
| `ux` | number \| null | 25% | UI 이슈 기반 (100 − 이슈×4) |
| `seo` | number \| null | 20% | Lighthouse SEO 평균 |

#### `healthBreakdown`

| 필드 | 설명 |
|------|------|
| `formula` | 점수 산식 설명 문자열 |
| `weights` | `{ performance, accessibility, ux, seo }` 가중치 |
| `weightedBase` | 감점 전 가중 평균 |
| `penaltyTotal` | 추가 감점 합 |
| `contributions[]` | `{ category, label, score, weight, weightedPoints }` |
| `penalties[]` | `{ id, label, points, message }` |
| `explanation[]` | 한글 설명 bullet |

**감점(`penalties`) 발생 조건**

- 페이지당 axe 이슈 > 2건
- console.error > 0
- failedRequests > 0
- UX 이슈 > 3건
- 성능 50점 미만 페이지 존재

### 4.3 `pages[]` (PageReport)

| 필드 | 타입 | 설명 |
|------|------|------|
| `url` | string | 페이지 URL |
| `statusCode` | number \| null | HTTP 상태 |
| `redirects` | string[] | 리다이렉트 체인 |
| `consoleErrors` | string[] | 콘솔 에러 메시지 |
| `jsExceptions` | string[] | JS 예외 |
| `failedRequests` | `{ url, status?, failure? }[]` | 실패 요청 |
| `lighthouse` | object? | Lighthouse 결과 (아래) |
| `axeViolations` | `{ id, impact?, description, nodes }[]` | 접근성 위반 |
| `brokenImages` | `{ src, alt? }[]` | 깨진 이미지 |
| `uiIssues` | UiIssue[] | 화면·UX 이슈 |
| `screenshotPaths` | `{ mobile?, tablet?, desktop? }` | 뷰포트별 스크린샷 |
| `interactionLog` | InteractionEvent[]? | 클릭·탐색 로그 |
| `interactionFlow` | string? | 트리 형태 흐름 텍스트 |
| `interactionDiscovery` | object? | 후보·클릭 통계 |
| `crawledAt` | string | 크롤 시각 |

#### `lighthouse` (페이지)

| 필드 | 설명 |
|------|------|
| `performance`, `accessibility`, `bestPractices`, `seo` | 0–100 또는 null |
| `fcp`, `lcp`, `cls`, `tbt`, `si` | Core Web Vitals 관련 |
| `collected` | Lighthouse 수집 성공 여부 |
| `fallback` | 실패 시 DOM 타이밍 fallback |
| `lighthouseError` | 실패 사유 |
| `domContentLoaded`, `loadEvent` | fallback 타이밍(초) |

#### `uiIssues[]`

| 필드 | 설명 |
|------|------|
| `type` | `horizontal_scroll`, `broken_image`, `overlap`, `outside_viewport`, `hidden_overflow`, `modal_or_drawer` |
| `severity` | `info`, `warn`, `error` |
| `viewport` | `mobile`, `tablet`, `desktop` |
| `message`, `friendlyMessage`, `userImpact` | 설명 |
| `category` | `ux`, `performance`, `accessibility`, `seo` |
| `selector` | CSS 선택자 |

#### `axeViolations[]`

| 필드 | 설명 |
|------|------|
| `id` | axe 규칙 ID |
| `impact` | `minor`, `moderate`, `serious`, `critical` |
| `description` | 규칙 설명 |
| `nodes` | 영향 받는 DOM 노드 수 |

### 4.4 `brokenLinks[]`

| 필드 | 설명 |
|------|------|
| `from` | 링크가 있는 페이지 |
| `to` | 대상 URL |
| `reason` | 실패 사유 |

### 4.5 `crawlMeta`

| 필드 | 설명 |
|------|------|
| `mode` | 크롤 모드 (예: `homepage_rich_subpage_light`) |
| `deviceProfile` | mobile/desktop |
| `interactionFlow` | 전체 이용 흐름 텍스트 |
| `outboundLinks` | 외부 링크 URL |
| `interactions` | InteractionEvent[] (전 페이지 합산) |
| `seedScope` | `{ origin, pathPrefix, mode }` |
| `discoveryStats` | 아래 표 |
| `debug` | `{ skipped[], skippedByReason }` |

#### `discoveryStats`

| 필드 | 설명 |
|------|------|
| `linksDiscovered` | 발견 내부 링크 |
| `clicksRecorded` | 기록된 클릭 수 |
| `clicksAttempted` | 시도 클릭 수 |
| `candidatesFound` | 클릭 후보 수 |
| `outboundDiscovered` | 외부 링크 수 |
| `runtimeRoutes` | SPA 라우트 수 |
| `profile` | `homepage` 등 |
| `meaningfulCount` | 의미 있는 상호작용 수 |
| `runtimeMs` | 상호작용 크롤 ms |
| `stoppedEarly` | 조기 종료 여부 |
| `skippedByReason` | 스킵 사유별 카운트 |

### 4.6 `timing`

| 필드 | 설명 |
|------|------|
| `totalSeconds` | 전체 분석 시간(초) |
| `phases` | `{ browser_launch, quick_scan, crawl, page_analysis, ... }` 단계별 초 |
| `summary` | `"Page analysis (total): 59.7s"` 형태 문자열 배열 |
| `pages[]` | 페이지별 `{ url, phases: { initial_load, lighthouse, axe, ... } }` |

### 4.7 `crawlLimits`

| 필드 | 설명 |
|------|------|
| `requested.maxPages` | 사용자 요청 최대 페이지 |
| `requested.maxDepth` | 최대 깊이 |
| `requested.traceMode` | `failure`, `all`, `off` |
| `applied.*` | 실제 적용값 |

---

## 5. `cards/{cardId}.json` (공유 카드)

URL·상세 페이지 없이 공유되는 경량 JSON.

| 필드 | 설명 |
|------|------|
| `cardId` | 카드 ID |
| `overallScore` | 종합 점수 |
| `categoryScores` | 4대 카테고리 (performance, accessibility, ux, seo) |
| `statusLabel` | Good / Warning / Critical |
| `generatedAt` | 생성 시각 |
| `topImprovements` | 개선 포인트 문장 (최대 3) |

공유 URL: `/card/{cardId}`

---

## 6. UI 전용 파생 데이터 (`lib/qualityProfile.ts`)

JSON에 **직접 없고** 리포트에서 계산하는 7축 프로필.

| 축 key | 라벨 | 원천 |
|--------|------|------|
| `performance` | 성능 | `summary.categoryScores.performance` 또는 `avgLighthousePerformance` |
| `accessibility` | 접근성 | `categoryScores.accessibility` |
| `ux` | 사용성 | `categoryScores.ux` |
| `seo` | SEO | `categoryScores.seo` |
| `shareability` | 공유성 | SEO 점수 + Lighthouse SEO 수집 여부로 추정 |
| `security` | 보안 | `quick.sslOk`, `quick.httpOk`, `httpStatus` |
| `stability` | 안정성 | DNS/HTTP, console.error, failedRequests, brokenLinks |

등급(`tierLabel`): 90+ 우수, 75+ 양호, 60+ 개선 필요, 미만 시급

### KPI (`buildReportKpi`)

| KPI | 계산 |
|-----|------|
| 분석 페이지 | `pages.length` |
| 발견 링크 | `crawlMeta.discoveryStats.linksDiscovered` ?? `quick.internalLinkCount` |
| 발견 이슈 | axe nodes + UX 이슈 + console + failed + brokenLinks |
| 분석 시간 | `timing.totalSeconds` |
| 체크 항목 | `pages×6 + 7축 + 3(quick) + penalties` (근사) |

---

## 7. 점수 산식 요약

```
종합 = round(성능×0.3 + 접근성×0.25 + 사용성×0.25 + SEO×0.2) − penaltyTotal
statusLabel: ≥75 Good, ≥50 Warning, else Critical
```

---

## 8. 예시 최소 `report.json`

```json
{
  "reportId": "report-sample",
  "targetUrl": "https://example.com",
  "deviceProfile": "desktop",
  "cardId": "report-sample-card",
  "quick": { "validUrl": true, "dnsOk": true, "httpOk": true, "sslOk": true, "httpStatus": 200 },
  "pages": [{ "url": "https://example.com/", "statusCode": 200, "axeViolations": [], "uiIssues": [], "screenshotPaths": {}, "crawledAt": "..." }],
  "brokenLinks": [],
  "summary": {
    "healthScore": 82,
    "statusLabel": "Good",
    "categoryScores": { "performance": 85, "accessibility": 90, "ux": 80, "seo": 75 },
    "topImprovements": ["접근성 라벨 보강", "이미지 최적화", "모바일 스크롤 점검"]
  },
  "timing": { "totalSeconds": 28.5, "phases": {}, "summary": [] }
}
```

전체 예시: `public/reports/report-sample/report.json`, `public/reports/qa-smoke/report.json`

---

## 9. 산출물 역할 분리

| 산출물 | UI 섹션 ID | 역할 |
|--------|------------|------|
| 공유 인증 카드 | `report-hero-share-card` | 1200×630, 점수·레이더·최소 메타만. PNG 다운로드 |
| 화면 진단 리포트 | `report-header` 이하 (axis, accordion 등) | 분석·개선·상세 탐색 |
| PDF 진단서 | `report-pdf-root` (인쇄 전용) | 표지·Executive·이슈·페이지별·기술 진단 전체 |

---

## 10. 관련 소스

| 역할 | 파일 |
|------|------|
| 타입 정의 | `lib/types.ts` |
| 7축·KPI 계산 | `lib/qualityProfile.ts` |
| UI 섹션 ID | `lib/reportSections.ts` |
| summary 빌드 | `scripts/analysis/report-summary.mjs` |
| 분석 실행 | `scripts/run-analysis.mjs` |
| PNG 캡처 | `lib/shareCardImage.ts` (html-to-image) |
