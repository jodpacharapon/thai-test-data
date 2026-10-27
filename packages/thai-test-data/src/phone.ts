import { digits, int, pick, type Rng } from "./random.js";

export const MOBILE_PREFIXES = ["06", "08", "09"] as const;
export type MobilePrefix = (typeof MOBILE_PREFIXES)[number];

/** A 10-digit Thai mobile number such as 0812345678. Optionally limit the prefixes used. */
export function mobilePhone(rng: Rng, prefixes: readonly MobilePrefix[] = MOBILE_PREFIXES): string {
  if (prefixes.length === 0) throw new Error("Pass at least one prefix");
  return pick(rng, prefixes) + digits(rng, 8);
}

/** Ways a mobile number can be wrong, for negative tests. */
export type InvalidPhoneKind = "prefix" | "short" | "long" | "letters";
export const INVALID_PHONE_KINDS: readonly InvalidPhoneKind[] = ["prefix", "short", "long", "letters"];

/**
 * A mobile number that fails validation:
 * - prefix: starts with a non-mobile prefix such as 02 (a Bangkok landline)
 * - short: 9 digits
 * - long: 11 digits
 * - letters: one digit replaced with a look-alike letter
 */
export function invalidMobilePhone(rng: Rng, kind: InvalidPhoneKind = "prefix"): string {
  const valid = mobilePhone(rng);
  switch (kind) {
    case "prefix":
      return "0" + pick(rng, ["1", "2", "3", "4", "5", "7"]) + valid.slice(2);
    case "short":
      return valid.slice(0, 9);
    case "long":
      return valid + digits(rng, 1);
    case "letters": {
      const at = int(rng, 2, 9);
      return valid.slice(0, at) + pick(rng, ["O", "I", "S", "B"]) + valid.slice(at + 1);
    }
  }
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
