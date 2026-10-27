// Validation rules for the Validator. Each rule tests one line of input and says why it fails,
// like a regex tester that also knows the checks a regex can't express (check digits, real postal codes).
//
// A rule is:
//   key, title, hint        tab label and one-line description
//   pattern { source, note } the shape as a regex, shown in the pattern bar
//   checks                  extra checks beyond the regex, shown as chips
//   test(line)              → { ok, reason, spans?, data? }; spans are [start, end) ranges to highlight
//   samples(td)             → example lines, valid and invalid mixed
import { createThaiData, formatPhone, formatThaiId, isValidThaiId, lookupPostalCode, thaiIdCheckDigit, toE164 } from "../../lib/index.js";
import { compileRegex, findMatches } from "../core/regex.js";

const BE_OFFSET = 543;
const MONTHS_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const DAYS_TH = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

/** Range covering the line without its leading/trailing whitespace. */
const trimmedSpan = (line) => {
  const start = line.length - line.trimStart().length;
  return [[start, start + line.trim().length]];
};
const fail = (line, reason, data) => ({ ok: false, reason, spans: trimmedSpan(line), data });
const pass = (line, reason, data) => ({ ok: true, reason, spans: trimmedSpan(line), data });
const firstNonDigit = (s) => s.match(/[^\d]/)?.[0];

const thaiId = {
  key: "thaiId",
  title: "เลขบัตร 13 หลัก",
  hint: "บัตรประชาชนและเลขผู้เสียภาษีนิติบุคคล ใช้สูตร check digit เดียวกัน",
  pattern: { source: String.raw`^\d{13}$`, note: "หลังตัดขีดและช่องว่างออก" },
  checks: ["check digit (mod 11)"],
  test(line) {
    const d = line.trim().replace(/[\s-]/g, "");
    const bad = firstNonDigit(d);
    if (bad) return fail(line, `มีตัวอักษร "${bad}" ใช้ได้แค่ตัวเลข ขีด และช่องว่าง`);
    if (d.length !== 13) return fail(line, `ต้องมี 13 หลัก ตอนนี้มี ${d.length}`, { digits: d });
    const check = thaiIdCheckDigit(d.slice(0, 12));
    if (!isValidThaiId(d)) return fail(line, `check digit ควรเป็น ${check} แต่เป็น ${d[12]}`, { digits: d });
    return pass(line, d[0] === "0" ? "เลขนิติบุคคล" : `บุคคลธรรมดา ประเภท ${d[0]}`, { digits: d });
  },
  samples: (td) => [td.citizenId(), formatThaiId(td.citizenId()), td.juristicId(), td.invalidCitizenId("checksum"),
    formatThaiId(td.citizenId(3)), td.invalidCitizenId("short"), td.invalidCitizenId("letters"), td.invalidJuristicId("long")],
};

const MOBILE_PREFIX = /^0[689]/;
const phone = {
  key: "phone",
  title: "เบอร์มือถือ",
  hint: "10 หลัก ขึ้นต้นด้วย 06, 08 หรือ 09 รับแบบมีขีด เว้นวรรค หรือ +66",
  pattern: { source: String.raw`^0[689]\d{8}$`, note: "หลังตัดขีด ช่องว่าง และแปลง +66 เป็น 0" },
  checks: [],
  test(line) {
    const raw = line.trim().replace(/[\s-]/g, "");
    const local = raw.startsWith("+66") ? "0" + raw.slice(3) : raw;
    const bad = firstNonDigit(local);
    if (bad) return fail(line, `มีตัวอักษร "${bad}" ใช้ได้แค่ตัวเลข ขีด ช่องว่าง และ +66 ข้างหน้า`);
    // A wrong prefix is the more useful message: 02-123-4567 is a landline, not a short mobile number.
    if (local.length >= 2 && !MOBILE_PREFIX.test(local)) {
      const landline = local[1] === "2" ? " (02 คือเบอร์บ้านกรุงเทพฯ)" : "";
      return fail(line, `ขึ้นต้นด้วย ${local.slice(0, 2)} ไม่ใช่เบอร์มือถือ${landline}`, { local });
    }
    if (local.length !== 10) return fail(line, `ต้องมี 10 หลัก ตอนนี้มี ${local.length}`, { local });
    return pass(line, raw.startsWith("+66") ? "มือถือ · รูปแบบ E.164" : "มือถือ", { local });
  },
  samples: (td) => [td.phone(), formatPhone(td.phone()), toE164(td.phone()), td.invalidPhone("prefix"), td.phone(["06"]), td.invalidPhone("short"), td.invalidPhone("letters"), td.invalidPhone("long")],
};

