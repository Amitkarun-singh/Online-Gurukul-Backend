import express, { Router } from "express";
import {
    createModule,
    getModule,
    updateModule,
    deleteModule,
    addnotesModule,
    deletenotesModule
} from "../controllers/module.contoller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(isAuthenticated);

router.route("/:classroomId").post(createModule);
router.route("/:classroomId/:moduleId")
    .get(getModule)
    .patch(updateModule)
    .delete(deleteModule);
router.route("/notes/:classroomId/:moduleId")
    .post(upload.single('noteFile'), addnotesModule);
router.route("/notes/:classroomId/:moduleId/:notesId").delete(deletenotesModule);

export default router;