# SnapIt SiteScope v0.1 — 통합 제품 기획

> 최종 갱신: 2026-06-01  
> 소스: `simple_report_v1` + `prompt_test_v2` 통합  
> 구현 상세·체크리스트: [IMPLEMENTATION.md](./IMPLEMENTATION.md)  
> 배포: [DEPLOY.md](./DEPLOY.md)

## 한 줄 요약

**v0.1 핵심 기능(분석·리포트·리드·점수 카드)은 구현 완료.** 남은 것은 운영(cleanup)·SPA 크롤 개선(getcha)·QA·선택 Worker.

---

## 목표

URL + 화면 크기(1440/390) + 크롤 옵션 → **단일 페이지**에서 Queue/Quick signals → **비개발자용 종합 리포트** → 목적별 리드(PDF 즉시 / 영업 문의 / 100p 확장).

---

## 핵심 결정 (확정)

| 항목 | 정책 | 구현 상태 |
|------|------|-----------|
| PDF | 이메일 제출 → **즉시** 다운로드 (`window.print`) | ✅ |
| 주요 흐름·입력 데이터 | 영구 블러 → 솔루션 문의 → 접수 팝업 (**unlock 없음**) | ✅ |
| 무료 분석 | 최대 **20** 페이지 (runner에서 최종 clamp) | ✅ |
| 확장 분석 | **100** 페이지 — 리드만, 수동 실행 | ✅ CTA |
| 전체 리포트 URL | v0.1 **제외** (`/report` → `/` 리다이렉트) | ✅ |
| 점수 카드 | `targetUrl`·`reportId` **미포함** + 개선 포인트 3개 | ✅ |
| 크롤 엔진 | simple_report SPA 스택 (Playwright + interaction crawl) | ✅ |
| 폼 옵션·폰트 | maxPages/depth/traceMode, Pretendard CDN | ✅ |
| 데이터 | 리포트 제공 목적만, 30일 삭제 | ✅ cleanup workflow + `expiresAt` |
| 옵션 스키마 | `schemaVersion: 3`, 프론트→CI→runner 일관 | ✅ |

---

## 제외 (v0.1 유지)

- 시나리오 편집·재테스트·작업번호 불러오기
- 작업 ID UI 노출
- `/report?id=` 공개 딥링크
- 크롤 중 폼 입력·문의 제출 (Phase 7에서 강화 예정)

---

## 정보 구조 (IA)

```
홈 (SiteShell)
├── AnalyzeForm
│   ├── URL + 데스크톱/모바일
│   ├── 고급 옵션 (maxPages, maxDepth, traceMode)
│   ├── AnalysisStatusPanel (Queue · Quick signals · 예상 대기)
│   └── AnalysisWaitExperience (ticker · 미니 게임)
└── ReportDashboard (같은 페이지 인라인)
    ├── ExecutiveSummary (종합 점수·설명·감점)
    ├── 카테고리 점수
    ├── GatedSection (주요 흐름 · 입력 데이터 — 블러)
    ├── TimingSection
    ├── PdfDownloadButton · ScoreCardShare · ExtendedReportCta
    └── FloatingLeadButton (FAB)
```

공유: `/card/[cardId]` — 점수·카테고리·개선 3개만 (사이트 URL 없음)

---

## 데이터 스키마 (요약)

### report.json (비공개 상세)

- `reportId`, `targetUrl`, `deviceProfile`, `pages`, `summary`, `crawlMeta`, `timing`
- `expiresAt`, `cardId`, `crawlLimits.requested` / `crawlLimits.applied`
- `summary.topImprovements` (최대 3개, 공유용 요약)

### cards/{cardId}.json (공개 가능)

```json
{
  "cardId": "uuid",
  "overallScore": 72,
  "categoryScores": { "performance": 50, "accessibility": 54, "ux": 80, "seo": 70 },
  "statusLabel": "Warning",
  "generatedAt": "2026-06-01T00:00:00.000Z",
  "topImprovements": ["접근성 개선 필요", "…"]
}
```

`targetUrl`, `reportId` **저장하지 않음**.

### status.json (폴링)

- `phase`: queued | quick | crawling | analyzing | complete | failed
- `quick`, `estimatedWaitLabel`, `errorCode`, `error`

