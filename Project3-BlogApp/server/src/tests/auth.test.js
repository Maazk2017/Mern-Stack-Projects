import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { jest } from "@jest/globals";

// Set global test timeout for long-running Mongo operations
jest.setTimeout(30000);

// 1. Define ESM Mocks BEFORE importing dependent modules
jest.unstable_mockModule("../modules/utils/auth.utils.js", () => ({
  generateOTP: jest.fn().mockResolvedValue("123456"),
}));

jest.unstable_mockModule("../modules/auth/auth.service.js", () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(true),
}));

// 2. Dynamically import modules that depend on the mocked files
const { default: app } = await import("../app.js");
const { User } = await import("../modules/auth/user.model.js");
const { Session } = await import("../modules/auth/session.model.js");
const authUtils = await import("../modules/utils/auth.utils.js");
const authService = await import("../modules/auth/auth.service.js");

// Factory Helpers
function createFakeUserData(overrides = {}) {
  return {
    username: faker.internet.username(),
    email: faker.internet.email().toLowerCase(),
    password: "Password123!",
    ...overrides,
  };
}

async function createTestUser(overrides = {}) {
  const rawPassword = overrides.password || "Password123!";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const userData = {
    username: faker.internet.username(),
    email: faker.internet.email().toLowerCase(),
    password: hashedPassword,
    isVerified: true,
    ...overrides,
  };

  const user = await User.create(userData);
  return { user, rawPassword };
}

describe("Auth Controller Integration Tests", () => {
  let mongoServer;

  // Set ENV variables for JWT logic
  process.env.JWT_ACCESS_SECRET = "test_access_secret";
  process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
  process.env.JWT_ACCESS_EXPIRY = "15m";
  process.env.JWT_REFRESH_EXPIRY = "7d";
  process.env.JWT_REFRESH_TOKEN_COOKIE_MAX_AGE = "604800000";

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }, 30000);

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 30000);

  beforeEach(() => {
    jest.clearAllMocks();
    authUtils.generateOTP.mockResolvedValue("123456");
    authService.sendOtpEmail.mockResolvedValue(true);
  });

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
  });

  // ==========================================
  // REGISTER TESTS
  // ==========================================
  describe("POST /auth/register", () => {
    it("should successfully register a new user and trigger OTP email", async () => {
      const userData = createFakeUserData();

      const res = await request(app)
        .post("/auth/register")
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("userId");

      const dbUser = await User.findOne({ email: userData.email });
      expect(dbUser).not.toBeNull();
      expect(dbUser.isVerified).toBe(false);
      expect(authService.sendOtpEmail).toHaveBeenCalledWith(userData.email, "123456");
    });

    it("should return 409 if username or email already exists", async () => {
      const { user } = await createTestUser();
      const duplicatePayload = createFakeUserData({
        email: user.email,
        username: user.username,
      });

      const res = await request(app)
        .post("/auth/register")
        .send(duplicatePayload);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  // ==========================================
  // LOGIN TESTS
  // ==========================================
  describe("POST /auth/login", () => {
    it("should login successfully if user is verified", async () => {
      const { user, rawPassword } = await createTestUser({ isVerified: true });

      const res = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: rawPassword });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
    });

    it("should return 403 if user account is not verified", async () => {
      const { user, rawPassword } = await createTestUser({ isVerified: false });

      const res = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: rawPassword });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/verify your email/i);
    });
  });

  // ==========================================
  // VERIFY OTP TESTS
  // ==========================================
  describe("POST /auth/verify-otp", () => {
    it("should verify valid otp and activate account", async () => {
      const hashedOtp = await bcrypt.hash("123456", 10);
      const { user } = await createTestUser({
        isVerified: false,
        otp: {
          code: hashedOtp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      const res = await request(app)
        .post("/auth/verify-otp")
        .send({ userId: user._id.toString(), otp: "123456" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isVerified).toBe(true);
      expect(updatedUser.otp.code).toBeUndefined();
    });
  });

  // ==========================================
  // REFRESH TOKEN TESTS
  // ==========================================
  describe("POST /auth/refresh", () => {
    it("should issue a new access token and rotate refresh token cookie", async () => {
      const { user } = await createTestUser();

      const session = await Session.create({
        userId: user._id,
        hashedRefreshToken: "temp",
        revoked: false,
      });

      const oldRefreshToken = jwt.sign(
        { id: user._id.toString(), sessionId: session._id.toString() },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      session.hashedRefreshToken = await bcrypt.hash(oldRefreshToken, 10);
      await session.save();

      const res = await request(app)
        .post("/auth/refresh")
        .set("Cookie", [`refreshToken=${oldRefreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.headers["set-cookie"]).toBeDefined();

      const updatedSession = await Session.findById(session._id);
      expect(updatedSession.hashedRefreshToken).not.toBe(session.hashedRefreshToken);
    });

    it("should return 401 if no refresh token cookie is provided", async () => {
      const res = await request(app).post("/auth/refresh");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/no active session/i);
    });

    it("should return 401 if session is revoked", async () => {
      const { user } = await createTestUser();

      const session = await Session.create({
        userId: user._id,
        hashedRefreshToken: "temp",
        revoked: true,
      });

      const refreshToken = jwt.sign(
        { id: user._id.toString(), sessionId: session._id.toString() },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .post("/auth/refresh")
        .set("Cookie", [`refreshToken=${refreshToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/session already expired/i);
    });
  });

  // ==========================================
  // GET ME TESTS
  // ==========================================
  describe("GET /auth/me", () => {
    it("should return current user profile excluding password", async () => {
      const { user } = await createTestUser();

      const accessToken = jwt.sign(
        { id: user._id.toString(), role: user.role || "user" },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
      );

      const res = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty("email", user.email);
      expect(res.body.user).toHaveProperty("username", user.username);
      expect(res.body.user.password).toBeUndefined();
    });

    it("should return 404 if user no longer exists in database", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const accessToken = jwt.sign(
        { id: nonExistentId },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
      );

      const res = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/user not found/i);
    });
  });

  // ==========================================
  // RESEND OTP TESTS
  // ==========================================
  describe("POST /auth/resend-otp", () => {
    it("should regenerate OTP and resend email for existing user", async () => {
      const { user } = await createTestUser({ isVerified: false });

      const res = await request(app)
        .post("/auth/resend-otp")
        .send({ email: user.email });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/new otp has been sent/i);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.otp.code).toBeDefined();
      expect(updatedUser.otp.expiresAt).toBeDefined();

      expect(authUtils.generateOTP).toHaveBeenCalledTimes(1);
      expect(authService.sendOtpEmail).toHaveBeenCalledWith(user.email, "123456");
    });

    it("should return 404 if email does not exist", async () => {
      const res = await request(app)
        .post("/auth/resend-otp")
        .send({ email: faker.internet.email() });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/user not found/i);
    });
  });
});