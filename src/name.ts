import { pick, type Rng } from "./random.js";

export type Gender = "male" | "female";

interface NamePart {
  th: string;
  en: string;
}

const MALE_FIRST: readonly NamePart[] = [
  { th: "สมชาย", en: "Somchai" }, { th: "สมศักดิ์", en: "Somsak" }, { th: "ธนพล", en: "Thanaphon" },
  { th: "ณัฐวุฒิ", en: "Nattawut" }, { th: "กิตติพงษ์", en: "Kittipong" }, { th: "วีระพงษ์", en: "Weerapong" },
  { th: "อนุชา", en: "Anucha" }, { th: "ประเสริฐ", en: "Prasert" }, { th: "ชัยวัฒน์", en: "Chaiwat" },
  { th: "ภาณุวัฒน์", en: "Panuwat" }, { th: "ธีรภัทร", en: "Teerapat" }, { th: "พงศกร", en: "Pongsakorn" },
];

const FEMALE_FIRST: readonly NamePart[] = [
  { th: "สมหญิง", en: "Somying" }, { th: "สุภาพร", en: "Supaporn" }, { th: "กาญจนา", en: "Kanchana" },
  { th: "ณัฐธิดา", en: "Natthida" }, { th: "พิมพ์ชนก", en: "Pimchanok" }, { th: "วรรณา", en: "Wanna" },
  { th: "อรอุมา", en: "Onuma" }, { th: "ศิริพร", en: "Siriporn" }, { th: "ปิยะนุช", en: "Piyanuch" },
  { th: "ชนิดา", en: "Chanida" }, { th: "กมลชนก", en: "Kamonchanok" }, { th: "รัตนา", en: "Rattana" },
];

const LAST: readonly NamePart[] = [
  { th: "ใจดี", en: "Jaidee" }, { th: "รักไทย", en: "Rakthai" }, { th: "ศรีสุข", en: "Srisuk" },
  { th: "มั่นคง", en: "Mankong" }, { th: "สุขสวัสดิ์", en: "Suksawat" }, { th: "ทองดี", en: "Thongdee" },
  { th: "แก้วมณี", en: "Kaewmanee" }, { th: "บุญมา", en: "Boonma" }, { th: "วงศ์สวัสดิ์", en: "Wongsawat" },
  { th: "พรหมมา", en: "Promma" }, { th: "เจริญผล", en: "Charoenphon" }, { th: "ศรีประเสริฐ", en: "Sriprasert" },
];

const TITLES = {
  male: { th: "นาย", en: "Mr." },
  female: { th: "นางสาว", en: "Ms." },
} as const;

export interface PersonName {
  gender: Gender;
  titleTh: string;
  titleEn: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  fullNameTh: string;
  fullNameEn: string;
}

export function personName(rng: Rng, gender?: Gender): PersonName {
  const g: Gender = gender ?? (rng() < 0.5 ? "male" : "female");
  const first = pick(rng, g === "male" ? MALE_FIRST : FEMALE_FIRST);
  const last = pick(rng, LAST);
  const title = TITLES[g];
  return {
    gender: g,
    titleTh: title.th,
    titleEn: title.en,
    firstNameTh: first.th,
    lastNameTh: last.th,
    firstNameEn: first.en,
    lastNameEn: last.en,
    fullNameTh: `${title.th}${first.th} ${last.th}`,
    fullNameEn: `${title.en} ${first.en} ${last.en}`,
  };
}
