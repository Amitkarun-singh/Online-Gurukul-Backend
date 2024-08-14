import express, { Router } from "express";
import {
    addNote,
    getNotes,
    deleteNote
} from "../controllers/note.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(isAuthenticated);

router.post("/:moduleId", upload.single("notesFile"), addNote);
router.get("/:moduleId", getNotes);
router.delete("/:moduleId/:noteId", deleteNote);


export default router;
