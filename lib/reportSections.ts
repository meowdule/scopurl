/** UI 섹션 ID — 지시·E2E·문서에서 동일 이름으로 참조 */

export const REPORT_SECTION = {
  /** URL, PDF, 디바이스 배지 */
  header: "report-header",
  /** SNS·메신저 공유용 인증 카드 1200×630 (PNG 캡처 대상) */
  heroShareCard: "report-hero-share-card",
  /** 분석 메타 (페이지·이슈·환경, 점수 없음) */
  analysisOverview: "report-analysis-overview",
  /** 우선 개선 TOP3 */
  priorityTop3: "report-priority-top3",
  /** 7축 영역별 점수·등급 카드 */
  axisCards: "report-axis-cards",
  /** 발견 이슈 카드 목록 */
  issuesDetail: "report-issues-detail",
  /** SEO 체크리스트 */
  seoAnalysis: "report-seo-analysis",
  /** 분석 범위·기술 메타 */
  analysisScope: "report-analysis-scope",
  /** 확장 분석 CTA */
  extendedCta: "report-extended-cta",
  /** 상세 분석 아코디언 */
  detailAccordion: "report-detail-accordion",
  /** 분석한 페이지 테이블 */
  pagesTable: "report-pages-table",
  /** 깨진 링크 목록 */
  brokenLinks: "report-broken-links",
  /** 분석 과정 KPI + 타임라인 */
  analysisProcess: "report-analysis-process",
} as const;

export type ReportSectionId =
  (typeof REPORT_SECTION)[keyof typeof REPORT_SECTION];
