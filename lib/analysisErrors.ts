import type { ReportStatusErrorCode } from "@/lib/types";

export function formatStatusError(code?: ReportStatusErrorCode, fallback?: string): string {
  const map: Record<ReportStatusErrorCode, string> = {
    dns_fail: "DNS 조회에 실패했습니다. 도메인 오타 또는 DNS 전파 상태를 확인해 주세요.",
    timeout: "분석 시간이 초과되었습니다. 잠시 뒤 다시 시도하거나 페이지 수를 줄여 주세요.",
    http_403: "사이트가 자동 접근(봇)을 차단하고 있습니다. 접근 정책 확인이 필요합니다.",
    cloudflare: "Cloudflare 보호 페이지에 막혀 분석이 중단되었습니다. 허용 규칙 설정이 필요합니다.",
    service_unconfigured:
      "지금은 분석 요청을 접수할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    unknown: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  };
  return (code && map[code]) || fallback || map.unknown;
}