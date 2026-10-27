// Data types and their settings.
// Each type declares its controls (like a password generator) and a gen(td, o, rng)
// that returns a value, or { value, ok, note } when it can produce negative cases.
import { breakThaiId, LOCALITIES, PROVINCES, lookupPostalCode, formatThaiId, formatPhone, toE164 } from "../../lib/index.js";

export const GROUPS = { id: "บัตรและภาษี", phone: "เบอร์โทร", name: "ชื่อและอีเมล", address: "ที่อยู่", date: "วันที่", person: "ครบชุด" };

const CASE = { id: "case", label: "Test case", kind: "seg", choices: [["valid", "Valid"], ["invalid", "Invalid"], ["mixed", "Mixed"]], def: "valid" };
const ID_BAD = { id: "bad", label: "Invalid types", kind: "checks", when: (o) => o.case !== "valid",
  choices: [["checksum", "Wrong check digit"], ["short", "12 digits"], ["long", "14 digits"], ["letters", "Contains letters"]], def: ["checksum"] };
const ID_NOTE = { checksum: "wrong check digit", short: "12 digits", long: "14 digits", letters: "contains letters" };
const ID_FORMAT = { id: "format", label: "Format", kind: "seg", choices: [["plain", "ตัวเลขล้วน"], ["dash", "มีขีด"], ["space", "เว้นวรรค"]], def: "plain" };
const FIRST_DIGIT = [
  ["any", "Random 1-8"],
  ["1", "1 · คนไทย แจ้งเกิดตามกำหนด"],
  ["2", "2 · คนไทย แจ้งเกิดเกินกำหนด"],
  ["3", "3 · มีชื่อในทะเบียนบ้านก่อนปี 2527"],
  ["4", "4 · ย้ายเข้าแต่ยังไม่มีเลข"],
  ["5", "5 · ตกสำรวจ"],
  ["6", "6 · ต่างด้าวอยู่ชั่วคราว"],
  ["7", "7 · บุตรของผู้ถือเลขขึ้นต้น 6"],
  ["8", "8 · ต่างด้าวได้สัญชาติไทย"],
];

const pickOne = (rng, arr) => arr[Math.floor(rng() * arr.length)];
// Tooltip text for settings, by control id (a control's own `help` wins).
export const HELP = {
  case: "Valid = ผ่าน validation ทั้งหมด · Invalid = ผิดทั้งหมด ใช้ทำ negative test · Mixed = ปนกันประมาณครึ่งต่อครึ่ง ทุกแถวมี expected result บอกไว้",
  bad: "เลือกว่าจะให้ผิดแบบไหน เลือกหลายแบบได้ ระบบจะสุ่มสลับกัน",
  format: "รูปแบบการแสดงผลเท่านั้น ไม่มีผลกับว่าค่าถูกหรือผิด",
  first: "หลักแรกของเลขบัตรบอกประเภทบุคคล เช่น 1 = คนไทยแจ้งเกิดตามกำหนด, 3 = มีชื่อในทะเบียนบ้านก่อนปี 2527, 8 = ต่างด้าวได้สัญชาติไทย",
  province: "จำกัดให้สุ่มเฉพาะจังหวัดที่เลือก",
  prefixes: "เลขสองหลักแรกของเบอร์มือถือที่อนุญาตให้สุ่ม",
  fields: "เลือก column ที่ต้องการในตาราง",
};
const ROAD_EN = { "ถนนสุขุมวิท": "Sukhumvit Rd.", "ถนนพหลโยธิน": "Phahonyothin Rd.", "ถนนเพชรบุรี": "Phetchaburi Rd.", "ถนนรามคำแหง": "Ramkhamhaeng Rd.",
  "ถนนเจริญกรุง": "Charoen Krung Rd.", "ถนนมิตรภาพ": "Mittraphap Rd.", "ถนนเพชรเกษม": "Phetkasem Rd.", "ถนนสุดบรรทัด": "Sut Banthat Rd." };
// Decide whether this row is a negative case, and which kind.
function caseFor(o, rng) {
  const kinds = o.bad && o.bad.length ? o.bad : null;
  const invalid = o.case === "invalid" || (o.case === "mixed" && rng() < 0.5);
  return invalid && kinds ? pickOne(rng, kinds) : null;
}
function formatId(v, f) {
  if (!/^\d{13}$/.test(v)) return v;
  if (f === "dash") return formatThaiId(v);
  if (f === "space") return formatThaiId(v).replace(/-/g, " ");
  return v;
}

