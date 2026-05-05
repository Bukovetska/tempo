import React, { useState, useEffect } from 'react';
import { Task, TaskPriority } from '../types';
import {
  apiFetchTasks,
  apiCreateTask,
  apiUpdateTask,
  apiDeleteTask,
} from '../services/apiService';
import { TaskService } from '../services/taskService';
import TaskItem from '../components/TaskItem';
import CategorySelect from '../components/CategorySelect';
import EditTaskModal from '../components/EditTaskModal';

interface DayPageProps {
  userId: string;
}

interface NewTaskForm {
  title:         string;
  description:   string;
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

function getTodayString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

const TODAY = getTodayString();

export default function DayPage({ userId }: DayPageProps) {
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [loading, setLoading]   = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm]         = useState<NewTaskForm>({
    title: '', description: '', category: 'work',
    priority: 'medium', time: '09:00', estimatedTime: '30',
  });
  const [formError, setFormError] = useState<string>('');
  const [conflicts, setConflicts] = useState<Task[]>([]);
  const [pendingTask, setPendingTask] = useState<PendingTaskData | null>(null);

  const progress = TaskService.calculateProgress(tasks);
  let completedCount = 0;
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].isCompleted) completedCount++;
  }

  const dateLabel = new Date(TODAY).toLocaleDateString('uk-UA', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks(): Promise<void> {
    try {
      setLoading(true);
      const data = await apiFetchTasks(TODAY);
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(taskId: string): Promise<void> {
    let task: Task | null = null;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id === taskId) { task = tasks[i]; break; }
    }
    if (!task) return;
    await apiUpdateTask(taskId, { isCompleted: !task.isCompleted });
    await loadTasks();
  }

  async function handleDelete(taskId: string): Promise<void> {
    await apiDeleteTask(taskId);
    await loadTasks();
  }

  function handleEdit(task: Task): void {
    setEditingTask(task);
  }

  function handleFormChange(field: keyof NewTaskForm, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleDurationChange(value: string): void {
    let clean = value.replace(/\D/g, '');
    if (clean.length > 1) clean = clean.replace(/^0+/, '');
    setForm((prev) => ({ ...prev, estimatedTime: clean }));
  }

  async function actuallyCreate(taskData: PendingTaskData): Promise<void> {
    try {
      await apiCreateTask(taskData);
      await loadTasks();
      setForm({
        title: '', description: '', category: 'work',
        priority: 'medium', time: '09:00', estimatedTime: '30',
      });
      setFormError('');
      setShowForm(false);
      setConflicts([]);
      setPendingTask(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Помилка створення';
      setFormError(msg);
    }
  }

  async function handleAddTask(): Promise<void> {
    if (!form.title.trim()) {
      setFormError('Введіть назву завдання');
      return;
    }

    const duration = Number(form.estimatedTime);
    if (!form.estimatedTime || isNaN(duration) || duration < 5 || duration > 480) {
      setFormError('Тривалість має бути від 5 до 480 хвилин');
      return;
    }

    const scheduledAt = TODAY + 'T' + form.time + ':00';
    const taskDateTime = new Date(scheduledAt);
    if (taskDateTime < new Date()) {
      setFormError('Не можна створювати задачі у минулому часі');
      return;
    }

    const taskData: PendingTaskData = {
      title:         form.title,
      description:   form.description,
      category:      form.category,
      priority:      form.priority,
      scheduledAt,
      estimatedTime: duration,
    };

    const conflictList = TaskService.findConflicts(scheduledAt, duration, tasks);
    if (conflictList.length > 0) {
      setConflicts(conflictList);
      setPendingTask(taskData);
      return;
    }
    await actuallyCreate(taskData);
  }

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#b0a0c8' }}>Завантаження...</p>
      </div>
    );
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.scheduledAt < b.scheduledAt) return -1;
    if (a.scheduledAt > b.scheduledAt) return 1;
    return 0;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ textTransform: 'capitalize' }}>{dateLabel}</h1>
          <p className="stat-sub">Щоденний планер</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Завдання</button>
      </div>

      <div className="reminder-banner">🔔 Плануй свій день і відстежуй прогрес</div>

      <div className="card" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: 700, color: '#2e2640' }}>Прогрес дня</span>
          <span style={{ fontWeight: 700, color: '#8b72be' }}>{completedCount} / {tasks.length} виконано</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: progress + '%' }} />
        </div>
        <p className="stat-sub" style={{ marginTop: '4px' }}>{progress}%</p>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '14px' }}>
          <p style={{ fontWeight: 700, marginBottom: '12px', color: '#2e2640' }}>Нове завдання</p>
          <div className="form-stack">
            <div>
              <label className="form-label">Назва *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="Назва завдання..."
                className={`input ${formError ? 'input-error' : ''}`}
              />
            </div>
            <div>
              <label className="form-label">Опис</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Короткий опис"
                className="input"
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
                  onChange={(e) => handleFormChange('priority', e.target.value)}
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
                  onChange={(e) => handleFormChange('time', e.target.value)}
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
            <button className="btn-primary" onClick={handleAddTask}>Додати</button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setFormError(''); }}>
              Скасувати
            </button>
          </div>
        </div>
      )}

      <p className="section-label">Завдання на день</p>
      <div className="flex-col-gap">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-icon">📋</p>
            <p>Завдань немає. Натисни «+ Завдання» щоб додати перше!</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))
        )}
      </div>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          userId={userId}
          allTasks={tasks}
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