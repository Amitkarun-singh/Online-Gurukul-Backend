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
    .post(createModule)
    .get(getAllModules);
    

router.route("/:classroomId/:moduleId")
    .get(getModule)
    .patch(updateModule)
    .delete(deleteModule);


export default router;