'use strict';
const request = require('supertest');
const app = require('../src/app');

describe('API integration basics', () => {
  test('health endpoint reports service status without exposing secrets', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe('ok');
    expect(response.body).toHaveProperty('database');
    expect(response.body).toHaveProperty('aiConfigured');
    expect(response.body).not.toHaveProperty('jwtSecret');
    expect(response.body).not.toHaveProperty('apiKey');
  });

  test('private resume endpoint rejects unauthenticated requests', async () => {
    const response = await request(app).get('/api/resumes').expect(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/authentication required/i);
  });

  test('unknown API routes return a structured 404 response', async () => {
    const response = await request(app).get('/api/does-not-exist').expect(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/route GET \/api\/does-not-exist not found/i);
  });
});
