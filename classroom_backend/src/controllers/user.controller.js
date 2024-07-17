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
        const { email, password, username } = req.body;
        if (!username && !email) {
        throw new ErrorHandler("username or email is required", 400);
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    }).select("+password");

    if (!user) return next(new ErrorHandler("User does not exist", 404));

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) return next(new ErrorHandler("Invalid Email or Password", 400));

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
        next(error);
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
    const {oldPassword, newPassword} = req.body

    if (!oldPassword && !newPassword) {
        throw new ErrorHandler("Both old and new passwords are required", 400);
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
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ErrorHandler("All fields are required", 400)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
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


    const {fullName, email, username, password ,dob, role } = req.body
  //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ErrorHandler("All fields are required", 400)
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

} );

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
})

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

})

export {
    loginUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    logoutUser,
    updateUserAvatar
};