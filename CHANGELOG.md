# Changelog

Format อ้างอิง [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
และใช้ [Semantic Versioning](https://semver.org/)

## [Unreleased]

### Added

- Web app: หน้า Report เปิด GitHub issue (bug report / feature request) พร้อมแนบ data type, settings และ seed ให้อัตโนมัติ

### Changed

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

[Unreleased]: https://github.com/jodpacharapon/thai-test-data/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jodpacharapon/thai-test-data/releases/tag/v0.1.0