const postal = {
  key: "postal",
  title: "รหัสไปรษณีย์",
  hint: "5 หลัก และต้องเป็นรหัสที่มีใช้จริง",
  pattern: { source: String.raw`^\d{5}$`, note: "" },
  checks: ["มีใช้จริง (7,436 ตำบล)"],
  test(line) {
    const code = line.trim().replace(/\s/g, "");
    if (firstNonDigit(code)) return fail(line, "รหัสไปรษณีย์มีแต่ตัวเลข");
    if (code.length !== 5) return fail(line, `ต้องมี 5 หลัก ตอนนี้มี ${code.length}`);
    const areas = lookupPostalCode(code);
    if (!areas.length) return fail(line, `ไม่มีรหัส ${code} ในระบบไปรษณีย์`, { code, areas });
    const provinces = [...new Set(areas.map((a) => a.province))];
    return pass(line, `${areas.length} ตำบล/แขวง ใน${provinces.join(", ")}`, { code, areas });
  },
  samples: (td) => [td.postalCode(), td.postalCode({ province: "เชียงใหม่" }), td.invalidPostalCode("unknown"), td.postalCode({ bangkok: false }), td.invalidPostalCode("short"), td.invalidPostalCode("letters")],
};

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const email = {
  key: "email",
  title: "อีเมล",
  hint: "รูปแบบที่ระบบส่วนใหญ่ยอมรับ ชื่อ@โดเมน.นามสกุล",
  pattern: { source: EMAIL.source, note: "" },
  checks: [],
  test(line) {
    const v = line.trim();
    const at = v.split("@").length - 1;
    if (/\s/.test(v)) return fail(line, "มีช่องว่าง");
    if (at === 0) return fail(line, "ไม่มี @");
    if (at > 1) return fail(line, `มี @ ${at} ตัว`);
    const [local, domain] = v.split("@");
    if (!local) return fail(line, "ไม่มีชื่อหน้า @");
    if (!domain) return fail(line, "ไม่มีโดเมนหลัง @");
    if (!domain.includes(".")) return fail(line, "โดเมนไม่มีจุด เช่น example.com");
    if (/\.\./.test(v) || local.startsWith(".") || local.endsWith(".")) return fail(line, "มีจุดติดกันหรือจุดที่ต้นหรือท้ายชื่อ");
    if (domain.endsWith(".") || domain.startsWith(".")) return fail(line, "โดเมนขึ้นต้นหรือลงท้ายด้วยจุด");
    if (!/^[A-Za-z]{2,}$/.test(domain.split(".").pop())) return fail(line, `นามสกุลโดเมน ".${domain.split(".").pop()}" ต้องเป็นตัวอักษรอย่างน้อย 2 ตัว`);
    if (!EMAIL.test(v)) return fail(line, "มีตัวอักษรที่ใช้ในอีเมลไม่ได้");
    return pass(line, domain, { local, domain });
  },
  samples: () => ["somchai.jaidee@example.com", "Malee.Sukjai2024@example.org", "somchai.jaideeexample.com", "nida@", "pim rak@example.net", "a@@example.com", "kittipong@example"],
};

