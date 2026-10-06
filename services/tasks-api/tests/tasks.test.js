const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');
const { createMemoryRepository } = require('../src/repositories/memoryRepository');

let app;
beforeEach(() => {
  app = createApp(createMemoryRepository());
});

test('GET /health returns ok', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: 'ok' });
});

test('POST /api/tasks creates a task with defaults', async () => {
  const res = await request(app).post('/api/tasks').send({ title: '  Write README  ' });
  assert.equal(res.status, 201);
  assert.equal(res.body.title, 'Write README');
  assert.equal(res.body.status, 'todo');
  assert.equal(res.body.priority, 'medium');
});

test('POST /api/tasks rejects an invalid payload', async () => {
  const res = await request(app).post('/api/tasks').send({ title: '', priority: 'urgent' });
  assert.equal(res.status, 422);
  assert.equal(res.body.details.length, 2);
});

test('PATCH to done sets completed_at, moving back clears it', async () => {
  const { body: task } = await request(app).post('/api/tasks').send({ title: 'Ship it' });

  const done = await request(app).patch(`/api/tasks/${task.id}`).send({ status: 'done' });
  assert.equal(done.status, 200);
  assert.ok(done.body.completed_at);

  const reopened = await request(app).patch(`/api/tasks/${task.id}`).send({ status: 'todo' });
  assert.equal(reopened.body.completed_at, null);
});

test('GET /api/tasks filters by status', async () => {
  await request(app).post('/api/tasks').send({ title: 'A' });
  await request(app).post('/api/tasks').send({ title: 'B', status: 'done' });
  const res = await request(app).get('/api/tasks?status=done');
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].title, 'B');
});

test('DELETE removes a task, then 404', async () => {
  const { body: task } = await request(app).post('/api/tasks').send({ title: 'Temp' });
  assert.equal((await request(app).delete(`/api/tasks/${task.id}`)).status, 204);
  assert.equal((await request(app).get(`/api/tasks/${task.id}`)).status, 404);
});

test('invalid id returns 400', async () => {
  const res = await request(app).get('/api/tasks/not-a-uuid');
  assert.equal(res.status, 400);
});
