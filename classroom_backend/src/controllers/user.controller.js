import {User} from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ErrorHandler from "../middlewares/error.middleware.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";

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
            username = text;
        }

        const user = await User.findOne({
            $or: [{username}, {email}]
        }).select("+password");

    if(!user){
        throw new ApiError(400, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) throw new ApiError(400, "Invalid Password");

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

const registerUser = asyncHandler(async (req, res, next) => {
    try {
        const { fullName, email, username, password, confirmPassword, dob, role } = req.body;

        // Check for empty fields
        if ([fullName, email, username, password, confirmPassword, dob, role].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }

        // Email validation
        if (!email.includes("@") || (!email.includes(".com") && !email.includes(".in"))) {
            throw new ApiError(400, "Invalid Email");
        }

        // Username validation
        if (username.length < 6) {
            throw new ApiError(400, "Username must be at least 6 characters");
        }
        if (!username.match(/^[a-zA-Z0-9_]+$/)) {
            throw new ApiError(400, "Username must contain only letters, numbers, and underscores");
        }

        // Password match validation
        if (password !== confirmPassword) {
            throw new ApiError(400, "Passwords do not match");
        }

        // Check if user already exists
        const existedUser = await User.findOne({
            $or: [{ username: username.toLowerCase() }, { email }]
        });

        if (existedUser) {
            throw new ApiError(409, "User with email or username already exists");
        }

        //add date validation age should be more than 7 years
        const currentDate = new Date();
        const birthDate = new Date(dob);
        const age = currentDate.getFullYear() - birthDate.getFullYear();
        const monthDifference = currentDate.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && currentDate.getDate() < birthDate.getDate())) {
            age--;
        }
        if (age < 7) {
            throw new ApiError(400, "Age should be more than 7 years");
        }

        // Check for avatar file
        const avatarLocalPath = req.files?.avatar[0]?.path;
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is required");
        }

        // Upload avatar to Cloudinary
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (!avatar) {
            throw new ApiError(400, "Avatar file is required");
        }

        // Create user
        const user = await User.create({
            fullName,
            avatar: avatar.url,
            email,
            password,
            username: username.toLowerCase(),
            dob,
            role
        });

        // Fetch created user without password and refreshToken
        const createdUser = await User.findById(user._id).select("-password -refreshToken");
        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }

        return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered Successfully")
        );
    } catch (error) {
        next(new ApiError(500, error.message || "An error occurred while registering"));
    }
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
    getAdminDashboard
};