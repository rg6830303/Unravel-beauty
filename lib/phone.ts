// "/max" metadata is required: the default build has no number-type data, so getType() would be undefined for everything.
import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js/max";

// Normalize to WhatsApp format (E.164 digits, no '+'). Returns null if not a valid mobile-capable number.
export function normalizePhone(raw: string, defaultCountry: CountryCode = "IN"): string | null {
  if (!raw) return null;
  const p = parsePhoneNumberFromString(String(raw).trim(), defaultCountry);
  if (!p || !p.isValid()) return null;
  const t = p.getType();
  // Landlines / premium numbers cannot hold WhatsApp accounts in practice.
  if (!t || !["MOBILE", "FIXED_LINE_OR_MOBILE"].includes(t)) return null;
  return p.number.replace("+", "");
}
