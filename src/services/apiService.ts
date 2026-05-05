const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
  return localStorage.getItem('tempo_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiRegister(
  name: string,
  email: string,
  password: string
): Promise<{ token: string; user: any }> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Помилка реєстрації');
  return data;
}

export async function apiLogin(
  email: string,
  password: string
): Promise<{ token: string; user: any }> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Помилка входу');
  return data;
}

export async function apiFetchTasks(date?: string): Promise<any[]> {
  const url = date
    ? `${BASE_URL}/tasks?date=${date}`
    : `${BASE_URL}/tasks`;

  const res = await fetch(url, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Помилка завантаження завдань');
  return data;
}

export async function apiCreateTask(task: {
  title:         string;
  description:   string;
  category:      string;
  priority:      string;
  scheduledAt:   string;
  estimatedTime: number;
}): Promise<{ id: string }> {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify(task),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Помилка створення завдання');
  return data;
}

export async function apiUpdateTask(
  id: string,
  updates: {
    isCompleted?:   boolean;
    title?:         string;
    description?:   string;
    category?:      string;
    priority?:      string;
    scheduledAt?:   string;
    estimatedTime?: number;
  }
): Promise<void> {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method:  'PUT',
    headers: authHeaders(),
    body:    JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Помилка оновлення завдання');
}

export async function apiDeleteTask(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method:  'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Помилка видалення завдання');
}

export interface ApiCategory {
  id:    string;
  label: string;
  color: string;
}

export async function apiFetchCategories(): Promise<ApiCategory[]> {
  try {
    const res = await fetch(`${BASE_URL}/categories`, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  } catch {
    return [];
  }
}

export async function apiCreateCategory(label: string, color?: string): Promise<ApiCategory> {
  const res  = await fetch(`${BASE_URL}/categories`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify({ label, color }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Помилка');
  return data;
}

export async function apiUpdateCategory(
  id: string,
  updates: { label?: string; color?: string }
): Promise<ApiCategory> {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method:  'PUT',
    headers: authHeaders(),
    body:    JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Помилка');
  return data;
}

export async function apiDeleteCategory(id: string): Promise<void> {
  const res  = await fetch(`${BASE_URL}/categories/${id}`, {
    method:  'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Помилка');
}

export async function apiUpdateSettings(settings: {
  name?:                 string;
  timezone?:             string;
  notificationsEnabled?: boolean;
  weeklyReportEnabled?:  boolean;
  dailySummaryEnabled?:  boolean;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/user/settings`, {
    method:  'PUT',
    headers: authHeaders(),
    body:    JSON.stringify(settings),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Помилка збереження');
  return data;
}

export async function apiGetMe(): Promise<any> {
  const res = await fetch(`${BASE_URL}/user/me`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Помилка');
  return data;
}