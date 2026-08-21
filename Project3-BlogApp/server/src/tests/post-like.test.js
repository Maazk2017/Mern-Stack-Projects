import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { jest } from "@jest/globals";

// Set test timeout
jest.setTimeout(30000);

const { default: app } = await import("../app.js");
const { User } = await import("../modules/auth/user.model.js");
const { Post } = await import("../modules/post/post.model.js");
const { Likes } = await import("../modules/likes/likes.model.js");

function generateAuthToken(user) {
    return jwt.sign(
        { id: user._id.toString(), role: user.role || "user" },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
    );
}

async function createTestUser() {
    const hashedPassword = await bcrypt.hash("Password123!", 10);
    const user = await User.create({
        username: faker.internet.username(),
        email: faker.internet.email().toLowerCase(),
        password: hashedPassword,
        isVerified: true,
    });
    const token = generateAuthToken(user);
    return { user, token };
}

describe("Post and Like Controller Integration Tests", () => {
    let mongoServer;

    process.env.JWT_ACCESS_SECRET = "test_access_secret";

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
    }, 30000);

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
    }, 30000);

    afterEach(async () => {
        if (mongoose.connection.readyState === 1) {
            const collections = mongoose.connection.collections;
            for (const key in collections) {
                await collections[key].deleteMany({});
            }
        }
    });

    // ==========================================
    // POST TESTS
    // ==========================================
    describe("POST /posts", () => {
        it("should successfully create a post when title or content is provided", async () => {
            const { token } = await createTestUser();

            const res = await request(app)
                .post("/posts")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    title: "Test Post Title",
                    content: "This is test post content.",
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("message", "Post created successfully");
            expect(res.body.post).toHaveProperty("title", "Test Post Title");
        });

        it("should return 400 if title, content, and images are missing", async () => {
            const { token } = await createTestUser();

            const res = await request(app)
                .post("/posts")
                .set("Authorization", `Bearer ${token}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/must include at least one/i);
        });
    });

    describe("GET /posts", () => {
        it("should fetch a paginated list of non-deleted posts", async () => {
            const { user, token } = await createTestUser();

            await Post.create({
                title: "Post 1",
                content: "Content 1",
                author: user._id,
            });

            const res = await request(app)
                .get("/posts")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.posts.length).toBe(1);
            expect(res.body).toHaveProperty("hasMore", false);
        });
    });

    // ==========================================
    // LIKE TESTS
    // ==========================================
    describe("POST /posts/:id/like", () => {
        it("should toggle a like on a post (like then unlike)", async () => {
            const { user, token } = await createTestUser();
            const post = await Post.create({
                title: "Likeable Post",
                content: "Test content",
                author: user._id,
            });

            // First request: Like the post
            let res = await request(app)
                .post(`/posts/${post._id}/like`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.liked).toBe(true);
            expect(res.body.likeCount).toBe(1);

            // Second request: Unlike the post
            res = await request(app)
                .post(`/posts/${post._id}/like`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.liked).toBe(false);
            expect(res.body.likeCount).toBe(0);
        });

        it("should return 404 if trying to like a non-existent post", async () => {
            const { token } = await createTestUser();
            const fakePostId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .post(`/posts/${fakePostId}/like`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/does not exists/i);
        });
    });
});