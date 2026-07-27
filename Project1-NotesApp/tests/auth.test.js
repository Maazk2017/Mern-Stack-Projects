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

});