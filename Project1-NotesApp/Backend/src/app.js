import express from "express";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import noteRoutes from "./routes/note.routes.js";
import cors from "cors";


const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", 
    credentials: true,               
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/note", noteRoutes);

export default app;