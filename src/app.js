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

// for user
import userrouter from "./routes/user.routes.js";

app.use("/api/v1/users", userrouter);

// for posts
import postrouter from "./routes/posts.route.js";

app.use("/api/v1/posts", postrouter);

// for like
import likerouter from "./routes/like.routes.js";

app.use("/api/v1/like", likerouter);

export { app };
