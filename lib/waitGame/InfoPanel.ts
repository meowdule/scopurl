import { WEB_TIPS, type WebTip } from "@/lib/waitGame/tips";

export type InfoEntry = WebTip & { id: number };

const MAX_ENTRIES = 5;

export class InfoPanel {
  private entries: InfoEntry[] = [];
  private nextId = 0;
  private usedTexts = new Set<string>();

  getEntries(): readonly InfoEntry[] {
    return this.entries;
  }

  addFromFragment(): WebTip {
    const tip = pickTip(this.usedTexts);
    this.usedTexts.add(tip.text);
    if (this.usedTexts.size > WEB_TIPS.length) {
      this.usedTexts.clear();
      this.usedTexts.add(tip.text);
    }

    this.entries.unshift({ ...tip, id: this.nextId++ });
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.length = MAX_ENTRIES;
    }
    return tip;
  }

  reset() {
    this.entries = [];
    this.nextId = 0;
    this.usedTexts.clear();
  }
}

function pickTip(used: Set<string>): WebTip {
  const pool = WEB_TIPS.filter((t) => !used.has(t.text));
  const source = pool.length > 0 ? pool : WEB_TIPS;
  return source[Math.floor(Math.random() * source.length)];
}
