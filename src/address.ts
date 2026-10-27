import { int, pick, type Rng } from "./random.js";
import { PROVINCE_ROWS } from "./data/localities.js";

export interface Locality {
  province: string;
  provinceEn: string;
  /** With its prefix, e.g. "เขตพระนคร" or "อำเภอเมืองเชียงใหม่". */
  district: string;
  districtEn: string;
  /** With its prefix, e.g. "แขวงพระบรมมหาราชวัง" or "ตำบลศรีภูมิ". */
  subdistrict: string;
  subdistrictEn: string;
  postalCode: string;
}

const BANGKOK = "กรุงเทพมหานคร";

/**
 * Every subdistrict in Thailand (77 provinces) with its district, province and postal code,
 * from kongvut/thai-province-data (MIT License).
 */
export const LOCALITIES: readonly Locality[] = PROVINCE_ROWS.flatMap(([province, provinceEn, districts]) => {
  const bkk = province === BANGKOK;
  return districts.flatMap(([district, districtEn, subs]) =>
    subs.map(([subdistrict, subdistrictEn, postalCode]) => ({
      province,
      provinceEn,
      district: (bkk ? "เขต" : "อำเภอ") + district,
      districtEn,
      subdistrict: (bkk ? "แขวง" : "ตำบล") + subdistrict,
      subdistrictEn,
      postalCode,
    })),
  );
});

/** Thai and English names of all 77 provinces, sorted in Thai order. */
export const PROVINCES: readonly { th: string; en: string }[] = PROVINCE_ROWS.map(([th, en]) => ({ th, en }));

const ROADS = ["ถนนสุขุมวิท", "ถนนพหลโยธิน", "ถนนเพชรบุรี", "ถนนรามคำแหง", "ถนนเจริญกรุง", "ถนนมิตรภาพ", "ถนนเพชรเกษม", "ถนนสุดบรรทัด"] as const;

export interface AddressOptions {
  /** Limit to one province, by Thai or English name, e.g. "เชียงใหม่" or "Chiang Mai". */
  province?: string;
  /** true for Bangkok only, false for everywhere except Bangkok. */
  bangkok?: boolean;
}

export interface Address extends Locality {
  houseNo: string;
  moo?: string;
  road: string;
  fullAddress: string;
}

const pools = new Map<string, readonly Locality[]>();
/** Localities matching the options; throws when none match. */
export function poolFor(options: AddressOptions): readonly Locality[] {
  const key = `${options.province ?? ""}|${options.bangkok ?? ""}`;
  let pool = pools.get(key);
  if (!pool) {
    pool = LOCALITIES.filter(
      (l) =>
        (options.province === undefined || l.province === options.province || l.provinceEn === options.province) &&
        (options.bangkok === undefined || (l.province === BANGKOK) === options.bangkok),
    );
    if (pool.length === 0) throw new Error(`No locality matches ${JSON.stringify(options)}`);
    pools.set(key, pool);
  }
  return pool;
}

export function address(rng: Rng, options: AddressOptions = {}): Address {
  const loc = pick(rng, poolFor(options));
  const houseNo = `${int(rng, 1, 999)}${rng() < 0.3 ? "/" + int(rng, 1, 99) : ""}`;
  const moo = loc.province === BANGKOK ? undefined : String(int(rng, 1, 15));
  const road = pick(rng, ROADS);
  const parts = [houseNo, moo && `หมู่ ${moo}`, road, loc.subdistrict, loc.district, loc.province, loc.postalCode];
  return { ...loc, houseNo, moo, road, fullAddress: parts.filter(Boolean).join(" ") };
}
