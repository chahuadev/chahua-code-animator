# Chahua Code Animator (ภาษาไทย)
*(โครงการอยู่ระหว่างการพัฒนา ยังใช้งานได้แต่ไม่รับประกันผลลัพธ์ 100%)*

**แพลตฟอร์มแปลง Markdown เป็นสไลด์พร้อมแอนิเมชัน พร้อมระบบความปลอดภัยครบชุด**

ปัจจุบันโปรเจ็กต์โฟกัสที่โหมด Presentation ซึ่งย่อสาระจากรายงานสถานะ Markdown ให้กลายเป็นสไลด์ทันที ขณะเดียวกันโหมด Typing สำหรับพิมพ์โค้ดทีละตัวอักษรยังพร้อมใช้งานเหมือนเดิม และทุกไฟล์ที่เปิดผ่านระบบยังผ่านการกรองความปลอดภัยจาก `security-core.js` ก่อนเสมอ

---

## เหตุผลที่เลือกใช้

- **มี 2 โหมดหลัก**
  - *Presentation*: วิเคราะห์ Markdown → สร้างสไลด์ (หน้าชื่อเรื่อง, อเจนดา, สรุปความคืบหน้า, รายละเอียด) พร้อมแถบควบคุม
  - *Typing*: เล่นโค้ดแบบพิมพ์ทีละตัว ปรับความเร็ว ขนาดบล็อก และจำนวนบรรทัดได้
- **ความปลอดภัยระดับองค์กร** – ป้องกัน path traversal, ตรวจนามสกุล/ขนาดไฟล์, กัน symlink, จำกัดอัตราการใช้งาน
- **ผลลัพธ์เชิงตัวเลข** – ชุดสไลด์ 40 หน้าเรนเดอร์ภายใน ~1.2 วินาที, ตัวลดความยาว bullet ลดข้อความเฉลี่ย ~45%, แผง Settings ที่ใช้ร่วมกันทำงานได้ราว 70% (อยู่ระหว่างแยกสำหรับแต่ละโหมด)

อ่านแผนงานล่าสุดได้ที่ [`docs/en/PRESENTATION_MODE_STATUS.md`](docs/en/PRESENTATION_MODE_STATUS.md)

---

## สถานะล่าสุด (19 ต.ค. 2025)

| ส่วนงาน | ความคืบหน้า |
| --- | --- |
| การแปลง Markdown เป็นสไลด์ | **100%** ครบทั้งหัวข้อหลัก/ย่อย/เช็กลิสต์ |
| ปรับ layout โหมด Presentation | **80%** (กำลังรีแฟกเตอร์ safe frame) |
| แยก Settings ต่อโหมด | **70%** (Typing เสถียร, Presentation ต้องปรับเพิ่ม) |
| ปุ่ม Browse Files | กำลังแก้ตำแหน่ง hit-area |

---

## เริ่มต้นใช้งานอย่างรวดเร็ว

```powershell
git clone https://github.com/chahuadev/chahua-code-animator
cd chahua-code-animator
npm install
npm start
```

1. เลือกไฟล์ Markdown ตัวอย่าง เช่น `docs/en/BINARY_MIGRATION_STATUS.md`
2. เลือกโหมด **Presentation** หรือ **Typing**
3. กด **Play Animation** แล้วควบคุมสไลด์จากหน้าต่าง Electron ได้ทันที

ต้องการสร้างแพ็กเกจให้ใช้ `npm run build:win`, `npm run build:mac`, หรือ `npm run build:linux`

---

## ใช้งานผ่าน npm CLI

ติดตั้งจาก npm โดยไม่ต้องโคลนโปรเจ็กต์:

```powershell
# ติดตั้งแบบ global (คำสั่งที่ได้คือ `chahua-code-animator`)
npm install -g @chahuadev/code-animator
chahua-code-animator --presentation

# หรือสั่งรันครั้งเดียว
npx @chahuadev/code-animator --presentation
```

คำสั่ง CLI จะเปิดแอป Electron จากแพ็กเกจ npm และบันทึก telemetry เป็นช่องทาง `npm-cli` สำหรับสถิติการใช้งานครั้งแรก พารามิเตอร์เพิ่มเติมหลังคำสั่งจะถูกส่งต่อให้โปรเซส Electron โดยตรง

