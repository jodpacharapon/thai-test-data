import { digits, int, type Rng } from "./random.js";

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

/** A valid citizen ID. The first digit (person type) is 1-8. */
export function citizenId(rng: Rng): string {
  const first12 = String(int(rng, 1, 8)) + digits(rng, 11);
  return first12 + thaiIdCheckDigit(first12);
}

/** A citizen ID whose check digit is deliberately wrong, for negative tests. */
export function invalidCitizenId(rng: Rng): string {
  const valid = citizenId(rng);
  const wrong = (Number(valid[12]) + int(rng, 1, 9)) % 10;
  return valid.slice(0, 12) + wrong;
}

/** A valid 13-digit juristic-person (company) tax ID. These start with 0. */
export function juristicId(rng: Rng): string {
  const first12 = "0" + digits(rng, 11);
  return first12 + thaiIdCheckDigit(first12);
}
