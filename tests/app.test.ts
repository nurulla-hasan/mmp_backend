import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

describe('application', () => {
  it('returns a liveness response', async () => {
    const response = await request(app).get('/health/live');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, message: 'Service is healthy' });
    expect(response.headers['x-request-id']).toBeTypeOf('string');
  });

  it('returns a consistent 404 response', async () => {
    const response = await request(app).get('/missing');
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });
});
