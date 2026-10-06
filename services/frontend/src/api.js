async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = Array.isArray(body.details) ? body.details.join(', ') : body.detail;
    throw new Error(detail || body.error || `Request failed (${res.status})`);
  }
  return body;
}

export const api = {
  listTasks: () => request('/api/tasks'),
  createTask: (data) => request('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
  getSummary: () => request('/api/analytics/summary?days=14'),
};
