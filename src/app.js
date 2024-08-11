import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
console.log(process.env.MONGODB_URI);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

app.use(express.static("public"));
app.use(cookieParser());

import userrouter from "./routes/user.routes.js";

app.use("/api/v1/users", userrouter);

import postrouter from "./routes/posts.route.js";

app.use("/api/v1/posts", postrouter);

export { app };
