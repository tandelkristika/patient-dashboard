const express = require('express');
const request = require('supertest');

const ApiError = require('../src/utils/ApiError');
const errorHandler = require('../src/middleware/errorHandler');
const { sanitizeBody } = require('../src/middleware/sanitizeBody');

const buildApp = () => {
  const app = express();

  app.use(express.json({ limit: '1kb' }));
  app.use(sanitizeBody);

  app.get('/known', () => {
    throw new ApiError(403, 'Nope');
  });

  app.get('/unknown', () => {
    throw new Error('SECRET internal detail: password hunter2');
  });

  app.get('/cast', () => {
    const error = new Error(
      'Cast to ObjectId failed for value "abc"'
    );

    error.name = 'CastError';

    throw error;
  });

  app.get('/duplicate', () => {
    const error = new Error('E11000 duplicate key');

    error.code = 11000;
    error.keyPattern = { email: 1 };

    throw error;
  });

  app.get('/mongoose-validation', () => {
    const error = new Error('Validation failed');

    error.name = 'ValidationError';
    error.errors = {
      name: {
        path: 'name',
        message: 'Name is required',
      },
    };

    throw error;
  });

  app.get('/expired-token', () => {
    const error = new Error('jwt expired');

    error.name = 'TokenExpiredError';

    throw error;
  });

  app.post('/echo', (req, res) => {
    res.json(req.body);
  });

  app.use(errorHandler);

  return app;
};

describe('central error handler', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('known ApiError keeps its status and message', async () => {
    const res = await request(app).get('/known');

    expect(res.status).toBe(403);

    expect(res.body).toEqual({
      success: false,
      message: 'Nope',
    });
  });

  test('unknown error returns 500 and hides internal details', async () => {
    const res = await request(app).get('/unknown');

    expect(res.status).toBe(500);

    expect(JSON.stringify(res.body)).not.toContain('hunter2');

    expect(res.body.success).toBe(false);
  });

  test('invalid MongoDB id returns 400', async () => {
    const res = await request(app).get('/cast');

    expect(res.status).toBe(400);

    expect(res.body.message).toBe('Invalid ID format');
  });

  test('duplicate key returns 409 naming the field', async () => {
    const res = await request(app).get('/duplicate');

    expect(res.status).toBe(409);

    expect(res.body.message).toContain('email');
  });

  test('mongoose validation error returns 400 with field list', async () => {
    const res = await request(app).get('/mongoose-validation');

    expect(res.status).toBe(400);

    expect(res.body.errors).toEqual([
      {
        field: 'name',
        message: 'Name is required',
      },
    ]);
  });

  test('expired token returns 401', async () => {
    const res = await request(app).get('/expired-token');

    expect(res.status).toBe(401);
  });

  test('malformed JSON returns 400', async () => {
    const res = await request(app)
      .post('/echo')
      .set('Content-Type', 'application/json')
      .send('{bad');

    expect(res.status).toBe(400);

    expect(res.body.message).toBe(
      'Invalid JSON in request body'
    );
  });

  test('oversized body returns 413', async () => {
    const res = await request(app)
      .post('/echo')
      .send({
        text: 'x'.repeat(2000),
      });

    expect(res.status).toBe(413);
  });
});

describe('body sanitizing', () => {
  const app = buildApp();

  test('MongoDB operators are stripped from the body', async () => {
    const res = await request(app)
      .post('/echo')
      .send({
        email: {
          $gt: '',
        },
        password: 'x',
      });

    expect(res.status).toBe(200);

    expect(res.body.email).toEqual({});

    expect(res.body.password).toBe('x');
  });

  test('normal data passes through unchanged', async () => {
    const res = await request(app)
      .post('/echo')
      .send({
        name: 'Test',
        tags: ['a', 'b'],
      });

    expect(res.body).toEqual({
      name: 'Test',
      tags: ['a', 'b'],
    });
  });
});
