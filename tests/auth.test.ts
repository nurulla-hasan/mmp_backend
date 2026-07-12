import cookieParser from 'cookie-parser';
import express, { Router } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '../src/middlewares/error-handler.js';
import { requestContext } from '../src/middlewares/request-context.js';
import { auth } from '../src/middlewares/auth.js';
import { USER_ROLES } from '../src/types/auth.js';
import { signAccessToken } from '../src/utils/jwt.js';

const app = express();
app.use(requestContext);
app.use(cookieParser());
const protectedRouter = Router();
protectedRouter.get('/authenticated', auth(), (req, res) => res.json({ user: req.user }));
protectedRouter.get('/admin', auth(USER_ROLES.ADMIN), (_req, res) => res.json({ ok: true }));
app.use('/test', protectedRouter);
app.use(errorHandler);

describe('auth middleware', () => {
  it('rejects a request without a token', async () => {
    const response = await request(app).get('/test/authenticated');
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ error: { code: 'UNAUTHORIZED' } });
  });

  it('accepts a Bearer access token', async () => {
    const token = signAccessToken({ userId: 'user-1', role: USER_ROLES.USER });
    const response = await request(app).get('/test/authenticated').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ user: { userId: 'user-1', role: USER_ROLES.USER } });
  });

  it('checks the access-token cookie before the Authorization header', async () => {
    const cookieToken = signAccessToken({ userId: 'cookie-user', role: USER_ROLES.USER });
    const headerToken = signAccessToken({ userId: 'header-user', role: USER_ROLES.ADMIN });
    const response = await request(app)
      .get('/test/authenticated')
      .set('Cookie', `accessToken=${cookieToken}`)
      .set('Authorization', `Bearer ${headerToken}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ user: { userId: 'cookie-user', role: USER_ROLES.USER } });
  });

  it('accepts a raw access token from the Authorization header', async () => {
    const token = signAccessToken({ userId: 'raw-user', role: USER_ROLES.USER });
    const response = await request(app).get('/test/authenticated').set('Authorization', token);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ user: { userId: 'raw-user', role: USER_ROLES.USER } });
  });

  it('blocks a user whose role is not allowed', async () => {
    const token = signAccessToken({ userId: 'user-1', role: USER_ROLES.USER });
    const response = await request(app).get('/test/admin').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ error: { code: 'FORBIDDEN' } });
  });

  it('allows an admin into an admin route', async () => {
    const token = signAccessToken({ userId: 'admin-1', role: USER_ROLES.ADMIN });
    const response = await request(app).get('/test/admin').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });
});
