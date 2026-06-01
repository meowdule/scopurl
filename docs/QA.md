# SnapIt SiteScope — QA (Phase 11)

## 로컬 명령

```bash
# 단위: 오류 코드 분류
npm run qa:errors

# example.com 분석 스모크 (~1–2분, Playwright 필요)
npm run qa:smoke

# getcha mobile (느림, 선택)
npm run qa:getcha
# 엄격: 2페이지 이상 필수
QA_GETCHA_STRICT=1 npm run qa:getcha

# 전체 (errors + build + smoke)
npm run qa

# E2E UI (build 후)
npm run build
npm run test:e2e:install
npm run test:e2e
```

## E2E 범위

| 스펙 | 검증 |
|------|------|
| `e2e/home.spec.ts` | Analyze 폼, 고급 옵션 |
| `e2e/report-demo.spec.ts` | `/demo` fixture 리포트, PDF·블러·점수 카드·100p CTA |
| `e2e/card.spec.ts` | `/card/e2e-card` 공개 점수 카드 (URL 미노출) |

Fixture: `public/reports/e2e-fixture/`, `public/cards/e2e-card.json`

## CI

`.github/workflows/qa.yml` — push/PR 시:

- `qa:errors`, lint, build
- `qa:smoke` (example.com)
- Playwright E2E (`out` artifact)
- Lighthouse (home, performance ≥ 50)

수동 `workflow_dispatch`:

- `run_getcha`: getcha.kr mobile 스모크
- `getcha_strict`: 2페이지 미만 시 실패

## 403 / Cloudflare

`detectErrorCode` 단위 테스트로 분류 검증. 실제 차단 URL은 수동 또는 별도 스테이징에서 `qa:smoke` 변형으로 확인.

## 출시 게이트 체크리스트

- [ ] `npm run qa` 통과
- [ ] `npm run test:e2e` 통과
- [ ] GitHub Pages 배포 후 Analyze 1회 (dispatch token)
- [ ] `NEXT_PUBLIC_LEAD_WEBHOOK` 수신 테스트
