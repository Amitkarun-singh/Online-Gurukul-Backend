import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Lecture } from "../models/lecture.model.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const addVideo = asyncHandler(async(req, res) => {
    const { lectureId } = req.params;
    const { title } = req.body;
    if(!lectureId){
        throw new ApiError(400, "Lecture Id is required");
    }
    if(!title){
        throw new ApiError(400, "Title is required");
    }
    try {
        const lecture = await Lecture.findById(lectureId);
        if(!lecture){
            throw new ApiError(404, "Lecture not found");
        }
        const videoFileLocalPath = req.file?.path;
        if(!videoFileLocalPath){
            throw new ApiError(400, "Video file is required");
        }
        const videoFile = await uploadOnCloudinary(videoFileLocalPath);
        if(!videoFile){
            throw new ApiError(500, "An error occurred while uploading video file");
        }
        const video = new Video({
            title: title,
            videoFile: videoFile.secure_url,
            lecture: lectureId
        });
        await video.save();
        lecture.videos.push(video._id);
        await lecture.save();
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Video added successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while adding video in lecture");
    }
    
});

const getVideos = asyncHandler(async(req, res) => {
    const { lectureId } = req.params;
    if(!lectureId){
        throw new ApiError(400, "Lecture Id is required");
    } 
    try {
        const lecture = await Lecture.findById(lectureId);
        if(!lecture){
            throw new ApiError(404, "Lecture not found");
        }
        const videos = await Video.find({_id: {$in: lecture.videos}});
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "Videos fetched successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while fetching videos");
    }
});

const deleteVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    if(!videoId){
        throw new ApiError(400, "Video Id is required");
    }
    try {
        const video = await Video.findById(videoId);
        if(!video){
            throw new ApiError(404, "Video not found");
        }

        const lecture = await Lecture.findOne({videos: videoId});
        if(!lecture){
            throw new ApiError(404, "Lecture not found");
        }
        const videoFileId = video.videoFile.split("/").pop();
        await deleteFromCloudinary(videoFileId);
        await video.deleteOne({_id: videoId});
        lecture.videos = lecture.videos.filter((video) => video.toString() !== videoId);
        await lecture.save();
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Video deleted successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while deleting video");
    }
});

const getVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    if(!videoId){
        throw new ApiError(400, "Video Id is required");
    }
    try {
        const video = await Video.findById(videoId);
        if(!video){
            throw new ApiError(404, "Video not found");
        }
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Video fetched successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while fetching video");
    }
});

export {
    getVideo,
    addVideo,
    getVideos,
    deleteVideo
}