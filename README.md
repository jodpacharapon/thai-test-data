<div align="center">

# Thai Test Data

**สร้างข้อมูลทดสอบภาษาไทยที่ผ่าน validation จริง ทั้งกรณีถูกและกรณีผิด**<br>
Realistic, valid Thai test data for QA and test automation, with negative cases built in.

[![CI](https://github.com/jodpacharapon/thai-test-data/actions/workflows/ci.yml/badge.svg)](https://github.com/jodpacharapon/thai-test-data/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

[**Web app**](https://thai-test-data.vercel.app) · [**Docs**](https://thai-test-data.vercel.app/#docs) · [Report a bug](https://github.com/jodpacharapon/thai-test-data/issues/new?template=bug_report.yml) · [Request a data type](https://github.com/jodpacharapon/thai-test-data/issues/new?template=feature_request.yml)

<img src="docs/screenshot.png" alt="หน้า Generator: สุ่มเลขบัตรประชาชนแบบผสมถูกและผิด พร้อมผลที่ควรได้ของแต่ละแถว" width="860">

</div>

## สารบัญ

- [ทำไมต้องใช้](#ทำไมต้องใช้)
- [ฟีเจอร์](#ฟีเจอร์)
- [เริ่มต้นใช้งาน](#เริ่มต้นใช้งาน)
- [ตัวอย่างการใช้งาน](#ตัวอย่างการใช้งาน)
- [API Reference](#api-reference)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [พัฒนาในเครื่อง](#พัฒนาในเครื่อง)
- [ข้อมูลที่อยู่](#ข้อมูลที่อยู่)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)
- [License](#license)

## ทำไมต้องใช้

ระบบไทยส่วนใหญ่ตรวจ check digit ของเลขบัตรประชาชน และตรวจว่ารหัสไปรษณีย์ตรงกับจังหวัดหรือไม่
ถ้ากรอก `1111111111111` หรือที่อยู่มั่วๆ ฟอร์มจะไม่ผ่าน Tester เลยต้องเสียเวลาหาข้อมูลที่ "ถูกพอ" มาใช้ทุกครั้ง

Thai Test Data สร้างข้อมูลที่ผ่าน validation ได้ทันที และสร้าง**ข้อมูลที่ผิดแบบตั้งใจ**ได้ด้วย
โดยแต่ละค่าบอกผลที่ควรได้ (expected result) ไว้ เอาไปเขียน negative test ได้เลย

ใช้ได้ 2 แบบ:

| | สำหรับ | ใช้ยังไง |
|---|---|---|
| 🌐 **Web app** | Tester ทุกคน | เปิด [thai-test-data.vercel.app](https://thai-test-data.vercel.app) เลือกชนิดข้อมูล ตั้งค่า แล้วคลิกคัดลอก หรือดาวน์โหลด CSV/JSON |
| 📦 **Library** | Automation Tester | `npm install thai-test-data` แล้วเรียกใช้ใน Playwright, Cypress, Jest หรือ Vitest |

## ฟีเจอร์

- **เลขบัตรประชาชนและเลขนิติบุคคล** ที่ check digit ถูกต้อง กำหนดหลักแรก (ประเภทบุคคล 1–8) ได้
- **เบอร์มือถือ** ขึ้นต้น 06/08/09 พร้อมรูปแบบมีขีดและ +66
- **ชื่อ-นามสกุล** ไทยและอังกฤษ มีคำนำหน้า เลือกเพศได้
- **ที่อยู่ครบ 77 จังหวัด 7,436 ตำบล** ที่จังหวัด อำเภอ ตำบล และรหัสไปรษณีย์ตรงกันจริง มีแบบภาษาอังกฤษ
- **รหัสไปรษณีย์ 966 รหัส** พร้อมค้นว่ารหัสเป็นของพื้นที่ไหน
- **วันเกิด** ตามช่วงอายุ ในรูปแบบ พ.ศ., แบบเต็ม หรือ ISO
- **Negative cases ทุกชนิด** เช่น check digit ผิด, ไม่ครบหลัก, มีตัวอักษรปน, รหัสไปรษณีย์ไม่ตรงจังหวัด, วันที่ 31/04
- **Seed ได้** ใส่ seed เดิมได้ข้อมูลชุดเดิม เทสพังแล้ว debug ซ้ำได้
- **Zero dependencies** และเขียนด้วย TypeScript แบบ strict

## เริ่มต้นใช้งาน

```bash
npm install --save-dev thai-test-data
```

```ts
import { createThaiData, isValidThaiId } from "thai-test-data";

const td = createThaiData({ seed: 42 }); // seed เดิม → ข้อมูลเดิมทุกครั้ง

td.citizenId();            // "5486152684282"
td.phone();                // "0931566048"
td.address().fullAddress;  // "592/27 หมู่ 1 ถนนพหลโยธิน ตำบลสระพังทอง อำเภอเขาวง กาฬสินธุ์ 46160"
td.person();               // ชื่อ เลขบัตร เบอร์ อีเมล วันเกิด ที่อยู่ ของคนเดียวกัน

isValidThaiId("1-2345-67890-12-1"); // true
```

ต้องใช้ Node.js 20 ขึ้นไป แพ็กเกจเป็น ES module

## ตัวอย่างการใช้งาน

### Playwright: กรณีถูกและกรณีผิด

```ts
import { test, expect } from "@playwright/test";
import { createThaiData } from "thai-test-data";

const td = createThaiData({ seed: 42 });

test("สมัครสมาชิกด้วยข้อมูลที่ถูกต้อง", async ({ page }) => {
  const user = td.person();
  await page.goto("/register");
  await page.fill("#citizenId", user.citizenId);
  await page.fill("#phone", user.phone);
  await page.fill("#address", user.address.fullAddress);
  await page.click("button[type=submit]");
  await expect(page.getByText("สมัครสำเร็จ")).toBeVisible();
});

for (const kind of ["checksum", "short", "long", "letters"] as const) {
  test(`ปฏิเสธเลขบัตรที่ผิดแบบ ${kind}`, async ({ page }) => {
    await page.goto("/register");
    await page.fill("#citizenId", td.invalidCitizenId(kind));
    await page.click("button[type=submit]");
    await expect(page.getByText("เลขบัตรประชาชนไม่ถูกต้อง")).toBeVisible();
  });
}
```

### เตรียมข้อมูลหลายรายการ

```ts
const users = td.many(100, () => td.person("female"));
const chiangMaiZips = td.many(20, () => td.postalCode({ province: "เชียงใหม่" }));
```

### ตรวจข้อมูลที่ระบบตอบกลับมา

```ts
import { isValidMobilePhone, lookupPostalCode } from "thai-test-data";

expect(isValidMobilePhone(response.phone)).toBe(true);
expect(lookupPostalCode(response.zip).map((l) => l.province)).toContain(response.province);
```

## API Reference

สร้างตัวสุ่มด้วย `createThaiData({ seed? })` แล้วเรียกเมธอดผ่านตัวแปรที่ได้ (ในตัวอย่างใช้ชื่อ `td`)

### ข้อมูลที่ถูกต้อง

| เมธอด | ผลลัพธ์ |
|---|---|
| `td.citizenId(firstDigit?)` | เลขบัตรประชาชน 13 หลัก กำหนดหลักแรก 1–8 ได้ |
| `td.juristicId()` | เลขผู้เสียภาษีนิติบุคคล ขึ้นต้นด้วย 0 |
| `td.phone(prefixes?)` | เบอร์มือถือ 10 หลัก จำกัดเลขขึ้นต้นได้ เช่น `["08"]` |
| `td.name(gender?)` | ชื่อไทยและอังกฤษ พร้อมคำนำหน้า |
| `td.address(options?)` | ที่อยู่ กรองได้ด้วย `{ province }` หรือ `{ bangkok }` |
| `td.postalCode(options?)` | รหัสไปรษณีย์ที่มีใช้จริง กรองได้เหมือน `address` |
| `td.birthDate(minAge?, maxAge?)` | `Date` ของวันเกิดตามช่วงอายุ (ค่าเริ่มต้น 18–65) |
| `td.person(gender?)` | ข้อมูลบุคคลครบชุด |
| `td.many(count, factory)` | เรียก `factory` ซ้ำ `count` ครั้ง |
| `td.random` | ตัวสุ่มที่ใช้ seed เดียวกัน สำหรับสร้างข้อมูลแบบของตัวเอง |

### ข้อมูลที่ผิด (negative cases)

| เมธอด | `kind` ที่เลือกได้ (ตัวแรกคือค่าเริ่มต้น) |
|---|---|
| `td.invalidCitizenId(kind?)` | `"checksum"`, `"short"` (12 หลัก), `"long"` (14 หลัก), `"letters"` |
| `td.invalidJuristicId(kind?)` | เหมือน `invalidCitizenId` |
| `td.invalidPhone(kind?)` | `"prefix"` (เช่น 02), `"short"`, `"long"`, `"letters"` |
| `td.invalidPostalCode(kind?)` | `"unknown"` (5 หลักแต่ไม่มีจริง), `"short"`, `"long"`, `"letters"` |

### ฟังก์ชันตรวจและจัดรูปแบบ

| ฟังก์ชัน | หน้าที่ |
|---|---|
| `isValidThaiId(value)` | ตรวจเลข 13 หลัก (ไม่สนขีดและช่องว่าง) |
| `thaiIdCheckDigit(first12)` | คำนวณ check digit จาก 12 หลักแรก |
| `formatThaiId(id)` | `1234567890121` → `1-2345-67890-12-1` |
| `isValidMobilePhone(value)` | ตรวจเบอร์มือถือ 10 หลัก |
| `formatPhone(phone)` / `toE164(phone)` | `081-234-5678` / `+66812345678` |
| `isValidPostalCode(code)` | ตรวจว่ารหัสไปรษณีย์มีใช้จริง |
| `lookupPostalCode(code)` | รายการตำบล อำเภอ จังหวัด ที่ใช้รหัสนี้ |
| `formatThaiDate(date)` / `formatThaiDateLong(date)` | `26/10/2569` / `26 ตุลาคม 2569` |
| `formatIsoDate(date)` | `2026-10-26` ตามเวลาท้องถิ่น |
| `toBuddhistYear(year)` / `toChristianYear(year)` | แปลง ค.ศ. ↔ พ.ศ. |
| `ageOn(birth, today?)` | อายุเต็มปี |

### ข้อมูลอ้างอิง

| ค่าคงที่ | เนื้อหา |
|---|---|
| `PROVINCES` | ชื่อจังหวัดไทยและอังกฤษ 77 จังหวัด |
| `LOCALITIES` | ตำบลทั้งหมด พร้อมอำเภอ จังหวัด และรหัสไปรษณีย์ |
| `POSTAL_CODES` | รหัสไปรษณีย์ที่มีใช้ทั้งหมด |

## โครงสร้างโปรเจกต์

```
thai-test-data/
├── src/                     # ซอร์สของ library
│   ├── index.ts             # createThaiData() และ export ทั้งหมด
│   ├── id.ts                # เลขบัตรประชาชน เลขนิติบุคคล check digit
│   ├── phone.ts             # เบอร์มือถือ
│   ├── name.ts              # ชื่อ-นามสกุล
│   ├── address.ts           # ที่อยู่
│   ├── postal.ts            # รหัสไปรษณีย์
│   ├── date.ts              # วันที่ พ.ศ.
│   ├── random.ts            # ตัวสุ่มแบบ seed ได้
│   └── data/localities.ts   # ข้อมูลตำบล (สร้างจากสคริปต์ ห้ามแก้เอง)
├── test/                    # unit tests (Vitest)
├── site/index.html          # Web app (deploy บน Vercel)
├── scripts/                 # สคริปต์สร้างข้อมูล
└── docs/                    # รูปประกอบ README
```

## พัฒนาในเครื่อง

```bash
git clone https://github.com/jodpacharapon/thai-test-data.git
cd thai-test-data
npm install
```

| คำสั่ง | หน้าที่ |
|---|---|
| `npm test` | รัน unit tests |
| `npm run typecheck` | ตรวจ type |
| `npm run build` | build library ไปที่ `dist/` |
| `npm run site` | build library แล้วคัดลอกไปที่ `site/lib/` |
| `npm run dev` | `site` แล้วเปิด web app ที่ http://localhost:8080 |

## ข้อมูลที่อยู่

ข้อมูลจังหวัด อำเภอ ตำบล และรหัสไปรษณีย์มาจาก
[kongvut/thai-province-data](https://github.com/kongvut/thai-province-data)
(MIT License, Copyright (c) 2025 Kongvut Sangkla) รายละเอียดอยู่ใน [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)

ข้อมูลผูกตำบลละ 1 รหัสไปรษณีย์ จึงอาจไม่มีรหัสเฉพาะของหน่วยงาน

อัปเดตเป็นเวอร์ชันใหม่:

```bash
git clone --depth 1 https://github.com/kongvut/thai-province-data /tmp/thai-province-data
npm run build:data -- /tmp/thai-province-data/api/latest/province_with_district_and_sub_district.json
```

แล้วแก้ `SOURCE_COMMIT` ใน [`scripts/build-localities.mjs`](scripts/build-localities.mjs) ให้ตรงกับ commit ที่ใช้

## Contributing

ยินดีรับทั้ง issue และ pull request ครับ อ่านวิธีได้ที่ [CONTRIBUTING.md](CONTRIBUTING.md)
ประวัติการเปลี่ยนแปลงอยู่ใน [CHANGELOG.md](CHANGELOG.md)

ไอเดียที่น่าทำต่อ: เลขบัญชีธนาคาร, PromptPay, ทะเบียนรถ, เลขพาสปอร์ต, CLI, Python และ Robot Framework

## Disclaimer

<details>
<summary><b>English</b></summary>

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

</details>

<details>
<summary><b>ภาษาไทย</b></summary>

- ข้อมูลทั้งหมดเป็น**ข้อมูลสังเคราะห์**ที่สุ่มขึ้น ไม่ได้นำมาจากบุคคล ฐานข้อมูล หรือทะเบียนราชการใด
  ชื่อเป็นชื่อไทยทั่วไปที่สุ่มจับคู่กัน ที่อยู่ใช้ชื่อพื้นที่จริงแต่ไม่ได้ผูกกับบ้านหรือบุคคลใด
- เลขที่สร้างผ่านสูตร check digit ที่เปิดเผยต่อสาธารณะ แต่**ไม่ได้ออกโดยหน่วยงานใด**
  และอาจบังเอิญตรงกับเลขของบุคคลหรือนิติบุคคลจริงได้
- ใช้เพื่อ**ทดสอบและพัฒนาซอฟต์แวร์เท่านั้น** ในระบบ test หรือ staging ห้ามนำไปสมัครบริการจริง เปิดบัญชี
  ทำหรือแก้ไขเอกสารแสดงตน หรือแอบอ้างเป็นผู้อื่น ซึ่งอาจเป็นความผิดทางอาญาทั้งในประเทศไทยและประเทศของผู้ใช้
- ผู้ใช้รับผิดชอบการใช้งานซอฟต์แวร์และข้อมูลที่ได้เอง รวมถึงการปฏิบัติตามกฎหมายที่เกี่ยวข้อง
  ซอฟต์แวร์นี้ให้ใช้ตามสภาพ ("as is") โดยไม่มีการรับประกันใดๆ ตาม [MIT License](LICENSE)

</details>

## License

[MIT](LICENSE) © jodpacharapon · ข้อมูลที่อยู่ © Kongvut Sangkla ([MIT](THIRD_PARTY_NOTICES.md))
