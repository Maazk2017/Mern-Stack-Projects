import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { jest } from "@jest/globals";

// Set test timeout
jest.setTimeout(30000);

// Dynamically import app and models
const { default: app } = await import("../app.js");
const { User } = await import("../modules/auth/user.model.js");
const { Post } = await import("../modules/post/post.model.js");
const { Comments } = await import("../modules/comments/comments.model.js");

function generateAuthToken(user) {
    return jwt.sign(
        { id: user._id.toString(), role: user.role || "user" },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
    );
}

async function createTestUserAndPost() {
    const hashedPassword = await bcrypt.hash("Password123!", 10);
    const user = await User.create({
        username: faker.internet.username(),
        email: faker.internet.email().toLowerCase(),
        password: hashedPassword,
        isVerified: true,
    });

    const post = await Post.create({
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        author: user._id,
    });

    const token = generateAuthToken(user);
    return { user, post, token };
}

describe("Comment Controller Integration Tests", () => {
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

    describe("POST /posts/:id/comments", () => {
        it("should successfully create a top-level comment", async () => {
            const { user, post, token } = await createTestUserAndPost();

            const res = await request(app)
                .post(`/posts/${post._id}/comments`)
                .set("Authorization", `Bearer ${token}`)
                .send({ text: "This is a test comment!" });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("message", "Comment posted successfully");
            expect(res.body.comment).toHaveProperty("text", "This is a test comment!");
            expect(res.body.comment.author.toString()).toBe(user._id.toString());
        });

        it("should return 404 if the post does not exist", async () => {
            const { token } = await createTestUserAndPost();
            const fakePostId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .post(`/posts/${fakePostId}/comments`)
                .set("Authorization", `Bearer ${token}`)
                .send({ text: "Nice post!" });

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/post not found/i);
        });
    });

    describe("GET /posts/:id/comments", () => {
        it("should fetch comments with pagination and like counts", async () => {
            const { user, post, token } = await createTestUserAndPost();

            await Comments.create({
                text: "First comment",
                post: post._id,
                author: user._id,
            });

            const res = await request(app)
                .get(`/posts/${post._id}/comments`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.comments.length).toBe(1);
            expect(res.body.comments[0]).toHaveProperty("text", "First comment");
            expect(res.body.comments[0]).toHaveProperty("likeCount", 0);
        });
    });

    describe("DELETE /comments/:id", () => {
        it("should soft delete a comment", async () => {
            const { user, post, token } = await createTestUserAndPost();

            const comment = await Comments.create({
                text: "Delete me",
                post: post._id,
                author: user._id,
            });

            const res = await request(app)
                .delete(`/comments/${comment._id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/comment deleted successfully/i);

            const updatedComment = await Comments.findById(comment._id);
            expect(updatedComment.isDeleted).toBe(true);
        });
    });
});