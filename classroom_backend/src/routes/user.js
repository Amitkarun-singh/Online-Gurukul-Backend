import express from "express";
import { getMyProfile, login, logout, register } from "../controllers/user.js";
import { isAuthenticated } from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.post("/new", register);
userRouter.post("/login", login);

userRouter.get("/logout", logout);

userRouter.get("/me", isAuthenticated, getMyProfile);

export default userRouter;
