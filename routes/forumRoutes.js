import express from "express";
import {
  approvePost,
  createComment,
  createPost,
  createReply,
  deleteComment,
  deletePost,
  deleteReply,
  getAllPosts,
  getAllPosts_V2,
  getCommentsOnPost,
  getPostById,
  getPostImageById,
  getPostRequests,
  getRepliesOnComment,
  likePost,
  rejectPost,
  unlikePost,
} from "../controllers/ForumController.js";
import dotenv from "dotenv";
import { GridFsStorage } from "multer-gridfs-storage";
import multer from "multer";
import {
  protect,
  alumni,
  alumniOrAdmin,
  admin,
} from "../middleware/authMiddlewares.js";
dotenv.config();

const storage = new GridFsStorage({
  url: process.env.URI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)) {
        reject(new Error("Only Images(png, jpg, jpeg) are allowed"));
      }
      const filename = file.originalname;
      const fileInfo = {
        filename: filename,
        bucketName: "forum_images",
      };
      resolve(fileInfo);
    });
  },
});
const upload = multer({ storage });

const router = express.Router();

router.get("/image/:id", getPostImageById);
router.get("/feed", getAllPosts);
router.get("/post/:postId", getPostById);
router.get("/feed_v2_alpha/", getAllPosts_V2);
router.get("/post-requests", getPostRequests);
router.get("/comments/:postId", getCommentsOnPost);
router.get("/replies/:commentId", getRepliesOnComment);

router.patch("/like/:id", protect, likePost);
router.patch("/unlike/:id", protect, unlikePost);
router.patch("/approve-post/:id", protect, admin, approvePost);
router.patch("/reject-post/:id", protect, admin, rejectPost);

router.post("/", protect, upload.array("images", 6), createPost);
router.post("/comment/:id", protect, createComment);
router.post("/reply/:id", protect, createReply);

router.delete("/:id", protect, deletePost);
router.delete("/comment/:id", protect, deleteComment);
router.delete("/reply/:id", protect, deleteReply);
export default router;
