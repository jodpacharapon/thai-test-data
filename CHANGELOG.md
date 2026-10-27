# Changelog

Format อ้างอิง [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
และใช้ [Semantic Versioning](https://semver.org/)

## [Unreleased]

## [0.3.0] - 2026-10-27

Library เพิ่ม `td.unique()` ส่วน API เดิมใช้ได้เหมือนเดิมทุกอย่าง ที่เปลี่ยนเยอะคือ web app

### Added

**Library**

- `td.unique(count, factory)` generate แบบไม่มีค่าซ้ำ เช่น `td.unique(30000, td.phone)` และ throw ถ้าค่าที่เป็นไปได้มีไม่พอ

**Web app: generate และดูผลลัพธ์**

- Generate ได้สูงสุด 100,000 รายการ เลื่อนดูได้ลื่นทุกแถว (render เฉพาะแถวที่เห็นบนจอ) ช่อง Count และ Seed อยู่ด้านบน พร้อมปุ่มลัด 10 / 100 / 1K / 10K / 100K
- ตัวเลือก Unique ไม่ให้มีค่าซ้ำ และบอกถ้าค่าที่เป็นไปได้มีไม่พอ
- ไอคอน ⓘ อธิบาย Count, Seed, Unique และ settings ต่างๆ
- ตัวกรองผลลัพธ์: ค้นหาด้วยข้อความหรือ regex, กรอง Valid / Invalid พร้อมจำนวน, กรองตามสาเหตุที่ invalid, เลือกจำนวนแถวต่อหน้า และปุ่มล้างตัวกรอง คัดลอก, JSON และ CSV จะได้เฉพาะแถวที่ตรงตัวกรอง
- ข้อมูลหลายช่อง (เช่น บุคคลครบชุด) แสดงเต็มทุกช่องโดยไม่ต้องเลื่อนซ้าย-ขวา: เป็นตารางถ้าพอดีจอ หรือเป็นการ์ดทีละแถวถ้าไม่พอดี สลับให้เองเมื่อหมุนจอหรือย่อหน้าต่าง
- คลิกช่องเพื่อคัดลอกค่าเดียว และปุ่มท้ายแถวคัดลอกทั้งแถวเป็น JSON
- พับรายการประเภทข้อมูลทางซ้ายได้ (จำไว้ให้ครั้งหน้า) และโหมดเต็มจอที่เหลือแค่ข้อมูล ตัวกรอง และปุ่มส่งออก (Esc เพื่อออก)
- ย้ายคอลัมน์ได้โดยลากหัวคอลัมน์ (หรือ Alt + ← / →) และปรับความกว้างได้โดยลากขอบขวา ลำดับคอลัมน์ใช้กับการ์ด, คัดลอก, JSON และ CSV ด้วย มีปุ่มรีเซ็ตคอลัมน์

**Web app: Validator**

- หน้า Validator แบบ regex tester: ตรวจได้ทีละหลายบรรทัด มี highlight และ ✓/✗ ทุกบรรทัดพร้อมเหตุผล คลิกดูวิธีคำนวณ รองรับเลขบัตร 13 หลัก เบอร์มือถือ รหัสไปรษณีย์ อีเมล วันที่ พ.ศ. และ Regex กำหนดเอง (ใส่ flags และดู capture groups ได้)

**Web app: SEO**

- แต่ละหน้ามี URL ของตัวเอง: `/`, `/validator`, `/docs`, `/report` (ลิงก์เก่าแบบ `/#docs` ยังใช้ได้ จะพาไปหน้าใหม่ให้)
- Title, description และ canonical URL แยกต่อหน้า, Open Graph image สำหรับ preview ตอนแชร์ลิงก์, structured data (JSON-LD), favicon, `sitemap.xml` และ `robots.txt`

**Repo**

- Release workflow: bump version และเพิ่ม section ใน CHANGELOG แล้ว push เข้า `main` จะสร้าง tag และ GitHub Release ให้อัตโนมัติ (และ publish ขึ้น npm เมื่อตั้ง `NPM_TOKEN`)

### Changed

- Web app: แยก `app.js` และ `styles.css` เป็น ES modules ตาม feature ใน `src/` และ stylesheet ใน `styles/` พร้อม unit tests (`npm run test:web`) ที่รันใน CI ทั้ง Node 20 และ 22

## [0.2.0] - 2026-10-27

Library API เหมือน 0.1.0 ทุกอย่าง ใช้แทนกันได้ทันที ส่วนที่เปลี่ยนคือ web app และโครงสร้าง repo

### Added

- Web app: หน้า Report เปิด GitHub issue (bug report / feature request) พร้อมแนบ data type, settings และ seed ให้อัตโนมัติ

### Changed

- จัด repo เป็น npm workspaces: library ย้ายไป `packages/thai-test-data/` web app ย้ายไป `apps/web/` และแยก HTML, CSS, JS ออกจากกัน
- Docs และ web app ใช้ศัพท์เทคนิคเป็นภาษาอังกฤษ เช่น Valid/Invalid, Format, Generate และเหตุผลของ invalid case

## [0.1.0] - 2026-10-27

First release

### Library

- `createThaiData({ seed })` สร้าง generator ที่ใส่ seed ได้
- `citizenId` (กำหนดหลักแรกได้) และ `juristicId` ที่ check digit ถูกต้อง
- `phone` จำกัด prefix ได้ พร้อม `formatPhone` และ `toE164`
- `name` ชื่อ-นามสกุลไทยและอังกฤษ และ `person` ข้อมูลบุคคลครบชุด
- `address` ครบ 77 จังหวัด 7,436 ตำบล filter ตามจังหวัดหรือกรุงเทพฯ ได้
- `postalCode`, `isValidPostalCode` และ `lookupPostalCode`
- `birthDate` ตามช่วงอายุ และ date formatter แบบ พ.ศ.
- Negative cases: `invalidCitizenId`, `invalidJuristicId`, `invalidPhone`, `invalidPostalCode`

### Web app

- Generator พร้อม settings panel เลือก valid, invalid หรือ mixed และแสดง expected result ทุกแถว
- Copy ทีละค่า, copy all หรือ export เป็น JSON และ CSV
- Validator เลขบัตรพร้อมแสดงวิธีคำนวณ check digit และ validator รหัสไปรษณีย์
- หน้า Docs, light/dark mode, responsive บนมือถือ

[Unreleased]: https://github.com/jodpacharapon/thai-test-data/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/jodpacharapon/thai-test-data/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/jodpacharapon/thai-test-data/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/jodpacharapon/thai-test-data/releases/tag/v0.1.0
