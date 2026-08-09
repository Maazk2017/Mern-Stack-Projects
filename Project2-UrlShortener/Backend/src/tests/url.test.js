import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import { Url } from "../modules/url/url.model.js";
import { Click } from "../modules/url/click.model.js";
import { User } from "../modules/auth/authUser.model.js";
import { Session } from "../modules/auth/authSession.model.js";

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
});

afterAll(async () => {
    await mongoose.connection.close();
});

afterEach(async () => {
    await Url.deleteMany({});
    await Click.deleteMany({});
    await User.deleteMany({});
    await Session.deleteMany({});
});

async function createAuthedUser(overrides = {}) {
    const mockUser = {
        username: "testuser",
        email: "testuser@gmail.com",
        password: "abc12345",
        ...overrides
    };

    await request(app)
        .post("/auth/register")
        .send(mockUser);

    const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: mockUser.email, password: mockUser.password });

    return {
        accessToken: loginRes.body.accessToken,
        cookies: loginRes.headers["set-cookie"]
    };
}

describe("createUrl", () => {
    let accessToken;

    beforeEach(async () => {
        ({ accessToken } = await createAuthedUser());
    });

    it("should create a short url with a random shortcode", async () => {
        const res = await request(app)
            .post("/api/urls")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ originalurl: "https://example.com" });

        expect(res.statusCode).toBe(201);
        expect(res.body.shortcode).toBeDefined();
    });

    it("should create a short url with a custom slug", async () => {
        const res = await request(app)
            .post("/api/urls")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ originalurl: "https://example.com", customslug: "my-link" });

        expect(res.statusCode).toBe(201);
        expect(res.body.shortcode).toBe("my-link");
    });

    it("should return 409 when custom slug is already taken", async () => {
        await request(app)
            .post("/api/urls")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ originalurl: "https://example.com", customslug: "taken-slug" });

        const res = await request(app)
            .post("/api/urls")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ originalurl: "https://another.com", customslug: "taken-slug" });

        expect(res.statusCode).toBe(409);
    });

    it("should return 401 when not authenticated", async () => {
        const res = await request(app)
            .post("/api/urls")
            .send({ originalurl: "https://another.com", customslug: "taken-slug" });

        expect(res.statusCode).toBe(401);
    });
});

describe("redirect", () => {
    let accessToken;

    beforeEach(async () => {
        ({ accessToken } = await createAuthedUser());
    });

    it("should redirect to the original url for a valid slug", async () => {
        await request(app)
            .post("/api/urls")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ originalurl: "https://example.com", customslug: "redirect-test" });

        const res = await request(app)
            .get("/api/redirect-test");

        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe("https://example.com");
    });

    it("should return 404 for a nonexistent slug", async () => {
        const res = await request(app)
            .get("/api/does-not-exist");

        expect(res.statusCode).toBe(404);
    });

    it("should return 410 for an expired slug", async () => {
        await request(app)
            .post("/api/urls")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                originalurl: "https://example.com",
                customslug: "expired-test",
                expireat: new Date(Date.now() - 60_000).toISOString()
            });

        const res = await request(app)
            .get("/api/expired-test");

        expect(res.statusCode).toBe(410);
    });

    it("should increment click count on redirect", async () => {
        await request(app)
            .post("/api/urls")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ originalurl: "https://example.com", customslug: "click-test" });

        await request(app)
            .get("/api/click-test");

        // Allow background analytics write to settle
        await new Promise((resolve) => setTimeout(resolve, 50));

        const url = await Url.findOne({ shortcode: "click-test" });
        expect(url).not.toBeNull();
        expect(url.clicks).toBe(1);
    });
});

describe("geturls", () => {
    it("should only return urls belonging to the user", async () => {
        const userA = await createAuthedUser({ username: "userA", email: "a@gmail.com" });
        const userB = await createAuthedUser({ username: "userB", email: "b@gmail.com" });

        await request(app)
            .post("/api/urls")
            .set("Authorization", `Bearer ${userA.accessToken}`)
            .send({ originalurl: "https://a.com" });

        await request(app)
            .post("/api/urls")
            .set("Authorization", `Bearer ${userB.accessToken}`)
            .send({ originalurl: "https://b.com" });

        const res = await request(app)
            .get("/api/urls")
            .set("Authorization", `Bearer ${userA.accessToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.count).toBe(1);
        expect(res.body.urls[0].originalurl).toBe("https://a.com");
    });
});

describe("deleteUrls", () => {
    it("should allow the owner to delete their url", async () => {
        const { accessToken } = await createAuthedUser();

        await request(app)
            .post("/api/urls")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ originalurl: "https://example.com", customslug: "delete-me" });

        const res = await request(app)
            .delete("/api/urls/delete-me")
            .set("Authorization", `Bearer ${accessToken}`);

        expect(res.statusCode).toBe(200);
    });

    it("should return 403 when a non-owner tries to delete", async () => {
        const owner = await createAuthedUser({ username: "owner", email: "owner@gmail.com" });
        const intruder = await createAuthedUser({ username: "intruder", email: "intruder@gmail.com" });

        await request(app)
            .post("/api/urls")
            .set("Authorization", `Bearer ${owner.accessToken}`)
            .send({ originalurl: "https://example.com", customslug: "protected" });

        const res = await request(app)
            .delete("/api/urls/protected")
            .set("Authorization", `Bearer ${intruder.accessToken}`);

        expect(res.statusCode).toBe(403);
    });

    it("should return 404 when deleting a nonexistent slug", async () => {
        const { accessToken } = await createAuthedUser();

        const res = await request(app)
            .delete("/api/urls/ghost-slug")
            .set("Authorization", `Bearer ${accessToken}`);

        expect(res.statusCode).toBe(404);
    });
});

describe("Rate limiting on create", () => {
    it("should return 429 after exceeding the limit", async () => {
        const { accessToken } = await createAuthedUser();

        let lastRes;

        for (let i = 0; i < 50; i++) {
            lastRes = await request(app)
                .post("/api/urls")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ originalurl: `https://example.com/${i}` });
            if (lastRes.statusCode === 429) break;
        }

        expect(lastRes.statusCode).toBe(429);
    }, 30000);
});