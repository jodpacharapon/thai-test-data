# Contributing

ขอบคุณที่สนใจช่วยพัฒนา Thai Test Data ครับ เอกสารนี้สรุปวิธีเริ่มต้นและข้อตกลงของโปรเจกต์

_English speakers are welcome too: open issues and pull requests in English or Thai._

## แจ้งปัญหาหรือขอฟีเจอร์

- **เจอบั๊ก:** เปิด issue แบบ [Bug report](https://github.com/jodpacharapon/thai-test-data/issues/new?template=bug_report.yml)
  ใส่ seed ด้วยถ้ามี จะได้สร้างข้อมูลชุดเดิมซ้ำได้
- **อยากได้ชนิดข้อมูลหรือกรณีผิดแบบใหม่:** เปิด issue แบบ [Feature request](https://github.com/jodpacharapon/thai-test-data/issues/new?template=feature_request.yml)
  บอกกฎการตรวจ (validation rule) ที่ระบบจริงใช้ และแหล่งอ้างอิงถ้ามี
- **ข้อมูลที่อยู่หรือรหัสไปรษณีย์ผิด:** ข้อมูลมาจาก [kongvut/thai-province-data](https://github.com/kongvut/thai-province-data)
  ช่วยแจ้งที่ต้นทางด้วย ทุกโปรเจกต์ที่ใช้ข้อมูลชุดนั้นจะได้ประโยชน์

## ตั้งค่าเครื่อง

ต้องใช้ Node.js 20 ขึ้นไป

```bash
git clone https://github.com/jodpacharapon/thai-test-data.git
cd thai-test-data
npm install
npm test
```

| คำสั่ง | หน้าที่ |
|---|---|
| `npm test` | รัน unit tests |
| `npm run typecheck` | ตรวจ type |
| `npm run build` | build library ไปที่ `dist/` |
| `npm run dev` | build แล้วเปิด web app ที่ http://localhost:8080 |
| `npm run build:data -- <file>` | สร้าง `src/data/localities.ts` ใหม่จากข้อมูลต้นทาง |

## ข้อตกลงในโค้ด

- **ไม่มี runtime dependency:** library ต้องใช้ได้ทันทีโดยไม่ดึงแพ็กเกจอื่น
- **ทุกการสุ่มต้องใช้ `rng` ที่ส่งเข้ามา:** ห้ามสุ่มด้วย `Math.random()` เองในฟังก์ชันสร้างข้อมูล ไม่อย่างนั้น seed จะใช้ไม่ได้
- **ข้อมูลที่ผิดต้องผิดจริง:** ทุก `invalid*()` ต้องมีเทสยืนยันว่าตัวตรวจ (`isValid*`) ปฏิเสธค่านั้น
- **ห้ามแก้ `src/data/localities.ts` เอง:** ไฟล์นี้สร้างจาก `scripts/build-localities.mjs`
- **ใช้ชื่อตัวแปรและคอมเมนต์ภาษาอังกฤษ** ส่วนข้อความที่ผู้ใช้เห็นในเว็บใช้ภาษาไทย
- **ไม่ใส่ข้อมูลของบุคคลจริง:** ชื่อที่เพิ่มต้องเป็นชื่อทั่วไป ห้ามใช้ชื่อคนดังหรือคนที่รู้จัก

### เพิ่มชนิดข้อมูลใหม่

1. เขียนฟังก์ชันสร้างข้อมูลในไฟล์ใหม่ใต้ `src/` โดยรับ `rng: Rng` เป็นพารามิเตอร์แรก
2. ถ้ามีกรณีผิด ให้ทำ `invalidXxx(rng, kind)` และ `isValidXxx(value)` คู่กัน
3. export จาก `src/index.ts` และเพิ่มเมธอดใน `createThaiData()`
4. เขียนเทสใน `test/` ทั้งกรณีถูกและกรณีผิดทุก `kind`
5. เพิ่มชนิดข้อมูลในหน้าเว็บ (`TYPES` ใน `site/index.html`) พร้อมตัวเลือกในแผงตั้งค่า
6. อัปเดต API Reference ใน `README.md` ตาราง API ในหน้า Docs และ `CHANGELOG.md`

## ส่ง Pull Request

1. Fork แล้วสร้าง branch จาก branch หลัก เช่น `feat/promptpay` หรือ `fix/phone-prefix`
2. ข้อความ commit เขียนเป็นประโยคคำสั่งภาษาอังกฤษ เช่น `Add PromptPay generator`
3. ก่อนส่ง รัน `npm run typecheck && npm test` ให้ผ่าน
4. เปิด PR แล้วกรอกตาม template CI จะรันเทสให้อัตโนมัติ

## License

การส่ง contribution ถือว่ายินยอมให้เผยแพร่ภายใต้ [MIT License](LICENSE) ของโปรเจกต์
