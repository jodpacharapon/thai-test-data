import { pick, type Rng } from "./random.js";
import { FEMALE_FIRST, MALE_FIRST, SURNAME_BACK, SURNAME_FRONT, type NameRow } from "./data/names.js";

export type Gender = "male" | "female";

/** "adult": นาย / นางสาว / นาง. "child": เด็กชาย / เด็กหญิง (used for under 15). */
export type TitleMode = "adult" | "child";

export interface NameOptions {
  gender?: Gender;
  /** Which set of titles to use. Default "adult". */
  titles?: TitleMode;
}

interface Title {
  th: string;
  en: string;
}

const TITLES: Record<TitleMode, Record<Gender, readonly Title[]>> = {
  adult: {
    male: [{ th: "นาย", en: "Mr." }],
    female: [{ th: "นางสาว", en: "Ms." }, { th: "นาง", en: "Mrs." }],
  },
  child: {
    male: [{ th: "เด็กชาย", en: "Master" }],
    female: [{ th: "เด็กหญิง", en: "Miss" }],
  },
};

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

/** Thai text and one of its English spellings, picked at random. */
function spell(rng: Rng, row: NameRow): { th: string; en: string } {
  const [th, ...en] = row;
  return { th, en: pick(rng, en) };
}

function surname(rng: Rng): { th: string; en: string } {
  const front = spell(rng, pick(rng, SURNAME_FRONT));
  let back = spell(rng, pick(rng, SURNAME_BACK));
  while (back.th === front.th) back = spell(rng, pick(rng, SURNAME_BACK));
  return { th: front.th + back.th, en: front.en + back.en };
}

export function personName(rng: Rng, genderOrOptions?: Gender | NameOptions): PersonName {
  const options: NameOptions = typeof genderOrOptions === "string" ? { gender: genderOrOptions } : genderOrOptions ?? {};
  const g: Gender = options.gender ?? (rng() < 0.5 ? "male" : "female");
  const title = pick(rng, TITLES[options.titles ?? "adult"][g]);
  const first = spell(rng, pick(rng, g === "male" ? MALE_FIRST : FEMALE_FIRST));
  const last = surname(rng);
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
