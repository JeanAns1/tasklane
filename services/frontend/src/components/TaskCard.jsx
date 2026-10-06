const ORDER = ['todo', 'in_progress', 'done'];
const NAMES = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });

function dueLabel(task) {
  if (!task.due_date) return null;
  const due = new Date(`${task.due_date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = task.status !== 'done' && due < today;
  const date = dateFormat.format(due);
  return { text: overdue ? `Overdue since ${date}` : `Due ${date}`, overdue };
}

export default function TaskCard({ task, onMove, onDelete }) {
  const index = ORDER.indexOf(task.status);
  const prev = ORDER[index - 1];
  const next = ORDER[index + 1];
  const due = dueLabel(task);

  return (
    <article className={`card card--${task.priority}`}>
      <h3 className="card__title">{task.title}</h3>
      <p className="card__meta">
        <span>{task.priority[0].toUpperCase() + task.priority.slice(1)} priority</span>
        {due && <span className={due.overdue ? 'card__due is-alert' : 'card__due'}>{due.text}</span>}
      </p>
      <div className="card__actions">
        {prev && (
          <button className="btn btn--ghost" onClick={() => onMove(task, prev)}>
            Move back
          </button>
        )}
        {next && (
          <button className="btn btn--ghost" onClick={() => onMove(task, next)}>
            {next === 'done' ? 'Mark done' : 'Start'}
          </button>
        )}
        <button className="btn btn--danger" onClick={() => onDelete(task)} aria-label={`Delete "${task.title}"`}>
          Delete
        </button>
      </div>
    </article>
  );
}

export { NAMES, ORDER };
