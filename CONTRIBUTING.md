# Contributing

ขอบคุณที่สนใจช่วยพัฒนา Thai Test Data ครับ

_English speakers are welcome too: open issues and pull requests in English or Thai._

## Issues

- **Bug:** เปิด [Bug report](https://github.com/jodpacharapon/thai-test-data/issues/new?template=bug_report.yml)
  ใส่ seed ด้วยถ้ามี จะได้ reproduce ได้
- **Feature request:** อยากได้ data type ใหม่หรือ invalid case แบบใหม่ เปิด [Feature request](https://github.com/jodpacharapon/thai-test-data/issues/new?template=feature_request.yml)
  บอก validation rule ที่ระบบจริงใช้ และ reference ถ้ามี
- **ข้อมูลที่อยู่หรือรหัสไปรษณีย์ผิด:** data มาจาก [kongvut/thai-province-data](https://github.com/kongvut/thai-province-data)
  ช่วยแจ้งที่ upstream ด้วย ทุก project ที่ใช้ data ชุดนั้นจะได้ประโยชน์

## Setup

ต้องใช้ Node.js 20 ขึ้นไป

```bash
git clone https://github.com/jodpacharapon/thai-test-data.git
cd thai-test-data
npm install
npm test
```

Repo เป็น npm workspaces: library อยู่ที่ `packages/thai-test-data/` web app อยู่ที่ `apps/web/`
รันทุกคำสั่งจาก root

| Command | Description |
|---|---|
| `npm test` | run unit tests |
| `npm run test:web` | run unit tests ของ web app |
| `npm run typecheck` | type check |
| `npm run build` | build library |
| `npm run build:web` | build web app ไปที่ `apps/web/dist/` |
| `npm run dev` | build แล้ว serve web app ที่ http://localhost:8080 |
| `npm run build:data -- <file>` | generate `localities.ts` ใหม่จาก upstream data |

## Code conventions

- **Zero runtime dependencies:** library ต้องใช้ได้ทันทีโดยไม่ต้องลง package อื่น
- **Random ทุกอย่างผ่าน `rng`:** ห้ามเรียก `Math.random()` เองใน generator function ไม่อย่างนั้น seed จะใช้ไม่ได้
- **Invalid data ต้อง invalid จริง:** ทุก `invalid*()` ต้องมี test ยืนยันว่า validator (`isValid*`) reject ค่านั้น
- **ห้ามแก้ `packages/thai-test-data/src/data/localities.ts` เอง:** file นี้ generate จาก `scripts/build-localities.mjs`
- **ตั้งชื่อ variable และเขียน comment เป็นภาษาอังกฤษ** ส่วน text ที่ user เห็นใน web app ใช้ภาษาไทยได้
- **ห้ามใส่ข้อมูลของคนจริง:** ชื่อที่เพิ่มต้องเป็นชื่อทั่วไป ไม่ใช่ชื่อคนดังหรือคนที่รู้จัก

### เพิ่ม data type ใหม่

1. เขียน generator function ใน file ใหม่ใต้ `packages/thai-test-data/src/` ให้รับ `rng: Rng` เป็น parameter แรก
2. ถ้ามี negative case ให้ทำ `invalidXxx(rng, kind)` คู่กับ `isValidXxx(value)`
3. export จาก `src/index.ts` และเพิ่ม method ใน `createThaiData()`
4. เขียน test ใน `packages/thai-test-data/test/` ทั้ง valid และ invalid ครบทุก `kind`
5. เพิ่ม data type ใน web app (`TYPES` ใน `apps/web/src/generator/types.js`) พร้อม option ใน settings panel ถ้ามีวิธี validate ให้เพิ่มกฎใน `apps/web/src/validator/rules.js` ด้วย
6. update API Reference ใน `README.md`, ตาราง API ในหน้า Docs และ `CHANGELOG.md`

## Pull requests

1. Fork แล้วแตก branch จาก `main` เช่น `feat/promptpay` หรือ `fix/phone-prefix`
2. Commit message เขียนเป็นภาษาอังกฤษแบบ imperative เช่น `Add PromptPay generator`
3. รัน `npm run typecheck && npm test` ให้ผ่านก่อน push
4. เปิด PR แล้วกรอกตาม template CI จะรัน test ให้อัตโนมัติ

## Releasing

Release อัตโนมัติด้วย GitHub Actions ([`release.yml`](.github/workflows/release.yml)):

1. Bump version ใน `packages/thai-test-data/package.json` ตาม [Semantic Versioning](https://semver.org/)
   เช่น `npm version minor -w thai-test-data --no-git-tag-version`
2. ใน `CHANGELOG.md` ย้ายรายการจาก `[Unreleased]` มาเป็น `## [X.Y.Z] - YYYY-MM-DD` เขียนทั้ง `### English` และ `### ภาษาไทย` และเพิ่ม compare link ท้ายไฟล์
3. Commit แล้ว push เข้า `main`

Workflow จะรัน test และ build แล้วสร้าง tag `vX.Y.Z` กับ GitHub Release โดยใช้ section นั้นใน CHANGELOG เป็น release notes
ถ้าแก้ section ของ version ที่ release ไปแล้ว release notes บน GitHub จะอัปเดตตามให้เองตอน push เข้า `main`
ถ้า repo มี secret `NPM_TOKEN` จะ publish ขึ้น npm (พร้อม provenance) ให้ด้วย version ที่ release ไปแล้วจะถูกข้าม

## License

การส่ง contribution ถือว่ายินยอมให้ publish ภายใต้ [MIT License](LICENSE) ของ project
