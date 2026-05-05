import React from 'react';
import { Task } from '../types';
import { TaskService } from '../services/taskService';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

export default function TaskItem({ task, onToggle, onDelete, onEdit }: TaskItemProps) {
  const time = new Date(task.scheduledAt).toLocaleTimeString('uk-UA', {
    hour: '2-digit', minute: '2-digit',
  });

  const categoryColor = task.categoryColor || '#8b72be';
  const categoryLabel = task.categoryLabel || task.category;

  return (
    <div className={`task-item ${task.isCompleted ? 'completed' : ''}`}>
      <button
        className={`task-checkbox ${task.isCompleted ? 'checked' : ''}`}
        onClick={() => onToggle(task.id)}
      >
        {task.isCompleted && '✓'}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p className={`task-title ${task.isCompleted ? 'done' : ''}`}>{task.title}</p>
        <p className="task-meta">
          <span style={{ color: categoryColor, fontWeight: 700 }}>{categoryLabel}</span>
          {' · '}{time}{' · '}{task.estimatedTime} хв
        </p>
      </div>

      <span className={`badge badge-${task.priority}`}>
        {TaskService.getPriorityLabel(task.priority)}
      </span>

      {!task.isCompleted && (
        <button
          onClick={() => onEdit(task)}
          style={{ background: 'none', border: 'none', color: '#8b72be', fontSize: '14px', padding: '0 4px', cursor: 'pointer' }}
          title="Редагувати"
        >
          ✏️
        </button>
      )}

      <button
        onClick={() => onDelete(task.id)}
        style={{ background: 'none', border: 'none', color: '#ccc', fontSize: '16px', padding: '0 4px', cursor: 'pointer' }}
        title="Видалити"
      >
        ✕
      </button>
    </div>
  );
}