import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Module } from "../models/module.model.js";
import { Video } from "../models/video.model.js";
import { Lecture } from "../models/lecture.model.js"
import { Doubt } from "../models/doubt.model.js";

const addDoubt = asyncHandler(async(req, res) => {
    const { lectureId, videoId } = req.params
    const { doubtDescription } = req.body
    if(!lectureId){
        throw new ApiError(400, "Lecture Id is required")
    }
    if(!videoId){
        throw new ApiError(400, "Video Id is required")
    }
    if(!doubtDescription){
        throw new ApiError(400, "Doubt Description is required")
    }
    try {
        const lecture = await Lecture.findById(lectureId)
        if(!lecture){
            throw new ApiError(404, "Lecture not found")
        }
        const video = await Video.findById(videoId)
        if(!video){
            throw new ApiError(404, "Video not found")
        }
        const doubt = new Doubt({
            doubtDescription: doubtDescription,
            lecture: lectureId,
            video: videoId
        })
        await doubt.save()
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                doubt,
                "Doubt added successfully"
            )
        )
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while adding doubt");
    }
});

const getDoubts = asyncHandler(async(req, res) => {
    const { lectureId, videoId } = req.params
    if(!lectureId){
        throw new ApiError(400, "Lecture Id is required")
    }
    if(!videoId){
        throw new ApiError(400, "Video Id is required")
    }
    try {
        const lecture = await Lecture.findById(lectureId)
        if(!lecture){
            throw new ApiError(404, "Lecture not found")
        }
        const video = await Video.findById(videoId)
        if(!video){
            throw new ApiError(404, "Video not found")
        }
        const doubts = await Doubt.find({lecture: lectureId, video: videoId})
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                doubts,
                "Doubts found successfully"
            )
        )
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while fetching doubts");
    }
});

const getAllDoubts = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400, "Video Id is required");
    }
    try {
        const video = await Video.findById(videoId);
        if (!video) {
            throw new ApiError(404, "Video not found");
        }
        const doubts = await Doubt.find({ video: videoId });
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    doubts,
                    "Doubts found successfully"
                )
            );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while fetching doubts");
    }
});

const updateDoubts = asyncHandler(async(req, res) => {
    const { lectureId, videoId, doubtId } = req.params;
    const { doubtDescription } = req.body;
    if(!lectureId){
        throw new ApiError(400, "Lecture Id is required");
    }
    if(!videoId){
        throw new ApiError(400, "Video Id is required");
    }
    if(!doubtId){
        throw new ApiError(400, "Doubt Id is required");
    }
    if(!doubtDescription){
        throw new ApiError(400, "Doubt Description is required");
    }
    try {
        const lecture = await Lecture.findById(lectureId);
        if(!lecture){
            throw new ApiError(404, "Lecture not found");
        }
        const video = await Video.findById(videoId);
        if(!video){
            throw new ApiError(404, "Video not found");
        }
        const doubt = await Doubt.findById(doubtId);
        if(!doubt){
            throw new ApiError(404, "Doubt not found");
        }
        doubt.doubtDescription = doubtDescription;
        await doubt.save();
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                doubt,
                "Doubt updated successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while updating the doubt");
    }
});

const deleteDoubts = asyncHandler(async(req, res) => {
    const { lectureId, videoId, doubtId } = req.params;
    if(!lectureId){
        throw new ApiError(400, "Lecture Id is required");
    }
    if(!videoId){
        throw new ApiError(400, "Video Id is required");
    }
    if(!doubtId){
        throw new ApiError(400, "Doubt Id is required");
    }
    try {
        const lecture = await Lecture.findById(lectureId);
        if(!lecture){
            throw new ApiError(404, "Lecture not found");
        }
        const video = await Video.findById(videoId);
        if(!video){
            throw new ApiError(404, "Video not found");
        }
        const doubt = await Doubt.findById(doubtId);
        if(!doubt){
            throw new ApiError(404, "Doubt not found");
        }
        await doubt.remove();
        lecture.doubts.pull(doubtId);
        await lecture.save();
        video.doubts.pull(doubtId);
        await video.save();
        await doubt.remove();
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Doubt deleted successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while deleting the doubt");
    }
});

export {
    addDoubt,
    getDoubts,
    getAllDoubts,
    updateDoubts,
    deleteDoubts
}