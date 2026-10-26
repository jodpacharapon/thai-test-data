import { seededRng, type Rng } from "./random.js";
import { citizenId, invalidCitizenId, juristicId } from "./id.js";
import { mobilePhone } from "./phone.js";
import { personName, type Gender, type PersonName } from "./name.js";
import { address, type Address } from "./address.js";
import { birthDate, formatIsoDate, formatThaiDate } from "./date.js";

export * from "./id.js";
export * from "./phone.js";
export * from "./date.js";
export { LOCALITIES, type Address } from "./address.js";
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
    citizenId: () => citizenId(rng),
    invalidCitizenId: () => invalidCitizenId(rng),
    juristicId: () => juristicId(rng),
    phone: () => mobilePhone(rng),
    name: (gender?: Gender) => personName(rng, gender),
    address: () => address(rng),
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
  };
  return gen;
}

export type ThaiData = ReturnType<typeof createThaiData>;

/** Ready-to-use unseeded generator. */
export const thaiData = createThaiData();
