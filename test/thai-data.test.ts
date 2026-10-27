import { describe, expect, it } from "vitest";
import {
  PROVINCES, ageOn, createThaiData, formatPhone, formatThaiDate, formatThaiDateLong, formatThaiId,
  isValidMobilePhone, isValidThaiId, LOCALITIES, thaiIdCheckDigit, toE164,
} from "../src/index.js";

const td = createThaiData({ seed: 42 });

describe("Thai ID", () => {
  it("computes the check digit for a hand-worked example", () => {
    // 1·13 + 2·12 + 3·11 + 4·10 + 5·9 + 6·8 + 7·7 + 8·6 + 9·5 + 0·4 + 1·3 + 2·2 = 352; 352 mod 11 = 0; (11 - 0) mod 10 = 1
    expect(thaiIdCheckDigit("123456789012")).toBe(1);
    expect(isValidThaiId("1234567890121")).toBe(true);
    expect(isValidThaiId("1-2345-67890-12-1")).toBe(true);
    expect(isValidThaiId("1234567890122")).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(isValidThaiId("123")).toBe(false);
    expect(isValidThaiId("abcdefghijklm")).toBe(false);
  });

  it("generates valid citizen IDs starting with 1-8", () => {
    for (const id of td.many(500, td.citizenId)) {
      expect(id).toMatch(/^[1-8]\d{12}$/);
      expect(isValidThaiId(id)).toBe(true);
    }
  });

  it("generates invalid IDs that still look like IDs", () => {
    for (const id of td.many(500, td.invalidCitizenId)) {
      expect(id).toMatch(/^\d{13}$/);
      expect(isValidThaiId(id)).toBe(false);
    }
  });

  it("generates valid juristic IDs starting with 0", () => {
    for (const id of td.many(200, td.juristicId)) {
      expect(id[0]).toBe("0");
      expect(isValidThaiId(id)).toBe(true);
    }
  });

  it("formats IDs", () => {
    expect(formatThaiId("1234567890121")).toBe("1-2345-67890-12-1");
  });
});

describe("phone", () => {
  it("generates valid mobile numbers", () => {
    for (const p of td.many(200, td.phone)) expect(isValidMobilePhone(p)).toBe(true);
  });

  it("formats and converts to E.164", () => {
    expect(formatPhone("0812345678")).toBe("081-234-5678");
    expect(toE164("081-234-5678")).toBe("+66812345678");
  });
});

describe("dates", () => {
  it("formats Buddhist Era dates", () => {
    const d = new Date(2026, 9, 26);
    expect(formatThaiDate(d)).toBe("26/10/2569");
    expect(formatThaiDateLong(d)).toBe("26 ตุลาคม 2569");
  });

  it("generates birth dates within the age range", () => {
    for (const b of td.many(300, () => td.birthDate(20, 30))) {
      const age = ageOn(b);
      expect(age).toBeGreaterThanOrEqual(20);
      expect(age).toBeLessThanOrEqual(30);
    }
  });
});

describe("address", () => {
  it("keeps province, district, subdistrict and postal code consistent", () => {
    for (const a of td.many(100, td.address)) {
      expect(LOCALITIES).toContainEqual({
        province: a.province, provinceEn: a.provinceEn, district: a.district, districtEn: a.districtEn,
        subdistrict: a.subdistrict, subdistrictEn: a.subdistrictEn, postalCode: a.postalCode,
      });
      expect(a.fullAddress).toContain(a.postalCode);
    }
  });

  it("uses เขต/แขวง only in Bangkok", () => {
    for (const loc of LOCALITIES) {
      const bkk = loc.provinceEn === "Bangkok";
      expect(loc.district.startsWith(bkk ? "เขต" : "อำเภอ")).toBe(true);
      expect(loc.subdistrict.startsWith(bkk ? "แขวง" : "ตำบล")).toBe(true);
    }
  });
});

describe("person", () => {
  it("builds a complete, valid person", () => {
    const p = td.person("female");
    expect(p.titleTh).toBe("นางสาว");
    expect(isValidThaiId(p.citizenId)).toBe(true);
    expect(p.email).toMatch(/^[a-z.0-9]+@example\.com$/);
    expect(p.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("is reproducible with the same seed", () => {
    const s1 = createThaiData({ seed: 99 });
    const s2 = createThaiData({ seed: 99 });
    expect(s1.many(5, s1.citizenId)).toEqual(s2.many(5, s2.citizenId));
    expect(s1.person()).toEqual(s2.person());
  });
});

describe("invalid variants", () => {
  it("breaks IDs in each requested way", () => {
    for (let i = 0; i < 100; i++) {
      expect(td.invalidCitizenId("short")).toMatch(/^\d{12}$/);
      expect(td.invalidCitizenId("long")).toMatch(/^\d{14}$/);
      expect(td.invalidCitizenId("letters")).toMatch(/^\d+[OISB]\d+$/);
      for (const kind of ["checksum", "short", "long", "letters"] as const) {
        expect(isValidThaiId(td.invalidCitizenId(kind))).toBe(false);
        expect(isValidThaiId(td.invalidJuristicId(kind))).toBe(false);
      }
    }
  });

  it("fixes the first digit of a citizen ID", () => {
    for (const id of td.many(50, () => td.citizenId(3))) {
      expect(id[0]).toBe("3");
      expect(isValidThaiId(id)).toBe(true);
    }
    expect(() => td.citizenId(0)).toThrow();
  });

  it("breaks phone numbers in each requested way", () => {
    for (let i = 0; i < 100; i++) {
      expect(td.invalidPhone("prefix")).toMatch(/^0[1-57]\d{8}$/);
      expect(td.invalidPhone("short")).toMatch(/^\d{9}$/);
      expect(td.invalidPhone("long")).toMatch(/^\d{11}$/);
      for (const kind of ["prefix", "short", "long", "letters"] as const) {
        expect(isValidMobilePhone(td.invalidPhone(kind))).toBe(false);
      }
    }
  });

  it("limits phone prefixes", () => {
    for (const p of td.many(50, () => td.phone(["08"]))) expect(p.startsWith("08")).toBe(true);
  });
});

describe("full locality data", () => {
  it("covers every province and subdistrict", () => {
    expect(PROVINCES).toHaveLength(77);
    expect(LOCALITIES.length).toBeGreaterThan(7000);
    for (const l of LOCALITIES) expect(l.postalCode).toMatch(/^\d{5}$/);
  });

  it("matches known postal codes", () => {
    const find = (p: string, s: string) => LOCALITIES.find((l) => l.province === p && l.subdistrict === s)?.postalCode;
    expect(find("กรุงเทพมหานคร", "แขวงพระบรมมหาราชวัง")).toBe("10200");
    expect(find("เชียงใหม่", "ตำบลศรีภูมิ")).toBe("50200");
    expect(find("ชลบุรี", "ตำบลหนองปรือ")).toBe("20150");
  });

  it("filters by province and Bangkok", () => {
    for (const a of td.many(50, () => td.address({ province: "Chiang Mai" }))) expect(a.province).toBe("เชียงใหม่");
    for (const a of td.many(50, () => td.address({ province: "ภูเก็ต" }))) expect(a.provinceEn).toBe("Phuket");
    for (const a of td.many(50, () => td.address({ bangkok: true }))) expect(a.moo).toBeUndefined();
    for (const a of td.many(50, () => td.address({ bangkok: false }))) expect(a.province).not.toBe("กรุงเทพมหานคร");
    expect(() => td.address({ province: "Atlantis" })).toThrow();
  });
});
