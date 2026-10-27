import { seededRng, type Rng } from "./random.js";
import { breakThaiId, citizenId, invalidCitizenId, juristicId, type InvalidIdKind } from "./id.js";
import { invalidMobilePhone, mobilePhone, type InvalidPhoneKind, type MobilePrefix } from "./phone.js";
import { personName, type Gender, type PersonName } from "./name.js";
import { address, type Address, type AddressOptions } from "./address.js";
import { invalidPostalCode, postalCode, type InvalidPostalKind } from "./postal.js";
import { birthDate, formatIsoDate, formatThaiDate } from "./date.js";

export * from "./id.js";
export * from "./phone.js";
export * from "./date.js";
export { INVALID_POSTAL_KINDS, POSTAL_CODES, isValidPostalCode, lookupPostalCode, type InvalidPostalKind } from "./postal.js";
export { LOCALITIES, PROVINCES, type Address, type AddressOptions, type Locality } from "./address.js";
export type { Gender, PersonName } from "./name.js";
export { seededRng, type Rng } from "./random.js";

export interface Person extends PersonName {
  citizenId: string;
  phone: string;
  email: string;
  birthDate: string;
  birthDateBE: string;
  address: Address;
}

export interface ThaiDataOptions {
  /** Same seed → same data, so failing tests can be reproduced. Omit for random data. */
  seed?: number;
}

export function createThaiData(options: ThaiDataOptions = {}) {
  const rng: Rng = options.seed === undefined ? Math.random : seededRng(options.seed);

  const gen = {
    /** Valid citizen ID; optionally fix the first digit (person type 1-8). */
    citizenId: (firstDigit?: number) => citizenId(rng, firstDigit),
    /** Citizen ID that fails validation: "checksum" (default), "short", "long" or "letters". */
    invalidCitizenId: (kind?: InvalidIdKind) => invalidCitizenId(rng, kind),
    juristicId: () => juristicId(rng),
    /** Juristic tax ID that fails validation, same kinds as invalidCitizenId. */
    invalidJuristicId: (kind?: InvalidIdKind) => breakThaiId(rng, juristicId(rng), kind),
    /** Mobile number; optionally limit prefixes, e.g. phone(["08"]). */
    phone: (prefixes?: readonly MobilePrefix[]) => mobilePhone(rng, prefixes),
    /** Mobile number that fails validation: "prefix" (default), "short", "long" or "letters". */
    invalidPhone: (kind?: InvalidPhoneKind) => invalidMobilePhone(rng, kind),
    /** The underlying random source, for building your own variations with the same seed. */
    random: rng,
    name: (gender?: Gender) => personName(rng, gender),
    /** Address whose subdistrict, district, province and postal code belong together. */
    address: (options?: AddressOptions) => address(rng, options),
    /** Real postal code, optionally limited like address(), e.g. postalCode({ province: "ภูเก็ต" }). */
    postalCode: (options?: AddressOptions) => postalCode(rng, options),
    /** Postal code that fails validation: "unknown" (default), "short", "long" or "letters". */
    invalidPostalCode: (kind?: InvalidPostalKind) => invalidPostalCode(rng, kind),
    birthDate: (minAge?: number, maxAge?: number) => birthDate(rng, minAge, maxAge),
    person: (gender?: Gender): Person => {
      const name = personName(rng, gender);
      const birth = birthDate(rng);
      const tag = Math.floor(rng() * 10000);
      return {
        ...name,
        citizenId: citizenId(rng),
        phone: mobilePhone(rng),
        email: `${name.firstNameEn}.${name.lastNameEn}${tag}@example.com`.toLowerCase(),
        birthDate: formatIsoDate(birth),
        birthDateBE: formatThaiDate(birth),
        address: address(rng),
      };
    },
    /** Build `count` items with any generator, e.g. `many(10, td.person)`. */
    many: <T>(count: number, factory: () => T): T[] => Array.from({ length: count }, () => factory()),
    /**
     * Like many(), but with no duplicates (values are compared as JSON), e.g. `unique(30000, td.phone)`.
     * Throws when `maxAttempts` calls cannot produce `count` distinct values.
     */
    unique: <T>(count: number, factory: () => T, maxAttempts = count * 50 + 100): T[] => {
      const seen = new Set<string>();
      const out: T[] = [];
      for (let i = 0; i < maxAttempts && out.length < count; i++) {
        const value = factory();
        const key = JSON.stringify(value);
        if (!seen.has(key)) {
          seen.add(key);
          out.push(value);
        }
      }
      if (out.length < count) {
        throw new Error(`Only found ${out.length} unique values out of ${count} requested`);
      }
      return out;
    },
  };
  return gen;
}

export type ThaiData = ReturnType<typeof createThaiData>;

/** Ready-to-use unseeded generator. */
export const thaiData = createThaiData();
