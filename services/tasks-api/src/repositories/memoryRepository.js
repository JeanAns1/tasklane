const { randomUUID } = require('node:crypto');

/** In-memory repository: used by the test suite, same interface as the Postgres one. */
function createMemoryRepository() {
  const tasks = new Map();

  return {
    async init() {},
    async list({ status } = {}) {
      return [...tasks.values()]
        .filter((t) => !status || t.status === status)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    async get(id) {
      return tasks.get(id) ?? null;
    },
    async create(data) {
      const now = new Date().toISOString();
      const task = {
        id: randomUUID(),
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? 'todo',
        priority: data.priority ?? 'medium',
        due_date: data.due_date ?? null,
        created_at: now,
        updated_at: now,
        completed_at: data.status === 'done' ? now : null,
      };
      tasks.set(task.id, task);
      return task;
    },
    async update(id, changes) {
      const task = tasks.get(id);
      if (!task) return null;
      const now = new Date().toISOString();
      const updated = { ...task, ...changes, updated_at: now };
      if (changes.status) {
        updated.completed_at = changes.status === 'done' ? task.completed_at ?? now : null;
      }
      tasks.set(id, updated);
      return updated;
    },
    async remove(id) {
      return tasks.delete(id);
    },
    async ping() {
      return true;
    },
  };
}

module.exports = { createMemoryRepository };
