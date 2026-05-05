import cron from 'node-cron';
import pool from '../db/pool';
import { sendTaskReminder, sendDailySummary, sendWeeklyReport } from './emailService';

async function checkAndSendReminders(): Promise<void> {
  console.log('🔍 Перевірка нагадувань...', new Date().toISOString());

  try {
    const result = await pool.query(`
      SELECT
        t.id, t.title, t.scheduled_at,
        u.id as user_id, u.name, u.email, u.timezone, u.notifications_enabled
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.is_completed = false
        AND t.scheduled_at > NOW() + INTERVAL '13 minutes'
        AND t.scheduled_at < NOW() + INTERVAL '17 minutes'
        AND u.notifications_enabled = true
        AND NOT EXISTS (
          SELECT 1 FROM email_logs
          WHERE task_id = t.id AND type = 'reminder'
        )
    `);

    console.log(`Знайдено ${result.rows.length} задач для нагадування`);

    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows[i];

      const taskDate = new Date(row.scheduled_at);
      const timeStr = taskDate.toLocaleString('uk-UA', {
        timeZone: row.timezone || 'Europe/Kyiv',
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'long',
      });

      const ok = await sendTaskReminder(row.email, row.name, row.title, timeStr);

      if (ok) {
        await pool.query(
          'INSERT INTO email_logs (user_id, task_id, type) VALUES ($1, $2, $3)',
          [row.user_id, row.id, 'reminder']
        );
        console.log(`✉️ Надіслано нагадування для ${row.email}`);
      }
    }
  } catch (err) {
    console.log('Помилка при перевірці нагадувань:', err);
  }
}


async function sendDailySummaries(): Promise<void> {
  console.log('🌙 Перевірка щоденних підсумків...');

  try {
    const users = await pool.query(`
      SELECT id, name, email, timezone
      FROM users
      WHERE daily_summary_enabled = true
    `);

    for (let i = 0; i < users.rows.length; i++) {
      const user = users.rows[i];
      const tz = user.timezone || 'Europe/Kyiv';

      const nowInTz = new Date().toLocaleString('en-US', {
        timeZone: tz,
        hour: '2-digit',
        hour12: false,
      });
      const userHour = parseInt(nowInTz);

      if (userHour !== 23) continue;

      const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: tz });

      const alreadySent = await pool.query(`
        SELECT 1 FROM email_logs
        WHERE user_id = $1
          AND type = 'daily_summary'
          AND DATE(sent_at AT TIME ZONE $2) = $3
      `, [user.id, tz, todayDate]);

      if (alreadySent.rows.length > 0) continue;

      const tasks = await pool.query(`
        SELECT title, is_completed FROM tasks
        WHERE user_id = $1
          AND DATE(scheduled_at AT TIME ZONE $2) = $3
        ORDER BY scheduled_at ASC
      `, [user.id, tz, todayDate]);

      if (tasks.rows.length === 0) continue;

      const total = tasks.rows.length;
      let completed = 0;
      const taskList: { title: string; isCompleted: boolean }[] = [];

      for (let j = 0; j < tasks.rows.length; j++) {
        const t = tasks.rows[j];
        if (t.is_completed) completed++;
        taskList.push({ title: t.title, isCompleted: t.is_completed });
      }

      const ok = await sendDailySummary(user.email, user.name, total, completed, taskList);

      if (ok) {
        await pool.query(
          'INSERT INTO email_logs (user_id, task_id, type) VALUES ($1, $2, $3)',
          [user.id, null, 'daily_summary']
        );
        console.log(`📊 Надіслано підсумок для ${user.email}`);
      }
    }
  } catch (err) {
    console.log('Помилка при відправці підсумків:', err);
  }
}


