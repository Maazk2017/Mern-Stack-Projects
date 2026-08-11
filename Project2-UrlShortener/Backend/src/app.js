import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import cookieParser from "cookie-parser"
import urlRoutes from "../src/modules/url/url.routes.js";
import redirectRoutes from "./modules/url/redirectToOriginal.js";
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


app.use("/auth", authRoutes);
app.use("/api", urlRoutes);
app.use("/", redirectRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error"});
});

export default app;