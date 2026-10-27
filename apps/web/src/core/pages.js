// The top-level pages: their URL path and what search engines and link previews show.
// Used in the browser for routing and by scripts/build.mjs to write one HTML file per page.

export const SITE_URL = "https://thai-test-data.vercel.app";
export const SITE_NAME = "Thai Test Data";

/** @type {Record<string, { path: string, title: string, description: string }>} */
export const PAGES = {
  generate: {
    path: "/",
    title: "Thai Test Data: สร้างข้อมูลทดสอบไทย เลขบัตรประชาชน เบอร์โทร ที่อยู่",
    description: "สุ่มข้อมูลทดสอบภาษาไทยที่ผ่าน validation จริง เลขบัตรประชาชน 13 หลัก เลขนิติบุคคล เบอร์มือถือ ชื่อ ที่อยู่ครบ 77 จังหวัด รหัสไปรษณีย์ วันเกิด พ.ศ. พร้อม invalid case สำหรับ negative test ได้สูงสุด 100,000 รายการ ฟรี ไม่ต้องสมัคร",
  },
  validate: {
    path: "/validator",
    title: "ตรวจเลขบัตรประชาชน เบอร์มือถือ รหัสไปรษณีย์ และ regex | Thai Test Data",
    description: "ตรวจ check digit เลขบัตรประชาชนและเลขนิติบุคคล เบอร์มือถือไทย รหัสไปรษณีย์ อีเมล วันที่ พ.ศ. หรือ regex ของคุณเอง ได้ทีละหลายบรรทัด พร้อมเหตุผลและวิธีคำนวณ",
  },
  docs: {
    path: "/docs",
    title: "Docs: ใช้ thai-test-data ใน Playwright, Cypress, Jest | Thai Test Data",
    description: "วิธีใช้ library thai-test-data สร้างข้อมูลทดสอบไทยใน automated test ด้วย TypeScript รองรับ seed, invalid data และ validators",
  },
  report: {
    path: "/report",
    title: "Report a bug หรือขอ feature | Thai Test Data",
    description: "แจ้ง bug หรือขอ data type ใหม่ให้ Thai Test Data ระบบจะเปิด GitHub issue พร้อมแนบ settings และ seed ที่ใช้อยู่ให้",
  },
};

/** The page for a URL path, or undefined. Accepts "/docs", "/docs/" and "/docs.html". */
export function pageForPath(path) {
  const clean = path.replace(/\.html$/, "").replace(/\/+$/, "") || "/";
  return Object.keys(PAGES).find((k) => PAGES[k].path === (clean === "/index" ? "/" : clean));
}
