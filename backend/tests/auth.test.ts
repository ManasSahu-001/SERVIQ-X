import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Authentication Middleware', () => {
  const app = createApp();

  it('should reject requests without Authorization header with 401', async () => {
    const res = await request(app).get('/api/conversations');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should accept valid demo/dev bearer token', async () => {
    const res = await request(app)
      .get('/api/conversations')
      .set('Authorization', 'Bearer demo-agent-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should reject malformed authorization headers', async () => {
    const res = await request(app)
      .get('/api/conversations')
      .set('Authorization', 'Basic invalid-format');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
