import { db } from "./db";
import { fetchPhoneHealth } from "./whatsapp";
import { getSettings, setSetting } from "./settings";

export async function pauseAllCampaigns(reason: string) {
  await db.from("campaigns").update({ status: "paused", pause_reason: reason }).in("status", ["running", "scheduled"]);
}

export async function pauseCampaign(id: string, reason: string) {
  await db.from("campaigns").update({ status: "paused", pause_reason: reason }).eq("id", id);
}

// Refresh quality rating + tier (cached 10 min). RED quality pauses all marketing automatically.
export async function refreshPhoneHealth(force = false) {
  const s = await getSettings();
  const last = s.phone_health?.checked_at ? new Date(s.phone_health.checked_at).getTime() : 0;
  if (!force && Date.now() - last < 10 * 60e3) return s.phone_health;
  try {
    const h = await fetchPhoneHealth();
    const health = { quality_rating: h.quality_rating, messaging_limit_tier: h.messaging_limit_tier, checked_at: new Date().toISOString() };
    await setSetting("phone_health", health);
    if (h.quality_rating === "RED") await pauseAllCampaigns("Number quality rating is RED — paused automatically");
    return health;
  } catch {
    return s.phone_health;
  }
}
