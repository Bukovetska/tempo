import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  family: 4,
} as any);

transporter.verify((err) => {
  if (err) {
    console.log('❌ Email не працює:', err.message);
  } else {
    console.log('✅ Email готовий до відправки');
  }
});


export async function sendTaskReminder(
  email: string,
  userName: string,
  taskTitle: string,
  taskTime: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="background: #8b72be; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h2 style="margin: 0;">⏱ Tempo</h2>
      </div>
      <div style="background: #f4f0fc; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #2e2640;">Привіт, ${userName}!</p>
        <p style="font-size: 14px; color: #4a3a60;">Нагадуємо що скоро у Вас задача:</p>
        <div style="background: white; padding: 16px; border-radius: 10px; border-left: 4px solid #8b72be; margin: 16px 0;">
          <p style="font-weight: bold; font-size: 16px; color: #2e2640; margin: 0;">${taskTitle}</p>
          <p style="color: #8b72be; font-size: 13px; margin-top: 6px;">🕐 ${taskTime}</p>
        </div>
        <p style="font-size: 12px; color: #b0a0c8; text-align: center; margin-top: 20px;">
          Це автоматичне нагадування з планера Tempo
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Tempo Planner" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `🔔 Нагадування: ${taskTitle}`,
      html: html,
    });
    return true;
  } catch (err) {
    console.log('Помилка відправки нагадування:', err);
    return false;
  }
}


export async function sendDailySummary(
  email: string,
  userName: string,
  totalTasks: number,
  completedTasks: number,
  taskList: { title: string; isCompleted: boolean }[]
): Promise<boolean> {
  let percent = 0;
  if (totalTasks > 0) {
    percent = Math.round((completedTasks / totalTasks) * 100);
  }

  let tasksHtml = '';
  for (let i = 0; i < taskList.length; i++) {
    const task = taskList[i];
    const icon = task.isCompleted ? '✅' : '⭕';
    const style = task.isCompleted
      ? 'color: #7aab8e; text-decoration: line-through;'
      : 'color: #4a3a60;';
    tasksHtml += `<li style="${style} margin-bottom: 6px;">${icon} ${task.title}</li>`;
  }

  let motivation = '';
  if (percent >= 80) motivation = '🎉 Чудовий день! Так тримати!';
  else if (percent >= 50) motivation = '👍 Непоганий результат, завтра буде краще!';
  else if (percent > 0) motivation = '💪 Завтра новий день - ще все вийде!';
  else motivation = '🌱 Не вийшло сьогодні - вийде завтра.';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="background: #8b72be; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h2 style="margin: 0;">⏱ Підсумок дня</h2>
      </div>
      <div style="background: #f4f0fc; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #2e2640;">Привіт, ${userName}!</p>
        <p style="font-size: 14px; color: #4a3a60;">Ось як пройшов твій день:</p>

        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center; margin: 16px 0;">
          <p style="font-size: 36px; font-weight: bold; color: #8b72be; margin: 0;">${percent}%</p>
          <p style="color: #b0a0c8; font-size: 13px;">виконано (${completedTasks} з ${totalTasks})</p>
        </div>

        <div style="background: white; padding: 16px; border-radius: 10px; margin-top: 12px;">
          <p style="font-weight: bold; color: #2e2640; margin-bottom: 10px;">Твої задачі сьогодні:</p>
          <ul style="list-style: none; padding-left: 0; font-size: 13px;">
            ${tasksHtml}
          </ul>
        </div>

        <p style="text-align: center; color: #8b72be; font-weight: bold; margin-top: 16px;">${motivation}</p>

        <p style="font-size: 12px; color: #b0a0c8; text-align: center; margin-top: 20px;">
          Tempo Planner · Щоденний підсумок
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Tempo Planner" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `📊 Підсумок дня: ${completedTasks}/${totalTasks} задач`,
      html: html,
    });
    return true;
  } catch (err) {
    console.log('Помилка відправки підсумку:', err);
    return false;
  }
}


export async function sendResetCode(email: string, code: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="background: #8b72be; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h2 style="margin: 0;">⏱ Скидання паролю</h2>
      </div>
      <div style="background: #f4f0fc; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 14px; color: #4a3a60;">
          Хтось запросив скидання паролю до Tempo акаунту.
        </p>
        <p style="font-size: 14px; color: #4a3a60; margin-top: 8px;">Ось твій код:</p>

        <div style="background: white; padding: 24px; border-radius: 12px; text-align: center; margin: 16px 0; border: 2px solid #c4b0e0;">
          <p style="font-size: 32px; font-weight: bold; color: #8b72be; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</p>
        </div>

        <p style="font-size: 13px; color: #6a5a80;">
          Введіть цей код у формі скидання паролю. Код дійсний <strong>15 хвилин</strong>.
        </p>

        <p style="font-size: 12px; color: #b0a0c8; margin-top: 20px; padding: 12px; background: #ede5fc; border-radius: 8px;">
          ⚠️ Якщо це не Ви — просто проігноруйте цей лист.
        </p>

        <p style="font-size: 12px; color: #b0a0c8; text-align: center; margin-top: 20px;">
          Tempo Planner
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Tempo Planner" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `🔐 Код скидання паролю: ${code}`,
      html: html,
    });
    return true;
  } catch (err) {
    console.log('Помилка відправки коду:', err);
    return false;
  }
}

