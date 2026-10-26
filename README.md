# Thai Test Data 🇹🇭

[![CI](https://github.com/jodpacharapon/hellotester/actions/workflows/ci.yml/badge.svg)](https://github.com/jodpacharapon/hellotester/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

สร้าง **ข้อมูลทดสอบภาษาไทยที่ผ่าน validation ได้จริง** สำหรับ Automation Test
(Playwright, Cypress, Jest, Vitest หรือ Node.js ทั่วไป)

Generate realistic, **valid** Thai test data for automated tests: national ID numbers with correct
check digits, mobile numbers, Thai/English names, consistent addresses, and Buddhist-era dates.

🔗 **ลองใช้บนเว็บ:** https://jodpacharapon.github.io/hellotester/

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
| เลขบัตรประชาชน (invalid) | `td.invalidCitizenId()` |
| เลขผู้เสียภาษีนิติบุคคล | `td.juristicId()` |
| เบอร์มือถือ | `td.phone()` |
| ชื่อ-นามสกุล ไทย/อังกฤษ | `td.name("male" \| "female")` |
| ที่อยู่ (จังหวัด/อำเภอ/ตำบล/รหัสไปรษณีย์ตรงกัน) | `td.address()` |
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
`formatThaiDate`, `formatThaiDateLong`, `toBuddhistYear`, `toChristianYear`, `ageOn`

## พัฒนาในเครื่อง

```bash
npm install
npm test          # unit tests
npm run site      # build แล้วเปิด site/index.html ผ่าน local server เช่น npx serve site
```

## ช่วยกันต่อยอด 🙌

ยินดีรับ Pull Request ครับ ไอเดียที่น่าทำ:

- เพิ่มข้อมูลตำบลใน [`src/address.ts`](src/address.ts) (ตอนนี้มีตัวอย่าง 24 แห่ง)
- เพิ่มชื่อ-นามสกุลใน [`src/name.ts`](src/name.ts)
- เลขบัญชีธนาคาร, PromptPay, ทะเบียนรถ, เลขพาสปอร์ต
- Python version, Robot Framework library, CLI

> ข้อมูลทั้งหมดเป็นข้อมูลสุ่มเพื่อการทดสอบเท่านั้น เลขบัตรที่สร้างอาจบังเอิญตรงกับบุคคลจริงได้ ห้ามใช้ในทางที่ผิด

## License

[MIT](LICENSE)
