import express from "express";
import { 
    loginUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    logoutUser,
    updateUserAvatar,
    generateOTP,
    verifyOTP,
    resetPassword,
    resendOTP
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
    ]),
    registerUser
    );

userRouter.route("/login").post(loginUser)

//secured routes
userRouter.route("/logout").post(isAuthenticated,  logoutUser)
userRouter.route("/refresh-token").post(refreshAccessToken)
userRouter.route("/change-password").post(isAuthenticated, changeCurrentPassword)
userRouter.route("/current-user").get(isAuthenticated, getCurrentUser)
userRouter.route("/update-account").patch(isAuthenticated, updateAccountDetails)
userRouter.route("/generate-otp").post(generateOTP)
userRouter.route("/verify-otp").post(verifyOTP)
userRouter.route("/reset-password").post(resetPassword)
userRouter.route("/resend-otp").post(resendOTP)

userRouter.route("/avatar").patch(isAuthenticated, upload.single("avatar"), updateUserAvatar)
export default userRouter;
