import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import { User } from "../modules/auth/authUser.model.js";
import { Session } from "../modules/auth/authSession.model.js";

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

describe ("Registration", () => {
    it ("should register a new user successfully", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({
                username: "abc",
                email: "abc@gmail.com",
                password: "abc12345"
            });
        expect(res.statusCode).toBe(201);
        expect(res.body.user.email).toBe("abc@gmail.com");
        expect(res.body.user.username).toBe("abc");
        expect(res.body.user.password).toBeUndefined();
        expect(res.body.accessToken).toBeDefined();
    });

    it ("should not register a new user with incorrect gmail or missing field", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({
                username: "abc",
                email: "abc$gmail.com",
            });
        expect(res.statusCode).toBe(400);
    });

    it ("should not register a user with existing username or email", async () => {
        await request(app)
            .post("/auth/register")
            .send({
                username: "abc",
                email: "abc@gmail.com",
                password: "abc12345"
            });

        const res = await request(app)
            .post("/auth/register")
            .send({
                username: "abc",
                email: "abc$gmail.com",
                password: "abc12345"
            });
        expect(res.statusCode).toBe(400);
    });

});

describe ("Login", () => {

    // Pre-register a user before running login tests
    const mockUser = {
        username: "abc",
        email: "abc@gmail.com",
        password: "abc12345"
    }

    beforeEach(async () => {
        await request(app)
            .post("/auth/register")
            .send(mockUser);
    });

    it ("should login a user successfully", async () => {

        const res = await request(app)
        .post("/auth/login")
        .send({
            email: mockUser.email,
            password: mockUser.password
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.user.email).toBe("abc@gmail.com");
        expect(res.body.user.username).toBe("abc");
        expect(res.body.accessToken).toBeDefined();
        const cookies = res.headers["set-cookie"];
        expect(cookies).toBeDefined();
    });

    it ("should not login a user with incorrect password", async () => {

        const res = await request(app)
        .post("/auth/login")
        .send({
            email:mockUser.email,
            password: "abc12346"
        });
        expect(res.statusCode).toBe(400);
    });

    it ("should not login a non existing user without registration", async () => {

        const res = await request(app)
        .post("/auth/login")
        .send({
            email:"test@gmail.com",
            password: "test1234"
        });
        expect(res.statusCode).toBe(400);
    });



});

describe ("logout", () => {

    const mockUser = {
        username: "logoutuser",
        email: "logout@example.com",
        password: "password123",
    };

    let validCookies;

    beforeEach(async () => {
        await request(app)
            .post("/auth/register")
            .send(mockUser);
        
        const loginRes = await request(app)
            .post("/auth/login")
            .send({
                email: mockUser.email,
                password: mockUser.password
            });
        validCookies = loginRes.headers["set-cookie"];
    });



    it ("should logout user successfully", async () => {
        
        const logoutRes = await request(app)
            .post("/auth/logout")
            .set("Cookie", validCookies);
        
        expect(logoutRes.statusCode).toBe(200);
        expect(logoutRes.body.message).toBe("User logged out successfully");
        
    });

    it ("should return 400 or 401 when trying to logout without cookies", async () => {
        const logoutRes = await request(app)
            .post("/auth/logout");
        
        expect(logoutRes.statusCode).toBeGreaterThanOrEqual(400);    
    });

    it ("should prevent using the refresh token after logging out", async () => {
        await request(app)
            .post("/auth/logout")
            .set("Cookie", validCookies);
        
        const refreshRes = await request(app)
            .post("/auth/refreshToken")
            .set("Cookie", validCookies);

        expect(refreshRes.statusCode).toBeGreaterThanOrEqual(400);
    });

});

describe ("refreshToken", () => {

    const mockUser = {
        username: "refreshtest",
        email: "refresh@example.com",
        password: "password123",
    }

    let validCookies;

    beforeEach(async () => {
        await request(app)
            .post("/auth/register")
            .send(mockUser);
        
        const loginRes = await request(app)
            .post("/auth/login")
            .send({
                email: mockUser.email,
                password: mockUser.password
            });
        validCookies = loginRes.headers["set-cookie"];
    });

    it ("should refresh token successfully", async () => {

        const refreshRes = await request(app)
            .post("/auth/refreshToken")
            .set("Cookie", validCookies);
        
        
        expect(refreshRes.statusCode).toBe(200);
        expect(refreshRes.body.message).toBe("Token refreshed successfully");
        expect(refreshRes.body.accessToken).toBeDefined();

    });

    it ("should return 401/400 when cookie is missing", async () => {
        const refreshRes = await request(app)
            .post("/auth/refreshToken");

        expect(refreshRes.statusCode).toBeGreaterThanOrEqual(400);

    });

    it ("should return 401 when attempting to use a refresh token after logging out", async () => {
        
        await request(app)
            .post("/auth/logout")
            .set("Cookie", validCookies);
        
        const refreshRes = await request(app)
            .post("/auth/refreshToken")
            .set("Cookie", validCookies);

        expect(refreshRes.statusCode).toBeGreaterThanOrEqual(400);

    });

    it ("should return 401/404 if user was deleted from DB", async () => {
        
        await User.deleteOne({ email: mockUser.email });
        
        const refreshRes = await request(app)
            .post("/auth/refreshToken")
            .set("Cookie", validCookies);

        expect(refreshRes.statusCode).toBeGreaterThanOrEqual(400);

    });

});

describe ("getUser", () => {

    const mockUser = {
        username: "abc",
        email: "abc@gmail.com",
        password: "abc12345"
    }

    let accessToken;
    let validCookies;

    beforeEach(async () => {

        await request(app)
            .post("/auth/register")
            .send(mockUser);

        const loginRes = await request(app)
            .post("/auth/login")
            .send({
                email: mockUser.email,
                password: mockUser.password
        });

        accessToken = loginRes.body.accessToken;
        validCookies = loginRes.headers["set-cookie"];
    })

    it ("should fetch user successfully", async () => {
        
        const getMeRes = await request(app)
            .get("/auth/getMe")
            .set("Authorization", `Bearer ${accessToken}`)
            .set("Cookie", validCookies);
        
        expect(getMeRes.statusCode).toBe(200);
        expect(getMeRes.body.message).toBe("User fetched successfully");
        expect(getMeRes.body.user.username).toBe(mockUser.username);
        expect(getMeRes.body.user.email).toBe(mockUser.email);
        expect(getMeRes.body.user.password).toBeUndefined();
    });

    it ("should return 400 or above when authorization header is messing", async () => {
        
        const getMeRes = await request(app)
            .get("/auth/getMe")
        
        expect(getMeRes.statusCode).toBe(401);
    });

    it ("should return 400 or above if token is valid but user was deleted from DB", async () => {
        
        await User.deleteOne({ email: mockUser.email });

        const getMeRes = await request(app)
            .get("/auth/getMe")
            .set("Authorization", `Bearer ${accessToken}`);
        
        expect(getMeRes.statusCode).toBeGreaterThanOrEqual(401);
    });


});