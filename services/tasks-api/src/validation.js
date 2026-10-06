const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates a task payload.
 * @param {object} body  incoming JSON
 * @param {{partial?: boolean}} options  partial=true for PATCH
 * @returns {{ value?: object, errors?: string[] }}
 */
function validateTask(body, { partial = false } = {}) {
  const errors = [];
  const value = {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Body must be a JSON object'] };
  }

  if (body.title !== undefined || !partial) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      errors.push('title is required and must be a non-empty string');
    } else if (body.title.trim().length > 120) {
      errors.push('title must be 120 characters or fewer');
    } else {
      value.title = body.title.trim();
    }
  }

  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== 'string') {
      errors.push('description must be a string');
    } else if (body.description && body.description.length > 1000) {
      errors.push('description must be 1000 characters or fewer');
    } else {
      value.description = body.description ? body.description.trim() : null;
    }
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) errors.push(`status must be one of: ${STATUSES.join(', ')}`);
    else value.status = body.status;
  }

  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) errors.push(`priority must be one of: ${PRIORITIES.join(', ')}`);
    else value.priority = body.priority;
  }

  if (body.due_date !== undefined) {
    if (body.due_date === null || body.due_date === '') value.due_date = null;
    else if (typeof body.due_date !== 'string' || !DATE_RE.test(body.due_date) || Number.isNaN(Date.parse(body.due_date))) {
      errors.push('due_date must be a date in YYYY-MM-DD format');
    } else value.due_date = body.due_date;
  }

  if (partial && Object.keys(value).length === 0 && errors.length === 0) {
    errors.push('Provide at least one field to update');
  }

  return errors.length ? { errors } : { value };
}

module.exports = { validateTask, STATUSES, PRIORITIES };
