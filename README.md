# Thai Test Data 🇹🇭

[![CI](https://github.com/jodpacharapon/thai-test-data/actions/workflows/ci.yml/badge.svg)](https://github.com/jodpacharapon/thai-test-data/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

สร้าง **ข้อมูลทดสอบภาษาไทยที่ผ่าน validation ได้จริง** สำหรับ Automation Test
(Playwright, Cypress, Jest, Vitest หรือ Node.js ทั่วไป)

Generate realistic, **valid** Thai test data for automated tests: national ID numbers with correct
check digits, mobile numbers, Thai/English names, consistent addresses, and Buddhist-era dates.

🔗 **ลองใช้บนเว็บ:** https://thai-test-data.vercel.app

## ใช้ได้ 2 แบบ

- **🌐 เว็บ (สำหรับ Tester ทุกคน):** พิมพ์ค้นหาชนิดข้อมูลที่ต้องการ เช่น "บัตร", "เบอร์" หรือ "zip"
  แล้วกดสุ่มหรือคัดลอกได้ทันที ถ้าต้องการหลายรายการก็สร้างครั้งละหลายแถวแล้วดาวน์โหลดเป็น CSV หรือ JSON ได้
- **📦 Library (สำหรับ Automation Tester):** `npm install thai-test-data` แล้วเรียกใช้ในสคริปต์เทส

## ทำไมต้องใช้

ฟอร์มในระบบไทยมักตรวจ check digit ของเลขบัตรประชาชน ถ้าพิมพ์ `1111111111111` ระบบจะไม่ยอมรับ
ไลบรารีนี้สร้างเลขที่ผ่านการตรวจให้ทันที พร้อมเลขที่ผิดแบบตั้งใจไว้ใช้เทส negative

| ข้อมูล | ฟังก์ชัน |
|---|---|
| เลขบัตรประชาชน (valid) | `td.citizenId()` |
| เลขบัตรประชาชน กำหนดหลักแรก (ประเภทบุคคล 1-8) | `td.citizenId(3)` |
| เลขบัตรประชาชน (invalid) | `td.invalidCitizenId("checksum" \| "short" \| "long" \| "letters")` |
| เลขผู้เสียภาษีนิติบุคคล | `td.juristicId()` / `td.invalidJuristicId(kind)` |
| เบอร์มือถือ | `td.phone()` หรือจำกัดเลขขึ้นต้น `td.phone(["08"])` |
| เบอร์มือถือ (invalid) | `td.invalidPhone("prefix" \| "short" \| "long" \| "letters")` |
| ชื่อ-นามสกุล ไทย/อังกฤษ | `td.name("male" \| "female")` |
| ที่อยู่ ครบ 77 จังหวัด 7,436 ตำบล (จังหวัด/อำเภอ/ตำบล/รหัสไปรษณีย์ตรงกัน) | `td.address()` หรือ `td.address({ province: "เชียงใหม่" })` |
| รหัสไปรษณีย์ที่มีใช้จริง | `td.postalCode()` หรือ `td.postalCode({ province: "ภูเก็ต" })` |
| รหัสไปรษณีย์ (invalid) | `td.invalidPostalCode("unknown" \| "short" \| "long" \| "letters")` |
| วันเกิดตามช่วงอายุ | `td.birthDate(18, 65)` |
| บุคคลครบชุด | `td.person()` |

## ติดตั้งและใช้งาน

```bash
npm install thai-test-data
```

```ts
import { createThaiData, isValidThaiId, formatThaiDate } from "thai-test-data";

const td = createThaiData({ seed: 42 }); // seed เดิม → ข้อมูลเดิม (debug เทสที่พังได้ง่าย)

const user = td.person();
// {
//   fullNameTh: "นางสาวสุภาพร ใจดี", fullNameEn: "Ms. Supaporn Jaidee",
//   citizenId: "3....", phone: "08........", email: "supaporn.jaidee1234@example.com",
//   birthDate: "1990-05-12", birthDateBE: "12/05/2533",
//   address: { fullAddress: "123/4 หมู่ 5 ถนนมิตรภาพ ตำบลในเมือง ...", postalCode: "40000", ... }
// }

const tenUsers = td.many(10, td.person);
isValidThaiId("1-2345-67890-12-1"); // true
```

### ตัวอย่างกับ Playwright

```ts
import { test, expect } from "@playwright/test";
import { createThaiData } from "thai-test-data";

const td = createThaiData();

test("สมัครสมาชิกด้วยข้อมูลที่ถูกต้อง", async ({ page }) => {
  const user = td.person();
  await page.goto("/register");
  await page.fill("#citizenId", user.citizenId);
  await page.fill("#phone", user.phone);
  await page.fill("#address", user.address.fullAddress);
  await page.click("button[type=submit]");
  await expect(page.getByText("สมัครสำเร็จ")).toBeVisible();
});

test("ปฏิเสธเลขบัตรประชาชนที่ผิด", async ({ page }) => {
  await page.goto("/register");
  await page.fill("#citizenId", td.invalidCitizenId());
  await page.click("button[type=submit]");
  await expect(page.getByText("เลขบัตรประชาชนไม่ถูกต้อง")).toBeVisible();
});
```

### ฟังก์ชันช่วยอื่นๆ

`isValidThaiId`, `formatThaiId`, `isValidMobilePhone`, `formatPhone`, `toE164`,
`isValidPostalCode`, `lookupPostalCode`, `POSTAL_CODES`, `PROVINCES`, `LOCALITIES`,
`formatThaiDate`, `formatThaiDateLong`, `toBuddhistYear`, `toChristianYear`, `ageOn`

## พัฒนาในเครื่อง

```bash
npm install
npm test          # unit tests
npm run site      # build แล้วเปิด site/index.html ผ่าน local server เช่น npx serve site
```

## ช่วยกันต่อยอด 🙌

ยินดีรับ Pull Request ครับ ไอเดียที่น่าทำ:

- เพิ่มชื่อ-นามสกุลใน [`src/name.ts`](src/name.ts)
- เลขบัญชีธนาคาร, PromptPay, ทะเบียนรถ, เลขพาสปอร์ต
- Python version, Robot Framework library, CLI

## ข้อมูลที่อยู่ / Address data

ข้อมูลจังหวัด อำเภอ ตำบล และรหัสไปรษณีย์มาจาก [kongvut/thai-province-data](https://github.com/kongvut/thai-province-data)
(MIT License, Copyright (c) 2025 Kongvut Sangkla) ดูรายละเอียดใน [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)

อัปเดตข้อมูลเป็นเวอร์ชันใหม่:

```bash
git clone --depth 1 https://github.com/kongvut/thai-province-data /tmp/thai-province-data
node scripts/build-localities.mjs /tmp/thai-province-data/api/latest/province_with_district_and_sub_district.json
```

แล้วแก้ `SOURCE_COMMIT` ใน `scripts/build-localities.mjs` ให้ตรงกับ commit ที่ใช้

## Disclaimer / ข้อจำกัดความรับผิด

**English**

- All data produced by this project is **synthetic** and randomly generated. It is not taken from any
  real person, database or government record. Names are common Thai names combined at random, and
  addresses use real localities that are not linked to any real household or person.
- Generated ID numbers pass the public check-digit formula but are **not issued by any authority**.
  A generated number may, by chance, match a number that belongs to a real person or company.
- Use this data **only for software testing and development**, in test or staging environments.
  Do not use it to register for real services, open accounts, create or alter identity documents,
  or impersonate anyone. Doing so may be a criminal offence in Thailand and in your own country.
- You are responsible for how you use this software and the data it produces, and for complying with
  the laws that apply to you. The software is provided "as is", without warranty of any kind, as stated
  in the [MIT License](LICENSE).

**ภาษาไทย**

- ข้อมูลทั้งหมดเป็น**ข้อมูลสังเคราะห์**ที่สุ่มขึ้น ไม่ได้นำมาจากบุคคล ฐานข้อมูล หรือทะเบียนราชการใด
  ชื่อเป็นชื่อไทยทั่วไปที่สุ่มจับคู่กัน ที่อยู่ใช้ชื่อพื้นที่จริงแต่ไม่ได้ผูกกับบ้านหรือบุคคลใด
- เลขที่สร้างผ่านสูตร check digit ที่เปิดเผยต่อสาธารณะ แต่**ไม่ได้ออกโดยหน่วยงานใด**
  และอาจบังเอิญตรงกับเลขของบุคคลหรือนิติบุคคลจริงได้
- ใช้เพื่อ**ทดสอบและพัฒนาซอฟต์แวร์เท่านั้น** ในระบบ test หรือ staging ห้ามนำไปสมัครบริการจริง เปิดบัญชี
  ทำหรือแก้ไขเอกสารแสดงตน หรือแอบอ้างเป็นผู้อื่น ซึ่งอาจเป็นความผิดทางอาญาทั้งในประเทศไทยและประเทศของผู้ใช้
- ผู้ใช้รับผิดชอบการใช้งานซอฟต์แวร์และข้อมูลที่ได้เอง รวมถึงการปฏิบัติตามกฎหมายที่เกี่ยวข้อง
  ซอฟต์แวร์นี้ให้ใช้ตามสภาพ ("as is") โดยไม่มีการรับประกันใดๆ ตาม [MIT License](LICENSE)


## License

[MIT](LICENSE)
