const fs = require('fs');
const os = require('os');
const path = require('path');

const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'careertrack-auth-test-'));
process.env.CAREERTRACK_DATA_DIR = dataDirectory;
process.env.JWT_SECRET = 'careertrack-auth-test-secret';

const request = require('supertest');
const app = require('../app');
const store = require('../storage/jsonStore');

afterAll(async () => {
  await fs.promises.rm(dataDirectory, { recursive: true, force: true });
});

describe('Authentication and profile API', () => {
  let token;
  let userId;

  it('registers users with password hashes and rejects duplicate email addresses', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'TEST@example.com',
        password: 'password123',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe('test@example.com');
    token = response.body.token;
    userId = response.body.user.id;

    const [storedUser] = await store.readCollection('users');
    expect(storedUser.password).not.toBe('password123');
    expect(storedUser.password).toMatch(/^\$2[aby]\$/);

    const duplicateResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        email: 'test@example.com',
        password: 'password123',
      });

    expect(duplicateResponse.statusCode).toBe(400);
    expect(duplicateResponse.body.message).toMatch(/already exists/i);
    expect((await store.readCollection('users'))).toHaveLength(1);
  });

  it('logs in case-insensitively and rejects incorrect passwords', async () => {
    const invalidResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'incorrect' });

    expect(invalidResponse.statusCode).toBe(401);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'TEST@EXAMPLE.COM', password: 'password123' });

    expect(response.statusCode).toBe(200);
    expect(response.body.user.id).toBe(userId);
    expect(response.body.token).toBeTruthy();
  });

  it('validates input and protects profile/password operations', async () => {
    const invalidRegistration = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'invalid', password: '123' });
    expect(invalidRegistration.statusCode).toBe(400);

    const profileResponse = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(profileResponse.statusCode).toBe(200);
    expect(profileResponse.body.data.password).toBeUndefined();
    expect(profileResponse.body.data._id).toBe(userId);

    const updateResponse = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated User', location: 'Toronto', bio: 'Looking for product roles.' });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.data.name).toBe('Updated User');
    expect(updateResponse.body.data.profile.location).toBe('Toronto');

    const passwordResponse = await request(app)
      .put('/api/users/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'password123', newPassword: 'new-password-123' });

    expect(passwordResponse.statusCode).toBe(200);

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'new-password-123' });

    expect(newLogin.statusCode).toBe(200);
  });

  it('deletes the authenticated account and its application records', async () => {
    const response = await request(app)
      .delete('/api/users/account')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(await store.readCollection('users')).toHaveLength(0);
    expect(await store.readCollection('applications')).toHaveLength(0);
  });
});
