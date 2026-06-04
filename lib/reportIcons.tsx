import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock,
  FileDown,
  FileText,
  Gauge,
  Globe,
  Layers,
  Link2,
  MapPin,
  Search,
  Share2,
  Shield,
  Sparkles,
  Target,
  Timer,
  Users,
  Wrench,
  Zap,
  Accessibility,
  Layout,
  Server,
  Monitor,
} from "lucide-react";
import type { QualityAxisKey } from "@/lib/qualityProfile";

export const ICON_SM = 16;
export const ICON_MD = 20;

export function ReportIcon({
  icon: Icon,
  size = ICON_SM,
  className = "",
  strokeWidth = 2,
}: {
  icon: LucideIcon;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={`shrink-0 ${className}`}
      aria-hidden
    />
  );
}

const AXIS_ICONS: Record<QualityAxisKey, LucideIcon> = {
  performance: Zap,
  accessibility: Accessibility,
  ux: Layout,
  seo: Search,
  shareability: Share2,
  security: Shield,
  stability: Server,
};

export function axisIcon(key: QualityAxisKey): LucideIcon {
  return AXIS_ICONS[key];
}

export {
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock,
  FileDown,
  FileText,
  Gauge,
  Globe,
  Layers,
  Link2,
  MapPin,
  Search,
  Share2,
  Shield,
  Sparkles,
  Target,
  Timer,
  Users,
  Wrench,
  Zap,
  Accessibility,
  Layout,
  Server,
  Monitor,
};
