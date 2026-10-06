import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import Board from './components/Board.jsx';
import CompletionStrip from './components/CompletionStrip.jsx';
import TaskForm from './components/TaskForm.jsx';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [taskList, stats] = await Promise.all([api.listTasks(), api.getSummary()]);
      setTasks(taskList);
      setSummary(stats);
      setError('');
    } catch (err) {
      setError(`Could not load data: ${err.message}. Check that every container is running.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function run(action) {
    try {
      await action();
      await refresh();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  return (
    <div className="shell">
      <header className="masthead">
        <h1 className="logo">Tasklane</h1>
        <TaskForm onCreate={(data) => run(() => api.createTask(data))} />
      </header>

      {error && (
        <p className="banner" role="alert">
          {error}
          <button className="btn btn--ghost" onClick={() => setError('')}>Dismiss</button>
        </p>
      )}

      <main>
        <CompletionStrip summary={summary} />
        {loading ? (
          <p className="loading">Loading tasks…</p>
        ) : (
          <Board
            tasks={tasks}
            onMove={(task, status) => run(() => api.updateTask(task.id, { status }))}
            onDelete={(task) => run(() => api.deleteTask(task.id))}
          />
        )}
      </main>

      <footer className="footer">
        React front-end, Express tasks API, FastAPI analytics, PostgreSQL. Built to run with one command.
      </footer>
    </div>
  );
}
