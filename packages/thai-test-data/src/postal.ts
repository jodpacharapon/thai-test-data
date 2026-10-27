import { digits, int, pick, type Rng } from "./random.js";
import { LOCALITIES, poolFor, type AddressOptions, type Locality } from "./address.js";

const BY_CODE = new Map<string, Locality[]>();
for (const l of LOCALITIES) {
  const list = BY_CODE.get(l.postalCode);
  if (list) list.push(l);
  else BY_CODE.set(l.postalCode, [l]);
}

/** Every postal code in use, sorted. */
export const POSTAL_CODES: readonly string[] = [...BY_CODE.keys()].sort();

/** Subdistricts that use this postal code; empty when the code does not exist. Spaces are ignored. */
export function lookupPostalCode(code: string): readonly Locality[] {
  return BY_CODE.get(code.replace(/\s/g, "")) ?? [];
}

/** True for a 5-digit postal code that is actually in use. */
export function isValidPostalCode(code: string): boolean {
  return lookupPostalCode(code).length > 0;
}

/** A real postal code, optionally limited to a province or to/excluding Bangkok. */
export function postalCode(rng: Rng, options: AddressOptions = {}): string {
  return pick(rng, poolFor(options)).postalCode;
}

/** Ways a postal code can be wrong, for negative tests. */
export type InvalidPostalKind = "unknown" | "short" | "long" | "letters";
export const INVALID_POSTAL_KINDS: readonly InvalidPostalKind[] = ["unknown", "short", "long", "letters"];

/**
 * A postal code that fails validation:
 * - unknown: 5 digits that look real (a real 2-digit area prefix) but are not in use
 * - short: 4 digits
 * - long: 6 digits
 * - letters: one digit replaced with a look-alike letter
 */
export function invalidPostalCode(rng: Rng, kind: InvalidPostalKind = "unknown"): string {
  const real = pick(rng, POSTAL_CODES);
  switch (kind) {
    case "unknown": {
      for (;;) {
        const code = real.slice(0, 2) + digits(rng, 3);
        if (!BY_CODE.has(code)) return code;
      }
    }
    case "short":
      return real.slice(0, 4);
    case "long":
      return real + digits(rng, 1);
    case "letters": {
      const at = int(rng, 1, 4);
      return real.slice(0, at) + pick(rng, ["O", "I", "S", "B"]) + real.slice(at + 1);
    }
  }
}
