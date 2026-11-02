import { db } from "./db";

export type Settings = {
  frequency_cap_days: number;
  sunset_after: number;
  quiet_start: number;
  quiet_end: number;
  default_send_hour: number;
  timezone: string;
  auto_pause_fail_pct: number;
  daily_cap_override: number | null;
  phone_health: { quality_rating?: string; messaging_limit_tier?: string; checked_at?: string };
};

export async function getSettings(): Promise<Settings> {
  const { data } = await db.from("settings").select("key,value");
  const s: any = {
    frequency_cap_days: 2, sunset_after: 6, quiet_start: 21, quiet_end: 9, default_send_hour: 11,
    timezone: "Asia/Kolkata", auto_pause_fail_pct: 25, daily_cap_override: null, phone_health: {},
  };
  for (const r of data ?? []) s[r.key] = r.value;
  return s;
}

export async function setSetting(key: string, value: unknown) {
  await db.from("settings").upsert({ key, value, updated_at: new Date().toISOString() });
}

// Hour of day (0-23) and the UTC offset-free "next occurrence" helpers in the business timezone.
export function hourIn(tz: string, d = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(d)) % 24;
}

// Next Date (>= from) whose local hour in tz equals `hour` (top of the hour).
export function nextAtHour(tz: string, hour: number, from = new Date()): Date {
  const d = new Date(Math.ceil(from.getTime() / 3600e3) * 3600e3);
  for (let i = 0; i < 49; i++) {
    if (hourIn(tz, d) === hour) return d;
    d.setTime(d.getTime() + 3600e3);
  }
  return from;
}

export function inQuietHours(s: Pick<Settings, "quiet_start" | "quiet_end" | "timezone">, d = new Date()) {
  const h = hourIn(s.timezone, d);
  return s.quiet_start > s.quiet_end ? h >= s.quiet_start || h < s.quiet_end : h >= s.quiet_start && h < s.quiet_end;
}

// First moment >= `from` outside quiet hours. With `hour` (contact's usual engagement hour) wait for that hour.
export function nextAllowedSend(s: Settings, from: Date, hour?: number | null): Date {
  if (hour !== null && hour !== undefined) {
    const t = hourIn(s.timezone, from) === hour ? from : nextAtHour(s.timezone, hour, from);
    if (!inQuietHours(s, t)) return t;
  }
  return inQuietHours(s, from) ? nextAtHour(s.timezone, s.quiet_end, from) : from;
}

export const TIER_LIMITS: Record<string, number> = {
  TIER_50: 50, TIER_250: 250, TIER_1K: 1000, TIER_2K: 2000, TIER_10K: 10000, TIER_100K: 100000, TIER_UNLIMITED: 1e9,
};
