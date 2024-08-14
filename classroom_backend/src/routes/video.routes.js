import express, { Router } from "express";
import {
    createLecture,
    getLecture,
    getAllLectures,
    deleteLecture
} from "../controllers/lecture.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(isAuthenticated);

export default router;

