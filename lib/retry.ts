// Retry policy: what to do with a failed send, by Meta error code.
// Pure (no I/O) so the whole decision table is unit-tested.

export const ERR = {
  NOT_ON_WHATSAPP: [131026],                 // undeliverable: no WhatsApp, old app version, or terms not accepted
  USER_MARKETING_CAP: [131049, 130472],      // Meta per-user marketing limit / user held out in a Meta experiment
  RATE_LIMIT: [130429, 131048, 80007, 4, 80008], // throughput / spam rate limit: stop this run, try again shortly
  PAIR_RATE_LIMIT: [131056],                 // too many messages to this one recipient: wait, do not stop the run
  OPTED_OUT_MARKETING: [131050],             // user stopped marketing messages
  PAYMENT: [131042],                         // payment method problem -> pause everything
  BAD_TEMPLATE: [132000, 132001, 132005, 132007, 132012, 132015, 132016], // template/params problems: stop the campaign
  ACCOUNT: [131031, 131030, 131005, 190, 10, 200], // account locked / bad token / missing permission -> pause everything
  PERMANENT: [131008, 131009, 131021, 131051, 100], // malformed request for this recipient: retrying cannot help
};

const MIN = 60e3, H = 3600e3;
// Everything else (131000, 131016, 131053, 133004, network errors, HTTP 5xx, unknown codes) is transient.
const TRANSIENT_DELAYS = [1 * MIN, 5 * MIN, 15 * MIN, 1 * H, 4 * H, 12 * H];
// Meta asks for increasing gaps before re-sending a capped marketing message.
const CAP_DELAYS = [24 * H, 48 * H, 72 * H, 96 * H];
// 131026 is ambiguous, so a number is only flagged as "no WhatsApp" after it failed 3 times over 4 days.
const UNDELIVERABLE_DELAYS = [24 * H, 72 * H];

export type Decision =
  | { action: "retry"; delayMs: number; counts: boolean; halt?: boolean }
  | { action: "fail"; contact?: "invalid" | "opted_out" }
  | { action: "pause_all" }
  | { action: "pause_campaign" };

const at = (delays: number[], i: number) => delays[Math.min(i, delays.length - 1)];

// retryCount = how many times this message has already been re-queued after a failure.
export function decide(code: number, retryCount: number, maxRetries: number): Decision {
  if (ERR.OPTED_OUT_MARKETING.includes(code)) return { action: "fail", contact: "opted_out" };
  if (ERR.PERMANENT.includes(code)) return { action: "fail" };
  if (ERR.PAYMENT.includes(code) || ERR.ACCOUNT.includes(code)) return { action: "pause_all" };
  if (ERR.BAD_TEMPLATE.includes(code)) return { action: "pause_campaign" };
  // rate limits say nothing about the recipient, so they never use up a retry
  if (ERR.RATE_LIMIT.includes(code)) return { action: "retry", delayMs: 2 * MIN, counts: false, halt: true };
  if (ERR.PAIR_RATE_LIMIT.includes(code)) return { action: "retry", delayMs: 10 * MIN, counts: false };

  if (ERR.NOT_ON_WHATSAPP.includes(code)) {
    if (retryCount >= Math.min(UNDELIVERABLE_DELAYS.length, maxRetries)) return { action: "fail", contact: "invalid" };
    return { action: "retry", delayMs: at(UNDELIVERABLE_DELAYS, retryCount), counts: true };
  }
  if (retryCount >= maxRetries) return { action: "fail" };
  if (ERR.USER_MARKETING_CAP.includes(code)) return { action: "retry", delayMs: at(CAP_DELAYS, retryCount), counts: true };
  return { action: "retry", delayMs: at(TRANSIENT_DELAYS, retryCount), counts: true };
}
