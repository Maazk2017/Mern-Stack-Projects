import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User } from "../src/models/user.models.js";
import { Note } from "../src/models/note.models.js";

let ownerToken, collaboratorToken, strangerToken, ownerId;
let collaboratorId;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
    
    // CRITICAL: Clean up users first so registration doesn't fail with "User already exists"
    await User.deleteMany({});
    await Note.deleteMany({});
    
    // Now create owner
    const ownerRes = await request(app).post("/api/auth/register").send({
        username: "owner",
        email: "owner@example.com",
        password: "password123"
    });
    
    // Debug check: If this logs undefined, print ownerRes.body to inspect your auth structure
    ownerToken = ownerRes.body.accessToken;
    ownerId = ownerRes.body.user?._id || ownerRes.body.user?.id;

    // Create collaborator
    const collabRes = await request(app).post("/api/auth/register").send({
        username: "collaborator",
        email: "collaborator@example.com",
        password: "password123"
    });

    collaboratorToken = collabRes.body.accessToken;
    collaboratorId = collabRes.body.user?._id || collabRes.body.user?.id;

    // Create stranger
    const strangerRes = await request(app).post("/api/auth/register").send({
        username: "stranger",
        email: "stranger@example.com",
        password: "password123"
    });

    strangerToken = strangerRes.body.accessToken;
}, 20000);

afterAll(async () => {
    await User.deleteMany({});
    await Note.deleteMany({});
    await mongoose.connection.close();
}, 20000);

beforeEach(async () => {
    await Note.deleteMany({});
});

describe("createNote", () => {
    it("should create a note successfully", async () => {
        const cnote = await request(app)
            .post("/api/note/createNote")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                title: "test",
                content: "testcontent"
            });
        
        expect(cnote.statusCode).toBe(201);
        expect(cnote.body.note).toHaveProperty("_id");
        expect(cnote.body.note.title).toBe("test");
        expect(cnote.body.note.owner).toEqual(ownerId);
    });

    it("should reject note without title", async () => {
        const cnote = await request(app)
            .post("/api/note/createNote")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                content: "testcontent"
            });

        expect(cnote.statusCode).toBe(400);
        expect(cnote.body.message).toBe("Title is required");
    });
});

describe("getNote", () => {
    it("should fetch a note requested by owner successfully", async () => {
        const cnote = await request(app)
            .post("/api/note/createNote")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                title: "test",
                content: "testcontent"
            });
        
        const gnote = await request(app)
            .get(`/api/note/getNote/${cnote.body.note._id}`)
            .set("Authorization", `Bearer ${ownerToken}`);
        
        expect(gnote.statusCode).toBe(200);
        expect(gnote.body.note.title).toBe("test");
    });

    it("should reject a note requested by stranger", async () => {
        const cnote = await request(app)
            .post("/api/note/createNote")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                title: "test",
                content: "testcontent"
            });

        const gnote = await request(app)
            .get(`/api/note/getNote/${cnote.body.note._id}`)
            .set("Authorization", `Bearer ${strangerToken}`);
        
        // Forbidden or Unauthorized based on middleware
        expect(gnote.statusCode).toBe(403);
    });

    it("should give 404 error when note doesn't exist", async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();

        const gnote = await request(app)
            .get(`/api/note/getNote/${fakeId}`)
            .set("Authorization", `Bearer ${ownerToken}`);
        
        expect(gnote.statusCode).toBe(404);
    });
});

describe("updateNote", () => {
    it("should update a note requested by owner successfully", async () => {
        const cnote = await request(app)
            .post("/api/note/createNote")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                title: "test",
                content: "testcontent"
            });
            
        
        const unote = await request(app)
            .patch(`/api/note/updateNote/${cnote.body.note._id}`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                title: "newtest",
                content: "newtestcontent"
            });
        
        expect(unote.statusCode).toBe(201);
        expect(unote.body.note.title).toBe("newtest");
        expect(unote.body.note.content).toBe("newtestcontent");
    });
});

describe("deleteNote", () => {
    it("should delete a note requested by owner successfully", async () => {
        const cnote = await request(app)
            .post("/api/note/createNote")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                title: "test",
                content: "testcontent"
            });
            
        
        const dnote = await request(app)
            .delete(`/api/note/deleteNote/${cnote.body.note._id}`)
            .set("Authorization", `Bearer ${ownerToken}`)
        
        expect(dnote.statusCode).toBe(200);
        expect(dnote.body.message).toBe("Note deleted successfully");
    });
});