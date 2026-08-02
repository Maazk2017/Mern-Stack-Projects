import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User } from "../src/models/user.models.js";
import { Note } from "../src/models/note.models.js";

let ownerToken, collaboratorToken, strangerToken, ownerId;
let collaboratorId;

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI_TEST);
    }
    
    // CRITICAL: Clean up users first so registration doesn't fail with "User already exists"
    await User.deleteMany({});
    await Note.deleteMany({});
    
    // Now create owner
    const ownerRes = await request(app).post("/api/auth/register").send({
        username: "owner",
        email: "owner@example.com",
        password: "password123"
    });

    console.log("ownerRes.statusCode:", ownerRes.statusCode);
    console.log("ownerRes.body:", ownerRes.body);   
    
    // Debug check: If this logs undefined, print ownerRes.body to inspect your auth structure
    ownerToken = ownerRes.body.accessToken;
    ownerId = ownerRes.body.user?._id || ownerRes.body.user?.id;

    // Create collaborator
    const collabRes = await request(app).post("/api/auth/register").send({
        username: "collaborator",
        email: "collaborator@example.com",
        password: "password123"
    });

    console.log("collabRes.statusCode:", collabRes.statusCode);
    console.log("collabRes.body:", collabRes.body); 

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
    if (mongoose.connection.readyState !== 0) {
        await User.deleteMany({});
        await Note.deleteMany({});
        await mongoose.connection.close();
    }
}, 30000);

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

describe("sharing and collaborator RBAC", () => {
    let noteId;

    // helper — avoids repeating the same share request in every test
    async function shareNoteWithCollaborator(role) {
        return request(app)
            .post(`/api/note/${noteId}/share`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ email: "collaborator@example.com", role });
    }

    beforeEach(async () => {
        const cnote = await request(app)
            .post("/api/note/createNote")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ title: "shared note", content: "shared content" });

        noteId = cnote.body.note._id;
    });

    it("viewer can read but not update the note", async () => {
        const shareRes = await shareNoteWithCollaborator("viewer");
        console.log("shareRes:", shareRes.statusCode, shareRes.body);

        console.log("collaboratorToken:", collaboratorToken);

        const readRes = await request(app)
            .get(`/api/note/getNote/${noteId}`)
            .set("Authorization", `Bearer ${collaboratorToken}`);

        expect(readRes.statusCode).toBe(200);

        const updateRes = await request(app)
            .patch(`/api/note/updateNote/${noteId}`)
            .set("Authorization", `Bearer ${collaboratorToken}`)
            .send({ title: "hacked title" });

        expect(updateRes.statusCode).toBe(403);
    });

    it("editor can update but not delete the note", async () => {
        await shareNoteWithCollaborator("editor");

        const updateRes = await request(app)
            .patch(`/api/note/updateNote/${noteId}`)
            .set("Authorization", `Bearer ${collaboratorToken}`)
            .send({ title: "editor updated this" });

        expect(updateRes.statusCode).toBe(200);
        expect(updateRes.body.note.title).toBe("editor updated this");

        const deleteRes = await request(app)
            .delete(`/api/note/deleteNote/${noteId}`)
            .set("Authorization", `Bearer ${collaboratorToken}`);

        expect(deleteRes.statusCode).toBe(403);
    });

    it("removed collaborator loses access to the note", async () => {
        await shareNoteWithCollaborator("viewer");

        // confirm access exists first
        const beforeRemove = await request(app)
            .get(`/api/note/getNote/${noteId}`)
            .set("Authorization", `Bearer ${collaboratorToken}`);
        expect(beforeRemove.statusCode).toBe(200);

        // owner removes them
        await request(app)
            .delete(`/api/note/${noteId}/share/${collaboratorId}`)
            .set("Authorization", `Bearer ${ownerToken}`);

        // access should now be gone
        const afterRemove = await request(app)
            .get(`/api/note/getNote/${noteId}`)
            .set("Authorization", `Bearer ${collaboratorToken}`);

        expect(afterRemove.statusCode).toBe(403);
    });
});