interface DayStat {
  dayName: string;  
  total: number;
  completed: number;
}

interface CategoryStat {
  label: string;
  color: string;
  count: number;
}

export async function sendWeeklyReport(
  email: string,
  userName: string,
  weekData: {
    totalTasks: number;
    completedTasks: number;
    bestDay: string;
    bestDayPercent: number;
    dayStats: DayStat[];
    categoryStats: CategoryStat[];
  }
): Promise<boolean> {
  const { totalTasks, completedTasks, bestDay, bestDayPercent, dayStats, categoryStats } = weekData;

  let percent = 0;
  if (totalTasks > 0) {
    percent = Math.round((completedTasks / totalTasks) * 100);
  }

  let daysHtml = '';
  for (let i = 0; i < dayStats.length; i++) {
    const day = dayStats[i];
    let dayPercent = 0;
    if (day.total > 0) {
      dayPercent = Math.round((day.completed / day.total) * 100);
    }
    const barHeight = Math.max(4, Math.round(dayPercent * 0.6));
    const shortName = day.dayName.slice(0, 2);
    const barColor = dayPercent < 50 ? '#c97b5a' : '#8b72be';

    daysHtml += `
      <td style="text-align: center; vertical-align: bottom; padding: 0 4px;">
        <div style="font-size: 10px; color: #6a5a80; font-weight: bold; margin-bottom: 4px;">
          ${dayPercent > 0 ? dayPercent + '%' : '—'}
        </div>
        <div style="width: 24px; height: ${barHeight}px; background: ${barColor}; border-radius: 4px 4px 0 0; margin: 0 auto;"></div>
        <div style="font-size: 11px; color: #b0a0c8; margin-top: 4px;">${shortName}</div>
      </td>
    `;
  }
  let categoriesHtml = '';
  for (let i = 0; i < categoryStats.length; i++) {
    const cat = categoryStats[i];
    categoriesHtml += `
      <li style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; list-style: none;">
        <span style="display: inline-block; width: 12px; height: 12px; border-radius: 3px; background: ${cat.color};"></span>
        <span style="color: #4a3a60; font-size: 13px;">${cat.label}</span>
        <span style="color: #b0a0c8; font-size: 12px;">— ${cat.count} задач</span>
      </li>
    `;
  }

  let motivation = '';
  if (percent >= 80) motivation = '🌟 Це був неймовірний тиждень! Ти на висоті!';
  else if (percent >= 60) motivation = '👏 Хороший тиждень! Так тримати!';
  else if (percent >= 40) motivation = '💪 Непогано. Наступний тиждень буде ще кращим!';
  else if (percent > 0) motivation = '🌱 Кожен тиждень — це нова можливість. Все попереду!';
  else motivation = '☕ Бувають такі тижні. Головне — не здаватись.';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #8b72be, #c084b8); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h2 style="margin: 0; font-size: 22px;">📊 Тижневий звіт</h2>
        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Як пройшов Ваш тиждень</p>
      </div>

      <div style="background: #f4f0fc; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #2e2640;">Привіт, ${userName}!</p>

        <div style="background: white; padding: 24px; border-radius: 12px; text-align: center; margin: 16px 0;">
          <p style="font-size: 48px; font-weight: bold; color: #8b72be; margin: 0; line-height: 1;">${percent}%</p>
          <p style="color: #b0a0c8; font-size: 13px; margin-top: 6px;">
            Виконано <strong style="color: #4a3a60;">${completedTasks}</strong> з ${totalTasks} задач
          </p>
        </div>

        ${bestDayPercent > 0 ? `
          <div style="background: #ede5fc; padding: 14px; border-radius: 10px; margin: 12px 0;">
            <p style="font-size: 12px; color: #8b72be; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">
              🏆 Найпродуктивніший день
            </p>
            <p style="font-size: 16px; color: #2e2640; font-weight: bold; margin-top: 4px;">
              ${bestDay} — ${bestDayPercent}%
            </p>
          </div>
        ` : ''}

        <div style="background: white; padding: 16px; border-radius: 10px; margin: 12px 0;">
          <p style="font-weight: bold; color: #2e2640; margin-bottom: 12px; font-size: 13px;">
            Виконання по днях:
          </p>
          <table style="width: 100%; border-collapse: collapse; height: 80px;">
            <tr style="vertical-align: bottom;">
              ${daysHtml}
            </tr>
          </table>
        </div>

        ${categoriesHtml ? `
          <div style="background: white; padding: 16px; border-radius: 10px; margin: 12px 0;">
            <p style="font-weight: bold; color: #2e2640; margin-bottom: 10px; font-size: 13px;">
              Топ категорії тижня:
            </p>
            <ul style="padding-left: 0; margin: 0;">
              ${categoriesHtml}
            </ul>
          </div>
        ` : ''}

        <p style="text-align: center; color: #8b72be; font-weight: bold; margin-top: 16px; font-size: 14px;">
          ${motivation}
        </p>

        <p style="font-size: 12px; color: #b0a0c8; text-align: center; margin-top: 20px;">
          Tempo Planner · Тижневий звіт
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Tempo Planner" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `📊 Твій тижневий звіт — ${percent}% продуктивності`,
      html: html,
    });
    return true;
  } catch (err) {
    console.log('Помилка відправки тижневого звіту:', err);
    return false;
  }
}