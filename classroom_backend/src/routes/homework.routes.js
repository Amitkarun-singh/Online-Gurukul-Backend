import express, { Router } from "express";
import {
    addHomework, 
    getHomeworks,
    updateHomework, 
    deleteHomework, 
    homeworkSubmission,
    AllhomworkSubmissions,
    deleteHomeworkSubmission,
    
} from "../controllers/homework.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(isAuthenticated);

router.post("/:moduleId", upload.single("homeworkFile"), addHomework);
router.get("/:moduleId", getHomeworks);
router.get("/submissions/:homeworkId", AllhomworkSubmissions);
router.patch("/:moduleId/:homeworkId", upload.single("homeworkFile"), updateHomework);
router.delete("/:moduleId/:homeworkId", deleteHomework);
router.post("/submit/:moduleId/:homeworkId", upload.single("submissionFile"), homeworkSubmission);
router.get("/submissions/:homeworkId", AllhomworkSubmissions);
router.delete("/submissions/:homeworkId/:submissionId", deleteHomeworkSubmission);


export default router;

