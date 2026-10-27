# Changelog

Format อ้างอิง [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
และใช้ [Semantic Versioning](https://semver.org/)

## [Unreleased]

### Added

- Release workflow: push version ใหม่เข้า `main` แล้วสร้าง tag, GitHub Release และ publish ขึ้น npm ให้อัตโนมัติ
- Library: `td.unique(count, factory)` generate แบบไม่มีค่าซ้ำ
- Web app: generate ได้สูงสุด 100,000 รายการ เลื่อนดูได้ครบทุกแถวโดยหน้าเว็บไม่หน่วง (render เฉพาะแถวที่เห็นบนจอ)
- Web app: ตัวกรองผลลัพธ์ ค้นหาแบบข้อความหรือ regex, กรอง Valid / Invalid พร้อมจำนวน, กรองตามสาเหตุที่ invalid, เลือกจำนวนแถวต่อหน้า (50 / 100 / 1,000 / 50,000 / ทั้งหมด) และเปลี่ยนหน้าได้ มีปุ่มล้างตัวกรองกดครั้งเดียวกลับค่าเริ่มต้น ส่วนคัดลอก, JSON และ CSV จะได้เฉพาะแถวที่ตรงตัวกรอง
- Web app: ข้อมูลหลายช่อง (เช่น บุคคลครบชุด) แสดงค่าเต็มทุกช่องโดยไม่ต้องเลื่อนซ้าย-ขวา ถ้าทุกคอลัมน์พอดีความกว้างจะแสดงเป็นตาราง ถ้าไม่พอดีจะแสดงเป็นการ์ดทีละแถว ช่องที่ยาวอย่างที่อยู่จะขึ้นบรรทัดใหม่เอง สลับให้อัตโนมัติเมื่อหมุนจอหรือย่อหน้าต่าง คลิกช่องไหนก็คัดลอกค่านั้นได้ และกดปุ่มคัดลอกท้ายแถวเพื่อคัดลอกทั้งแถวเป็น JSON
- Web app: พับรายการประเภทข้อมูลทางซ้ายได้ (จำไว้ให้ครั้งหน้า) และปุ่ม "เต็มจอ" ให้ผลลัพธ์เต็มหน้าจอ เหลือแค่ข้อมูล ตัวกรอง และปุ่มส่งออก กด Esc เพื่อออก
- Web app: ย้ายคอลัมน์ได้โดยลากหัวคอลัมน์ (หรือ Alt + ← / →) และปรับความกว้างได้โดยลากขอบขวาของหัวคอลัมน์ ลำดับคอลัมน์ใช้กับการ์ด, คัดลอกทั้งแถว, คัดลอกทั้งหมด, JSON และ CSV ด้วย มีปุ่มรีเซ็ตคอลัมน์ ในโหมดเต็มจอข้อมูลหลายช่องจะแสดงเป็นตารางที่พอดีจอ คอลัมน์ยาวๆ ตัดขึ้นบรรทัดใหม่แทนการเลื่อนซ้าย-ขวา
- Web app: ช่อง Count และ Seed ย้ายขึ้นไปด้านบน พร้อมปุ่มลัด 10 / 100 / 1K / 10K / 100K
- Web app: หน้า Validator แบบ regex tester ตรวจได้ทีละหลายบรรทัด highlight ทุกบรรทัด มี gutter ✓/✗ บอกเหตุผล และคลิกดูวิธีคำนวณ รองรับเลขบัตร 13 หลัก เบอร์มือถือ รหัสไปรษณีย์ อีเมล วันที่ พ.ศ. และ Regex กำหนดเอง (ใส่ flags และดู capture groups ได้)
- Web app: ตัวเลือก Unique และไอคอน ⓘ อธิบาย Count, Seed, Unique และ settings ต่างๆ

### Changed

- Web app: แยก `app.js` และ `styles.css` เป็น ES modules ตาม feature ใน `src/` และ stylesheet ใน `styles/` พร้อม unit tests (`npm run test:web`) ที่รันใน CI

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
