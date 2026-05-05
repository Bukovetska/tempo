import { User, Task } from '../types';

const USERS_KEY    = 'tempo_users';
const TASKS_KEY    = 'tempo_tasks';
const SESSION_KEY  = 'tempo_session';


export function getUsers(): User[] {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email === email);
}

export function registerUser(user: User): void {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

export function getSession(): User | null {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveSession(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}


export function getTasks(): Task[] {
  const raw = localStorage.getItem(TASKS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function getTasksByUserAndDate(userId: string, date: string): Task[] {
  return getTasks().filter((t) => {
    const taskDate = t.scheduledAt.split('T')[0];
    return t.userId === userId && taskDate === date;
  });
}

export function getTasksByUser(userId: string): Task[] {
  return getTasks().filter((t) => t.userId === userId);
}

export function addTask(task: Task): void {
  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);
}

export function updateTask(updated: Task): void {
  const tasks = getTasks().map((t) => t.id === updated.id ? updated : t);
  saveTasks(tasks);
}

export function deleteTask(taskId: string): void {
  const tasks = getTasks().filter((t) => t.id !== taskId);
  saveTasks(tasks);
}