import {User} from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ErrorHandler from "../middlewares/error.middleware.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import sendMail from "../utils/sendMail.js";
import dotenv from 'dotenv';
dotenv.config();

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ErrorHandler("Something went wrong while generating referesh and access token", 500)
    }
}

const loginUser = asyncHandler(async (req, res, next) => {
    try {
        const { text , password } = req.body;
        if (!text) {
            throw new ApiError(400, "username or email is required");
        }
        if (!password) {
            throw new ApiError(400, "password is required");
        }
        let email;
        let username;
        if (text.includes("@") && (text.includes(".com") || text.includes(".in"))) {
            email = text;
        }else{
            username = text.toLowerCase();
        }

        const user = await User.findOne({
            $or: [{username}, {email}]
        }).select("+password");

    if(!user){
        throw new ApiError(400, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) throw new ApiError(400, "Invalid password");

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while login")
    }
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ErrorHandler("unauthorized request", 401)
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ErrorHandler("Invalid refresh token", 401)
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ErrorHandler("Refresh token is expired or used", 401)
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ErrorHandler(error?.message || "Invalid refresh token", 401)
    }

});

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword, newConfirmPassword} = req.body

    if (!oldPassword && !newPassword) {
        throw new ErrorHandler("Both old and new passwords are required", 400);
    }

    if(!newConfirmPassword){
        throw new ErrorHandler("Confirm password is required", 400);
    }

    if (newPassword !== newConfirmPassword) {
        throw new ErrorHandler("Passwords do not match", 400);
    }

    const user = await User.findById(req.user?._id).select("+password");
    if (!user) {
        throw new ErrorHandler("User not found", 404);
    }
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ErrorHandler("Invalid old password", 400)
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email, dob} = req.body

    if (!fullName || !email || !dob) {
        throw new ErrorHandler("All fields are required", 400)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email,
                dob: dob
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const registerUser = asyncHandler( async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res


    const {fullName, email, username, password, confirmPassword ,dob, role } = req.body

    if (
        [fullName, email, username, password, confirmPassword].some((field) => field?.trim() === "")
    ) {
        throw new ErrorHandler("All fields are required", 400)
    }

    if(password != confirmPassword){
        throw new ErrorHandler("Passwords do not match", 400);
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ErrorHandler("User with email or username already exists", 409)
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    

    if (!avatarLocalPath) {
        throw new ErrorHandler("Avatar file is required", 400)
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar) {
        throw new ErrorHandler("Avatar file is required", 400)
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        email, 
        password,
        username: username.toLowerCase(),
        dob,
        role
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ErrorHandler("Something went wrong while registering the user", 500)
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

});

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
});