async function sendWeeklyReports(): Promise<void> {
  console.log('📅 Перевірка тижневих звітів...');

  try {
    const users = await pool.query(`
      SELECT id, name, email, timezone
      FROM users
      WHERE weekly_report_enabled = true
    `);

    for (let i = 0; i < users.rows.length; i++) {
      const user = users.rows[i];
      const tz = user.timezone || 'Europe/Kyiv';

      const nowStrInTz = new Date().toLocaleString('en-US', {
        timeZone: tz,
        weekday: 'short',
        hour: '2-digit',
        hour12: false,
      });
      const isSunday = nowStrInTz.startsWith('Sun');
      const userHour = parseInt(nowStrInTz.split(',')[1].trim());

      if (!isSunday || userHour !== 20) continue;

      const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: tz });
      const alreadySent = await pool.query(`
        SELECT 1 FROM email_logs
        WHERE user_id = $1
          AND type = 'weekly_report'
          AND DATE(sent_at AT TIME ZONE $2) = $3
      `, [user.id, tz, todayDate]);

      if (alreadySent.rows.length > 0) continue;

      const tasks = await pool.query(`
        SELECT
          t.title, t.is_completed, t.category, t.scheduled_at,
          c.label as category_label, c.color as category_color
        FROM tasks t
        LEFT JOIN categories c ON t.category = c.id
        WHERE t.user_id = $1
          AND DATE(t.scheduled_at AT TIME ZONE $2) >= DATE($3) - INTERVAL '6 days'
          AND DATE(t.scheduled_at AT TIME ZONE $2) <= DATE($3)
      `, [user.id, tz, todayDate]);

      if (tasks.rows.length === 0) continue;

      const totalTasks = tasks.rows.length;
      let completedTasks = 0;

      const dayStatsMap: Record<string, { total: number; completed: number }> = {
        'Понеділок': { total: 0, completed: 0 },
        'Вівторок':  { total: 0, completed: 0 },
        'Середа':    { total: 0, completed: 0 },
        'Четвер':    { total: 0, completed: 0 },
        'П\'ятниця': { total: 0, completed: 0 },
        'Субота':    { total: 0, completed: 0 },
        'Неділя':    { total: 0, completed: 0 },
      };

      const catStatsMap: Record<string, { label: string; color: string; count: number }> = {};

      for (let j = 0; j < tasks.rows.length; j++) {
        const t = tasks.rows[j];

        if (t.is_completed) completedTasks++;

        const taskDayStr = new Date(t.scheduled_at).toLocaleDateString('en-US', {
          timeZone: tz,
          weekday: 'short',
        });
        const dayMap: Record<string, string> = {
          'Mon': 'Понеділок', 'Tue': 'Вівторок', 'Wed': 'Середа',
          'Thu': 'Четвер', 'Fri': 'П\'ятниця', 'Sat': 'Субота', 'Sun': 'Неділя',
        };
        const dayName = dayMap[taskDayStr];
        if (dayName && dayStatsMap[dayName]) {
          dayStatsMap[dayName].total++;
          if (t.is_completed) dayStatsMap[dayName].completed++;
        }

        if (t.is_completed) {
          const catLabel = t.category_label || t.category;
          const catColor = t.category_color || '#8b72be';
          if (!catStatsMap[catLabel]) {
            catStatsMap[catLabel] = { label: catLabel, color: catColor, count: 0 };
          }
          catStatsMap[catLabel].count++;
        }
      }

      const orderedDays = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'];
      const dayStats = orderedDays.map((d) => ({
        dayName: d,
        total: dayStatsMap[d].total,
        completed: dayStatsMap[d].completed,
      }));

      let bestDay = '';
      let bestDayPercent = 0;
      for (let j = 0; j < dayStats.length; j++) {
        const d = dayStats[j];
        if (d.total === 0) continue;
        const p = Math.round((d.completed / d.total) * 100);
        if (p > bestDayPercent) {
          bestDayPercent = p;
          bestDay = d.dayName;
        }
      }

      const catList: { label: string; color: string; count: number }[] = [];
            for (const key in catStatsMap) {
              catList.push(catStatsMap[key]);
            }
            catList.sort((a, b) => b.count - a.count);
            const categoryStats = catList.slice(0, 5);

      const ok = await sendWeeklyReport(user.email, user.name, {
        totalTasks,
        completedTasks,
        bestDay,
        bestDayPercent,
        dayStats,
        categoryStats,
      });

      if (ok) {
        await pool.query(
          'INSERT INTO email_logs (user_id, task_id, type) VALUES ($1, $2, $3)',
          [user.id, null, 'weekly_report']
        );
        console.log(`📅 Надіслано тижневий звіт для ${user.email}`);
      }
    }
  } catch (err) {
    console.log('Помилка при відправці тижневих звітів:', err);
  }
}


export function startScheduler(): void {
  cron.schedule('*/5 * * * *', () => {
    checkAndSendReminders();
  });

  cron.schedule('0 * * * *', () => {
    sendDailySummaries();
    sendWeeklyReports();
  });

  console.log('⏰ Cron-планувальник запущено');
}