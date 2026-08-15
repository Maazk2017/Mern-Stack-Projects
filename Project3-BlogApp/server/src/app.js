import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./modules/auth/auth.routes.js";
import postRouter from "./modules/post/post.routes.js";
import commentActionsRouter from "./modules/comments/comments-actions.routes.js";

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true
    })
);


app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/api/posts", postRouter);
app.use("/api/comments", commentActionsRouter);

export default app;