const daysIn = (month, ceYear) => new Date(ceYear, month, 0).getDate();
const thaiDate = {
  key: "thaiDate",
  title: "วันที่ พ.ศ.",
  hint: "วว/ดด/ปปปป เป็นปี พ.ศ. และต้องเป็นวันที่มีจริง",
  pattern: { source: String.raw`^(\d{1,2})\/(\d{1,2})\/(\d{4})$`, note: "" },
  checks: ["ปี พ.ศ. 2400–2700", "วันที่มีจริง (รวม 29 ก.พ.)"],
  test(line) {
    const m = line.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return fail(line, "รูปแบบต้องเป็น วว/ดด/ปปปป เช่น 05/03/2535");
    const [day, month, year] = m.slice(1).map(Number);
    if (year >= 1900 && year < 2400) return fail(line, `ปี ${year} ดูเป็น ค.ศ. ปี พ.ศ. คือ ${year + BE_OFFSET}`);
    if (year < 2400 || year > 2700) return fail(line, `ปี ${year} อยู่นอกช่วง พ.ศ. 2400–2700`);
    if (month < 1 || month > 12) return fail(line, `ไม่มีเดือน ${month}`);
    const ce = year - BE_OFFSET;
    const max = daysIn(month, ce);
    if (day < 1 || day > max) return fail(line, `${MONTHS_TH[month - 1]} ${year} มีแค่ ${max} วัน`);
    const date = new Date(ce, month - 1, day);
    return pass(line, `วัน${DAYS_TH[date.getDay()]}ที่ ${day} ${MONTHS_TH[month - 1]} ${year}`, { date });
  },
  samples: (td) => {
    const fmt = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear() + BE_OFFSET}`;
    return [fmt(td.birthDate()), fmt(td.birthDate(20, 30)), "31/04/2535", "29/02/2567", "29/02/2566", "15/13/2540", "05/03/1992"];
  },
};

/** Rule for a pattern the user types. `fullMatch` anchors it to the whole line. */
export function customRule(source, flags, { fullMatch }) {
  // Compile the pattern as typed first: errors then quote what the user wrote, and a source
  // like "a)|(b" is rejected instead of escaping the ^(?:…)$ wrapper.
  const typed = compileRegex(source, flags);
  const { re, error } = typed.error || !fullMatch ? typed : compileRegex(`^(?:${source})$`, flags);
  return {
    key: "custom",
    title: "Regex กำหนดเอง",
    hint: "แต่ละบรรทัดผ่านเมื่อ regex ตรงกับข้อความ",
    pattern: { source, note: fullMatch ? "ต้องตรงทั้งบรรทัด" : "" },
    checks: [],
    error,
    test(line) {
      if (!re || !source) return { ok: false, reason: error ? "pattern ผิด" : "ยังไม่ได้ใส่ pattern", spans: [] };
      const matches = findMatches(re, line);
      if (!matches.length) return { ok: false, reason: "ไม่ตรง", spans: [] };
      // Zero-length matches (lookaheads, \b, \d*) still count; they just have nothing to highlight.
      const reason = matches.length > 1 ? `ตรง ${matches.length} จุด` : matches[0].text ? `ตรงกับ "${matches[0].text}"` : `ตรงแบบไม่มีตัวอักษร ที่ตำแหน่ง ${matches[0].start}`;
      const spans = matches.filter((m) => m.end > m.start).map((m) => [m.start, m.end]);
      return { ok: true, reason, spans, data: { matches } };
    },
    samples: () => ["0812345678", "081-234-5678", "0212345678", "+66812345678", "08123", "0991234567"],
  };
}

export const RULES = [thaiId, phone, postal, email, thaiDate];

/** Default sample text for a rule, one value per line. */
export const sampleText = (rule, seed) => rule.samples(createThaiData(seed === undefined ? {} : { seed })).join("\n");

/**
 * Test every line of `text`. Blank lines are kept (so line numbers line up) but not tested.
 * @returns {{ line: string, n: number, result: ReturnType<typeof thaiId.test> | null }[]}
 */
export function testLines(rule, text, maxLines = Infinity) {
  return text.split("\n").slice(0, maxLines).map((line, i) => ({ line, n: i + 1, result: line.trim() === "" ? null : rule.test(line) }));
}
