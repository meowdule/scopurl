import fs from "node:fs";
let af = fs.readFileSync("components/AnalyzeForm.tsx", "utf8");
if (!af.includes('from "@/lib/paths"')) {
  af = af.replace(
    'import type { ReportJson } from "@/lib/types";',
    'import type { ReportJson } from "@/lib/types";\nimport { assetUrl } from "@/lib/paths";',
  );
  fs.writeFileSync("components/AnalyzeForm.tsx", af);
  console.log("added assetUrl import");
} else {
  console.log("import already present");
}