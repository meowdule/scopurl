#!/usr/bin/env node
/**
 * Create a Notion database row from a lead payload.
 * Env: NOTION_TOKEN (required), NOTION_DATABASE_ID (required)
 */

const MODE_TO_KIND = {
  pdf: "PDF",
  solution: "문의",
  extended: "확장",
  general: "구독",
};

function textChunk(value, max = 2000) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function titleProp(value) {
  const content = textChunk(value) || "—";
  return {
    title: [{ type: "text", text: { content } }],
  };
}

function richTextProp(value) {
  const content = textChunk(value);
  if (!content) return undefined;
  return {
    rich_text: [{ type: "text", text: { content } }],
  };
}

function emailProp(value) {
  const email = textChunk(value, 320);
  if (!email) return undefined;
  return { email };
}

function urlProp(value) {
  const url = textChunk(value, 2000);
  if (!url) return undefined;
  return { url };
}

function selectProp(name) {
  return { select: { name } };
}

function buildProperties(payload) {
  const kind = MODE_TO_KIND[payload.mode] ?? "문의";
  const props = {
    종류: selectProp(kind),
    이름: titleProp(payload.name || payload.email),
    이메일: emailProp(payload.email),
  };

  const company = richTextProp(payload.company);
  if (company) props.회사 = company;

  const url =
    urlProp(payload.siteUrl) ??
    (payload.reportId
      ? urlProp(`https://meowdule.github.io/scopurl/?report=${payload.reportId}`)
      : undefined);
  if (url) props.URL = url;

  return props;
}

async function main() {
  const token = process.env.NOTION_TOKEN?.trim();
  const databaseId = process.env.NOTION_DATABASE_ID?.trim();
  const raw = process.env.LEAD_PAYLOAD?.trim();

  if (!token || !databaseId || !raw) {
    console.error("NOTION_TOKEN, NOTION_DATABASE_ID, and LEAD_PAYLOAD are required.");
    process.exit(1);
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    console.error("LEAD_PAYLOAD is not valid JSON.");
    process.exit(1);
  }

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: databaseId.replace(/-/g, "") },
      properties: buildProperties(payload),
    }),
  });

  const body = await res.text();
  if (!res.ok) {
    console.error(`Notion API error (${res.status}):`, body);
    process.exit(1);
  }

  console.log("Notion page created:", body);
}

main();
