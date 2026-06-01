import { ReportDashboard } from "@/components/ReportDashboard";

/** QA/E2E: pre-built fixture report without running analysis. */
export default function DemoReportPage() {
  return <ReportDashboard reportId="e2e-fixture" />;
}
