# Changelog

การเปลี่ยนแปลงที่สำคัญของโปรเจกต์ รูปแบบอ้างอิง [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
และใช้ [Semantic Versioning](https://semver.org/)

## [Unreleased]

## [0.1.0] - 2026-10-27

เวอร์ชันแรก

### Library

- `createThaiData({ seed })` สร้างตัวสุ่มที่ใส่ seed ได้
- เลขบัตรประชาชน (`citizenId`, กำหนดหลักแรกได้) และเลขผู้เสียภาษีนิติบุคคล (`juristicId`) ที่ check digit ถูกต้อง
- เบอร์มือถือ (`phone`) จำกัดเลขขึ้นต้นได้ พร้อม `formatPhone` และ `toE164`
- ชื่อ-นามสกุลไทยและอังกฤษ (`name`) และข้อมูลบุคคลครบชุด (`person`)
- ที่อยู่ครบ 77 จังหวัด 7,436 ตำบล (`address`) กรองตามจังหวัดหรือกรุงเทพฯ ได้
- รหัสไปรษณีย์ (`postalCode`, `isValidPostalCode`, `lookupPostalCode`)
- วันเกิดตามช่วงอายุและตัวจัดรูปแบบวันที่ พ.ศ.
- Negative cases: `invalidCitizenId`, `invalidJuristicId`, `invalidPhone`, `invalidPostalCode`

### Web app

- Generator พร้อมแผงตั้งค่าแบบตัวสุ่มรหัสผ่าน เลือกกรณีถูก ผิด หรือผสม และแสดงผลที่ควรได้ทุกแถว
- คัดลอกทีละค่า คัดลอกทั้งหมด หรือส่งออก JSON และ CSV
- Validator ตรวจเลขบัตรพร้อมแสดงวิธีคำนวณ check digit และตรวจรหัสไปรษณีย์
- หน้า Docs, โหมดสว่างและมืด, รองรับมือถือ

[Unreleased]: https://github.com/jodpacharapon/thai-test-data/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jodpacharapon/thai-test-data/releases/tag/v0.1.0
