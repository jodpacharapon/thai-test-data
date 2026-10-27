import { createThaiData, seededRng, breakThaiId, LOCALITIES, PROVINCES, lookupPostalCode, isValidThaiId, thaiIdCheckDigit, formatThaiId, formatPhone, toE164 } from "./lib/index.js";

const $ = (id) => document.getElementById(id);

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 1400);
}
async function copy(text, done = "Copied") {
  try { await navigator.clipboard.writeText(text); toast(done); return true; }
  catch { toast("Copy ไม่สำเร็จ ลอง select ข้อความแล้วกด Ctrl+C"); return false; }
}

// Theme
const root = document.documentElement;
try { const saved = localStorage.getItem("theme"); if (saved) root.dataset.theme = saved; } catch {}
const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
// The button shows the mode you switch to.
const paintThemeBtn = () => { document.querySelector(".theme-label").textContent = isDark() ? "Light mode" : "Dark mode"; };
$("themeBtn").addEventListener("click", () => {
  root.dataset.theme = isDark() ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  paintThemeBtn();
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", paintThemeBtn);
paintThemeBtn();

// Views
const VIEWS = ["generate", "validate", "docs", "report"];
function showView() {
  const name = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "generate";
  VIEWS.forEach((v) => { $("view-" + v).hidden = v !== name; });
  document.querySelectorAll(".tabs a").forEach((a) => {
    if (a.dataset.view === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}
addEventListener("hashchange", () => { showView(); scrollTo(0, 0); if (location.hash === "#report") fillReportContext(); });
showView();

// ---- Data types and their settings -------------------------------------------------
// Each type declares its controls (like a password generator) and a gen(td, o, rng)
// that returns a value, or { value, ok, note } when it can produce negative cases.
const GROUPS = { id: "บัตรและภาษี", phone: "เบอร์โทร", name: "ชื่อและอีเมล", address: "ที่อยู่", date: "วันที่", person: "ครบชุด" };

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
const HELP = {
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

const TYPES = [
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

// Settings per type, kept while switching between types.
const settings = Object.fromEntries(TYPES.map((t) => [t.key, Object.fromEntries(t.controls.map((c) => [c.id, Array.isArray(c.def) ? [...c.def] : c.def]))]));
let current = TYPES[0];
let values = [];

// Type list
const typeButtons = [];
const groupLabels = [];
Object.entries(GROUPS).forEach(([gKey, gLabel]) => {
  const label = document.createElement("div");
  label.className = "group-label";
  label.textContent = gLabel;
  $("typeList").appendChild(label);
  label.members = TYPES.filter((t) => t.group === gKey).map((t) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "type";
    b.setAttribute("role", "option");
    b.textContent = t.title;
    b.addEventListener("click", () => select(t));
    $("typeList").appendChild(b);
    const entry = { t, b, text: `${t.title} ${t.keys} ${gLabel}`.toLowerCase() };
    typeButtons.push(entry);
    return entry;
  });
  groupLabels.push(label);
});
const noMatch = document.createElement("p");
noMatch.className = "no-match";
noMatch.hidden = true;
noMatch.innerHTML = 'ไม่พบ อยากให้มีเพิ่ม? <a href="https://github.com/jodpacharapon/thai-test-data/issues" target="_blank" rel="noopener">เปิด issue</a>';
$("typeList").appendChild(noMatch);

$("q").addEventListener("input", (e) => {
  const terms = e.target.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let shown = 0;
  typeButtons.forEach((x) => { x.b.hidden = !terms.every((t) => x.text.includes(t)); if (!x.b.hidden) shown++; });
  groupLabels.forEach((l) => { l.hidden = l.members.every((m) => m.b.hidden); });
  noMatch.hidden = shown > 0;
});
$("q").addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const first = typeButtons.find((x) => !x.b.hidden);
  if (first) select(first.t);
});

// Settings panel
function renderConfig() {
  const o = settings[current.key];
  const box = $("config");
  box.replaceChildren();
  current.controls.forEach((c) => {
    if (c.when && !c.when(o)) return;
    const group = document.createElement("fieldset");
    group.className = "cfg cfg-" + c.kind;
    const legend = document.createElement("legend");
    legend.textContent = c.label;
    const help = c.help ?? HELP[c.id];
    if (help) {
      const info = document.createElement("button");
      info.type = "button";
      info.className = "info";
      info.textContent = "i";
      info.setAttribute("aria-label", `${c.label} คืออะไร`);
      info.dataset.tip = help;
      legend.append(info);
    }
    group.appendChild(legend);
    const name = `${current.key}-${c.id}`;

    if (c.kind === "seg") {
      const seg = document.createElement("div");
      seg.className = "seg";
      c.choices.forEach(([val, label]) => {
        const id = `${name}-${val}`;
        const input = Object.assign(document.createElement("input"), { type: "radio", name, id, value: val, checked: o[c.id] === val });
        const lab = Object.assign(document.createElement("label"), { htmlFor: id, textContent: label });
        if (c.id === "case") lab.dataset.case = val;
        input.addEventListener("change", () => { o[c.id] = val; renderConfig(); generate(); });
        seg.append(input, lab);
      });
      group.appendChild(seg);
    } else if (c.kind === "checks") {
      const list = document.createElement("div");
      list.className = "checks";
      c.choices.forEach(([val, label]) => {
        const id = `${name}-${val}`;
        const wrap = document.createElement("label");
        wrap.className = "check";
        wrap.htmlFor = id;
        const input = Object.assign(document.createElement("input"), { type: "checkbox", id, value: val, checked: o[c.id].includes(val) });
        input.addEventListener("change", () => {
          o[c.id] = c.choices.map(([v]) => v).filter((v) => document.getElementById(`${name}-${v}`).checked);
          generate();
        });
        wrap.append(input, document.createTextNode(label));
        list.appendChild(wrap);
      });
      group.appendChild(list);
      if (c.id === "bad") {
        const hint = document.createElement("small");
        hint.className = "cfg-hint";
        hint.textContent = "ไม่เลือกเลย = ได้แต่ valid data";
        group.appendChild(hint);
      }
    } else if (c.kind === "select") {
      const sel = document.createElement("select");
      sel.id = name;
      c.choices.forEach(([val, label]) => sel.appendChild(Object.assign(document.createElement("option"), { value: val, textContent: label, selected: o[c.id] === val })));
      sel.addEventListener("change", () => { o[c.id] = sel.value; generate(); });
      group.appendChild(sel);
    } else if (c.kind === "number") {
      const input = Object.assign(document.createElement("input"), { type: "number", id: name, min: c.min, max: c.max, value: o[c.id] });
      input.addEventListener("change", () => {
        o[c.id] = Math.min(c.max, Math.max(c.min, Number(input.value) || 0));
        input.value = o[c.id];
        generate();
      });
      group.appendChild(input);
    }
    box.appendChild(group);
  });
  box.hidden = box.childElementCount === 0;
}

function select(t) {
  current = t;
  typeButtons.forEach((x) => x.b.setAttribute("aria-selected", String(x.t === t)));
  $("typeTitle").textContent = t.title;
  $("typeDesc").textContent = t.desc;
  renderConfig();
  generate();
}

// Results. Generators return a plain value, or { value, ok, note } for test cases.
const norm = (it) => (it && typeof it === "object" && "value" in it ? it : { value: it });
const hasCase = () => values.length > 0 && values[0].ok !== undefined;
const isTable = () => values.length > 0 && typeof values[0].value === "object";
const statusText = (r) => (r.ok ? (r.okNote ? "Valid · " + r.okNote : "Valid") : "Invalid · " + r.note);

const MAX_COUNT = 100000;
const DISPLAY_LIMIT = 200;
const fmt = (n) => n.toLocaleString("en-US");

function generate() {
  const count = Math.min(MAX_COUNT, Math.max(1, Number($("count").value) || 1));
  const seedVal = $("seed").value;
  const td = createThaiData(seedVal === "" ? {} : { seed: Number(seedVal) });
  const rng = seedVal === "" ? Math.random : seededRng(Number(seedVal) + 7919);
  const o = settings[current.key];
  if ($("unique").checked) {
    // Retry until there are enough distinct values; types with few possible values stop early.
    const seen = new Set();
    values = [];
    for (let i = 0; i < count * 50 + 100 && values.length < count; i++) {
      const r = norm(current.gen(td, o, rng));
      const key = JSON.stringify(r.value);
      if (!seen.has(key)) { seen.add(key); values.push(r); }
    }
  } else {
    values = Array.from({ length: count }, () => norm(current.gen(td, o, rng)));
  }
  const result = $("result");
  result.replaceChildren();
  const n = values.length;
  const bad = values.filter((r) => r.ok === false).length;
  const tally = hasCase() ? ` · valid ${fmt(n - bad)} · invalid ${fmt(bad)}` : "";
  const shortfall = n < count ? ` · unique ได้แค่ ${fmt(n)} จาก ${fmt(count)}` : "";
  const truncated = n > DISPLAY_LIMIT ? ` · แสดง ${DISPLAY_LIMIT} แถวแรก ใช้ Copy all, JSON หรือ CSV เพื่อเอาครบทุกแถว` : "";
  const summary = `${fmt(n)} rows${tally}${shortfall}`;

  if (isTable()) {
    const cols = Object.keys(values[0].value);
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    const table = document.createElement("table");
    const head = table.createTHead().insertRow();
    ["#", ...cols, ...(hasCase() ? ["Expected"] : [])].forEach((c) => { const th = document.createElement("th"); th.textContent = c; head.appendChild(th); });
    const body = table.createTBody();
    values.slice(0, DISPLAY_LIMIT).forEach((r, i) => {
      const tr = body.insertRow();
      tr.insertCell().textContent = i + 1;
      cols.forEach((c) => {
        const cell = tr.insertCell();
        cell.textContent = r.value[c];
        if (/^[\d+\-/]+$/.test(String(r.value[c]))) cell.className = "mono";
      });
      if (hasCase()) {
        const st = document.createElement("span");
        st.className = "st " + (r.ok ? "ok" : "bad");
        st.textContent = statusText(r);
        tr.insertCell().appendChild(st);
      }
    });
    wrap.appendChild(table);
    result.appendChild(wrap);
    $("sheetFoot").textContent = `${summary}${truncated || " · ใช้ปุ่ม JSON หรือ CSV เพื่อ export ทั้งตาราง"}`;
    return;
  }

  const list = document.createElement("ol");
  list.className = "rows";
  values.slice(0, DISPLAY_LIMIT).forEach((r) => {
    const v = r.value;
    const li = document.createElement("li");
    li.className = "row";
    li.tabIndex = 0;
    li.innerHTML = '<span class="val"></span><span class="st"></span><span class="hint">Copy</span>';
    const val = li.querySelector(".val");
    val.textContent = v.trim() === "" ? `"${v}"` : v;
    if (/[ก-๙]/.test(v) && !/^\d/.test(v) || /, /.test(v)) val.classList.add("text");
    if (r.ok !== undefined) {
      const st = li.querySelector(".st");
      st.classList.add(r.ok ? "ok" : "bad");
      st.textContent = statusText(r);
      if (r.ok) st.title = r.note;
    }
    const doCopy = async () => {
      if (!(await copy(v, "Copied"))) return;
      li.classList.add("copied");
      li.querySelector(".hint").textContent = "✓";
      setTimeout(() => { li.classList.remove("copied"); li.querySelector(".hint").textContent = "Copy"; }, 1200);
    };
    li.addEventListener("click", doCopy);
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doCopy(); } });
    list.appendChild(li);
  });
  result.appendChild(list);
  $("sheetFoot").textContent = `${summary} · คลิกแถวเพื่อ copy${truncated}`;
}

const toCsv = () => {
  const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const caseCols = hasCase() ? ["expected", "reason"] : [];
  const caseVals = (r) => (hasCase() ? [r.ok ? "valid" : "invalid", r.ok ? "" : r.note] : []);
  if (isTable()) {
    const cols = Object.keys(values[0].value);
    return [[...cols, ...caseCols].map(esc).join(","), ...values.map((r) => [...cols.map((c) => r.value[c]), ...caseVals(r)].map(esc).join(","))].join("\n");
  }
  return [["value", ...caseCols].map(esc).join(","), ...values.map((r) => [r.value, ...caseVals(r)].map(esc).join(","))].join("\n");
};
const toJson = () => JSON.stringify(values.map((r) => (r.ok === undefined ? r.value : { value: r.value, expected: r.ok ? "valid" : "invalid", reason: r.ok ? "" : r.note })), null, 2);

$("regen").addEventListener("click", generate);
$("count").addEventListener("change", generate);
$("seed").addEventListener("change", generate);
$("unique").addEventListener("change", generate);
$("copyAll").addEventListener("click", () => copy(isTable() ? toCsv() : values.map((r) => r.value).join("\n"), `Copied ${fmt(values.length)} rows`));
$("copyJson").addEventListener("click", () => copy(toJson(), "Copied JSON"));
$("dlCsv").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + toCsv()], { type: "text/csv;charset=utf-8" }));
  a.download = `thai-test-data-${current.key}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
});

select(TYPES[0]);

// Validator with the check-digit working shown digit by digit.
function validate() {
  const raw = $("idInput").value.trim();
  const digits = raw.replace(/\D/g, "");
  const verdict = $("verdict");
  verdict.replaceChildren();
  $("calc").hidden = digits.length < 12;
  if (!raw) { verdict.className = "verdict"; return; }

  const ok = isValidThaiId(raw);
  const stamp = document.createElement("span");
  stamp.className = "stamp";
  const note = document.createElement("small");
  if (digits.length !== 13) {
    stamp.textContent = "Invalid length";
    note.textContent = `ต้องมี 13 หลัก ตอนนี้มี ${digits.length}`;
  } else if (ok) {
    stamp.textContent = "Valid";
    note.textContent = digits[0] === "0" ? "เลขนิติบุคคล" : "เลขบุคคลธรรมดา";
  } else {
    stamp.textContent = "Invalid check digit";
    note.textContent = `หลักสุดท้ายควรเป็น ${thaiIdCheckDigit(digits.slice(0, 12))}`;
  }
  verdict.className = "verdict " + (ok ? "ok" : "bad");
  verdict.append(stamp, note);
  if (digits.length >= 12) renderCalc(digits.slice(0, 13));
}

function renderCalc(d) {
  const grid = $("calcGrid");
  grid.replaceChildren();
  const cell = (text, cls = "") => { const el = document.createElement("div"); el.textContent = text; el.className = cls; grid.appendChild(el); };
  const rows = [
    ["digit", (i) => i < 12 ? d[i] : (d[12] ?? "?")],
    ["× weight", (i) => i < 12 ? 13 - i : ""],
    ["product", (i) => i < 12 ? Number(d[i]) * (13 - i) : ""],
  ];
  rows.forEach(([label, fn], r) => {
    const last = r === rows.length - 1 ? " last" : "";
    cell(label, "lbl" + last);
    for (let i = 0; i < 13; i++) cell(String(fn(i)), (i === 12 ? "chk" : "") + last);
  });
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(d[i]) * (13 - i);
  const mod = sum % 11;
  const check = (11 - mod) % 10;
  $("calcSteps").innerHTML = "";
  const lines = [
    `sum = <b>${sum}</b>`,
    `${sum} mod 11 = <b>${mod}</b>`,
    `check digit = (11 − ${mod}) mod 10 = <b>${check}</b>`,
  ];
  $("calcSteps").innerHTML = lines.join("<br>");
}

$("idInput").addEventListener("input", validate);
validate();

function validateZip() {
  const raw = $("zipInput").value.trim();
  const code = raw.replace(/\s/g, "");
  const verdict = $("zipVerdict"), areas = $("zipAreas");
  verdict.replaceChildren();
  areas.replaceChildren();
  if (!raw) { verdict.className = "verdict"; return; }
  const found = lookupPostalCode(code);
  const stamp = document.createElement("span");
  stamp.className = "stamp";
  const note = document.createElement("small");
  if (!/^\d{5}$/.test(code)) {
    stamp.textContent = /\D/.test(code) ? "Invalid characters" : "Invalid length";
    note.textContent = /\D/.test(code) ? "รหัสไปรษณีย์มีแต่ตัวเลข" : `ตอนนี้มี ${code.length} หลัก`;
  } else if (!found.length) {
    stamp.textContent = "Not found";
    const near = [...new Set(LOCALITIES.filter((l) => l.postalCode.startsWith(code.slice(0, 2))).map((l) => l.province))];
    note.textContent = near.length ? `รหัสที่ขึ้นต้นด้วย ${code.slice(0, 2)} เป็นของ${near.join(", ")}` : "";
  } else {
    stamp.textContent = "Valid";
    const provinces = [...new Set(found.map((l) => l.province))];
    note.textContent = `${found.length} ตำบล/แขวง ใน${provinces.join(", ")}`;
    const table = document.createElement("table");
    const head = table.createTHead().insertRow();
    ["ตำบล/แขวง", "อำเภอ/เขต", "จังหวัด"].forEach((c) => { const th = document.createElement("th"); th.textContent = c; head.appendChild(th); });
    const body = table.createTBody();
    found.forEach((l) => { const tr = body.insertRow(); [l.subdistrict, l.district, l.province].forEach((t) => { tr.insertCell().textContent = t; }); });
    areas.appendChild(table);
  }
  verdict.className = "verdict " + (found.length ? "ok" : "bad");
  verdict.append(stamp, note);
}
$("zipInput").addEventListener("input", validateZip);
validateZip();

// Report: build a prefilled GitHub issue URL (issue forms accept field ids as query params).
const ISSUE_URL = "https://github.com/jodpacharapon/thai-test-data/issues/new";
const reportKind = () => document.querySelector('input[name="kind"]:checked').value;

function contextText() {
  return [
    `Data type: ${current.title} (${current.key})`,
    `Settings: ${JSON.stringify(settings[current.key])}`,
    `Count: ${$("count").value || 10}, Seed: ${$("seed").value || "(random)"}`,
    `Example values: ${values.slice(0, 3).map((r) => JSON.stringify(r.value)).join(", ")}`,
  ].join("\n");
}
function fillReportContext() {
  const steps = $("bugSteps");
  if (!steps.dataset.edited) steps.value = `1. เปิด Generator เลือก ${current.title}\n2. ตั้งค่าตามด้านล่าง แล้วกด Generate\n3. `;
  setContext($("bugContext").checked);
}
// Keep the context block in the textarea in sync with the checkbox, so what you see is what gets sent.
function setContext(on) {
  const steps = $("bugSteps");
  const base = steps.value.replace(/\n*Data type:[\s\S]*$/, "");
  steps.value = on ? `${base}\n\n${contextText()}` : base;
  updateIssueLink();
}
function updateIssueLink() {
  const q = new URLSearchParams();
  if (reportKind() === "bug") {
    q.set("template", "bug_report.yml");
    q.set("title", $("bugTitle").value.trim() || "Bug: ");
    q.set("what", $("bugWhat").value);
    q.set("steps", $("bugSteps").value);
    q.set("where", "Web app");
    if ($("bugContext").checked) q.set("version", navigator.userAgent);
  } else {
    q.set("template", "feature_request.yml");
    q.set("title", $("featTitle").value.trim() || "Feature: ");
    q.set("need", $("featNeed").value);
    q.set("rule", $("featRule").value);
    q.set("usecase", $("featUse").value);
  }
  $("openIssue").href = `${ISSUE_URL}?${q}`;
}
document.querySelectorAll('input[name="kind"]').forEach((r) => r.addEventListener("change", () => {
  document.querySelectorAll(".field-group").forEach((g) => { g.hidden = g.dataset.for !== reportKind(); });
  updateIssueLink();
}));
$("bugSteps").addEventListener("input", () => { $("bugSteps").dataset.edited = "1"; });
$("bugContext").addEventListener("change", (e) => setContext(e.target.checked));
$("reportForm").addEventListener("input", updateIssueLink);
$("reportForm").addEventListener("submit", (e) => e.preventDefault());
fillReportContext();

// Info tooltips: hover/focus shows them; a tap toggles them on touch screens.
// Shift the tooltip left when it would run past the right edge of the screen.
const placeTip = (e) => {
  const btn = e.target.closest?.(".info");
  if (!btn) return;
  const width = Math.min(280, innerWidth - 32);
  const left = btn.getBoundingClientRect().left - 8;
  const overflow = left + width - (document.documentElement.clientWidth - 12);
  btn.style.setProperty("--tip-x", `${-8 - Math.max(0, overflow)}px`);
};
document.addEventListener("pointerover", placeTip);
document.addEventListener("focusin", placeTip);
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".info");
  document.querySelectorAll(".info.open").forEach((b) => { if (b !== btn) b.classList.remove("open"); });
  if (btn) btn.classList.toggle("open");
});
