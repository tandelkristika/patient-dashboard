process.env.CLIENT_URL = 'http://localhost:5173';

const request = require('supertest');
const app = require('../src/app');

describe('API basics', () => {
  test('health check returns 200', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('unknown route returns JSON 404', async () => {
    const res = await request(app).get(
      '/api/does-not-exist'
    );

    expect(res.status).toBe(404);

    expect(res.body).toEqual({
      success: false,
      message: 'Route not found',
    });
  });

  test('security headers are present, X-Powered-By is hidden', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-powered-by']).toBeUndefined();

    expect(res.headers['x-content-type-options']).toBe(
      'nosniff'
    );
  });

  test('CORS allows our frontend origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(
      res.headers['access-control-allow-origin']
    ).toBe('http://localhost:5173');
  });

  test('CORS never grants access to another origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://evil.example.com');

    expect(
      res.headers['access-control-allow-origin']
    ).not.toBe('http://evil.example.com');
  });
});

// Keep this LAST because it consumes the rate-limit budget.
describe('rate limiting', () => {
  test(
    'requests beyond the limit receive 429',
    async () => {
      let lastStatus;

      for (let i = 0; i < 105; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const res = await request(app).get('/api/health');

        lastStatus = res.status;
      }

      expect(lastStatus).toBe(429);
    },
    30000
  );
});
