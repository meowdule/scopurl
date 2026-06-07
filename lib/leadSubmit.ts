import { dispatchLeadToNotion } from "@/lib/dispatchLead";

export type LeadMode = "pdf" | "solution" | "extended" | "general";

export type LeadPayload = {
  mode: LeadMode;
  email: string;
  company?: string;
  name?: string;
  siteUrl?: string;
  message?: string;
  reportId?: string;
};

const MODE_LABELS: Record<LeadMode, string> = {
  pdf: "PDF 리포트 받기",
  solution: "솔루션 문의",
  extended: "확장 분석 요청",
  general: "업데이트 구독",
};

function buildLeadBody(payload: LeadPayload) {
  const submittedAt = new Date().toISOString();
  return {
    ...payload,
    submittedAt,
    modeLabel: MODE_LABELS[payload.mode],
    _subject: `scopurl 리드 — ${MODE_LABELS[payload.mode]}`,
    _template: "table",
  };
}

async function postLead(url: string, body: ReturnType<typeof buildLeadBody>) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Lead submission failed (${res.status})`);
  }
}

export async function submitLead(payload: LeadPayload): Promise<void> {
  const emailWebhook = process.env.NEXT_PUBLIC_LEAD_WEBHOOK?.trim();
  const notionWebhook = process.env.NEXT_PUBLIC_LEAD_NOTION_WEBHOOK?.trim();
  const hasNotionDispatch = Boolean(
    process.env.NEXT_PUBLIC_QUEUE_DISPATCH_TOKEN?.trim(),
  );

  if (!emailWebhook && !notionWebhook && !hasNotionDispatch) {
    console.info("[lead]", payload);
    return;
  }

  const body = buildLeadBody(payload);

  if (emailWebhook) {
    await postLead(emailWebhook, body);
  }

  if (notionWebhook) {
    try {
      await postLead(notionWebhook, body);
    } catch (err) {
      console.warn("[lead] Notion webhook failed:", err);
    }
  }

  try {
    await dispatchLeadToNotion(payload);
  } catch (err) {
    console.warn("[lead] Notion dispatch failed:", err);
  }
}
