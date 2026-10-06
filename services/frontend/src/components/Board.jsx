import TaskCard, { NAMES, ORDER } from './TaskCard.jsx';

const EMPTY_TEXT = {
  todo: 'Nothing queued. Add a task above to get started.',
  in_progress: 'Start a task from the to-do lane to see it here.',
  done: 'Finished tasks land here and count toward the chart.',
};

export default function Board({ tasks, onMove, onDelete }) {
  return (
    <div className="board">
      {ORDER.map((status) => {
        const items = tasks.filter((t) => t.status === status);
        return (
          <section key={status} className={`lane lane--${status}`} aria-labelledby={`lane-${status}`}>
            <h2 id={`lane-${status}`} className="lane__title">
              {NAMES[status]} <span className="lane__count">{items.length}</span>
            </h2>
            {items.length === 0 ? (
              <p className="lane__empty">{EMPTY_TEXT[status]}</p>
            ) : (
              items.map((t) => <TaskCard key={t.id} task={t} onMove={onMove} onDelete={onDelete} />)
            )}
          </section>
        );
      })}
    </div>
  );
}
