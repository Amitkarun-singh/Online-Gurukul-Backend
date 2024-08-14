import express, { Router } from "express";
import {
    createLecture,
    getLecture,
    getAllLectures,
    deleteLecture
} from "../controllers/lecture.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(isAuthenticated);

router.post("/:moduleId", createLecture);
router.get("/:moduleId/:lectureId", getLecture);
router.get("/:moduleId", getAllLectures);
router.delete("/:moduleId/:lectureId", deleteLecture);

export default router;

