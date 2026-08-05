import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import cookieParser from "cookie-parser"

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);

export default app;