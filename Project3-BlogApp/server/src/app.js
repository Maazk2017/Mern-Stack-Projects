import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./modules/auth/auth.routes.js";
import cors from "cors";

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

export default app;