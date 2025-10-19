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

อ่านแผนงานล่าสุดได้ที่ [`docs/th/PRESENTATION_MODE_STATUS.md`](docs/th/PRESENTATION_MODE_STATUS.md)

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

### โหมดพัฒนา

```powershell
git clone https://github.com/chahuadev/chahua-code-animator
cd chahua-code-animator
npm install
npm start
```

1. เลือกไฟล์ Markdown ตัวอย่าง เช่น `docs/en/PRESENTATION_MODE_STATUS.md`
2. เลือกโหมด **Presentation** หรือ **Typing**:
   - *Presentation*: ย่อสาระจาก Markdown เป็นสไลด์พร้อมหัวข้อ ลูกศร และตัวบ่งชี้ความคืบหน้า
   - *Typing*: เล่นโค้ดแบบพิมพ์ทีละตัวอักษร ปรับความเร็วและขนาดบล็อกได้
3. กด **Play Animation** เพื่อเปิดหน้าต่าง Electron พร้อมคำสั่งควบคุม

### ใช้งานแอปพลิเคชันที่แพ็กเกจแล้ว

หลังจากสร้างด้วย `npm run build:win` ไฟล์ติดตั้งจะอยู่ในโฟลเดอร์ `dist/`:

```powershell
# ติดตั้ง .exe หรือ .msi
& ".\dist\Chahua Code Animator-1.0.0-win-x64-{COMMIT_HASH}.exe"
```

หลังติดตั้ง เปิดแอปจากเมนู Start หรือไอคอนบนเดสก์ท็อป แอปพลิเคชันจะสร้างโฟลเดอร์ `workspace/` โดยอัตโนมัติเมื่อรันครั้งแรก

### ปุ่มลัดในโหมด Presentation

ขณะใช้งานหน้าต่างเล่นสไลด์:

| ปุ่ม | ฟังก์ชัน |
| --- | --- |
| <kbd>Space</kbd> หรือ <kbd>→</kbd> | ไปสไลด์ถัดไป |
| <kbd>←</kbd> หรือ <kbd>Backspace</kbd> | กลับสไลด์ก่อนหน้า |
| <kbd>H</kbd> | เปิด/ปิดข้อมูลและหน้าช่วยเหลือ |
| <kbd>R</kbd> | รีเซตไปสไลด์แรก |
| <kbd>Esc</kbd> | ปิดหน้าต่างเล่น |

### ปุ่มลัดในโหมด Typing

| ปุ่ม | ฟังก์ชัน |
| --- | --- |
| <kbd>Space</kbd> | เล่น/หยุด |
| <kbd>→</kbd> | เลื่อนลงตามบล็อก |
| <kbd>←</kbd> | เลื่อนขึ้นตามบล็อก |
| <kbd>R</kbd> | รีเซตแอนิเมชัน |
| <kbd>Esc</kbd> | ปิดหน้าต่างเล่น |

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
npm run build:win

# dist/ จะได้ไฟล์ที่มีรหัส commit กำกับ เช่น
#  ├─ Chahua Code Animator-1.0.0-win-x64-a1b2c3d.exe
#  └─ Chahua Code Animator-1.0.0-win-x64-a1b2c3d.msi
```

**เช็กลิสต์ก่อนปล่อยรุ่น:**

1. ✅ ตรวจสอบว่าได้ทั้ง `.exe` และ `.msi`
2. ✅ เปิดตัวติดตั้งเพื่อดูไอคอน ชื่อผลิตภัณฑ์ และเวอร์ชัน
3. ✅ ทดลองติดตั้ง/ถอนการติดตั้งบน Windows VM ใหม่
4. ✅ (ตัวเลือก) เซ็นไฟล์ด้วย `signtool` แล้วทดสอบอีกครั้ง
5. ✅ บันทึกข้อมูลสถิติในไฟล์ `workspace/telemetry/installer-metrics.json`

> **หมายเหตุ:** โฟลเดอร์ `workspace/` จะถูกสร้างโดยอัตโนมัติเมื่อรันแอปเป็นครั้งแรก ตรวจสอบให้แน่ใจว่ามีโฟลเดอร์นี้ในตำแหน่งการติดตั้ง เพื่อเก็บข้อมูล telemetry และไฟล์ผู้ใช้

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

ต้องการช่วยปรับโหมด Presentation, ระบบ safe frame หรือการทดสอบ เชิญส่ง Pull Request ได้เลย ตรวจสอบแผนงานก่อนที่ [`docs/th/PRESENTATION_MODE_STATUS.md`](docs/th/PRESENTATION_MODE_STATUS.md) เพื่อให้งานตรงทิศทาง

- อีเมล: chahuadev@gmail.com
- แจ้งปัญหา: https://github.com/chahuadev/chahua-code-animator/issues

สัญญาอนุญาต MIT – ดูรายละเอียดในไฟล์ [LICENSE](LICENSE)

---

## เอกสารทางการ (ภาษาอังกฤษ)

- [Code of Conduct](docs/en/CODE_OF_CONDUCT.md)
- [Contributing Guide](docs/en/CONTRIBUTING.md)
- [Security Policy](docs/en/SECURITY_POLICY.md)
- [Support Guidelines](docs/en/SUPPORT.md)

## เอกสารทางการ (ภาษาไทย)

- [จรรยาบรรณของชุมชน](docs/th/CODE_OF_CONDUCT.md)
- [คู่มือการมีส่วนร่วม](docs/th/CONTRIBUTING.md)
- [นโยบายความปลอดภัย](docs/th/SECURITY_POLICY.md)
- [คู่มือการสนับสนุน](docs/th/SUPPORT.md)
