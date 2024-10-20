import express, { Router } from "express";
import {
    addDoubt,
    getDoubts,
    getAllDoubts,
    updateDoubts,
    deleteDoubts,
    addDoubtReply
} from "../controllers/doubt.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(isAuthenticated);

router.post("/:lectureId/:videoId", addDoubt);
router.get("/:lectureId/:videoId", getDoubts);
router.get("/:videoId", getAllDoubts);
router.patch("/:lectureId/:videoId/:doubtId", updateDoubts);
router.delete("/:lectureId/:doubtId", deleteDoubts);
router.post("/:doubtId", addDoubtReply)

export default router;

