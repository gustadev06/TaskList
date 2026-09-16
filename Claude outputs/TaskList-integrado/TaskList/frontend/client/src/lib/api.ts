export type Task = {
  id: number;
  title: string;
  done: boolean;
};

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_URL_KEY = "taskboard-api-url";

export function getApiUrl() {
  if (typeof window === "undefined") return DEFAULT_API_URL;
  return window.localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL;
}

export function setApiUrl(url: string) {
  const normalized = url.trim().replace(/\/$/, "");
  window.localStorage.setItem(API_URL_KEY, normalized);
  return normalized;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const rawBody = await response.text();
  let body: unknown = null;

  try {
    body = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    body = rawBody;
  }

  if (!response.ok) {
    const message = typeof body === "object" && body !== null
      ? ((body as { error?: string; erro?: string }).error || (body as { error?: string; erro?: string }).erro)
      : null;
    throw new Error(message || `A API respondeu com status ${response.status}.`);
  }

  return body as T;
}

export function listTasks() {
  return request<unknown>("/tasks").then((result) => {
    if (!Array.isArray(result)) {
      throw new Error("A URL informada não retornou uma lista de tarefas.");
    }
    return result as Task[];
  });
}

export function createTask(title: string) {
  return request<unknown>("/tasks", {
    method: "POST",
    body: JSON.stringify({ title }),
  }).then((result) => result as Task);
}

export function completeTask(id: number) {
  return request<unknown>(`/tasks/${id}/complete`, {
    method: "PATCH",
  }).then((result) => result as Task);
}

export function checkApi() {
  return request<string>("/");
}

export { DEFAULT_API_URL };
