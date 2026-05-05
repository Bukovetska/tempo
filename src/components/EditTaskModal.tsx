import React, { useState, useEffect } from 'react';
import { Task, TaskPriority } from '../types';
import { apiUpdateTask } from '../services/apiService';
import { TaskService } from '../services/taskService';
import CategorySelect from './CategorySelect';

interface EditTaskModalProps {
  task: Task;
  userId: string;
  allTasks: Task[];
  onClose: () => void;
  onSaved: () => void;
}

interface TaskUpdates {
  title:         string;
  description:   string;
  category:      string;
  priority:      TaskPriority;
  scheduledAt:   string;
  estimatedTime: number;
}

export default function EditTaskModal({ task, userId, allTasks, onClose, onSaved }: EditTaskModalProps) {
  const taskDate = new Date(task.scheduledAt);
  const yyyy = taskDate.getFullYear();
  const mm = String(taskDate.getMonth() + 1).padStart(2, '0');
  const dd = String(taskDate.getDate()).padStart(2, '0');
  const hh = String(taskDate.getHours()).padStart(2, '0');
  const mn = String(taskDate.getMinutes()).padStart(2, '0');

  const [title, setTitle]                 = useState<string>(task.title);
  const [description, setDescription]     = useState<string>(task.description || '');
  const [category, setCategory]           = useState<string>(task.category);
  const [priority, setPriority]           = useState<TaskPriority>(task.priority);
  const [date, setDate]                   = useState<string>(yyyy + '-' + mm + '-' + dd);
  const [time, setTime]                   = useState<string>(hh + ':' + mn);
  const [estimatedTime, setEstimatedTime] = useState<string>(String(task.estimatedTime));
  const [error, setError]                 = useState<string>('');
  const [saving, setSaving]               = useState<boolean>(false);
  const [conflicts, setConflicts] = useState<Task[]>([]);
  const [pendingUpdate, setPendingUpdate] = useState<TaskUpdates | null>(null);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  function handleDurationChange(value: string): void {
    let clean = value.replace(/\D/g, '');
    if (clean.length > 1) clean = clean.replace(/^0+/, '');
    setEstimatedTime(clean);
  }

  function getTodayForInput(): string {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  async function actuallySave(updates: TaskUpdates): Promise<void> {
    setSaving(true);
    try {
      await apiUpdateTask(task.id, updates);
      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Помилка';
      setError(msg);
    } finally {
      setSaving(false);
      setConflicts([]);
      setPendingUpdate(null);
    }
  }

  async function handleSave(): Promise<void> {
    if (!title.trim()) {
      setError('Введіть назву');
      return;
    }

    const duration = Number(estimatedTime);
    if (!estimatedTime || isNaN(duration) || duration < 5 || duration > 480) {
      setError('Тривалість має бути від 5 до 480 хв');
      return;
    }

    const newDateTime = new Date(date + 'T' + time + ':00');
    if (newDateTime < new Date()) {
      setError('Не можна ставити час у минулому');
      return;
    }

    const newScheduledAt = date + 'T' + time + ':00';
    const updates: TaskUpdates = {
      title, description, category, priority,
      scheduledAt: newScheduledAt,
      estimatedTime: duration,
    };

    const conflictList = TaskService.findConflicts(newScheduledAt, duration, allTasks, task.id);
    if (conflictList.length > 0) {
      setConflicts(conflictList);
      setPendingUpdate(updates);
      return;
    }
    await actuallySave(updates);
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <p className="modal-title">Редагувати задачу</p>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          <div className="form-stack">
            <div>
              <label className="form-label">Назва *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`input ${error ? 'input-error' : ''}`}
                autoFocus
              />
            </div>

            <div>
              <label className="form-label">Опис</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
              />
            </div>

            <div className="form-grid-2">
              <div>
                <label className="form-label">Категорія</label>
                <CategorySelect userId={userId} value={category} onChange={setCategory} />
              </div>
              <div>
                <label className="form-label">Пріоритет</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="input"
                >
                  <option value="high">Високий</option>
                  <option value="medium">Середній</option>
                  <option value="low">Низький</option>
                </select>
              </div>
              <div>
                <label className="form-label">Дата</label>
                <input
                  type="date"
                  value={date}
                  min={getTodayForInput()}
                  onChange={(e) => setDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="form-label">Час</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="input"
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Тривалість (хв)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={estimatedTime}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  placeholder="30"
                  className="input"
                />
              </div>
            </div>

            {error && <p className="error-text">⚠ {error}</p>}
          </div>

          <div className="form-actions">
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Збереження...' : '💾 Зберегти'}
            </button>
            <button className="btn-secondary" onClick={onClose}>Скасувати</button>
          </div>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="modal-overlay high-z" onClick={() => { setConflicts([]); setPendingUpdate(null); }}>
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

            <p className="conflict-prompt">Все одно зберегти зміни?</p>

            <div className="form-actions" style={{ marginTop: 0 }}>
              <button
                className="btn-secondary"
                onClick={() => { setConflicts([]); setPendingUpdate(null); }}
              >
                Ні, скасувати
              </button>
              <button
                className="btn-primary"
                onClick={() => { if (pendingUpdate) actuallySave(pendingUpdate); }}
              >
                Так, зберегти
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}