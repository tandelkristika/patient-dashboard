require('dotenv').config();

process.env.CLIENT_URL = 'http://localhost:5173';

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const Doctor = require('../src/models/Doctor');
const connectDB = require('../src/config/db');

describe('Authentication API', () => {
  const testEmail = 'auth.test@example.com';
  const testPassword = 'CorrectHorse9';

  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await Doctor.deleteMany({ email: testEmail });
  });

  afterAll(async () => {
    await Doctor.deleteMany({ email: testEmail });

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test('register creates a doctor and returns a JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dr. Auth Test',
        email: testEmail,
        password: testPassword,
        specialization: 'Cardiology',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toEqual(expect.any(String));

    expect(res.body.doctor).toEqual({
      id: expect.any(String),
      name: 'Dr. Auth Test',
      email: testEmail,
      specialization: 'Cardiology',
    });

    expect(res.body.doctor.passwordHash).toBeUndefined();

    const doctor = await Doctor.findOne({
      email: testEmail,
    }).select('+passwordHash');

    expect(doctor).not.toBeNull();
    expect(doctor.passwordHash).not.toBe(testPassword);
    expect(await doctor.comparePassword(testPassword)).toBe(true);
  });

  test('register normalizes the email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dr. Email Test',
        email: '  AUTH.TEST@EXAMPLE.COM  ',
        password: testPassword,
        specialization: 'Neurology',
      });

    expect(res.status).toBe(201);
    expect(res.body.doctor.email).toBe(testEmail);
  });

  test('register rejects a duplicate email', async () => {
    await Doctor.create({
      name: 'Existing Doctor',
      email: testEmail,
      passwordHash: await Doctor.hashPassword(testPassword),
      specialization: 'General Medicine',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another Doctor',
        email: testEmail,
        password: testPassword,
        specialization: 'Cardiology',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email is already registered');
  });

  test('register rejects a short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dr. Short Password',
        email: testEmail,
        password: 'short',
        specialization: 'Cardiology',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      'Password must be at least 8 characters'
    );
  });

  test('register rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('login accepts the correct password', async () => {
    await Doctor.create({
      name: 'Dr. Login Test',
      email: testEmail,
      passwordHash: await Doctor.hashPassword(testPassword),
      specialization: 'Cardiology',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.doctor.email).toBe(testEmail);
    expect(res.body.doctor.passwordHash).toBeUndefined();
  });

  test('login is case-insensitive for email', async () => {
    await Doctor.create({
      name: 'Dr. Case Test',
      email: testEmail,
      passwordHash: await Doctor.hashPassword(testPassword),
      specialization: 'Dermatology',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'AUTH.TEST@EXAMPLE.COM',
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('login rejects the wrong password', async () => {
    await Doctor.create({
      name: 'Dr. Wrong Password',
      email: testEmail,
      passwordHash: await Doctor.hashPassword(testPassword),
      specialization: 'Cardiology',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword1',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('login rejects an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('login rejects missing credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me rejects a missing token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      'Not authorized, token missing'
    );
  });

  test('GET /api/auth/me returns the logged-in doctor', async () => {
    const doctor = await Doctor.create({
      name: 'Dr. Me Test',
      email: testEmail,
      passwordHash: await Doctor.hashPassword(testPassword),
      specialization: 'Neurology',
    });

    const token = jwt.sign(
      { id: doctor._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    expect(res.body.doctor).toEqual({
      id: doctor._id.toString(),
      name: 'Dr. Me Test',
      email: testEmail,
      specialization: 'Neurology',
    });

    expect(res.body.doctor.passwordHash).toBeUndefined();
  });

  test('GET /api/auth/me rejects an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer definitely-invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      'Not authorized, invalid token'
    );
  });
});
