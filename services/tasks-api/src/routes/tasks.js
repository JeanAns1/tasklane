const express = require('express');
const { validateTask, STATUSES } = require('../validation');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Wraps async handlers so errors reach the error middleware.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function tasksRouter(repo) {
  const router = express.Router();

  router.param('id', (req, res, next, id) => {
    if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Invalid task id' });
    next();
  });

  router.get('/', wrap(async (req, res) => {
    const { status } = req.query;
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` });
    }
    res.json(await repo.list({ status }));
  }));

  router.get('/:id', wrap(async (req, res) => {
    const task = await repo.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  }));

  router.post('/', wrap(async (req, res) => {
    const { value, errors } = validateTask(req.body);
    if (errors) return res.status(422).json({ error: 'Validation failed', details: errors });
    res.status(201).json(await repo.create(value));
  }));

  router.patch('/:id', wrap(async (req, res) => {
    const { value, errors } = validateTask(req.body, { partial: true });
    if (errors) return res.status(422).json({ error: 'Validation failed', details: errors });
    const task = await repo.update(req.params.id, value);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  }));

  router.delete('/:id', wrap(async (req, res) => {
    const deleted = await repo.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.status(204).end();
  }));

  return router;
}

module.exports = { tasksRouter };
