import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const FILE = "/Users/pinomax/Downloads/База спортмакс ОЧИЩЕННАЯ.xlsx";
const BATCH = 200;

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const s = String(val).trim();
  // DD.MM.YY или DD.MM.YYYY
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
    const d = new Date(y, parseInt(m[2]) - 1, parseInt(m[1]));
    if (!isNaN(d.getTime())) return d;
  }
  const d2 = new Date(s);
  return isNaN(d2.getTime()) ? null : d2;
}

function normalizePhone(val: unknown): string | null {
  if (!val) return null;
  const raw = String(val).replace(/[\s\-\(\)]/g, "");
  if (raw.startsWith("+7") && raw.length === 12) return raw;
  if (raw.startsWith("8") && raw.length === 11) return "+7" + raw.slice(1);
  if (raw.startsWith("7") && raw.length === 11) return "+" + raw;
  if (raw.length === 10 && raw.startsWith("9")) return "+7" + raw;
  return raw || null;
}

async function main() {
  console.log("📖 Читаю Excel...");
  const wb = XLSX.readFile(FILE);
  const sheet = wb.Sheets["Чистая база (14652)"];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

  // Пропускаем заголовок (строка 0)
  const dataRows = rows.slice(1);
  console.log(`✅ Загружено строк: ${dataRows.length}`);

  // Очищаем старые тестовые seed-данные (id 10-14 без fitnessId)
  await prisma.user.deleteMany({
    where: { id: { in: [10, 11, 12, 13, 14] }, fitnessId: null },
  });
  console.log("🗑️  Удалены тестовые клиенты");

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < dataRows.length; i += BATCH) {
    const batch = dataRows.slice(i, i + BATCH);

    for (const row of batch) {
      const [lastName, firstName, middleName, birthDateRaw, phonePrimary, phoneExtra, email, address, regDateRaw, manager, notes] = row as unknown[];

      const phone = normalizePhone(phonePrimary);
      if (!phone) { skipped++; continue; }

      const birthDate = parseDate(birthDateRaw);
      const registrationDate = parseDate(regDateRaw) ?? new Date();
      const phoneAll = phoneExtra ? JSON.stringify([normalizePhone(phoneExtra)].filter(Boolean)) : null;

      const data = {
        lastName: String(lastName || "").trim() || null,
        firstName: String(firstName || "").trim() || null,
        middleName: String(middleName || "").trim() || null,
        phone,
        email: String(email || "").trim() || null,
        address: String(address || "").trim() || null,
        birthDate,
        registrationDate,
        notes: String(notes || "").trim() || null,
        phoneAll,
        // Имя менеджера сохраняем в extra пока нет таблицы менеджеров
        extra: manager ? JSON.stringify({ managerName: String(manager).trim() }) : null,
        role: "клиент",
        isActive: true,
      };

      try {
        const existing = await prisma.user.findFirst({ where: { phone } });
        if (existing) {
          // Обновляем только если нет fitnessId (не перезаписываем данные из 1С)
          await prisma.user.update({
            where: { id: existing.id },
            data: { ...data, fitnessId: existing.fitnessId },
          });
          updated++;
        } else {
          await prisma.user.create({ data });
          inserted++;
        }
      } catch {
        skipped++;
      }
    }

    // Прогресс каждые 1000 записей
    if ((i + BATCH) % 1000 === 0 || i + BATCH >= dataRows.length) {
      const done = Math.min(i + BATCH, dataRows.length);
      const pct = Math.round((done / dataRows.length) * 100);
      process.stdout.write(`\r⏳ ${done}/${dataRows.length} (${pct}%) | ✅ ${inserted} добавлено | 🔄 ${updated} обновлено | ⏭️  ${skipped} пропущено`);
    }
  }

  console.log("\n");
  console.log("═══════════════════════════════════");
  console.log(`✅ Добавлено новых:   ${inserted}`);
  console.log(`🔄 Обновлено:        ${updated}`);
  console.log(`⏭️  Пропущено:        ${skipped}`);
  console.log(`📊 Итого в базе:     ${await prisma.user.count({ where: { role: "клиент" } })}`);
  console.log("═══════════════════════════════════");
}

main()
  .catch((e) => { console.error("\n❌ Ошибка:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
