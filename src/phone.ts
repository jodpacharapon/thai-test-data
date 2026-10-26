import { digits, pick, type Rng } from "./random.js";

const MOBILE_PREFIXES = ["06", "08", "09"] as const;

/** A 10-digit Thai mobile number such as 0812345678. */
export function mobilePhone(rng: Rng): string {
  return pick(rng, MOBILE_PREFIXES) + digits(rng, 8);
}

/** Format 10 digits as 0XX-XXX-XXXX. */
export function formatPhone(phone: string): string {
  return phone.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3");
}

/** Convert a local mobile number to E.164, e.g. 0812345678 → +66812345678. */
export function toE164(phone: string): string {
  return "+66" + phone.replace(/\D/g, "").replace(/^0/, "");
}

/** True for a 10-digit Thai mobile number starting with 06, 08 or 09. Dashes and spaces are ignored. */
export function isValidMobilePhone(value: string): boolean {
  return /^0[689]\d{8}$/.test(value.replace(/[\s-]/g, ""));
}
