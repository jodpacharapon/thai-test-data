# Changelog

Format อ้างอิง [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
และใช้ [Semantic Versioning](https://semver.org/)

## [Unreleased]

### Added

- Release workflow: push version ใหม่เข้า `main` แล้วสร้าง tag, GitHub Release และ publish ขึ้น npm ให้อัตโนมัติ
- Library: `td.unique(count, factory)` generate แบบไม่มีค่าซ้ำ
- Web app: generate ได้สูงสุด 100,000 รายการ (ตารางแสดง 200 แถวแรก ส่วน copy และ export ได้ครบ)
- Web app: ตัวเลือก Unique และไอคอน ⓘ อธิบาย Count, Seed, Unique และ settings ต่างๆ

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

[Unreleased]: https://github.com/jodpacharapon/thai-test-data/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/jodpacharapon/thai-test-data/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/jodpacharapon/thai-test-data/releases/tag/v0.1.0
