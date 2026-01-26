import cron from 'node-cron';
import db from '../config/db.js';

/**
 * Generate missing rent records for all current tenants
 * Backfills from move-in date to current month
 * - First rent is always next month after move-in
 * - If move-in after 15th, first rent is half amount
 */
export function generateMissingRentRecords() {
  const currentTenants = db.prepare(`
    SELECT t.id as tenant_id, t.house_id, t.move_in_date, h.rent_amount
    FROM tenants t
    JOIN houses h ON t.house_id = h.id
    WHERE t.is_current = 1
  `).all();

  let totalCreated = 0;
  let totalSkipped = 0;

  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 10);

  for (const tenant of currentTenants) {
    const moveInDate = new Date(tenant.move_in_date);
    const moveInDay = moveInDate.getDate();

    // First rent is always next month after move-in (10th of next month)
    let dueDate = new Date(moveInDate.getFullYear(), moveInDate.getMonth() + 1, 10);
    let isFirstRent = true;

    // Loop from first due date to current month
    while (dueDate <= currentMonth) {
      // Only create records for months where the cron job would have already run
      // (i.e., the 1st of that month has passed)
      const cronRunDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
      if (now < cronRunDate) {
        // Skip - cron job hasn't run yet for this month, let it handle the record
        break;
      }

      const dueDateStr = dueDate.toISOString().split('T')[0];
      const yearMonth = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;

      // Check if record already exists for this month
      const existing = db.prepare(`
        SELECT id FROM rent_payments
        WHERE tenant_id = ? AND strftime('%Y-%m', due_date) = ?
      `).get(tenant.tenant_id, yearMonth);

      if (!existing) {
        // First rent is half if move-in was after 15th
        const rentAmount = (isFirstRent && moveInDay > 15)
          ? Math.round(tenant.rent_amount / 2)
          : tenant.rent_amount;

        db.prepare(`
          INSERT INTO rent_payments (tenant_id, house_id, due_date, due_amount)
          VALUES (?, ?, ?, ?)
        `).run(tenant.tenant_id, tenant.house_id, dueDateStr, rentAmount);
        totalCreated++;
      } else {
        totalSkipped++;
      }

      isFirstRent = false;
      // Move to next month
      dueDate.setMonth(dueDate.getMonth() + 1);
    }
  }

  return { created: totalCreated, skipped: totalSkipped, tenants: currentTenants.length };
}

/**
 * Generate rent records for current month only
 * Used by monthly cron job
 * - If tenant moved in last month after 15th, this is their first rent (half amount)
 */
export function generateCurrentMonthRent() {
  const now = new Date();
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 10);
  const dueDateStr = dueDate.toISOString().split('T')[0];
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Previous month for checking new tenants
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevYearMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  const currentTenants = db.prepare(`
    SELECT t.id as tenant_id, t.house_id, t.move_in_date, h.rent_amount
    FROM tenants t
    JOIN houses h ON t.house_id = h.id
    WHERE t.is_current = 1
  `).all();

  let created = 0;
  let skipped = 0;

  for (const tenant of currentTenants) {
    // Check if record already exists for this month
    const existing = db.prepare(`
      SELECT id FROM rent_payments
      WHERE tenant_id = ? AND strftime('%Y-%m', due_date) = ?
    `).get(tenant.tenant_id, yearMonth);

    if (!existing) {
      // Check if this is tenant's first rent (moved in last month)
      const moveInDate = new Date(tenant.move_in_date);
      const moveInYearMonth = `${moveInDate.getFullYear()}-${String(moveInDate.getMonth() + 1).padStart(2, '0')}`;
      const isFirstRent = (moveInYearMonth === prevYearMonth);
      const moveInDay = moveInDate.getDate();

      // First rent is half if move-in was after 15th
      const rentAmount = (isFirstRent && moveInDay > 15)
        ? Math.round(tenant.rent_amount / 2)
        : tenant.rent_amount;

      db.prepare(`
        INSERT INTO rent_payments (tenant_id, house_id, due_date, due_amount)
        VALUES (?, ?, ?, ?)
      `).run(tenant.tenant_id, tenant.house_id, dueDateStr, rentAmount);
      created++;
    } else {
      skipped++;
    }
  }

  return { created, skipped };
}

/**
 * Initialize the scheduler
 * - Runs backfill immediately on startup
 * - Sets up monthly cron job for 1st of every month at 00:05
 */
export function initializeScheduler() {
  console.log('[Scheduler] Initializing rent record scheduler...');

  // Run backfill immediately on startup
  try {
    const result = generateMissingRentRecords();
    console.log(`[Scheduler] Startup backfill complete: ${result.created} records created, ${result.skipped} already existed for ${result.tenants} tenants`);
  } catch (error) {
    console.error('[Scheduler] Error during startup backfill:', error);
  }

  // Schedule monthly job: 1st of every month at 00:05 AM
  // Cron format: minute hour day-of-month month day-of-week
  cron.schedule('5 0 1 * *', () => {
    console.log('[Scheduler] Running monthly rent record generation...');
    try {
      const result = generateCurrentMonthRent();
      console.log(`[Scheduler] Monthly generation complete: ${result.created} records created, ${result.skipped} already existed`);
    } catch (error) {
      console.error('[Scheduler] Error during monthly generation:', error);
    }
  }, {
    timezone: 'Asia/Kolkata' // Indian Standard Time
  });

  console.log('[Scheduler] Cron job scheduled: 1st of every month at 00:05 AM IST');
}