const updateUserAvatar = asyncHandler(async (req, res) => {

    const userWithOldAvatar = await User.findById(
        req.user._id, 
    ).select("-password -refreshToken")

    if (!userWithOldAvatar || !userWithOldAvatar.avatar) {
        throw new ApiError(
            400, 
            "User or Avatar not found"
        )
    }
    const oldAvatarCloudinaryUrl = userWithOldAvatar.avatar;

    const oldAvatar = await deleteFromCloudinary(oldAvatarCloudinaryUrl);
    if(!oldAvatar){
        throw new ApiError(400, "oldAvatar is required")
    }

    console.log(req.files);
    const avatarLocalPath = req.files?.path

    if (!avatarLocalPath) {
        new ApiError(400, "Avatar path is missing ")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(
        new ApiRresponse(
            200, 
            user, 
            "Avatar updated Successfully"
        )
    )

});

const generateOTP = asyncHandler(async (req, res) => {
    const { text } = req.body;

    if (!text) {
        throw new ApiError(400, "Username or email is required");
    }

    let email;
    let username;
    if (text.includes("@") && (text.includes(".com") || text.includes(".in"))) {
        email = text;
    } else {
        username = text.toLowerCase();
    }

    try {
        const user = await User.findOne({ $or: [{ username }, { email }] }).select("+password");
        if (!user) {
            throw new ApiError(400, "User does not exist");
        }

        console.log(user.email);
        

        const otp = Math.floor(100000 + Math.random() * 900000);
        user.otp = otp;
        user.otpExpireTime = Date.now() + 2 * 60 * 1000; 
        console.log(user.otpExpires);
        
        user.otpEmail = user.email;
        await user.save({ validateBeforeSave: false });

        const emailBody = `Your OTP is ${otp}. Please do not share it with anyone.`;
        const emailSubject = "Password Reset OTP";
        await sendMail({
            from: process.env.MY_MAIL,
            to: user.email,
            subject: emailSubject,
            text: emailBody,
        });

        const resendToken = jwt.sign({ id: user._id }, process.env.RESEND_TOKEN_SECRET, { expiresIn: '1d' });

        res.cookie('resendToken', resendToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        });

        res.status(200).json(new ApiResponse(200, null, "OTP generated and sent successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while generating OTP and sending mail");
    }
});

const resendOTP = asyncHandler(async (req, res) => {
    const resendToken = req.cookies?.resendToken;
    if (!resendToken) {
        throw new ApiError(400, "Go back and Enter your email again");
    }
    
    try {
        const decodedToken = jwt.verify(resendToken, process.env.RESEND_TOKEN_SECRET);

        const user = await User.findById(decodedToken.id);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        user.otp = otp;
        user.otpExpireTime = Date.now() + 2 * 60 * 1000;
        user.otpEmail = user.email;
        await user.save({ validateBeforeSave: false });

        const emailBody = `Your OTP is ${otp}. Please do not share it with anyone.`;
        const emailSubject = "OTP Resent";
        await sendMail({
            from: process.env.MY_MAIL,
            to: user.email,
            subject: emailSubject,
            text: emailBody,
        });

        res.status(200).json(new ApiResponse(200, null, "OTP resent successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while resending OTP");
    }
});

const verifyOTP = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const { resendToken } = req.cookies?.resendToken;
    if(resendToken){
        throw new ApiError(400, "Go back and Enter your email again");
    }

    if (!otp) {
        throw new ApiError(400, "OTP is required");
    }

    if(otp.length < 6){
        throw new ApiError(400, "OTP must be 6 characters");
    }

    if(/[a-zA-Z!@#$%^&*(),.?":{}|<>]/.test(otp)){
        throw new ApiError(400, "OTP should only contain numbers");
    }
    
    try {
        const user = await User.findOne({ otp, otpExpireTime: { $gt: Date.now() } });
        
        if (!user) {
            throw new ApiError(400, "Invalid OTP");
        } else if (user.otpExpires < Date.now()) {
            throw new ApiError(400, "Expired OTP");
        }

        res.clearCookie('resendToken');

        const resetToken = jwt.sign({ id: user._id }, process.env.RESET_TOKEN_SECRET, { expiresIn: '60m' });

        res.cookie('resetToken', resetToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        });

        user.otp = undefined;
        user.otpExpireTime = undefined;
        user.otpEmail = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(200).json(new ApiResponse(200, null, "OTP verified successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while verifying OTP");
    }
});


const resetPassword = asyncHandler(async (req, res) => {
    const {newPassword, confirmNewPassword } = req.body;
    const resetToken = req.cookies?.resetToken;
    if (!resetToken) {
        throw new ApiError(400, "Reset token is required");
    }

    if (!newPassword) {
        throw new ApiError(400, "New password is required");
    }

    if (!confirmNewPassword) {
        throw new ApiError(400, "Confirm new password is required");
    }

    if (newPassword !== confirmNewPassword) {
        throw new ApiError(400,"Passwords do not match");
    }

    try {
        const decodedToken = jwt.verify(resetToken, process.env.RESET_TOKEN_SECRET);

        const user = await User.findById(decodedToken.id);

        if (!user) {
            throw new ApiError("User not found", 404);
        }
        
        user.password = newPassword;
        await user.save({ validateBeforeSave: false });
        res.clearCookie('resetToken');

        return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                null, 
                "Password reset successfully"
        ));
    } catch (error) {
        throw new ApiError(error.message || "Invalid reset token", 401);
    }
});

const getStudentDashboard = asyncHandler(async (req, res) => {
    // Logic to fetch student dashboard data
});

const getTeacherDashboard = asyncHandler(async (req, res) => {
    // Logic to fetch teacher dashboard data
});

const getAdminDashboard = asyncHandler(async (req, res) => {
    // Logic to fetch admin dashboard data
});

export {
    loginUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    logoutUser,
    updateUserAvatar,
    getStudentDashboard,
    getTeacherDashboard,
    getAdminDashboard,
    generateOTP,
    verifyOTP,
    resetPassword,
    resendOTP
};