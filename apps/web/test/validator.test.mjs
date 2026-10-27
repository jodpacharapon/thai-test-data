// Validator rules (src/validator/rules.js) and the regex helper (src/core/regex.js), run against the built dist/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { customRule, RULES, sampleText, testLines } from "../dist/src/validator/rules.js";
import { compileRegex, escapeRegex, findMatches } from "../dist/src/core/regex.js";
import { formatThaiId, thaiIdCheckDigit } from "../dist/lib/index.js";

const rule = (key) => RULES.find((r) => r.key === key);
const check = (key, line) => rule(key).test(line);
const withCheck = (first12) => first12 + thaiIdCheckDigit(first12);
const ID = withCheck("110170023070");
const WRONG = (Number(ID[12]) + 1) % 10;

test("Thai ID: accepts plain, dashed and juristic IDs", () => {
  assert.equal(check("thaiId", ID).ok, true);
  assert.equal(check("thaiId", formatThaiId(ID)).ok, true);
  assert.equal(check("thaiId", withCheck("010553600031")).reason, "เลขนิติบุคคล");
});

test("Thai ID: explains what is wrong", () => {
  assert.match(check("thaiId", ID.slice(0, 12) + WRONG).reason, new RegExp(`check digit ควรเป็น ${ID[12]} แต่เป็น ${WRONG}`));
  assert.match(check("thaiId", ID.slice(0, 12)).reason, /13 หลัก ตอนนี้มี 12/);
  assert.match(check("thaiId", "11017OO230705").reason, /ตัวอักษร "O"/);
});

test("Thai ID: highlights the value without surrounding spaces", () => {
  assert.deepEqual(check("thaiId", `  ${ID} `).spans, [[2, 15]]);
});

test("phone: accepts local, dashed and +66 forms", () => {
  assert.equal(check("phone", "0812345678").ok, true);
  assert.equal(check("phone", "081-234-5678").ok, true);
  assert.equal(check("phone", "+66812345678").reason, "มือถือ · รูปแบบ E.164");
});

test("phone: rejects landlines, wrong lengths and letters", () => {
  assert.match(check("phone", "0212345678").reason, /02 คือเบอร์บ้านกรุงเทพฯ/);
  assert.match(check("phone", "02-123-4567").reason, /ไม่ใช่เบอร์มือถือ/);
  assert.match(check("phone", "081234567").reason, /10 หลัก ตอนนี้มี 9/);
  assert.match(check("phone", "08123456O8").reason, /ตัวอักษร/);
});

test("postal code: must be 5 digits and in use", () => {
  assert.equal(check("postal", "50200").ok, true);
  assert.equal(check("postal", "5020").ok, false);
  assert.match(check("postal", "99999").reason, /ไม่มีรหัส 99999/);
});

test("email: gives a specific reason for common mistakes", () => {
  assert.equal(check("email", "a.b@example.com").ok, true);
  assert.equal(check("email", "ab.example.com").reason, "ไม่มี @");
  assert.equal(check("email", "a@@example.com").reason, "มี @ 2 ตัว");
  assert.equal(check("email", "a b@example.com").reason, "มีช่องว่าง");
  assert.match(check("email", "a@example").reason, /ไม่มีจุด/);
});

test("Thai date: checks the Buddhist-era year and real calendar days", () => {
  assert.equal(check("thaiDate", "29/02/2567").ok, true); // 2024 is a leap year
  assert.match(check("thaiDate", "29/02/2566").reason, /มีแค่ 28 วัน/);
  assert.match(check("thaiDate", "31/04/2535").reason, /มีแค่ 30 วัน/);
  assert.match(check("thaiDate", "05/03/1992").reason, /ค.ศ. ปี พ.ศ. คือ 2535/);
  assert.match(check("thaiDate", "15/13/2540").reason, /ไม่มีเดือน 13/);
});

test("custom regex: full-match mode anchors the pattern", () => {
  const r = customRule(String.raw`0[689]\d{8}`, "", { fullMatch: true });
  assert.equal(r.test("0812345678").ok, true);
  assert.equal(r.test("x0812345678").ok, false);
});

test("custom regex: find mode highlights every match with the g flag", () => {
  const r = customRule(String.raw`\d+`, "g", { fullMatch: false });
  const res = r.test("a1 b22 c333");
  assert.deepEqual(res.spans, [[1, 2], [4, 6], [8, 11]]);
  assert.equal(res.reason, "3 matches");
});

test("custom regex: zero-length matches count as a match", () => {
  const lookahead = customRule("^(?=.*\\d)(?=.*[A-Z])", "", { fullMatch: false });
  assert.equal(lookahead.test("Abc123").ok, true);
  assert.equal(lookahead.test("abc").ok, false);
  const star = customRule("\\d*", "", { fullMatch: false }).test("abc123");
  assert.equal(star.ok, true);
  assert.deepEqual(star.spans, []);
});

test("custom regex: full match can't be escaped and errors quote the typed pattern", () => {
  const escaped = customRule("a)|(b", "", { fullMatch: true });
  assert.ok(escaped.error);
  assert.equal(escaped.test("xb").ok, false);
  const broken = customRule("(abc", "", { fullMatch: true });
  assert.doesNotMatch(broken.error, /\^\(\?:/);
});

test("email: names the real problem with the domain ending", () => {
  assert.match(check("email", "a@example.c").reason, /นามสกุลโดเมน/);
  assert.match(check("email", "a@example.").reason, /ลงท้ายด้วยจุด/);
});

test("custom regex: reports a broken pattern instead of throwing", () => {
  const r = customRule("([", "", { fullMatch: false });
  assert.ok(r.error);
  assert.equal(r.test("anything").ok, false);
});

test("testLines keeps blank lines untested so line numbers line up", () => {
  const out = testLines(rule("postal"), "50200\n\n5020");
  assert.deepEqual(out.map((e) => [e.n, e.result?.ok ?? null]), [[1, true], [2, null], [3, false]]);
});

test("every rule's samples include both passing and failing lines", () => {
  for (const r of RULES) {
    const results = testLines(r, sampleText(r, 7)).map((e) => e.result.ok);
    assert.ok(results.includes(true) && results.includes(false), r.key);
  }
});

test("regex helper: validates flags and returns match positions and groups", () => {
  assert.match(compileRegex("a", "x").error, /flag/);
  assert.deepEqual(findMatches(/(\d)(\d)?/, "a12 b3").map((m) => [m.start, m.end, m.groups]), [[1, 3, ["1", "2"]]]);
  assert.equal(findMatches(/\d/g, "1a2").length, 2);
  assert.equal(escapeRegex("a.b*c"), String.raw`a\.b\*c`);
});
