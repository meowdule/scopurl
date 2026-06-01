import fs from "node:fs";
import path from "node:path";
import { CardPageClient } from "./CardPageClient";

export function generateStaticParams() {
  const dir = path.join(process.cwd(), "public", "cards");
  if (!fs.existsSync(dir)) {
    return [{ cardId: "placeholder" }];
  }
  const ids = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ cardId: f.replace(/\.json$/, "") }));
  return ids.length > 0 ? ids : [{ cardId: "placeholder" }];
}

type Props = {
  params: { cardId: string };
};

export default function CardPage({ params }: Props) {
  return <CardPageClient cardId={params.cardId} />;
}
