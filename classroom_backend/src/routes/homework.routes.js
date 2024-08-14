import express, { Router } from "express";
import {
    addHomework, 
    getHomeworks,
    updateHomework, 
    deleteHomework, 
    homeworkSubmission
} from "../controllers/homework.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(isAuthenticated);

router.post("/:moduleId", upload.single("homeworkFile"), addHomework);
router.get("/:moduleId", getHomeworks);
router.patch("/:moduleId/:homeworkId", upload.single("homeworkFile"), updateHomework);
router.delete("/:moduleId/:homeworkId", deleteHomework);
router.post("/submit/:moduleId/:homeworkId", upload.single("submissionFile"), homeworkSubmission);

export default router;

