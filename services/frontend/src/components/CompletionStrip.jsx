const dayFormat = new Intl.DateTimeFormat('en', { weekday: 'narrow' });
const fullFormat = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' });

export default function CompletionStrip({ summary }) {
  if (!summary) return <section className="strip strip--loading" aria-busy="true" />;

  const days = summary.completed_per_day;
  const max = Math.max(1, ...days.map((d) => d.count));
  const doneInWindow = days.reduce((sum, d) => sum + d.count, 0);
  const open = summary.by_status.todo + summary.by_status.in_progress;

  return (
    <section className="strip" aria-label="Progress over the last 14 days">
      <div className="strip__headline">
        <p className="strip__big">{doneInWindow}</p>
        <p className="strip__caption">tasks finished in the last two weeks</p>
      </div>

      <ol className="strip__bars">
        {days.map((d) => {
          const date = new Date(`${d.date}T00:00:00`);
          const label = `${fullFormat.format(date)}: ${d.count} finished`;
          return (
            <li key={d.date} className="strip__day" title={label}>
              <span
                className={`strip__bar${d.count === 0 ? ' strip__bar--empty' : ''}`}
                style={{ '--h': `${(d.count / max) * 100}%` }}
              />
              <span className="strip__dow" aria-hidden="true">{dayFormat.format(date)}</span>
              <span className="visually-hidden">{label}</span>
            </li>
          );
        })}
      </ol>

      <dl className="strip__facts">
        <div><dt>Open</dt><dd>{open}</dd></div>
        <div className={summary.overdue ? 'is-alert' : ''}><dt>Overdue</dt><dd>{summary.overdue}</dd></div>
        <div><dt>Due in 7 days</dt><dd>{summary.due_this_week}</dd></div>
        <div><dt>Done overall</dt><dd>{Math.round(summary.completion_rate * 100)}%</dd></div>
      </dl>
    </section>
  );
}