---

## วิธีสร้างไฟล์ติดตั้ง (Windows EXE / MSI)

โปรเจ็กต์ใช้ Electron Builder ในการสร้างตัวติดตั้ง:

```powershell
# สร้างตัวติดตั้ง Windows (.exe และ .msi พร้อม hash ของ commit)
npm run dist:win

# dist/ จะได้ไฟล์ที่มีรหัส commit กำกับ เช่น
#  ├─ Chahua Code Animator-1.0.0-win-x64-a1b2c3d.exe
#  └─ Chahua Code Animator-1.0.0-win-x64-a1b2c3d.msi
```

เช็กลิสต์ก่อนปล่อยรุ่น:

1. ตรวจสอบว่าได้ทั้ง `.exe` และ `.msi` (เปิดใช้ `msi: true` ใน config เรียบร้อยแล้ว).
2. เปิดตัวติดตั้งเพื่อดูไอคอน ชื่อผลิตภัณฑ์ และเวอร์ชันว่าตรงกับที่ระบุ.
3. ทดลองติดตั้ง/ถอนการติดตั้งบน Windows VM ใหม่ และเก็บหลักฐานผลการทดสอบ.
4. เซ็นไฟล์ด้วย `signtool` (ถ้ามี certificate) แล้วรันทดสอบซ้ำอีกครั้ง.
5. บันทึกขนาดไฟล์ติดตั้งและ telemetry ครั้งแรก (ดูได้จาก `workspace/telemetry/installer-metrics.json` และ `workspace/telemetry/first-run-log.json`) ไว้ใน `docs/en/PRESENTATION_MODE_STATUS.md`.

> **เงื่อนไขการปล่อย:** ห้ามเผยแพร่ MSI/EXE จนกว่าแผนงาน Presentation mode และ security จะทำเสร็จ 100% ตามรายงานสถานะ

---

## ไฟล์สำคัญ

- `renderer/scripts/presentation-utils.js` – ตัวแปลง Markdown → โมเดลสไลด์
- `renderer/scripts/animation.js` – ตัวเล่น PresentationAnimation และ Typing
- `renderer/scripts/main.js` – UI เลือกโหมดและประสานค่าต่าง ๆ ผ่าน IPC
- `renderer/styles/animation.css`, `renderer/styles/main.css` – นิยาม layout และสไตล์ของสไลด์/หน้าจอหลัก
- `security-core.js` – โมดูลรักษาความปลอดภัยเมื่อเปิดไฟล์

---

## สรุปผลการทำงาน

- สไลด์ที่สร้างได้จริง: **40** หน้า จากรายงาน Binary Migration
- Bullet ที่ถูกย่อ: ลดความยาวเฉลี่ย **~45%** และแสดง全文ผ่าน tooltip ได้
- เวลาเปิดหน้าต่าง Presentation หลังแปลงข้อมูล: < **200 มิลลิวินาที** บนโน้ตบุ๊กระดับกลาง
- ระบบความปลอดภัย: ตรวจสอบเส้นทางและ symlink ทุกครั้งก่อนเรนเดอร์

---

## มีส่วนร่วม / ขอความช่วยเหลือ

ต้องการช่วยปรับโหมด Presentation, ระบบ safe frame หรือการทดสอบ เชิญส่ง Pull Request ได้เลย ตรวจสอบแผนงานก่อนที่ [`docs/en/PRESENTATION_MODE_STATUS.md`](docs/en/PRESENTATION_MODE_STATUS.md) เพื่อให้งานตรงทิศทาง

- อีเมล: chahuadev@gmail.com
- แจ้งปัญหา: https://github.com/chahuadev/chahua-code-animator/issues

สัญญาอนุญาต MIT – ดูรายละเอียดในไฟล์ [LICENSE](LICENSE)

---

## เอกสารทางการ (ภาษาอังกฤษ)

- [Code of Conduct](docs/en/CODE_OF_CONDUCT.md)
- [Contributing Guide](docs/en/CONTRIBUTING.md)
- [Security Policy](docs/en/SECURITY_POLICY.md)
- [Support Guidelines](docs/en/SUPPORT.md)
