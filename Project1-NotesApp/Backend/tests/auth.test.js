import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User } from "../src/models/user.models.js";
import { Session } from "../src/models/session.models.js";

beforeAll (async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
});

afterAll (async () => {
    await mongoose.connection.close();
});

afterEach (async () => {
    await User.deleteMany({});
    await Session.deleteMany({});
});

describe ("Authentication", () => {

    it ("should register a new user successfully", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                username: "testuser",
                email: "test@example.com",
                password: "password123"
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body.user.email).toBe("test@example.com");
        expect(res.body.user.username).toBe("testuser");
        expect(res.body.user.password).toBeUndefined();
        expect(res.body.accessToken).toBeDefined();

    });


    it ("should reject registration with missing fields", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({ email: "test@example.com"});

        expect(res.statusCode).toBe(400);
    });

    it ("should reject registration with duplicate username or email", async () => {

        await request(app)
            .post("/api/auth/register")
            .send({
                username: "testuser",
                email: "test@example.com",
                password: "password123"
            });

        const res = await request(app)
            .post("/api/auth/register")
            .send({ 
                username: "testuser",
                email: "test@example.com",
                password: "password123"
            });

        expect(res.statusCode).toBe(409);
    });

    //

    it("should login user successfully", async () => {
        await request(app)
            .post("/api/auth/register")
            .send({
                username: "testuser",
                email: "test@example.com",
                password: "password123"
            });

        const res = await request(app)
            .post("/api/auth/login")
            .send({
                email: "test@example.com",
                password: "password123"
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.accessToken).toBeDefined();
    });

    // 

    it("should not login for non existing email", async () => {
        await request(app)
            .post("/api/auth/register")
            .send({
                username: "testuser",
                email: "test@example.com",
                password: "password123"
            });

        const res = await request(app)
            .post("/api/auth/login")
            .send({
                email: "nonexistent@example.com",
                password: "password123"
            });

        expect(res.statusCode).toBe(401);
    });

    it("should not login with incorrect password", async () => {
        await request(app)
            .post("/api/auth/register")
            .send({
                username: "testuser",
                email: "test@example.com",
                password: "password123"
            });

        const res = await request(app)
            .post("/api/auth/login")
            .send({
                email: "test@example.com",
                password: "wrongpassword"
            });

        expect(res.statusCode).toBe(401);
    });

    it("should logout the user", async () => {
        await request(app)
            .post("/api/auth/register")
            .send({
                username: "testuser",
                email: "test@example.com",
                password: "password123"
            });

        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({
                email: "test@example.com",
                password: "password123"
        });

        // Extract cookie from response headers
        const cookies = loginRes.headers["set-cookie"];

        expect(loginRes.statusCode).toBe(200);

        const logoutRes = await request(app)
            .get("/api/auth/logout")
            .set("Cookie", cookies);

        expect(logoutRes.statusCode).toBe(200);
        expect(logoutRes.body.message).toBe("Logged out successfully");

    });

    it("should reject logout attempt without session cookie", async () => {
        const res = await request(app).get("/api/auth/logout");
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("No active session");
    });

    it("should reject login when required fields are missing", async () => {
    const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com" }); 

    expect(res.statusCode).toBe(400);
});

});

describe ("Token Refresh", () => {
    it("should issue a new access token and rotate refresh token", async () => {
        const loginRes = await request(app)
            .post("/api/auth/register")
            .send({
                username: "refresher",
                email: "refresh@example.com",
                password: "password123"
            });

        const cookies = loginRes.headers["set-cookie"];

        const res = await request(app)
            .get("/api/auth/refreshToken")
            .set("Cookie", cookies)
        
        expect(res.statusCode).toBe(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should reject refresh if no cookie is provided", async () => {
        const res = await request(app)
            .get("/api/auth/refreshToken")
        
        expect(res.statusCode).toBe(401)
    });

    it("should reject refresh if session has been revoked", async () => {
        const loginRes = await request(app)
            .post("/api/auth/register")
            .send({
                username: "revoketest",
                email: "revoke@example.com",
                password: "password123"
            });

        const cookies = loginRes.headers["set-cookie"];

        // Revoke all sessions directly in the test database
        await Session.updateMany({}, {revoked: true});

        const res = await request(app)
            .get("/api/auth/refreshToken")
            .set("Cookie", cookies);

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Session already invalid");
    });

});

describe ("Get current user", () => {
    it("should fetch user profile when given a valid access token", async () => {
        const regRes = await request(app)
            .post("/api/auth/register")
            .send({
                username: "metest",
                email: "me@example.com",
                password: "password123"
        });

        const token = regRes.body.accessToken;

        const res = await request(app)
            .get("/api/auth/getMe")
            .set("Authorization", `Bearer ${token}`)

        expect(res.statusCode).toBe(200);
        expect(res.body.user.username).toBe("metest");
        expect(res.body.user.password).toBeUndefined()
    });

    it("should reject request without Bearer token", async () => {
        const res = await request(app).get("/api/auth/getMe");
        expect(res.statusCode).toBe(401);
    });

});