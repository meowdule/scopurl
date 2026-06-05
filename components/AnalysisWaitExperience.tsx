"use client";

import { ExplorationGameView } from "@/components/ExplorationGameView";

type Props = {
  active: boolean;
};

export function AnalysisWaitExperience({ active }: Props) {
  return <ExplorationGameView active={active} />;
}
