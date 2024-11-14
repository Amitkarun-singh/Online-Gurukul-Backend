import express, { Router } from "express";
import {
    addVideo,
    getVideos,
    deleteVideo,
    getVideo,
} from "../controllers/video.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(isAuthenticated); 

router.post("/:lectureId", upload.single("videoFile"), addVideo);
router.get("/:lectureId", getVideos);
router.get("/:lectureId/:videoId", getVideo);
router.delete("/:lectureId/:videoId", deleteVideo);

export default router;