export const TYPES = [
  { key: "citizen", group: "id", title: "เลขบัตรประชาชน", desc: "13 หลัก check digit ถูกต้อง เลือก invalid case สำหรับ negative test ได้", keys: "citizen id national invalid negative ขีด",
    controls: [CASE, ID_BAD, ID_FORMAT, { id: "first", label: "First digit (ประเภทบุคคล)", kind: "select", choices: FIRST_DIGIT, def: "any", when: (o) => o.case !== "invalid" }],
    gen: (td, o, rng) => {
      const bad = caseFor(o, rng);
      const valid = td.citizenId(o.first === "any" ? undefined : Number(o.first));
      if (!bad) return { value: formatId(valid, o.format), ok: true, note: "บุคคลธรรมดา ประเภท " + valid[0] };
      return { value: formatId(breakThaiId(td.random, valid, bad), o.format), ok: false, note: ID_NOTE[bad] };
    } },
  { key: "juristic", group: "id", title: "เลขผู้เสียภาษีนิติบุคคล", desc: "13 หลัก ขึ้นต้นด้วย 0 ใช้สูตร check digit เดียวกับบัตรประชาชน", keys: "นิติบุคคล บริษัท ภาษี tax juristic company",
    controls: [CASE, ID_BAD, ID_FORMAT],
    gen: (td, o, rng) => {
      const bad = caseFor(o, rng);
      const valid = td.juristicId();
      if (!bad) return { value: formatId(valid, o.format), ok: true, note: "นิติบุคคล" };
      return { value: formatId(breakThaiId(td.random, valid, bad), o.format), ok: false, note: ID_NOTE[bad] };
    } },
  { key: "phone", group: "phone", title: "เบอร์มือถือ", desc: "10 หลัก ขึ้นต้นด้วย 06, 08 หรือ 09", keys: "โทรศัพท์ มือถือ phone mobile tel e164 +66",
    controls: [CASE,
      { id: "bad", label: "Invalid types", kind: "checks", when: (o) => o.case !== "valid",
        choices: [["prefix", "Wrong prefix (เช่น 02)"], ["short", "9 digits"], ["long", "11 digits"], ["letters", "Contains letters"]], def: ["prefix"] },
      { id: "prefixes", label: "ขึ้นต้นด้วย", kind: "checks", choices: [["06", "06"], ["08", "08"], ["09", "09"]], def: ["06", "08", "09"], when: (o) => o.case !== "invalid" },
      { id: "format", label: "Format", kind: "seg", choices: [["plain", "0812345678"], ["dash", "081-234-5678"], ["e164", "+66812345678"]], def: "plain" }],
    gen: (td, o, rng) => {
      const bad = caseFor(o, rng);
      const fmt = (v) => !/^0\d{9}$/.test(v) ? v : o.format === "dash" ? formatPhone(v) : o.format === "e164" ? toE164(v) : v;
      if (!bad) return { value: fmt(td.phone(o.prefixes.length ? o.prefixes : undefined)), ok: true, note: "มือถือ" };
      const note = { prefix: "not a mobile prefix", short: "9 digits", long: "11 digits", letters: "contains letters" }[bad];
      return { value: fmt(td.invalidPhone(bad)), ok: false, note };
    } },
  { key: "name", group: "name", title: "ชื่อ-นามสกุล", desc: "ชื่อไทยพร้อมคำนำหน้า หรือชื่อที่เขียนเป็นภาษาอังกฤษ", keys: "ชื่อ นามสกุล name thai english",
    controls: [CASE,
      { id: "bad", label: "Invalid types", kind: "checks", when: (o) => o.case !== "valid",
        choices: [["digits", "Contains digits"], ["symbols", "Special characters"], ["long", "Over 100 chars"], ["blank", "Whitespace only"]], def: ["digits", "symbols"] },
      { id: "lang", label: "Language", kind: "seg", choices: [["th", "TH"], ["en", "EN"], ["both", "TH + EN"]], def: "th" },
      { id: "gender", label: "Gender", kind: "seg", choices: [["any", "Random"], ["male", "Male"], ["female", "Female"]], def: "any" },
      { id: "extra", label: "Include", kind: "checks", choices: [["title", "คำนำหน้า"]], def: ["title"] }],
    gen: (td, o, rng) => {
      const n = td.name(o.gender === "any" ? undefined : o.gender);
      const title = o.extra.includes("title");
      const th = (title ? n.titleTh : "") + n.firstNameTh + " " + n.lastNameTh;
      const en = (title ? n.titleEn + " " : "") + n.firstNameEn + " " + n.lastNameEn;
      const name = o.lang === "en" ? en : o.lang === "both" ? `${th} / ${en}` : th;
      const bad = caseFor(o, rng);
      if (!bad) return { value: name, ok: true, note: "" };
      if (bad === "digits") return { value: name.replace(" ", Math.floor(rng() * 900 + 100) + " "), ok: false, note: "contains digits" };
      if (bad === "symbols") return { value: name.replace(" ", pickOne(rng, ["@", "#", "$", "%", "*", "!"]) + " "), ok: false, note: "special characters" };
      if (bad === "long") return { value: (name + " ").repeat(Math.ceil(110 / (name.length + 1))).trim(), ok: false, note: "over 100 chars" };
      return { value: "   ", ok: false, note: "whitespace only" };
    } },
  { key: "email", group: "name", title: "อีเมล", desc: "ใช้ domain ที่สงวนไว้สำหรับตัวอย่าง ส่งอีเมลถึงใครจริงไม่ได้", keys: "email mail",
    controls: [CASE,
      { id: "bad", label: "Invalid types", kind: "checks", when: (o) => o.case !== "valid",
        choices: [["noAt", "Missing @"], ["noDomain", "Missing domain"], ["space", "Contains space"], ["doubleAt", "Double @"]], def: ["noAt", "noDomain"] },
      { id: "domain", label: "Domain", kind: "seg", choices: [["example.com", "example.com"], ["example.org", "example.org"], ["example.net", "example.net"]], def: "example.com" },
      { id: "extra", label: "Include", kind: "checks", choices: [["number", "ตัวเลขท้ายชื่อ"], ["upper", "ตัวพิมพ์ใหญ่ปน"]], def: ["number"] }],
    gen: (td, o, rng) => {
      const n = td.name();
      let user = `${n.firstNameEn}.${n.lastNameEn}`.toLowerCase();
      if (o.extra.includes("number")) user += Math.floor(rng() * 9000 + 1000);
      if (o.extra.includes("upper")) user = user[0].toUpperCase() + user.slice(1);
      const bad = caseFor(o, rng);
      if (!bad) return { value: `${user}@${o.domain}`, ok: true, note: "" };
      const v = { noAt: `${user}${o.domain}`, noDomain: `${user}@`, space: `${user.replace(".", " ")}@${o.domain}`, doubleAt: `${user}@@${o.domain}` }[bad];
      const note = { noAt: "missing @", noDomain: "missing domain", space: "contains space", doubleAt: "double @" }[bad];
      return { value: v, ok: false, note };
    } },
  { key: "address", group: "address", title: "ที่อยู่", desc: "ครบทุกตำบลทั่วประเทศ จังหวัด อำเภอ ตำบล และรหัสไปรษณีย์ตรงกันจริง", keys: "address บ้าน province district zip postal จังหวัด อำเภอ ตำบล รหัสไปรษณีย์ english",
    controls: [CASE,
      { id: "bad", label: "Invalid types", kind: "checks", when: (o) => o.case !== "valid",
        choices: [["zip", "Postal code ผิดพื้นที่"], ["zipShort", "Postal code 4 digits"], ["district", "District ผิดจังหวัด"]], def: ["zip", "district"] },
      { id: "format", label: "Format", kind: "seg", choices: [["full", "บรรทัดเดียว"], ["parts", "แยกช่อง"], ["en", "ภาษาอังกฤษ"]], def: "full" },
      { id: "province", label: "Province", kind: "select", def: "any",
        choices: [["any", "ทุกจังหวัด"], ["upcountry", "ทุกจังหวัดยกเว้นกรุงเทพฯ"], ...PROVINCES.map((p) => [p.th, p.th])] },
      { id: "extra", label: "Include", kind: "checks", choices: [["road", "ถนน"], ["moo", "หมู่ (ต่างจังหวัด)"]], def: ["road", "moo"] }],
    gen: (td, o, rng) => {
      const opts = o.province === "any" ? {} : o.province === "upcountry" ? { bangkok: false } : { province: o.province };
      const a = { ...td.address(opts) };
      const bad = caseFor(o, rng);
      let note = "";
      if (bad === "zip") {
        // A real postal code from another province, so it still looks plausible.
        let other = pickOne(rng, LOCALITIES);
        while (other.province === a.province || other.postalCode === a.postalCode) other = pickOne(rng, LOCALITIES);
        a.postalCode = other.postalCode;
        note = `รหัส ${other.postalCode} เป็นของ${other.province}`;
      } else if (bad === "zipShort") {
        a.postalCode = a.postalCode.slice(0, 4);
        note = "postal code 4 digits";
      } else if (bad === "district") {
        let other = pickOne(rng, LOCALITIES);
        while (other.province === a.province) other = pickOne(rng, LOCALITIES);
        a.district = other.district;
        a.districtEn = other.districtEn;
        note = `${other.district} อยู่ใน${other.province}`;
      }
      const road = o.extra.includes("road") ? a.road : "";
      const moo = o.extra.includes("moo") && a.moo ? a.moo : "";
      let value;
      if (o.format === "parts") {
        value = { "บ้านเลขที่": a.houseNo, "หมู่": moo || "-", "ถนน": road || "-", "ตำบล/แขวง": a.subdistrict, "อำเภอ/เขต": a.district, "จังหวัด": a.province, "รหัสไปรษณีย์": a.postalCode };
      } else if (o.format === "en") {
        const bkk = a.provinceEn === "Bangkok";
        value = [a.houseNo + (moo ? ` Moo ${moo}` : ""), road && ROAD_EN[road], `${bkk ? "Khwaeng" : "Tambon"} ${a.subdistrictEn}`, `${bkk ? "Khet" : "Amphoe"} ${a.districtEn}`, `${a.provinceEn} ${a.postalCode}`].filter(Boolean).join(", ");
      } else {
        value = [a.houseNo, moo && `หมู่ ${moo}`, road, a.subdistrict, a.district, a.province, a.postalCode].filter(Boolean).join(" ");
      }
      return { value, ok: !bad, note };
    } },
  { key: "postal", group: "address", title: "รหัสไปรษณีย์", desc: "รหัสที่ใช้งานจริงทั่วประเทศ เลือกจังหวัดได้ หรือ generate รหัสที่ไม่มีอยู่จริงสำหรับ negative test", keys: "zip postal code รหัสไปรษณีย์ ไปรษณีย์",
    controls: [CASE,
      { id: "bad", label: "Invalid types", kind: "checks", when: (o) => o.case !== "valid",
        choices: [["unknown", "Unknown code (5 digits)"], ["short", "4 digits"], ["long", "6 digits"], ["letters", "Contains letters"]], def: ["unknown"] },
      { id: "province", label: "Province", kind: "select", def: "any", when: (o) => o.case !== "invalid",
        choices: [["any", "ทุกจังหวัด"], ["upcountry", "ทุกจังหวัดยกเว้นกรุงเทพฯ"], ...PROVINCES.map((p) => [p.th, p.th])] }],
    gen: (td, o, rng) => {
      const bad = caseFor(o, rng);
      if (bad) {
        const note = { unknown: "unknown code", short: "4 digits", long: "6 digits", letters: "contains letters" }[bad];
        return { value: td.invalidPostalCode(bad), ok: false, note };
      }
      const opts = o.province === "any" ? {} : o.province === "upcountry" ? { bangkok: false } : { province: o.province };
      const code = td.postalCode(opts);
      // Some codes span provinces (83000 is Phuket and Ko Yao, Phang Nga); list the chosen province first.
      const area = [...lookupPostalCode(code)].sort((x, y) => (y.province === o.province) - (x.province === o.province));
      const provinces = [...new Set(area.map((l) => l.province))];
      const districts = [...new Set(area.map((l) => l.district))];
      return { value: code, ok: true, note: "", okNote: `${districts[0]}${districts.length > 1 ? ` +${districts.length - 1}` : ""} ${provinces.join(", ")}` };
    } },
  { key: "birth", group: "date", title: "วันเกิด", desc: "เลือกช่วงอายุและ format พ.ศ. หรือ ค.ศ. ได้", keys: "birth date วันเกิด พ.ศ. ค.ศ. iso buddhist",
    controls: [CASE,
      { id: "bad", label: "Invalid types", kind: "checks", when: (o) => o.case !== "valid",
        choices: [["impossible", "Impossible date (31/04)"], ["underage", "Under age"], ["future", "Future date"], ["era", "Wrong era (พ.ศ./ค.ศ.)"]], def: ["impossible", "underage"] },
      { id: "format", label: "Format", kind: "seg", choices: [["be", "วว/ดด/ปปปป (พ.ศ.)"], ["long", "5 มีนาคม 2535"], ["iso", "YYYY-MM-DD (ค.ศ.)"]], def: "be" },
      { id: "minAge", label: "Min age", kind: "number", def: 18, min: 0, max: 100 },
      { id: "maxAge", label: "Max age", kind: "number", def: 65, min: 0, max: 120 }],
    gen: (td, o, rng) => {
      const MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
      const pad = (n) => String(n).padStart(2, "0");
      // y is the year to print; parts let us print dates that cannot exist.
      const fmt = (d, m, y) => o.format === "iso" ? `${y}-${pad(m)}-${pad(d)}` : o.format === "long" ? `${d} ${MONTHS[m - 1]} ${y}` : `${pad(d)}/${pad(m)}/${y}`;
      const yearOf = (ce) => o.format === "iso" ? ce : ce + 543;
      const fromDate = (dt) => fmt(dt.getDate(), dt.getMonth() + 1, yearOf(dt.getFullYear()));
      const min = Math.max(0, Math.min(o.minAge, o.maxAge)), max = Math.max(o.minAge, o.maxAge);
      const bad = caseFor(o, rng);
      if (!bad) return { value: fromDate(td.birthDate(min, max)), ok: true, note: `age ${min}-${max}` };
      if (bad === "impossible") {
        const [d, m] = pickOne(rng, [[31, 4], [31, 6], [31, 9], [31, 11], [30, 2], [32, 1], [15, 13]]);
        return { value: fmt(d, m, yearOf(td.birthDate(min, max).getFullYear())), ok: false, note: "impossible date" };
      }
      if (bad === "underage") {
        if (min === 0) return { value: fromDate(td.birthDate(0, 0)), ok: false, note: "under age (min age ตั้งเป็น 0 อยู่)" };
        return { value: fromDate(td.birthDate(0, min - 1)), ok: false, note: `under ${min}` };
      }
      if (bad === "future") {
        const dt = new Date(); dt.setDate(dt.getDate() + 1 + Math.floor(rng() * 365));
        return { value: fromDate(dt), ok: false, note: "future date" };
      }
      const dt = td.birthDate(min, max);
      const wrongYear = o.format === "iso" ? dt.getFullYear() + 543 : dt.getFullYear();
      return { value: fmt(dt.getDate(), dt.getMonth() + 1, wrongYear), ok: false, note: o.format === "iso" ? "พ.ศ. year in ค.ศ. field" : "ค.ศ. year in พ.ศ. field" };
    } },
  { key: "person", group: "person", title: "บุคคลครบชุด", desc: "ทุกช่องเป็นของคนเดียวกัน เลือกได้ว่าจะเอาช่องไหน", keys: "person คน json ทั้งหมด",
    controls: [
      { id: "gender", label: "Gender", kind: "seg", choices: [["any", "Random"], ["male", "Male"], ["female", "Female"]], def: "any" },
      { id: "fields", label: "Fields", kind: "checks",
        choices: [["nameTh", "ชื่อไทย"], ["nameEn", "ชื่ออังกฤษ"], ["id", "เลขบัตร"], ["phone", "เบอร์"], ["email", "อีเมล"], ["birth", "วันเกิด"], ["address", "ที่อยู่"]],
        def: ["nameTh", "id", "phone", "email", "birth", "address"] }],
    gen: (td, o) => {
      const p = td.person(o.gender === "any" ? undefined : o.gender);
      const all = { nameTh: ["ชื่อ", p.fullNameTh], nameEn: ["Name", p.fullNameEn], id: ["เลขบัตร", p.citizenId], phone: ["เบอร์", p.phone],
        email: ["อีเมล", p.email], birth: ["วันเกิด", p.birthDateBE], address: ["ที่อยู่", p.address.fullAddress] };
      const fields = o.fields.length ? o.fields : ["nameTh"];
      return Object.fromEntries(fields.map((f) => all[f]));
    } },
];
