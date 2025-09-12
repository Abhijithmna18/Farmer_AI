const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');
const app = require('../server'); // Assuming server.js exports the Express app

// Test data
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'TestPass123', // Meets validation requirements: uppercase, lowercase, number, 8+ chars
  confirmPassword: 'TestPass123'
};

const adminCredentials = {
  email: 'abhijithmnair2002@gmail.com',
  password: 'Admin@123'
};

describe('Authentication Module Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/farmerai_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({ email: { $in: [testUser.email, 'duplicate@example.com'] } });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up test users before each test
    await User.deleteMany({ email: { $in: [testUser.email, 'duplicate@example.com'] } });
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.role).toBe('farmer');

      // Verify user was created in database
      const user = await User.findOne({ email: testUser.email });
      expect(user).toBeTruthy();
      expect(user.firstName).toBe(testUser.firstName);
      expect(user.lastName).toBe(testUser.lastName);
      expect(await bcrypt.compare(testUser.password, user.password)).toBe(true);
    });

    test('should fail registration with missing required fields', async () => {
      const incompleteUser = {
        firstName: 'Test',
        // Missing lastName, email, password
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/required/i);
    });

    test('should fail registration with password mismatch', async () => {
      const invalidUser = {
        ...testUser,
        confirmPassword: 'DifferentPass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/password.*match/i);
    });

    test('should fail registration with duplicate email', async () => {
      // First, create a user
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Try to register with same email
      const duplicateUser = {
        ...testUser,
        firstName: 'Different',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already in use/i);
    });

    test('should fail registration with invalid email format', async () => {
      const invalidUser = {
        ...testUser,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.message).toMatch(/email/i);
    });

    test('should fail registration with weak password', async () => {
      const weakPasswordUser = {
        ...testUser,
        password: 'weak',
        confirmPassword: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body.message).toMatch(/password/i);
    });

    test('should fail registration with names containing numbers', async () => {
      const invalidNameUser = {
        ...testUser,
        firstName: 'Test123',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidNameUser)
        .expect(400);

      expect(response.body.message).toMatch(/letters only/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    });

    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.role).toBe('farmer');
    });

    test('should fail login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: testUser.password
        })
        .expect(400);

      expect(response.body.message).toMatch(/required/i);
    });

    test('should fail login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email
        })
        .expect(400);

      expect(response.body.message).toMatch(/required/i);
    });

    test('should fail login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: testUser.password
        })
        .expect(400);

      expect(response.body.message).toMatch(/email/i);
    });

    test('should fail login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPass123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid credentials/i);
    });

    test('should fail login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid credentials/i);
    });

    test('should fail login with weak password format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'weak'
        })
        .expect(400);

      expect(response.body.message).toMatch(/password/i);
    });

    test('should allow admin override login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(adminCredentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(adminCredentials.email);
      expect(response.body.user.role).toBe('admin');
    });
  });

  describe('GET /api/auth/me (Profile)', () => {
    let token;

    beforeEach(async () => {
      // Register and login to get token
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      token = loginResponse.body.token;
    });

    test('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.role).toBe('farmer');
    });

    test('should fail to get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.message).toMatch(/authentication/i);
    });

    test('should fail to get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toMatch(/authentication/i);
    });
  });

  describe('PUT /api/auth/me (Update Profile)', () => {
    let token;

    beforeEach(async () => {
      // Register and login to get token
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      token = loginResponse.body.token;
    });

    test('should update user profile successfully', async () => {
      const updates = {
        phone: '1234567890',
        location: 'Test City',
        state: 'Test State'
      };

      const response = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send(updates)
        .expect(200);

      expect(response.body.message).toMatch(/updated successfully/i);
      expect(response.body.user.phone).toBe(updates.phone);
      expect(response.body.user.location).toBe(updates.location);
      expect(response.body.user.state).toBe(updates.state);
    });

    test('should fail to update profile without token', async () => {
      const updates = {
        phone: '1234567890'
      };

      const response = await request(app)
        .put('/api/auth/me')
        .send(updates)
        .expect(401);

      expect(response.body.message).toMatch(/authentication/i);
    });
  });

  describe('Authentication Middleware', () => {
    let token;

    beforeEach(async () => {
      // Register and login to get token
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      token = loginResponse.body.token;
    });

    test('should allow access with valid JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should deny access without authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.message).toMatch(/authentication/i);
    });

    test('should deny access with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.message).toMatch(/authentication/i);
    });
  });

  describe('Security Tests', () => {
    test('should hash passwords securely', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const user = await User.findOne({ email: testUser.email });
      expect(user.password).not.toBe(testUser.password);
      expect(user.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash pattern
    });

    test('should not return password in responses', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(registerResponse.body.user.password).toBeUndefined();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(loginResponse.body.user.password).toBeUndefined();
    });

    test('should validate password complexity', async () => {
      const weakPasswords = ['short', 'nouppercase123', 'NOLOWERCASE123', 'NoNumbers'];

      for (const weakPassword of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: weakPassword
          })
          .expect(400);

        expect(response.body.message).toMatch(/password/i);
      }
    });
  });
});
