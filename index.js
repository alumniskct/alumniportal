import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";

import { Server as httpServer } from "http";
import { fileURLToPath } from "url";

import alumniDataRouter from "./routes/alumniDataRoutes.js";
import alumniRouter from "./routes/alumniRoutes.js";
import conversationRouter from "./routes/conversationRoutes.js";
import eventRouter from "./routes/eventRoutes.js";
import forumRouter from "./routes/forumRoutes.js";
import galleryRouter from "./routes/galleryRoutes.js";
import testimonialRouter from "./routes/testimonialRoutes.js";
import userRouter from "./routes/userRoutes.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import config_db from "./config/dbconfig.js";
import socket from "./socket/index.js";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

dotenv.config();
config_db(process.env.URI);

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "/templates"));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/alumni", alumniRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/forum", forumRouter);
app.use("/api/v1/gallery", galleryRouter);
app.use("/api/v1/testimonial", testimonialRouter);
app.use("/api/v1/alumni-data", alumniDataRouter);
app.use("/api/v1/conversation", conversationRouter);

// app.get("/forgotPassword", (req, res) => {
//   res.render("forgot-password", {
//     content: "Forgot your password?",
//     receiver: "Aswin",
//   });
// });

if (process.env.NODE_ENV === "DEVELOPMENT") {
  console.log("Development mode".yellow);
  app.get("/", (req, res) => {
    res.send("ALUMNI PORTAL API");
  });
} else {
  console.log("Production mode".green);
  const root = path.join(__dirname, "client", "build");
  app.use(express.static(root));
  app.get("*", (req, res) => {
    res.sendFile("index.html", { root });
  });
}

app.use(notFound);
app.use(errorHandler);

const server = httpServer(app);

socket(server);

server.listen(process.env.PORT, () => {
  console.log(
    `Server is running on port ${process.env.PORT}`.black.bgGreen.bold
  );
});
