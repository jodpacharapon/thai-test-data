import { digits, int, pick, type Rng } from "./random.js";

/** Check digit for a 13-digit Thai ID: (11 - Σ dᵢ·(14-i) mod 11) mod 10 over the first 12 digits. */
export function thaiIdCheckDigit(first12: string): number {
  if (!/^\d{12}$/.test(first12)) throw new Error("Expected exactly 12 digits");
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(first12[i]) * (13 - i);
  return (11 - (sum % 11)) % 10;
}

/** True when the value is a 13-digit Thai ID (citizen or juristic) with a correct check digit. Dashes and spaces are ignored. */
export function isValidThaiId(value: string): boolean {
  const id = value.replace(/[\s-]/g, "");
  if (!/^\d{13}$/.test(id)) return false;
  return thaiIdCheckDigit(id.slice(0, 12)) === Number(id[12]);
}

/** Format 13 digits as X-XXXX-XXXXX-XX-X. */
export function formatThaiId(id: string): string {
  return id.replace(/^(\d)(\d{4})(\d{5})(\d{2})(\d)$/, "$1-$2-$3-$4-$5");
}

/** A valid citizen ID. The first digit is the person type (1-8); pass one to fix it. */
export function citizenId(rng: Rng, firstDigit?: number): string {
  if (firstDigit !== undefined && !(Number.isInteger(firstDigit) && firstDigit >= 1 && firstDigit <= 8)) {
    throw new Error("firstDigit must be an integer from 1 to 8");
  }
  const first12 = String(firstDigit ?? int(rng, 1, 8)) + digits(rng, 11);
  return first12 + thaiIdCheckDigit(first12);
}

/** Ways a 13-digit ID can be wrong, for negative tests. */
export type InvalidIdKind = "checksum" | "short" | "long" | "letters";
export const INVALID_ID_KINDS: readonly InvalidIdKind[] = ["checksum", "short", "long", "letters"];

/**
 * Break a valid 13-digit ID in a specific way:
 * - checksum: wrong check digit
 * - short: 12 digits
 * - long: 14 digits
 * - letters: one digit replaced with a look-alike letter (O, I, S, B)
 */
export function breakThaiId(rng: Rng, validId: string, kind: InvalidIdKind = "checksum"): string {
  switch (kind) {
    case "checksum":
      return validId.slice(0, 12) + ((Number(validId[12]) + int(rng, 1, 9)) % 10);
    case "short":
      return validId.slice(0, 12);
    case "long":
      return validId + int(rng, 0, 9);
    case "letters": {
      const at = int(rng, 1, 11);
      return validId.slice(0, at) + pick(rng, ["O", "I", "S", "B"]) + validId.slice(at + 1);
    }
  }
}

/** A citizen ID that fails validation. Defaults to a wrong check digit. */
export function invalidCitizenId(rng: Rng, kind: InvalidIdKind = "checksum"): string {
  return breakThaiId(rng, citizenId(rng), kind);
}

/** A valid 13-digit juristic-person (company) tax ID. These start with 0. */
export function juristicId(rng: Rng): string {
  const first12 = "0" + digits(rng, 11);
  return first12 + thaiIdCheckDigit(first12);
}
