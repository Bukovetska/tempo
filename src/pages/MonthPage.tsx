import React, { useState, useEffect } from 'react';
import { apiFetchTasks, apiCreateTask } from '../services/apiService';
import { TaskService } from '../services/taskService';
import { Task, TaskCategory, TaskPriority } from '../types';
import CategorySelect from '../components/CategorySelect';
import EditTaskModal from '../components/EditTaskModal';

interface MonthPageProps {
  userId: string;
}

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  work:     '#8b72be',
  study:    '#c07090',
  personal: '#c8a84b',
  health:   '#7aab8e',
};

interface NewTaskForm {
  title:         string;
  category:      string;
  priority:      TaskPriority;
  time:          string;
  estimatedTime: string;
}

interface PendingTaskData {
  title:         string;
  description:   string;
  category:      string;
  priority:      TaskPriority;
  scheduledAt:   string;
  estimatedTime: number;
}

export default function MonthPage({ userId }: MonthPageProps) {
  const now = new Date();
  const [year, setYear]         = useState<number>(now.getFullYear());
  const [month, setMonth]       = useState<number>(now.getMonth());
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showForm, setShowForm]       = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<NewTaskForm>({
    title: '', category: 'work', priority: 'medium', time: '09:00', estimatedTime: '30',
  });
  const [formError, setFormError] = useState<string>('');
  const [saving, setSaving]       = useState<boolean>(false);
  const [conflicts, setConflicts] = useState<Task[]>([]);
  const [pendingTask, setPendingTask] = useState<PendingTaskData | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks(): Promise<void> {
    try {
      const data = await apiFetchTasks();
      setAllTasks(data);
    } catch (err) {
      console.error(err);
    }
  }

  const firstDay    = new Date(year, month, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName   = new Date(year, month).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });

  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth();
  const today        = now.getDate();

  const isCurrentMonth = year === currentYear && month === currentMonth;
  const isPastMonth    = year < currentYear || (year === currentYear && month < currentMonth);
  const isFutureMonth  = year > currentYear || (year === currentYear && month > currentMonth);

  function isDayInPast(day: number): boolean {
    if (isPastMonth) return true;
    if (isFutureMonth) return false;
    return day < today;
  }

  function getTaskLocalDate(task: Task): string {
    const d = new Date(task.scheduledAt);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
  }

  function getTasksForDay(day: number): Task[] {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = year + '-' + mm + '-' + dd;
    const result: Task[] = [];
    for (let i = 0; i < allTasks.length; i++) {
      if (getTaskLocalDate(allTasks[i]) === dateStr) result.push(allTasks[i]);
    }
    return result;
  }

  function prevMonth(): void {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
    setShowForm(false);
    setSelectedDay(null);
  }

  function nextMonth(): void {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
    setShowForm(false);
    setSelectedDay(null);
  }

  function handleDayClick(day: number): void {
    setSelectedDay(day);
    setShowForm(true);
    setFormError('');
    setForm({ title: '', category: 'work', priority: 'medium', time: '09:00', estimatedTime: '30' });
  }

  function handleDurationChange(value: string): void {
    let clean = value.replace(/\D/g, '');
    if (clean.length > 1) clean = clean.replace(/^0+/, '');
    setForm((prev) => ({ ...prev, estimatedTime: clean }));
  }

  function canEditTask(task: Task, day: number): boolean {
    if (task.isCompleted) return false;
    if (isDayInPast(day)) return false;
    return true;
  }

  function findTopCategory(dayTasks: Task[]): string | null {
    if (dayTasks.length === 0) return null;
    const counts: { [key: string]: number } = {};
    for (let i = 0; i < dayTasks.length; i++) {
      const cat = dayTasks[i].category;
      if (counts[cat] === undefined) counts[cat] = 0;
      counts[cat]++;
    }
    let topCat: string | null = null;
    let topCount = 0;
    for (const cat in counts) {
      if (counts[cat] > topCount) { topCount = counts[cat]; topCat = cat; }
    }
    return topCat;
  }

  async function actuallyCreate(taskData: PendingTaskData): Promise<void> {
    setSaving(true);
    try {
      await apiCreateTask(taskData);
      await loadTasks();
      setShowForm(false);
      setSelectedDay(null);
      setConflicts([]);
      setPendingTask(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Помилка';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTask(): Promise<void> {
    if (!form.title.trim()) {
      setFormError('Введіть назву');
      return;
    }
    if (!selectedDay) return;

    const duration = Number(form.estimatedTime);
    if (!form.estimatedTime || isNaN(duration) || duration < 5 || duration > 480) {
      setFormError('Тривалість має бути від 5 до 480 хв');
      return;
    }

    const mm = String(month + 1).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    const scheduledAt = year + '-' + mm + '-' + dd + 'T' + form.time + ':00';

    if (new Date(scheduledAt) < new Date()) {
      setFormError('Не можна створювати задачі у минулому');
      return;
    }

    const taskData: PendingTaskData = {
      title: form.title,
      description: '',
      category: form.category,
      priority: form.priority,
      scheduledAt,
      estimatedTime: duration,
    };

    const conflictList = TaskService.findConflicts(scheduledAt, duration, allTasks);
    if (conflictList.length > 0) {
      setConflicts(conflictList);
      setPendingTask(taskData);
      return;
    }
    await actuallyCreate(taskData);
  }

  const selectedDayTasks: Task[] = selectedDay ? getTasksForDay(selectedDay) : [];
  const canAddToSelectedDay = selectedDay !== null && !isDayInPast(selectedDay);

  const monthTasks: Task[] = [];
  for (let i = 0; i < allTasks.length; i++) {
    const d = new Date(allTasks[i].scheduledAt);
    if (d.getFullYear() === year && d.getMonth() === month) monthTasks.push(allTasks[i]);
  }

  let monthCompleted = 0;
  for (let i = 0; i < monthTasks.length; i++) {
    if (monthTasks[i].isCompleted) monthCompleted++;
  }
  const monthRate = monthTasks.length > 0 ? Math.round((monthCompleted / monthTasks.length) * 100) : 0;

  let selectedDateLabel = '';
  if (selectedDay) {
    selectedDateLabel = new Date(year, month, selectedDay).toLocaleDateString('uk-UA', {
      day: 'numeric', month: 'long',
    });
  }

  const categoryKeys: TaskCategory[] = ['work', 'study', 'personal', 'health'];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Місячний планер</h1>
      </div>

      <div className="month-nav">
        <button className="btn-secondary" onClick={prevMonth}>←</button>
        <div className="month-title-block">
          <span className="month-title">{monthName}</span>
          {isPastMonth && (
            <span className="month-status past">📖 архів (тільки перегляд)</span>
          )}
          {isFutureMonth && (
            <span className="month-status future">🔮 планування</span>
          )}
          {!isCurrentMonth && (
            <button
              className="return-today"
              onClick={() => {
                setYear(currentYear);
                setMonth(currentMonth);
                setShowForm(false);
                setSelectedDay(null);
              }}
            >
              повернутись до сьогодні
            </button>
          )}
        </div>
        <button className="btn-secondary" onClick={nextMonth}>→</button>
      </div>

      {showForm && selectedDay && (
        <div className="card" style={{ marginBottom: '14px', border: '1px solid #c4b0e0' }}>
          <div className="modal-header">
            <p style={{ fontWeight: 700, color: '#2e2640' }}>
              {canAddToSelectedDay ? 'Завдання на' : 'Перегляд:'} {selectedDateLabel}
            </p>
            <button
              className="modal-close"
              onClick={() => { setShowForm(false); setSelectedDay(null); }}
            >✕</button>
          </div>

          {selectedDayTasks.length > 0 && (
            <div style={{ marginBottom: canAddToSelectedDay ? '14px' : '0' }}>
              <p className="section-label">
                {canAddToSelectedDay ? 'Вже заплановано:' : 'Задачі цього дня:'}
              </p>
              <div className="flex-col-gap" style={{ gap: '6px' }}>
                {selectedDayTasks.map((t) => {
                  const time = new Date(t.scheduledAt).toLocaleTimeString('uk-UA', {
                    hour: '2-digit', minute: '2-digit',
                  });
                  const editable = canEditTask(t, selectedDay);
                  let itemClass = 'month-day-task';
                  if (t.isCompleted) itemClass += ' completed';

                  return (
                    <div
                      key={t.id}
                      className={itemClass}
                      onClick={() => { if (editable) setEditingTask(t); }}
                      style={{ cursor: editable ? 'pointer' : 'default' }}
                    >
                      <span className="month-day-task-time">{time}</span>
                      <span className={`month-day-task-title ${t.isCompleted ? 'done' : ''}`}>
                        {t.title}
                      </span>
                      {editable && <span style={{ fontSize: '11px', color: '#b0a0c8' }}>✏️</span>}
                      {t.isCompleted && <span style={{ fontSize: '11px', color: '#7aab8e' }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {canAddToSelectedDay ? (
            <>
              <p className="section-label">Додати нову:</p>
              <div className="form-stack">
                <div>
                  <label className="form-label">Назва *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Назва завдання..."
                    className={`input ${formError ? 'input-error' : ''}`}
                  />
                </div>

                <div className="form-grid-2">
                  <div>
                    <label className="form-label">Категорія</label>
                    <CategorySelect
                      userId={userId}
                      value={form.category}
                      onChange={(v) => setForm((p) => ({ ...p, category: v }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Пріоритет</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as TaskPriority }))}
                      className="input"
                    >
                      <option value="high">Високий</option>
                      <option value="medium">Середній</option>
                      <option value="low">Низький</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Час</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Тривалість (хв)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.estimatedTime}
                      onChange={(e) => handleDurationChange(e.target.value)}
                      placeholder="30"
                      className="input"
                    />
                  </div>
                </div>

                {formError && <p className="error-text">⚠ {formError}</p>}
              </div>

              <div className="form-actions">
                <button className="btn-primary" onClick={handleAddTask} disabled={saving}>
                  {saving ? 'Збереження...' : 'Додати завдання'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => { setShowForm(false); setSelectedDay(null); }}
                >
                  Закрити
                </button>
              </div>
            </>
          ) : (
            <div className="past-day-banner">
              📖 Цей день вже минув — нові задачі сюди додавати не можна
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="calendar-grid" style={{ marginBottom: '6px' }}>
          {DAY_NAMES.map((d) => (
            <div key={d} className="calendar-day-name">{d}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayTasks = getTasksForDay(day);
            const isToday = isCurrentMonth && day === today;
            const isSelected = selectedDay === day;
            const hasTasks = dayTasks.length > 0;
            const isPast = isDayInPast(day);

            let completedCount = 0;
            for (let j = 0; j < dayTasks.length; j++) {
              if (dayTasks[j].isCompleted) completedCount++;
            }
            const rate = dayTasks.length > 0 ? Math.round((completedCount / dayTasks.length) * 100) : 0;

            const topCatId = findTopCategory(dayTasks);
            let barColor = '#8b72be';
            if (topCatId && (topCatId in CATEGORY_COLORS)) {
              barColor = CATEGORY_COLORS[topCatId as TaskCategory];
            }

            let dayClass = 'calendar-day';
            if (isSelected) dayClass += ' selected';
            else if (isToday) dayClass += ' today';
            else if (isPast) dayClass += ' past';

            let dayTextColor = '#6a5a80';
            if (isSelected || isToday) dayTextColor = '#8b72be';
            else if (isPast) dayTextColor = '#a59cb8';

            const dayOpacity = (isPast && !hasTasks) ? 0.5 : 1;

            return (
              <div
                key={day}
                className={dayClass}
                onClick={() => handleDayClick(day)}
                style={{ opacity: dayOpacity }}
              >
                <p className="calendar-day-number" style={{ color: dayTextColor }}>{day}</p>
                {hasTasks && (
                  <>
                    <div
                      className="calendar-day-bar"
                      style={{ background: barColor, width: rate + '%' }}
                    />
                    <p className="calendar-day-count">{completedCount}/{dayTasks.length}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="legend-row">
        {categoryKeys.map((cat) => (
          <div key={cat} className="legend-item">
            <div className="legend-bar" style={{ background: CATEGORY_COLORS[cat] }} />
            {TaskService.getCategoryLabel(cat)}
          </div>
        ))}
      </div>

      <div className="month-stats">
        <div className="month-stat-card">
          <p className="stat-label">Виконано</p>
          <p className="month-stat-number">{monthRate}%</p>
        </div>
        <div className="card">
          <p className="stat-label-muted">Завдань</p>
          <p className="stat-number purple">{monthTasks.length}</p>
        </div>
        <div className="card">
          <p className="stat-label-muted">Виконано</p>
          <p className="stat-number green">{monthCompleted}</p>
        </div>
      </div>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          userId={userId}
          allTasks={allTasks}
          onClose={() => setEditingTask(null)}
          onSaved={() => loadTasks()}
        />
      )}

      {conflicts.length > 0 && (
        <div className="modal-overlay high-z" onClick={() => { setConflicts([]); setPendingTask(null); }}>
          <div className="card modal-card-small" onClick={(e) => e.stopPropagation()}>
            <div className="conflict-icon-wrapper">
              <div className="conflict-icon">⚠️</div>
            </div>
            <h3 className="conflict-title">Конфлікт часу</h3>
            <p className="conflict-text">Ця задача накладається на:</p>

            <div className="conflict-list">
              {conflicts.map((t) => (
                <div key={t.id} className="conflict-item">
                  <span className="conflict-bullet">•</span>
                  <span>{TaskService.formatConflictTime(t)}</span>
                </div>
              ))}
            </div>

            <p className="conflict-prompt">Все одно створити цю задачу?</p>

            <div className="form-actions" style={{ marginTop: 0 }}>
              <button
                className="btn-secondary"
                onClick={() => { setConflicts([]); setPendingTask(null); }}
              >
                Ні, скасувати
              </button>
              <button
                className="btn-primary"
                onClick={() => { if (pendingTask) actuallyCreate(pendingTask); }}
              >
                Так, створити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}