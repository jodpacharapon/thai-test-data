import { int, pick, type Rng } from "./random.js";

interface Locality {
  province: string;
  provinceEn: string;
  district: string;
  subdistrict: string;
  postalCode: string;
}

/**
 * A curated sample of real localities whose province, district, subdistrict and
 * postal code belong together. Extending this list is a great first contribution.
 */
export const LOCALITIES: readonly Locality[] = [
  { province: "กรุงเทพมหานคร", provinceEn: "Bangkok", district: "เขตพระนคร", subdistrict: "แขวงพระบรมมหาราชวัง", postalCode: "10200" },
  { province: "กรุงเทพมหานคร", provinceEn: "Bangkok", district: "เขตปทุมวัน", subdistrict: "แขวงลุมพินี", postalCode: "10330" },
  { province: "กรุงเทพมหานคร", provinceEn: "Bangkok", district: "เขตบางรัก", subdistrict: "แขวงสีลม", postalCode: "10500" },
  { province: "กรุงเทพมหานคร", provinceEn: "Bangkok", district: "เขตจตุจักร", subdistrict: "แขวงลาดยาว", postalCode: "10900" },
  { province: "กรุงเทพมหานคร", provinceEn: "Bangkok", district: "เขตห้วยขวาง", subdistrict: "แขวงห้วยขวาง", postalCode: "10310" },
  { province: "กรุงเทพมหานคร", provinceEn: "Bangkok", district: "เขตวัฒนา", subdistrict: "แขวงคลองตันเหนือ", postalCode: "10110" },
  { province: "นนทบุรี", provinceEn: "Nonthaburi", district: "อำเภอเมืองนนทบุรี", subdistrict: "ตำบลบางกระสอ", postalCode: "11000" },
  { province: "ปทุมธานี", provinceEn: "Pathum Thani", district: "อำเภอคลองหลวง", subdistrict: "ตำบลคลองหนึ่ง", postalCode: "12120" },
  { province: "สมุทรปราการ", provinceEn: "Samut Prakan", district: "อำเภอเมืองสมุทรปราการ", subdistrict: "ตำบลปากน้ำ", postalCode: "10270" },
  { province: "พระนครศรีอยุธยา", provinceEn: "Phra Nakhon Si Ayutthaya", district: "อำเภอพระนครศรีอยุธยา", subdistrict: "ตำบลประตูชัย", postalCode: "13000" },
  { province: "นครปฐม", provinceEn: "Nakhon Pathom", district: "อำเภอเมืองนครปฐม", subdistrict: "ตำบลพระปฐมเจดีย์", postalCode: "73000" },
  { province: "ชลบุรี", provinceEn: "Chon Buri", district: "อำเภอบางละมุง", subdistrict: "ตำบลหนองปรือ", postalCode: "20150" },
  { province: "ระยอง", provinceEn: "Rayong", district: "อำเภอเมืองระยอง", subdistrict: "ตำบลท่าประดู่", postalCode: "21000" },
  { province: "เชียงใหม่", provinceEn: "Chiang Mai", district: "อำเภอเมืองเชียงใหม่", subdistrict: "ตำบลศรีภูมิ", postalCode: "50200" },
  { province: "เชียงใหม่", provinceEn: "Chiang Mai", district: "อำเภอเมืองเชียงใหม่", subdistrict: "ตำบลสุเทพ", postalCode: "50200" },
  { province: "เชียงราย", provinceEn: "Chiang Rai", district: "อำเภอเมืองเชียงราย", subdistrict: "ตำบลเวียง", postalCode: "57000" },
  { province: "พิษณุโลก", provinceEn: "Phitsanulok", district: "อำเภอเมืองพิษณุโลก", subdistrict: "ตำบลในเมือง", postalCode: "65000" },
  { province: "ขอนแก่น", provinceEn: "Khon Kaen", district: "อำเภอเมืองขอนแก่น", subdistrict: "ตำบลในเมือง", postalCode: "40000" },
  { province: "นครราชสีมา", provinceEn: "Nakhon Ratchasima", district: "อำเภอเมืองนครราชสีมา", subdistrict: "ตำบลในเมือง", postalCode: "30000" },
  { province: "อุดรธานี", provinceEn: "Udon Thani", district: "อำเภอเมืองอุดรธานี", subdistrict: "ตำบลหมากแข้ง", postalCode: "41000" },
  { province: "อุบลราชธานี", provinceEn: "Ubon Ratchathani", district: "อำเภอเมืองอุบลราชธานี", subdistrict: "ตำบลในเมือง", postalCode: "34000" },
  { province: "ภูเก็ต", provinceEn: "Phuket", district: "อำเภอเมืองภูเก็ต", subdistrict: "ตำบลตลาดใหญ่", postalCode: "83000" },
  { province: "สุราษฎร์ธานี", provinceEn: "Surat Thani", district: "อำเภอเมืองสุราษฎร์ธานี", subdistrict: "ตำบลตลาด", postalCode: "84000" },
  { province: "สงขลา", provinceEn: "Songkhla", district: "อำเภอหาดใหญ่", subdistrict: "ตำบลหาดใหญ่", postalCode: "90110" },
];

const ROADS = ["ถนนสุขุมวิท", "ถนนพหลโยธิน", "ถนนเพชรบุรี", "ถนนรามคำแหง", "ถนนเจริญกรุง", "ถนนมิตรภาพ"] as const;

export interface Address extends Locality {
  houseNo: string;
  moo?: string;
  road: string;
  fullAddress: string;
}

export function address(rng: Rng): Address {
  const loc = pick(rng, LOCALITIES);
  const houseNo = `${int(rng, 1, 999)}${rng() < 0.3 ? "/" + int(rng, 1, 99) : ""}`;
  const isBangkok = loc.provinceEn === "Bangkok";
  const moo = isBangkok ? undefined : String(int(rng, 1, 15));
  const road = pick(rng, ROADS);
  const parts = [houseNo, moo && `หมู่ ${moo}`, road, loc.subdistrict, loc.district, loc.province, loc.postalCode];
  return { ...loc, houseNo, moo, road, fullAddress: parts.filter(Boolean).join(" ") };
}
