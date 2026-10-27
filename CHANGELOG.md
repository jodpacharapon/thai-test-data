# Changelog

All notable changes to this project. Each release is written in English and Thai.<br>
บันทึกการเปลี่ยนแปลงของ project แต่ละ release มีทั้งภาษาอังกฤษและภาษาไทย

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [Semantic Versioning](https://semver.org/)

## [Unreleased]

## [0.3.1] - 2026-10-27

### English

The library is the same as 0.3.0; this release changes the web app only.

**Added**

- The site is verified in Google Search Console (verification file and meta tag), and Google has read `sitemap.xml` and found all 4 pages.

**Fixed**

- Stopped using Vercel's `cleanUrls`, which redirects every URL ending in `.html`, so files such as the Google verification file are served as they are. `/validator`, `/docs` and `/report` are now mapped to each page's HTML file with rewrites, and a test checks that the rewrites match the pages in `pages.js`.

### ภาษาไทย

Library เหมือน 0.3.0 ทุกอย่าง รอบนี้แก้เฉพาะ web app

**เพิ่ม**

- ยืนยันเจ้าของเว็บกับ Google Search Console แล้ว (ไฟล์ยืนยันและ meta tag) และส่ง `sitemap.xml` แล้ว Google เจอครบ 4 หน้า

**แก้ไข**

- เลิกใช้ `cleanUrls` ของ Vercel ซึ่ง redirect ทุก URL ที่ลงท้ายด้วย `.html` ไฟล์อย่างไฟล์ยืนยันของ Google จึงเปิดได้ตรงๆ ตอนนี้ map `/validator`, `/docs` และ `/report` ไปที่ไฟล์ HTML ของแต่ละหน้าด้วย rewrites แทน พร้อม test ที่เช็คว่า rewrites ตรงกับรายชื่อหน้าใน `pages.js`

## [0.3.0] - 2026-10-27

### English

The library adds `td.unique()`; everything else works as before. Most of the changes are in the web app.

**Added: library**

- `td.unique(count, factory)` generates values with no duplicates, e.g. `td.unique(30000, td.phone)`, and throws when there aren't enough possible values.

**Added: web app, generating and viewing results**

- Generate up to 100,000 rows and scroll through all of them smoothly (only the rows on screen are rendered). Count and Seed sit at the top, with 10 / 100 / 1K / 10K / 100K shortcuts.
- A Unique option to avoid duplicates, which says so when a type has fewer possible values than requested.
- ⓘ tooltips explain Count, Seed, Unique and the settings.
- Result filters: search by text or regex, filter Valid / Invalid with counts, filter by invalid reason, choose rows per page, and clear all filters in one click. Copy all, JSON and CSV export only the rows that match.
- Types with several fields (e.g. a full person) show every value in full without sideways scrolling: as a table when it fits, otherwise as one card per row, switching automatically when the screen is rotated or resized.
- Click a field to copy one value, or use the button at the end of a row to copy the whole row as JSON.
- Fold the data-type list on the left (remembered for next time), and a full-screen mode with only the data, filters and exports (Esc to leave).
- Move columns by dragging their headers (or Alt + ← / →) and resize them by dragging a header's right edge. The order applies to cards, copy, JSON and CSV too, and a reset button restores the default.

**Added: web app, Validator**

- A regex-tester style Validator: check many lines at once, with a highlight, ✓/✗ and reason on every line, and click a line to see how it was calculated. Supports 13-digit IDs, mobile numbers, postal codes, email, Buddhist-era dates and your own regex (with flags and capture groups).

**Added: web app, SEO**

- Each page has its own URL: `/`, `/validator`, `/docs`, `/report`. Old links such as `/#docs` still work and go to the new page.
- A title, description and canonical URL for each page, an Open Graph image for link previews, structured data (JSON-LD), a favicon, `sitemap.xml` and `robots.txt`.

**Added: repo**

- Release workflow: bump the version and add a CHANGELOG section, then push to `main`, and the tag and GitHub Release are created automatically (and published to npm once `NPM_TOKEN` is set).

**Changed**

- Web app: `app.js` and `styles.css` are split into ES modules by feature in `src/` and stylesheets in `styles/`, with unit tests (`npm run test:web`) that run in CI on Node 20 and 22.

### ภาษาไทย

Library เพิ่ม `td.unique()` ส่วน API เดิมใช้ได้เหมือนเดิมทุกอย่าง ที่เปลี่ยนเยอะคือ web app

**เพิ่ม: library**

- `td.unique(count, factory)` generate แบบไม่มีค่าซ้ำ เช่น `td.unique(30000, td.phone)` และ throw ถ้าค่าที่เป็นไปได้มีไม่พอ

**เพิ่ม: web app ส่วน generate และดูผลลัพธ์**

- Generate ได้สูงสุด 100,000 รายการ เลื่อนดูได้ลื่นทุกแถว (render เฉพาะแถวที่เห็นบนจอ) ช่อง Count และ Seed อยู่ด้านบน พร้อมปุ่มลัด 10 / 100 / 1K / 10K / 100K
- ตัวเลือก Unique ไม่ให้มีค่าซ้ำ และบอกถ้าค่าที่เป็นไปได้มีไม่พอ
- ไอคอน ⓘ อธิบาย Count, Seed, Unique และ settings ต่างๆ
- ตัวกรองผลลัพธ์: ค้นหาด้วยข้อความหรือ regex, กรอง Valid / Invalid พร้อมจำนวน, กรองตามสาเหตุที่ invalid, เลือกจำนวนแถวต่อหน้า และปุ่มล้างตัวกรอง คัดลอก, JSON และ CSV จะได้เฉพาะแถวที่ตรงตัวกรอง
- ข้อมูลหลายช่อง (เช่น บุคคลครบชุด) แสดงเต็มทุกช่องโดยไม่ต้องเลื่อนซ้าย-ขวา: เป็นตารางถ้าพอดีจอ หรือเป็นการ์ดทีละแถวถ้าไม่พอดี สลับให้เองเมื่อหมุนจอหรือย่อหน้าต่าง
- คลิกช่องเพื่อคัดลอกค่าเดียว และปุ่มท้ายแถวคัดลอกทั้งแถวเป็น JSON
- พับรายการประเภทข้อมูลทางซ้ายได้ (จำไว้ให้ครั้งหน้า) และโหมดเต็มจอที่เหลือแค่ข้อมูล ตัวกรอง และปุ่มส่งออก (Esc เพื่อออก)
- ย้ายคอลัมน์ได้โดยลากหัวคอลัมน์ (หรือ Alt + ← / →) และปรับความกว้างได้โดยลากขอบขวา ลำดับคอลัมน์ใช้กับการ์ด, คัดลอก, JSON และ CSV ด้วย มีปุ่มรีเซ็ตคอลัมน์

**เพิ่ม: web app ส่วน Validator**

- หน้า Validator แบบ regex tester: ตรวจได้ทีละหลายบรรทัด มี highlight และ ✓/✗ ทุกบรรทัดพร้อมเหตุผล คลิกดูวิธีคำนวณ รองรับเลขบัตร 13 หลัก เบอร์มือถือ รหัสไปรษณีย์ อีเมล วันที่ พ.ศ. และ Regex กำหนดเอง (ใส่ flags และดู capture groups ได้)

**เพิ่ม: web app ส่วน SEO**

- แต่ละหน้ามี URL ของตัวเอง: `/`, `/validator`, `/docs`, `/report` (ลิงก์เก่าแบบ `/#docs` ยังใช้ได้ จะพาไปหน้าใหม่ให้)
- Title, description และ canonical URL แยกต่อหน้า, Open Graph image สำหรับ preview ตอนแชร์ลิงก์, structured data (JSON-LD), favicon, `sitemap.xml` และ `robots.txt`

**เพิ่ม: repo**

- Release workflow: bump version และเพิ่ม section ใน CHANGELOG แล้ว push เข้า `main` จะสร้าง tag และ GitHub Release ให้อัตโนมัติ (และ publish ขึ้น npm เมื่อตั้ง `NPM_TOKEN`)

**เปลี่ยนแปลง**

- Web app: แยก `app.js` และ `styles.css` เป็น ES modules ตาม feature ใน `src/` และ stylesheet ใน `styles/` พร้อม unit tests (`npm run test:web`) ที่รันใน CI ทั้ง Node 20 และ 22

## [0.2.0] - 2026-10-27

### English

The library API is the same as 0.1.0 and works as a drop-in replacement. The changes are in the web app and the repo layout.

**Added**

- Web app: a Report page that opens a GitHub issue (bug report or feature request) with the data type, settings and seed attached automatically.

**Changed**

- The repo uses npm workspaces: the library moved to `packages/thai-test-data/` and the web app to `apps/web/`, with HTML, CSS and JS in separate files.
- Docs and the web app use English for technical terms, such as Valid/Invalid, Format, Generate and the reasons for invalid cases.

### ภาษาไทย

Library API เหมือน 0.1.0 ทุกอย่าง ใช้แทนกันได้ทันที ส่วนที่เปลี่ยนคือ web app และโครงสร้าง repo

**เพิ่ม**

- Web app: หน้า Report เปิด GitHub issue (bug report / feature request) พร้อมแนบ data type, settings และ seed ให้อัตโนมัติ

**เปลี่ยนแปลง**

- จัด repo เป็น npm workspaces: library ย้ายไป `packages/thai-test-data/` web app ย้ายไป `apps/web/` และแยก HTML, CSS, JS ออกจากกัน
- Docs และ web app ใช้ศัพท์เทคนิคเป็นภาษาอังกฤษ เช่น Valid/Invalid, Format, Generate และเหตุผลของ invalid case

## [0.1.0] - 2026-10-27

### English

First release.

**Library**

- `createThaiData({ seed })` creates a generator that accepts a seed.
- `citizenId` (with an optional first digit) and `juristicId` with valid check digits.
- `phone` with optional prefixes, plus `formatPhone` and `toE164`.
- `name` for Thai and English names, and `person` for a full set of personal details.
- `address` covering all 77 provinces and 7,436 subdistricts, filterable by province or Bangkok.
- `postalCode`, `isValidPostalCode` and `lookupPostalCode`.
- `birthDate` within an age range, and Buddhist-era date formatters.
- Negative cases: `invalidCitizenId`, `invalidJuristicId`, `invalidPhone`, `invalidPostalCode`.

**Web app**

- A generator with a settings panel to choose valid, invalid or mixed data, showing the expected result on every row.
- Copy one value, copy all, or export as JSON and CSV.
- An ID validator that shows how the check digit is calculated, and a postal code validator.
- A Docs page, light and dark mode, and a mobile-friendly layout.

### ภาษาไทย

Release แรก

**Library**

- `createThaiData({ seed })` สร้าง generator ที่ใส่ seed ได้
- `citizenId` (กำหนดหลักแรกได้) และ `juristicId` ที่ check digit ถูกต้อง
- `phone` จำกัด prefix ได้ พร้อม `formatPhone` และ `toE164`
- `name` ชื่อ-นามสกุลไทยและอังกฤษ และ `person` ข้อมูลบุคคลครบชุด
- `address` ครบ 77 จังหวัด 7,436 ตำบล filter ตามจังหวัดหรือกรุงเทพฯ ได้
- `postalCode`, `isValidPostalCode` และ `lookupPostalCode`
- `birthDate` ตามช่วงอายุ และ date formatter แบบ พ.ศ.
- Negative cases: `invalidCitizenId`, `invalidJuristicId`, `invalidPhone`, `invalidPostalCode`

**Web app**

- Generator พร้อม settings panel เลือก valid, invalid หรือ mixed และแสดง expected result ทุกแถว
- Copy ทีละค่า, copy all หรือ export เป็น JSON และ CSV
- Validator เลขบัตรพร้อมแสดงวิธีคำนวณ check digit และ validator รหัสไปรษณีย์
- หน้า Docs, light/dark mode, responsive บนมือถือ

[Unreleased]: https://github.com/jodpacharapon/thai-test-data/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/jodpacharapon/thai-test-data/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/jodpacharapon/thai-test-data/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/jodpacharapon/thai-test-data/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/jodpacharapon/thai-test-data/releases/tag/v0.1.0
