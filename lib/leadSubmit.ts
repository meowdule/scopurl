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

export async function submitLead(payload: LeadPayload): Promise<void> {
  const webhook = process.env.NEXT_PUBLIC_LEAD_WEBHOOK?.trim();
  if (!webhook) {
    console.info("[lead]", payload);
    return;
  }
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, submittedAt: new Date().toISOString() }),
  });
  if (!res.ok) {
    throw new Error(`Lead submission failed (${res.status})`);
  }
}
