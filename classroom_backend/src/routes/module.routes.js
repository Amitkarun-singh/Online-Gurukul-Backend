import express, { Router } from "express";
import {
    createModule,
    getModule,
    getAllModules,
    updateModule,
    deleteModule,
} from "../controllers/module.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(isAuthenticated);

router.route("/:classroomId")
    .post(createModule);

router.route("/:classroomId/:moduleId")
    .get(getModule)
    .patch(updateModule)
    .delete(deleteModule);

router.route("/:classroomId")
    .get(getAllModules);

export default router;