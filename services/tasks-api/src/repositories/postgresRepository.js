const { Pool } = require('pg');

const COLUMNS = `id, title, description, status, priority,
  to_char(due_date, 'YYYY-MM-DD') AS due_date,
  created_at, updated_at, completed_at`;

function createPostgresRepository(connectionString) {
  const pool = new Pool({ connectionString });

  return {
    /** Waits for the database, then creates the schema if needed. */
    async init({ retries = 10, delayMs = 2000 } = {}) {
      for (let attempt = 1; ; attempt++) {
        try {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
              id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              title        VARCHAR(120) NOT NULL,
              description  TEXT,
              status       VARCHAR(20)  NOT NULL DEFAULT 'todo'
                           CHECK (status IN ('todo', 'in_progress', 'done')),
              priority     VARCHAR(10)  NOT NULL DEFAULT 'medium'
                           CHECK (priority IN ('low', 'medium', 'high')),
              due_date     DATE,
              created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
              updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
              completed_at TIMESTAMPTZ
            );
            CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
          `);
          return;
        } catch (err) {
          if (attempt >= retries) throw err;
          console.warn(`Database not ready (attempt ${attempt}/${retries}): ${err.message}`);
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    },

    async list({ status } = {}) {
      const { rows } = status
        ? await pool.query(`SELECT ${COLUMNS} FROM tasks WHERE status = $1 ORDER BY created_at DESC`, [status])
        : await pool.query(`SELECT ${COLUMNS} FROM tasks ORDER BY created_at DESC`);
      return rows;
    },

    async get(id) {
      const { rows } = await pool.query(`SELECT ${COLUMNS} FROM tasks WHERE id = $1`, [id]);
      return rows[0] ?? null;
    },

    async create(data) {
      const { rows } = await pool.query(
        `INSERT INTO tasks (title, description, status, priority, due_date, completed_at)
         VALUES ($1, $2, COALESCE($3, 'todo'), COALESCE($4, 'medium'), $5,
                 CASE WHEN $3 = 'done' THEN NOW() END)
         RETURNING ${COLUMNS}`,
        [data.title, data.description ?? null, data.status ?? null, data.priority ?? null, data.due_date ?? null],
      );
      return rows[0];
    },

        async update(id, changes) {
      const fields = Object.keys(changes);
      const values = [id, ...fields.map((f) => changes[f])];
      const sets = fields.map((f, i) => `${f} = $${i + 2}`);

      if (changes.status) {
        // Separate parameter: reusing the status param in both SET and CASE
        // makes PostgreSQL deduce two different types (varchar vs text).
        values.push(changes.status);
        sets.push(`completed_at = CASE WHEN $${values.length}::text = 'done'
                                       THEN COALESCE(completed_at, NOW()) ELSE NULL END`);
      }
      sets.push('updated_at = NOW()');

      const { rows } = await pool.query(
        `UPDATE tasks SET ${sets.join(', ')} WHERE id = $1 RETURNING ${COLUMNS}`,
        values,
      );
      return rows[0] ?? null;
    },

    async remove(id) {
      const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
      return rowCount > 0;
    },

    async ping() {
      await pool.query('SELECT 1');
      return true;
    },

    async close() {
      await pool.end();
    },
  };
}

module.exports = { createPostgresRepository };
