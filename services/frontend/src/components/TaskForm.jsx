import { useState } from 'react';

const EMPTY = { title: '', priority: 'medium', due_date: '' };

export default function TaskForm({ onCreate }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const ok = await onCreate({ ...form, due_date: form.due_date || null });
    setSaving(false);
    if (ok) setForm(EMPTY);
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label className="task-form__title">
        <span className="visually-hidden">Task title</span>
        <input
          value={form.title}
          onChange={update('title')}
          placeholder="What needs doing?"
          maxLength={120}
          required
        />
      </label>
      <label>
        <span className="visually-hidden">Priority</span>
        <select value={form.priority} onChange={update('priority')}>
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
      </label>
      <label>
        <span className="visually-hidden">Due date</span>
        <input type="date" value={form.due_date} onChange={update('due_date')} />
      </label>
      <button type="submit" className="btn btn--primary" disabled={saving}>
        {saving ? 'Adding…' : 'Add task'}
      </button>
    </form>
  );
}