### requests/{id}.json (CI)

- `schemaVersion: 3`, `deviceProfile`, `maxPages`, `maxDepth`, `traceMode`

---

## 오류 UX (한국어)

| errorCode | 사용자 메시지 방향 |
|-----------|-------------------|
| `dns_fail` | DNS 조회 실패, 도메인 확인 |
| `timeout` | 분석 시간 초과, 페이지 수 줄이기 |
| `http_403` | 봇 차단 |
| `cloudflare` | Cloudflare 보호 페이지 |
| `unknown` | 일반 재시도 안내 |

구현: `lib/analysisErrors.ts` + runner `detectErrorCode()`

---

## Phase 3 설계 보완 (완료 — 2026-06-01)

1. ✅ `TRACE_MODES` / `buildAnalysisOptions()` — `lib/analysisOptions.ts` 단일 정의  
2. ✅ runner 최종 clamp (`setRuntimeCrawlLimits`, `setRuntimeTraceMode`)  
3. ✅ `crawlLimits.requested` + `applied` in `report.json`  
4. ✅ trace: `httpErrors`, `${slug}_${shortHash}.zip`, `trace-mode=all` 저장  
5. ✅ `analyze-and-publish.yml` — `SITE_SCOPE_MAX_PAGES: 12` 제거  
6. ✅ `schemaVersion: 3` in dispatch / request JSON  

---

## 구현 진행률 (2026-06-01)

| Phase | 내용 | 상태 |
|-------|------|------|
| 0 | 이관·빌드·smoke | ✅ |
| 1 | SPA 파이프라인·20p·topImprovements | ✅ (getcha 1p 한계 잔존) |
| 2 | 단일 페이지·reportId 비노출 | ✅ |
| 3 | 옵션·CI·trace·crawlLimits | ✅ |
| 4 | Queue/오류 UX | ✅ |
| 5 | 로딩 ticker·공룡 게임 | ✅ |
| 6 | ExecutiveSummary·TimingSection | ✅ |
| 7 | 폼 submit 차단·SPA 크롤 강화 | ⬜ |
| 8 | 리드 게이트 (PDF/블러/100p/FAB) | ✅ |
| 9 | 점수 카드 PNG·card.json·/card | ✅ (OG 미구현) |
| 10 | 30일 cleanup workflow | ✅ |
| 11 | QA·getcha·403/CF E2E | ✅ (2026-06-01) |
| 12 | Cloudflare Worker (선택) | ⬜ |

---

## 다음에 할 일 (우선순위)

### 1. 출시 전 수동 확인 (자동 QA 이후)

1. ~~Phase 10–11 CI~~ ✅ — [QA.md](./QA.md) 참고  
2. **프로덕션 Analyze 1회** — GitHub Pages + `QUEUE_DISPATCH_TOKEN`  
3. **리드 webhook** — `NEXT_PUBLIC_LEAD_WEBHOOK` 수신 확인  
4. **getcha** (선택) — `npm run qa:getcha` 또는 CI `workflow_dispatch` + `run_getcha`  

### 2. 품질 개선 (Phase 7)

- 크롤 중 `form submit` / 민감 입력 차단 강화  
- SPA hydration·라우트 대기 튜닝 (getcha 다페이지)  

### 3. 선택 (v0.1.1+)

- 점수 카드 OG 메타 (`/card/[cardId]`)  
- Cloudflare Worker (`POST /analyze` → repository_dispatch)  
- PDF 전용 print CSS 개선 (현재 `window.print`)  

---

## 환경 변수

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_QUEUE_DISPATCH_TOKEN` | 원클릭 Analyze (repository_dispatch) |
| `NEXT_PUBLIC_LEAD_WEBHOOK` | 리드 제출 POST |
| `NEXT_PUBLIC_BASE_PATH` | GitHub Pages base path |

---

## 검증 명령 (로컬)

```bash
npm run build
node scripts/run-analysis.mjs --report-id=smoke --target-url=https://example.com --device=mobile --max-pages=20 --trace-mode=failure
```

성공 기준: `public/reports/smoke/report.json`, `public/cards/{cardId}.json`, `npm run build` 통과.
