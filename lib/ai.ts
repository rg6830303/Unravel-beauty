import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateReply(contactId: string): Promise<string | null> {
  const [{ data: history }, { data: kb }] = await Promise.all([
    db.from("messages").select("direction,body").eq("contact_id", contactId)
      .not("body", "is", null).order("created_at", { ascending: false }).limit(20),
    db.from("knowledge").select("title,content").limit(50),
  ]);
  if (!history?.length) return null;

  // Build alternating turns (merge consecutive same-role messages)
  const turns: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of history.reverse()) {
    const role = m.direction === "in" ? "user" : "assistant";
    const last = turns[turns.length - 1];
    if (last?.role === role) last.content += "\n" + m.body;
    else turns.push({ role, content: m.body });
  }
  while (turns[0]?.role === "assistant") turns.shift();
  if (turns[turns.length - 1]?.role !== "user") return null;

  const knowledge = (kb || []).map((k) => `## ${k.title || ""}\n${k.content}`).join("\n\n");
  const res = await client.messages.create({
    model: process.env.AI_MODEL || "claude-sonnet-5-5",
    max_tokens: 400,
    system:
      (process.env.AI_SYSTEM_PROMPT || "You are a helpful WhatsApp business assistant.") +
      "\nKeep replies under 80 words, plain text, WhatsApp style. Never invent prices or policies not in the knowledge base." +
      (knowledge ? `\n\nKnowledge base:\n${knowledge}` : ""),
    messages: turns,
  });
  const text = res.content.find((c) => c.type === "text");
  return text && "text" in text ? text.text.trim() : null;
}
