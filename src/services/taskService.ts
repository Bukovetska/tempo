import { Task } from '../types';

export class TaskService {

  static getCategoryLabel(category: string): string {
    if (category === 'work')     return 'Робота';
    if (category === 'study')    return 'Навчання';
    if (category === 'personal') return 'Особисте';
    if (category === 'health')   return "Здоров'я";
    return category;
  }

  static getPriorityLabel(priority: string): string {
    if (priority === 'high')   return 'Високий';
    if (priority === 'medium') return 'Середній';
    if (priority === 'low')    return 'Низький';
    return priority;
  }

  static calculateProgress(tasks: { isCompleted: boolean }[]): number {
    if (tasks.length === 0) return 0;

    let completed = 0;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].isCompleted) {
        completed = completed + 1;
      }
    }

    return Math.round((completed / tasks.length) * 100);
  }

  static findConflicts(
    scheduledAt: string,
    estimatedTime: number,
    allTasks: Task[],
    excludeId?: string
  ): Task[] {
    const newStart = new Date(scheduledAt).getTime();
    const newEnd = newStart + estimatedTime * 60 * 1000;

    const conflicts: Task[] = [];

    for (let i = 0; i < allTasks.length; i++) {
      const t = allTasks[i];

      if (t.isCompleted) continue;
      if (excludeId && t.id === excludeId) continue;

      let duration = 30;
      if (t.estimatedTime) {
        duration = t.estimatedTime;
      }
      const tStart = new Date(t.scheduledAt).getTime();
      const tEnd = tStart + duration * 60 * 1000;

      const overlaps = newStart < tEnd && tStart < newEnd;
      if (overlaps) {
        conflicts.push(t);
      }
    }

    return conflicts;
  }

  static formatConflictTime(task: Task): string {
    const start = new Date(task.scheduledAt);
    const end = new Date(start.getTime() + task.estimatedTime * 60 * 1000);

    const startH = String(start.getHours()).padStart(2, '0');
    const startM = String(start.getMinutes()).padStart(2, '0');
    const endH = String(end.getHours()).padStart(2, '0');
    const endM = String(end.getMinutes()).padStart(2, '0');

    return task.title + ' (' + startH + ':' + startM + '–' + endH + ':' + endM + ')';
  }
}