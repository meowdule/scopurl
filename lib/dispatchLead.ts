import { getConfiguredRepo } from "@/lib/config";
import type { LeadPayload } from "@/lib/leadSubmit";

/** Queue lead for Notion via repository_dispatch (token stays server-side in Actions). */
export async function dispatchLeadToNotion(payload: LeadPayload): Promise<void> {
  const token = process.env.NEXT_PUBLIC_QUEUE_DISPATCH_TOKEN?.trim();
  if (!token) return;

  const repo = getConfiguredRepo();
  const [owner, name] = repo.split("/");
  if (!owner || !name) return;

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${name}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "sitescope-lead",
        client_payload: {
          ...payload,
          submittedAt: new Date().toISOString(),
        },
      }),
    },
  );

  if (res.status !== 204 && !res.ok) {
    const text = await res.text();
    throw new Error(
      `Could not queue lead for Notion (${res.status}). ${text.slice(0, 200)}`,
    );
  }
}
